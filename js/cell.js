/**
 * Procedurally builds the human cell model.
 *
 * Returns:
 *   {
 *     group,      // THREE.Group containing the whole cell
 *     pickables,  // roots raycast for selection (each with userData.kind / .priority)
 *     materials,  // every material used (clipping planes get attached to these)
 *     kinds,      // Map<key, { group, reps: [Object3D] }> for highlight / focus
 *     anchors,    // Map<key, Vector3> label anchor positions
 *     update(t)   // per-frame animation
 *   }
 */
import * as THREE from 'three';
import { ORGANELLES } from './data.js';

/* ---------------- deterministic pseudo-random helpers ---------------- */
let _seed = 42;
function rand() {
  _seed = (_seed * 16807) % 2147483647;
  return (_seed - 1) / 2147483646;
}
function randRange(a, b) { return a + rand() * (b - a); }

/** Sphere with smooth low-frequency lumps, for an organic look. */
function organicSphere(radius, wSeg, hSeg, amp, freq, seed = 1) {
  const g = new THREE.SphereGeometry(radius, wSeg, hSeg);
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n =
      Math.sin(v.x * freq + seed * 12.9) *
      Math.sin(v.y * freq * 0.9 + seed * 3.1) *
      Math.sin(v.z * freq * 1.1 + seed * 7.7);
    v.multiplyScalar(1 + amp * n);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

function randomPointInSphere(radius, margin = 0) {
  const v = new THREE.Vector3();
  do {
    v.set(randRange(-1, 1), randRange(-1, 1), randRange(-1, 1));
  } while (v.lengthSq() > 1);
  return v.multiplyScalar(radius - margin);
}

/* ---------------- procedural canvas textures ---------------- */
function noiseCanvasTexture(size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 110 + Math.random() * 90;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Horizontal ridges used as the mitochondrion's cristae bump map. */
function stripesCanvasTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = '#e8e8e8';
  for (let y = 0; y < 128; y += 14) ctx.fillRect(0, y, 128, 6);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 2);
  return t;
}

