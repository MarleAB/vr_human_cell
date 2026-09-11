/**
 * VR Human Cell — application bootstrap.
 * Scene, lighting, camera, selection & highlight, guided tour,
 * cutaway clipping and WebXR (VR) support.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ORGANELLES, TOUR_ORDER } from './data.js';
import { buildCell } from './cell.js';
import { LabelManager } from './labels.js';
import { Picker } from './interactions.js';
import { createUI } from './ui.js';
import { Tour } from './tour.js';

const overlay = document.getElementById('error-overlay');
function fatal(msg) {
  overlay.hidden = false;
  overlay.textContent = msg;
}

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  fatal('⚠️ WebGL is not available in this browser.\nThe 3D cell cannot be displayed — please try a browser with WebGL support.');
  throw e;
}

/* ============================ renderer / scene ============================ */
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.localClippingEnabled = true;
renderer.xr.enabled = true;
document.getElementById('app').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x060b16);
scene.fog = new THREE.FogExp2(0x060b16, 0.011);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 2.6, 11.5);
scene.add(camera); // needed so VR info-billboard children render

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.rotateSpeed = 0.55;
controls.minDistance = 2.2;
controls.maxDistance = 30;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.55;

/* ============================ lighting ============================ */
scene.add(new THREE.HemisphereLight(0xbdd4ff, 0x222c44, 0.55));
const key = new THREE.DirectionalLight(0xffffff, 0.9);
key.position.set(8, 12, 10);
scene.add(key);
const innerGlow = new THREE.PointLight(0x7fd8ff, 30, 0, 2);
scene.add(innerGlow);
const rim = new THREE.PointLight(0xff9f6e, 15, 0, 2);
rim.position.set(-7, -5, -7);
scene.add(rim);

/* ============================ background molecules ============================ */
{
  const N = 800;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(25 + Math.random() * 45);
    pos.set([v.x, v.y, v.z], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(g, new THREE.PointsMaterial({
    color: 0x4a6a9c, size: 0.18, transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
  }));
  stars.name = 'stars';
  scene.add(stars);
}

/* ============================ the cell ============================ */
const cell = buildCell();
scene.add(cell.group);

// Cutaway: one global clipping plane, animated in/out.
const clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 10);
for (const m of cell.materials) m.clippingPlanes = [clipPlane];
let cutawayOn = false;
let clipTarget = 10;

const labels = new LabelManager(scene, cell.anchors, ORGANELLES);

/* ============================ selection / highlight ============================ */
let selected = null;        // { key, items }
let focusGoal = null;       // { camPos, target }
const selColor = new THREE.Color();

function captureHighlight(key) {
  const items = [];
  const k = cell.kinds.get(key);
  if (!k) return items;
  k.group.traverse((o) => {
    if (!o.material) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (items.some((i) => i.m === m)) continue;
      if (m.emissive) items.push({ m, type: 'e', emissive: m.emissive.clone(), ei: m.emissiveIntensity });
      else if (m.transparent) items.push({ m, type: 'o', opacity: m.opacity });
    }
  });
  return items;
}

function clearHighlight() {
  if (!selected) return;
  for (const i of selected.items) {
    if (i.type === 'e') { i.m.emissive.copy(i.emissive); i.m.emissiveIntensity = i.ei; }
    else i.m.opacity = i.opacity;
  }
  selected = null;
}

function pulseHighlight(t) {
  if (!selected) return;
  selColor.set(ORGANELLES[selected.key].color);
  const p = 0.55 + 0.3 * Math.sin(t * 5);
  for (const i of selected.items) {
    if (i.type === 'e') { i.m.emissive.copy(selColor); i.m.emissiveIntensity = i.ei + p; }
    else i.m.opacity = Math.min(0.55, i.opacity * (2.2 + Math.sin(t * 5)));
  }
}

