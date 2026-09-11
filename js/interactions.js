/**
 * Picking for mouse / touch and WebXR controllers.
 *
 * Events (via .on):
 *   'select'  ({ key, point })                — a pickable was activated
 *   'hover'   ({ key | null })                — desktop pointer hover changed
 */
import * as THREE from 'three';

export class Picker {
  constructor(renderer, camera, pickables) {
    this.renderer = renderer;
    this.camera = camera;
    this.pickables = pickables;
    this.raycaster = new THREE.Raycaster();
    this.handlers = {};
    this._downPos = null;
    this._downTime = 0;
    this._hoverKey = null;

    const dom = renderer.domElement;

    dom.addEventListener('pointerdown', (e) => {
      this._downPos = [e.clientX, e.clientY];
      this._downTime = performance.now();
    });

    dom.addEventListener('pointerup', (e) => {
      if (!this._downPos) return;
      const dx = e.clientX - this._downPos[0];
      const dy = e.clientY - this._downPos[1];
      const moved = Math.hypot(dx, dy);
      const dt = performance.now() - this._downTime;
      this._downPos = null;
      if (moved < 7 && dt < 500) this.selectAt(e.clientX, e.clientY);
    });

    if (window.matchMedia('(pointer: fine)').matches) {
      dom.addEventListener('pointermove', (e) => {
        const hit = this._cast(e.clientX, e.clientY);
        const key = hit ? hit.key : null;
        if (key !== this._hoverKey) {
          this._hoverKey = key;
          dom.style.cursor = key ? 'pointer' : '';
          this._emit('hover', { key });
        }
      });
    }

    // ---- VR controllers ----
    this.controllers = [];
    this._tmpMatrix = new THREE.Matrix4();
    this._lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -6),
    ]);
    for (let i = 0; i < 2; i++) {
      const controller = renderer.xr.getController(i);
      const line = new THREE.Line(this._lineGeo.clone(), new THREE.LineBasicMaterial({
        color: 0x66d9ff, transparent: true, opacity: 0.7, depthTest: false,
      }));
      line.renderOrder = 999;
      line.scale.z = 1;
      controller.add(line);
      controller.addEventListener('selectstart', () => {
        const hit = this._castFromController(controller);
        if (hit) this._emit('select', { key: hit.key, point: hit.point, vr: true });
      });
      controller.addEventListener('connected', () => { line.visible = true; });
      controller.addEventListener('disconnected', () => { line.visible = false; });
      this.controllers.push({ controller, line });
    }
  }

  on(event, cb) { (this.handlers[event] ||= []).push(cb); }
  _emit(event, payload) { (this.handlers[event] || []).forEach((cb) => cb(payload)); }

  /** Choose the "best" hit: highest userData.priority, nearest among ties. */
  _best(intersects) {
    let bestP = -Infinity;
    const resolved = [];
    for (const hit of intersects) {
      let obj = hit.object;
      while (obj && obj.userData.kind === undefined) obj = obj.parent;
      if (!obj) continue;
      const p = obj.userData.priority || 0;
      if (p > bestP) bestP = p;
      resolved.push({ key: obj.userData.kind, point: hit.point, priority: p });
    }
    return resolved.find((h) => h.priority === bestP) || null;
  }

  _cast(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const pointer = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(pointer, this.camera);
    return this._best(this.raycaster.intersectObjects(this.pickables, true));
  }

  _castFromController(controller) {
    this._tmpMatrix.identity().extractRotation(controller.matrixWorld);
    this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(this._tmpMatrix);
    return this._best(this.raycaster.intersectObjects(this.pickables, true));
  }

  selectAt(clientX, clientY) {
    const hit = this._cast(clientX, clientY);
    this._emit('select', hit ? { key: hit.key, point: hit.point, vr: false } : { key: null });
  }

  /** Shorten controller lasers to their hover target; call every frame. */
  update() {
    if (!this.renderer.xr.isPresenting) return;
    for (const { controller, line } of this.controllers) {
      const hit = this._castFromController(controller);
      line.scale.z = hit ? Math.max(0.05, hit.point.distanceTo(this.raycaster.ray.origin) / 6) : 1;
      line.material.opacity = hit ? 1 : 0.5;
    }
  }
}