/* ---------------- main builder ---------------- */
export function buildCell() {
  const group = new THREE.Group();
  const materials = [];
  const pickables = [];
  const kinds = new Map();
  const anchors = new Map();
  const animated = { mitos: [], vesicles: [], breathe: [], spin: [] };

  const mat = (m) => { materials.push(m); return m; };
  const kindOf = (key) => {
    if (!kinds.has(key)) kinds.set(key, { group: new THREE.Group(), reps: [] });
    return kinds.get(key);
  };
  const registerPick = (root, key, priority = 0) => {
    root.userData.kind = key;
    root.userData.priority = priority;
    pickables.push(root);
  };

  const nucleusPos = new THREE.Vector3(-0.85, 0.42, 0.1);
  const golgiPos = new THREE.Vector3(2.35, -0.4, -1.05);
  const centroPos = new THREE.Vector3(0.7, 1.5, 0.55);

  /* ================= CELL MEMBRANE ================= */
  const membrane = kindOf('membrane').group;
  const membraneNoise = noiseCanvasTexture();
  const outerShell = new THREE.Mesh(
    organicSphere(5, 96, 96, 0.016, 1.6, 3),
    mat(new THREE.MeshPhysicalMaterial({
      color: ORGANELLES.membrane.color,
      roughness: 0.35,
      metalness: 0.05,
      transparent: true,
      opacity: 0.15,
      side: THREE.FrontSide,
      bumpMap: membraneNoise,
      bumpScale: 0.9,
      depthWrite: false,
    }))
  );
  const innerShell = new THREE.Mesh(
    new THREE.SphereGeometry(4.93, 64, 64),
    mat(new THREE.MeshPhysicalMaterial({
      color: ORGANELLES.membrane.color,
      roughness: 0.5,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
      depthWrite: false,
    }))
  );
  membrane.add(outerShell, innerShell);

  // Transmembrane protein channels poking through the bilayer.
  const channelGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.42, 8);
  const channelMat = mat(new THREE.MeshStandardMaterial({ color: 0x1f7fae, roughness: 0.4, transparent: true, opacity: 0.8 }));
  const channels = new THREE.InstancedMesh(channelGeo, channelMat, 70);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const n = new THREE.Vector3();
  for (let i = 0; i < 70; i++) {
    n.copy(randomPointInSphere(1)).normalize();
    q.setFromUnitVectors(up, n);
    m4.compose(n.clone().multiplyScalar(4.98), q, new THREE.Vector3(1, 1, 1));
    channels.setMatrixAt(i, m4);
  }
  membrane.add(channels);
  animated.breathe.push({ obj: membrane, amp: 0.008, speed: 0.8, phase: 0 });
  anchors.set('membrane', new THREE.Vector3(0, 5.35, 0.4));

  /* ================= CYTOPLASM PARTICLES ================= */
  const cytoGeo = new THREE.BufferGeometry();
  const cytoCount = 350;
  const cytoPos = new Float32Array(cytoCount * 3);
  let ci = 0;
  while (ci < cytoCount) {
    const p = randomPointInSphere(4.7);
    if (p.distanceTo(nucleusPos) < 1.9) continue;
    cytoPos.set([p.x, p.y, p.z], ci * 3);
    ci++;
  }
  cytoGeo.setAttribute('position', new THREE.BufferAttribute(cytoPos, 3));
  const cyto = new THREE.Points(cytoGeo, mat(new THREE.PointsMaterial({
    color: 0x8fb8d8, size: 0.035, transparent: true, opacity: 0.4,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  })));
  group.add(cyto);
  animated.spin.push({ obj: cyto, axis: 'y', speed: 0.02 });

  /* ================= NUCLEUS ================= */
  const nucK = kindOf('nucleus');
  const nucleus = new THREE.Group();
  nucleus.position.copy(nucleusPos);

  // Invisible proxy sphere so the envelope is easy to click.
  const nucProxy = new THREE.Mesh(
    new THREE.SphereGeometry(1.62, 24, 24),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  nucProxy.userData.kind = 'nucleus';
  nucProxy.userData.priority = 1;
  nucleus.add(nucProxy);
  pickables.push(nucProxy);

  const envelope = new THREE.Mesh(
    organicSphere(1.6, 64, 64, 0.02, 2.2, 9),
    mat(new THREE.MeshPhysicalMaterial({
      color: ORGANELLES.nucleus.color,
      roughness: 0.25,
      transparent: true,
      opacity: 0.30,
      side: THREE.DoubleSide,
      depthWrite: false,
    }))
  );
  nucleus.add(envelope);

  // Nuclear pores — little dots on the envelope.
  const poreGeo = new THREE.IcosahedronGeometry(0.035, 0);
  const poreMat = mat(new THREE.MeshStandardMaterial({ color: 0x5a4fcf, roughness: 0.5 }));
  const pores = new THREE.InstancedMesh(poreGeo, poreMat, 90);
  for (let i = 0; i < 90; i++) {
    n.copy(randomPointInSphere(1)).normalize();
    q.setFromUnitVectors(up, n);
    m4.compose(n.clone().multiplyScalar(1.62), q, new THREE.Vector3(1, 1, 1));
    pores.setMatrixAt(i, m4);
  }
  nucleus.add(pores);

  // Chromatin strands (thin squiggles inside the nucleus).
  const chromMat = mat(new THREE.MeshStandardMaterial({ color: 0xc0b4ff, roughness: 0.6, transparent: true, opacity: 0.55 }));
  for (let i = 0; i < 7; i++) {
    const pts = [];
    let p = randomPointInSphere(1.15);
    for (let s = 0; s < 5; s++) {
      pts.push(p.clone());
      p = p.clone().add(randomPointInSphere(0.55));
      if (p.length() > 1.35) p.setLength(1.35);
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    nucleus.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.028, 6), chromMat));
  }
  nucK.group.add(nucleus);
  nucK.reps.push(nucleus);
  animated.breathe.push({ obj: nucleus, amp: 0.006, speed: 0.9, phase: 1 });
  anchors.set('nucleus', nucleusPos.clone().add(new THREE.Vector3(0, 1.95, 0.4)));

  /* ---- Nucleolus (nested inside; higher pick priority) ---- */
  const nuclK = kindOf('nucleolus');
  const nucleolus = new THREE.Mesh(
    organicSphere(0.52, 40, 40, 0.09, 3.5, 20),
    mat(new THREE.MeshStandardMaterial({
      color: ORGANELLES.nucleolus.color,
      roughness: 0.45,
      emissive: ORGANELLES.nucleolus.color,
      emissiveIntensity: 0.12,
      transparent: true,
      opacity: 0.92,
    }))
  );
  nucleolus.position.copy(nucleusPos).add(new THREE.Vector3(0.28, -0.18, 0.34));
  nucleolus.userData.kind = 'nucleolus';
  nucleolus.userData.priority = 3;
  pickables.push(nucleolus);
  nuclK.group.add(nucleolus);
  nuclK.reps.push(nucleolus);
  anchors.set('nucleolus', nucleolus.position.clone().add(new THREE.Vector3(0.55, -0.55, 1.05)));

  /* ================= ROUGH ER ================= */
  const rerK = kindOf('rer');
  const rerCenter = nucleusPos.clone().add(new THREE.Vector3(-0.15, -2.35, 0.55));
  const rerMat = mat(new THREE.MeshStandardMaterial({ color: ORGANELLES.rer.color, roughness: 0.55, transparent: true, opacity: 0.9 }));
  const ribDotMat = mat(new THREE.MeshStandardMaterial({ color: ORGANELLES.ribosome.color, roughness: 0.35, emissive: ORGANELLES.ribosome.color, emissiveIntensity: 0.25 }));
  for (let i = 0; i < 4; i++) {
    const R = 1.15 + i * 0.34;
    const sheet = new THREE.Mesh(new THREE.TorusGeometry(R, 0.17, 12, 56, 2.5), rerMat);
    sheet.rotation.set(Math.PI / 2 + randRange(-0.2, 0.2), randRange(0, Math.PI), randRange(-0.12, 0.12));
    sheet.scale.set(1, 1, 0.5);
    sheet.position.copy(rerCenter).add(new THREE.Vector3(0, i * 0.38, 0));
    // Stud the sheet with ribosome dots (as children, so they follow its transform).
    for (let r = 0; r < 26; r++) {
      const a = randRange(0, 2.5);
      const b = randRange(0, Math.PI * 2);
      const dot = new THREE.Mesh(new THREE.IcosahedronGeometry(0.042, 0), ribDotMat);
      dot.position.set(
        (R + 0.17 * Math.cos(b)) * Math.cos(a),
        (R + 0.17 * Math.cos(b)) * Math.sin(a),
        0.17 * Math.sin(b) / 0.5
      );
      sheet.add(dot);
    }
    rerK.group.add(sheet);
  }
  const rerPick = new THREE.Mesh(new THREE.SphereGeometry(2.3, 12, 12), new THREE.MeshBasicMaterial({ visible: false }));
  rerPick.position.copy(rerCenter).add(new THREE.Vector3(0, 0.55, 0));
  rerK.group.add(rerPick);
  registerPick(rerPick, 'rer');
  rerK.group.visible = true;
  rerK.reps.push(rerPick);
  anchors.set('rer', rerCenter.clone().add(new THREE.Vector3(0.2, 2.15, 0.3)));

  /* ================= SMOOTH ER ================= */
  const serK = kindOf('ser');
  const serMat = mat(new THREE.MeshStandardMaterial({ color: ORGANELLES.ser.color, roughness: 0.4, transparent: true, opacity: 0.9 }));
  const serCenter = nucleusPos.clone().add(new THREE.Vector3(-1.3, 0.9, -1.7));
  for (let i = 0; i < 3; i++) {
    const pts = [];
    const base = serCenter.clone().add(new THREE.Vector3(i * 0.55 - 0.4, i * 0.35, i * 0.4 - 0.3));
    for (let s = 0; s < 7; s++) {
      const a = (s / 7) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        base.x + Math.cos(a) * randRange(0.5, 0.85),
        base.y + Math.sin(a * 2 + i) * randRange(0.25, 0.45),
        base.z + Math.sin(a) * randRange(0.5, 0.85)
      ));
    }
    const curve = new THREE.CatmullRomCurve3(pts, true);
    serK.group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 90, 0.085, 10, true), serMat));
  }
  const serPick = new THREE.Mesh(new THREE.SphereGeometry(1.35, 12, 12), new THREE.MeshBasicMaterial({ visible: false }));
  serPick.position.copy(serCenter);
  serK.group.add(serPick);
  registerPick(serPick, 'ser');
  serK.reps.push(serPick);
  anchors.set('ser', serCenter.clone().add(new THREE.Vector3(0, 1.15, 0)));

  /* ================= GOLGI APPARATUS ================= */
  const golgiK = kindOf('golgi');
  const golgi = new THREE.Group();
  golgi.position.copy(golgiPos);
  golgi.rotation.set(0.35, -0.6, 0.15);
  const golgiMat = mat(new THREE.MeshStandardMaterial({ color: ORGANELLES.golgi.color, roughness: 0.45, transparent: true, opacity: 0.92 }));
  for (let i = 0; i < 6; i++) {
    const R = 0.62 + i * 0.075;
    const disc = new THREE.Mesh(new THREE.TorusGeometry(R, 0.09, 10, 44, 4.1), golgiMat);
    disc.rotation.set(Math.PI / 2 + randRange(-0.06, 0.06), 0, randRange(-0.1, 0.1) + i * 0.08);
    disc.scale.set(1, 1, 0.45);
    disc.position.set(Math.sin(i * 0.6) * 0.14, i * 0.21 - 0.5, 0);
    golgi.add(disc);
  }
  // Vesicles budding off the rims.
  const budMat = mat(new THREE.MeshStandardMaterial({ color: 0xffd7ea, roughness: 0.3, transparent: true, opacity: 0.95 }));
  for (let i = 0; i < 7; i++) {
    const a = randRange(0, Math.PI * 2);
    const R = randRange(0.65, 1.15);
    const bud = new THREE.Mesh(new THREE.SphereGeometry(randRange(0.06, 0.1), 12, 12), budMat);
    bud.position.set(Math.cos(a) * R, randRange(-0.5, 0.7), Math.sin(a) * R * 0.45);
    golgi.add(bud);
  }
  golgiK.group.add(golgi);
  golgiK.reps.push(golgi);
  registerPick(golgi, 'golgi');
  anchors.set('golgi', golgiPos.clone().add(new THREE.Vector3(-0.2, 1.35, 0.2)));
  anchors.set('vesicle', golgiPos.clone().add(new THREE.Vector3(0.95, 0.75, 0.85)));

  /* ================= MITOCHONDRIA ================= */
  const mitoK = kindOf('mitochondrion');
  const mitoSpots = [
    [3.05, 1.35, -1.25], [-2.85, -1.55, 1.35], [2.45, -2.2, 1.35], [-1.25, 2.95, -1.75],
    [0.35, -3.25, -1.35], [3.15, 0.25, 2.05], [-3.3, 1.15, 0.55],
  ];
  const mitoStripe = stripesCanvasTexture();
  mitoSpots.forEach((spot, i) => {
    const mito = new THREE.Group();
    mito.position.fromArray(spot);
    mito.rotation.set(randRange(0, Math.PI), randRange(0, Math.PI), randRange(0, Math.PI));

    const outer = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.3, 0.78, 6, 18),
      mat(new THREE.MeshPhysicalMaterial({
        color: ORGANELLES.mitochondrion.color,
        roughness: 0.35,
        transparent: true,
        opacity: 0.8,
        emissive: 0xbd5b00,
        emissiveIntensity: 0.22,
        bumpMap: mitoStripe,
        bumpScale: 0.4,
      }))
    );
    outer.rotation.z = Math.PI / 2;
    const inner = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.22, 0.62, 6, 14),
      mat(new THREE.MeshStandardMaterial({ color: 0xc65d1f, roughness: 0.6, transparent: true, opacity: 0.55, bumpMap: mitoStripe, bumpScale: 0.9 }))
    );
    inner.rotation.z = Math.PI / 2;
    mito.add(outer, inner);
    mitoK.group.add(mito);
    registerPick(mito, 'mitochondrion');
    animated.mitos.push({ obj: mito, phase: i * 1.3 });
  });
  mitoK.reps.push(mitoK.group.children[0]);
  const firstMito = mitoK.group.children[0].position;
  anchors.set('mitochondrion', firstMito.clone().add(new THREE.Vector3(0, 0.95, 0)));

  /* ================= LYSOSOMES ================= */
  const lysoK = kindOf('lysosome');
  const lysoMat = mat(new THREE.MeshStandardMaterial({ color: ORGANELLES.lysosome.color, roughness: 0.4, emissive: 0x7a1030, emissiveIntensity: 0.3 }));
  [[-1.6, -2.6, -1.7], [1.9, 2.4, -1.9], [3.5, -1.3, 0.35], [-3.55, -0.5, -1.15], [0.8, -1.9, 3.0]].forEach((spot) => {
    const ly = new THREE.Mesh(organicSphere(0.23, 24, 24, 0.12, 4, spot[0] * 10 + 5), lysoMat);
    ly.position.fromArray(spot);
    lysoK.group.add(ly);
    registerPick(ly, 'lysosome');
  });
  lysoK.reps.push(lysoK.group.children[0]);
  anchors.set('lysosome', lysoK.group.children[0].position.clone().add(new THREE.Vector3(0, 0.6, 0)));

  /* ================= PEROXISOMES ================= */
  const perK = kindOf('peroxisome');
  const perMat = mat(new THREE.MeshStandardMaterial({ color: ORGANELLES.peroxisome.color, roughness: 0.4, emissive: 0x034a38, emissiveIntensity: 0.4 }));
  [[2.1, 1.15, 2.4], [-0.3, 2.4, 2.3], [-2.5, 1.95, 1.6], [2.6, -1.5, -2.3], [-1.9, -2.15, 2.2]].forEach((spot) => {
    const pe = new THREE.Mesh(organicSphere(0.15, 20, 20, 0.1, 4, spot[1] * 10 + 2), perMat);
    pe.position.fromArray(spot);
    perK.group.add(pe);
    registerPick(pe, 'peroxisome');
  });
  perK.reps.push(perK.group.children[0]);
  anchors.set('peroxisome', perK.group.children[0].position.clone().add(new THREE.Vector3(0, 0.45, 0)));

  /* ================= FREE RIBOSOMES ================= */
  const ribK = kindOf('ribosome');
  const freeRib = new THREE.Group();
  for (let i = 0; i < 90; i++) {
    const p = randomPointInSphere(4.45);
    if (p.distanceTo(nucleusPos) < 2.0) continue;
    const dot = new THREE.Mesh(new THREE.IcosahedronGeometry(0.045, 0), ribDotMat);
    dot.position.copy(p);
    freeRib.add(dot);
  }
  ribK.group.add(freeRib);
  registerPick(freeRib, 'ribosome');
  ribK.reps.push(freeRib.children[Math.min(5, freeRib.children.length - 1)]);
  anchors.set('ribosome', freeRib.children[0].position.clone().add(new THREE.Vector3(0, 0.35, 0)));

  /* ================= CENTROSOME ================= */
  const cenK = kindOf('centrosome');
  const centrosome = new THREE.Group();
  centrosome.position.copy(centroPos);
  const cenMat = mat(new THREE.MeshStandardMaterial({ color: ORGANELLES.centrosome.color, roughness: 0.45, emissive: 0x40550a, emissiveIntensity: 0.3 }));
  const buildBarrel = () => {
    const barrel = new THREE.Group();
    barrel.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.55, 20, 1, true), cenMat));
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.55, 6), cenMat);
      rod.position.set(Math.cos(a) * 0.1, 0, Math.sin(a) * 0.1);
      rod.rotation.z = 0.06;
      barrel.add(rod);
    }
    return barrel;
  };
  const b1 = buildBarrel();
  const b2 = buildBarrel();
  b2.rotation.x = Math.PI / 2;
  centrosome.add(b1, b2);
  cenK.group.add(centrosome);
  cenK.reps.push(centrosome);
  registerPick(centrosome, 'centrosome');
  anchors.set('centrosome', centroPos.clone().add(new THREE.Vector3(0, 0.55, 0)));

  /* ================= CYTOSKELETON ================= */
  const cykK = kindOf('cytoskeleton');
  const cykMat = mat(new THREE.MeshBasicMaterial({ color: ORGANELLES.cytoskeleton.color, transparent: true, opacity: 0.12, depthWrite: false }));
  for (let i = 0; i < 34; i++) {
    const dir = randomPointInSphere(1).normalize();
    const end = dir.clone().multiplyScalar(randRange(3.4, 4.75));
    const mid = centroPos.clone().lerp(end, 0.5).add(randomPointInSphere(0.6));
    const curve = new THREE.QuadraticBezierCurve3(centroPos, mid, end);
    cykK.group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 26, 0.014, 5), cykMat));
  }
  anchors.set('cytoskeleton', centroPos.clone().add(new THREE.Vector3(1.4, 1.6, -1.3)));

  /* ================= TRANSPORT VESICLES (animated) ================= */
  const vesK = kindOf('vesicle');
  const vesMat = mat(new THREE.MeshStandardMaterial({ color: ORGANELLES.vesicle.color, roughness: 0.25, transparent: true, opacity: 0.9, emissive: 0x777799, emissiveIntensity: 0.25 }));
  for (let i = 0; i < 18; i++) {
    const start = golgiPos.clone().add(randomPointInSphere(0.9));
    const end = randomPointInSphere(1).normalize().multiplyScalar(randRange(4.6, 4.85));
    const mid1 = start.clone().lerp(end, 0.35).add(randomPointInSphere(0.7));
    const mid2 = start.clone().lerp(end, 0.7).add(randomPointInSphere(0.7));
    const curve = new THREE.CatmullRomCurve3([start, mid1, mid2, end]);
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), vesMat);
    vesK.group.add(mesh);
    animated.vesicles.push({ mesh, curve, speed: randRange(0.045, 0.085), offset: rand() });
  }

  /* ---- attach all kind groups ---- */
  for (const k of kinds.values()) {
    if (!k.group.parent) group.add(k.group);
  }

  /* ---- master per-frame update ---- */
  const update = (t) => {
    for (const b of animated.breathe) {
      const s = 1 + b.amp * Math.sin(t * b.speed + b.phase);
      b.obj.scale.setScalar(s);
    }
    for (const m of animated.mitos) {
      const s = 1 + 0.035 * Math.sin(t * 1.6 + m.phase);
      m.obj.scale.setScalar(s);
      m.obj.rotation.y += 0.0009;
    }
    for (const v of animated.vesicles) {
      const p = (t * v.speed + v.offset) % 1;
      v.mesh.position.copy(v.curve.getPoint(p));
      const fade = Math.sin(p * Math.PI);
      v.mesh.scale.setScalar(0.6 + 0.5 * fade);
    }
    for (const s of animated.spin) {
      s.obj.rotation[s.axis] = t * s.speed;
    }
    // Ribosomes shimmer.
    ribDotMat.emissiveIntensity = 0.18 + 0.12 * Math.sin(t * 2.4);
  };

  return { group, pickables, materials, kinds, anchors, update };
}