function focusPointFor(key, pickedPoint) {
  if (pickedPoint) return pickedPoint.clone();
  const k = cell.kinds.get(key);
  if (k?.reps?.length) {
    const v = new THREE.Vector3();
    k.reps[0].getWorldPosition(v);
    return v;
  }
  return cell.anchors.get(key)?.clone() ?? new THREE.Vector3();
}

function focusCamera(key, point) {
  const dist = ORGANELLES[key].viewDistance ?? 4;
  let target, camPos;
  if (key === 'membrane') {
    target = new THREE.Vector3(0, 0, 0);
    camPos = camera.position.clone().setLength(dist);
  } else {
    target = point;
    const dir = point.clone();
    if (dir.lengthSq() < 0.5) dir.copy(camera.position);
    dir.normalize();
    camPos = point.clone().add(dir.multiplyScalar(dist));
  }
  focusGoal = { camPos, target };
}

/* ============================ VR info billboard ============================ */
const vrCanvas = document.createElement('canvas');
vrCanvas.width = 1024; vrCanvas.height = 560;
const vrCtx = vrCanvas.getContext('2d');
const vrTexture = new THREE.CanvasTexture(vrCanvas);
vrTexture.colorSpace = THREE.SRGBColorSpace;
const vrPanel = new THREE.Sprite(new THREE.SpriteMaterial({
  map: vrTexture, transparent: true, depthTest: false, opacity: 0.97,
}));
vrPanel.scale.set(1.35, 0.74, 1);
vrPanel.position.set(0.5, -0.1, -1.5);
vrPanel.renderOrder = 1000;
vrPanel.visible = false;
camera.add(vrPanel);
let vrPanelTimer = 0;

function wrapText(ctx, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y);
      y += lh;
      line = w;
    } else line = test;
  }
  ctx.fillText(line, x, y);
  return y + lh;
}

function showVRPanel(key) {
  const o = ORGANELLES[key];
  const c = '#' + o.color.toString(16).padStart(6, '0');
  const W = vrCanvas.width, H = vrCanvas.height;
  vrCtx.clearRect(0, 0, W, H);
  vrCtx.fillStyle = 'rgba(8, 13, 24, 0.92)';
  vrCtx.beginPath();
  vrCtx.roundRect(4, 4, W - 8, H - 8, 34);
  vrCtx.fill();
  vrCtx.strokeStyle = c;
  vrCtx.lineWidth = 4;
  vrCtx.stroke();
  vrCtx.fillStyle = c;
  vrCtx.beginPath();
  vrCtx.arc(64, 72, 20, 0, Math.PI * 2);
  vrCtx.fill();
  vrCtx.fillStyle = '#f2f6ff';
  vrCtx.font = '700 46px system-ui, sans-serif';
  vrCtx.textBaseline = 'alphabetic';
  vrCtx.fillText(o.name, 104, 88);
  vrCtx.font = '30px system-ui, sans-serif';
  vrCtx.fillStyle = '#c9d6ef';
  const y = wrapText(vrCtx, o.description, 52, 160, W - 104, 44);
  vrCtx.font = 'italic 27px system-ui, sans-serif';
  vrCtx.fillStyle = c;
  wrapText(vrCtx, '💡 ' + o.fact, 52, Math.min(y + 30, H - 96), W - 104, 40);
  vrTexture.needsUpdate = true;
  vrPanel.visible = true;
  vrPanelTimer = 9;
}

/* ============================ UI + interactions ============================ */
let rotateTimer = null;
const tour = new Tour(TOUR_ORDER,
  (key) => doSelect(key, null),
  () => {
    ui.setTourActive(false);
    if (!renderer.xr.isPresenting) controls.autoRotate = true;
  });

function doSelect(key, point, vr = false) {
  clearHighlight();
  selected = { key, items: captureHighlight(key) };
  ui.showInfo(key);
  if (vr || renderer.xr.isPresenting) showVRPanel(key);
  else focusCamera(key, focusPointFor(key, point));
}

function deselect() {
  clearHighlight();
  focusGoal = null;
  ui.closePanel();
}

const actions = {
  focus(key) { tour.stop(true); ui.setTourActive(false); doSelect(key, null); },
  deselect() { deselect(); },
  toggleTour() {
    if (tour.running) {
      tour.stop(true);
      ui.setTourActive(false);
      if (!renderer.xr.isPresenting) controls.autoRotate = true;
    } else {
      deselect();
      controls.autoRotate = false;
      clearTimeout(rotateTimer);
      ui.setTourActive(true);
      tour.start();
    }
  },
  toggleLabels() {
    labels.setVisible(!labels.visible);
    ui.setLabelsActive(labels.visible);
  },
  toggleCutaway() {
    cutawayOn = !cutawayOn;
    clipTarget = cutawayOn ? 1.2 : 10;
    ui.setCutawayActive(cutawayOn);
  },
  resetView() {
    tour.stop(true); ui.setTourActive(false);
    deselect();
    focusGoal = { camPos: new THREE.Vector3(0, 2.6, 11.5), target: new THREE.Vector3(0, 0, 0) };
  },
  enterVR() {
    navigator.xr?.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor'] })
      .then((s) => renderer.xr.setSession(s))
      .catch((err) => console.warn('VR session failed:', err));
  },
};

const ui = createUI(actions);
ui.showWelcome();

// VR availability → reveal the button.
if (navigator.xr?.isSessionSupported) {
  navigator.xr.isSessionSupported('immersive-vr')
    .then((ok) => ui.showVRButton(ok))
    .catch(() => ui.showVRButton(false));
}

const picker = new Picker(renderer, camera, cell.pickables);
for (const { controller } of picker.controllers) scene.add(controller);
picker.on('select', ({ key, point, vr }) => {
  if (!key) { if (!tour.running) deselect(); return; }
  if (tour.running) { tour.stop(true); ui.setTourActive(false); }
  doSelect(key, point, vr);
});
renderer.domElement.addEventListener('pointerdown', () => ui.hideHint(), { once: true });

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (tour.running) { tour.stop(true); ui.setTourActive(false); }
    deselect();
  }
});

/* ---- cancel camera tweens & auto-rotate when the user grabs the scene ---- */
controls.addEventListener('start', () => {
  focusGoal = null;
  controls.autoRotate = false;
  clearTimeout(rotateTimer);
});
controls.addEventListener('end', () => {
  clearTimeout(rotateTimer);
  rotateTimer = setTimeout(() => { if (!renderer.xr.isPresenting) controls.autoRotate = true; }, 5000);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ============================ main loop ============================ */
const clock = new THREE.Clock();
let time = 0;

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  time += dt;

  if (!renderer.xr.isPresenting) controls.update();

  // Cutaway plane slides in / out.
  if (Math.abs(clipPlane.constant - clipTarget) > 0.01) {
    clipPlane.constant += (clipTarget - clipPlane.constant) * Math.min(1, dt * 3.2);
  }

  // Camera focus tween.
  if (focusGoal && !renderer.xr.isPresenting) {
    const k = 1 - Math.exp(-dt * 2.8);
    camera.position.lerp(focusGoal.camPos, k);
    controls.target.lerp(focusGoal.target, k);
    if (camera.position.distanceTo(focusGoal.camPos) < 0.05 &&
        controls.target.distanceTo(focusGoal.target) < 0.05) focusGoal = null;
  }

  // VR info billboard auto-hides.
  if (vrPanel.visible && (vrPanelTimer -= dt) <= 0) vrPanel.visible = false;

  cell.update(time);
  pulseHighlight(time);
  picker.update();
  tour.update(dt);

  const stars = scene.getObjectByName('stars');
  if (stars) stars.rotation.y = time * 0.004;

  renderer.render(scene, camera);
});
