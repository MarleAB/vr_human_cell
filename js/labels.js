/** Floating sprite labels for each organelle. */
import * as THREE from 'three';

function makeLabelTexture(text, colorHex) {
  const pad = 22;
  const font = '600 30px "Segoe UI", system-ui, sans-serif';
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  ctx.font = font;
  const tw = ctx.measureText(text).width;
  c.width = Math.ceil(tw) + pad * 2 + 26;
  c.height = 64;

  const r = 30;
  const roundRect = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };
  roundRect(2, 2, c.width - 4, c.height - 4, r);
  ctx.fillStyle = 'rgba(9, 14, 26, 0.82)';
  ctx.fill();
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // color dot
  ctx.beginPath();
  ctx.arc(pad - 1, c.height / 2, 9, 0, Math.PI * 2);
  ctx.fillStyle = colorHex;
  ctx.fill();

  ctx.font = font;
  ctx.fillStyle = '#eaf1ff';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, pad + 20, c.height / 2 + 1);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return { tex, aspect: c.width / c.height };
}

export class LabelManager {
  /**
   * @param {THREE.Scene} scene
   * @param {Map<string, THREE.Vector3>} anchors
   * @param {object} data  ORGANELLES map
   */
  constructor(scene, anchors, data) {
    this.group = new THREE.Group();
    this.group.renderOrder = 998;
    for (const [key, pos] of anchors) {
      const { tex, aspect } = makeLabelTexture(data[key].name, '#' + data[key].color.toString(16).padStart(6, '0'));
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        depthTest: false,
        sizeAttenuation: true,
        opacity: 0.95,
      }));
      const h = 0.42;
      sprite.scale.set(h * aspect, h, 1);
      sprite.position.copy(pos);
      this.group.add(sprite);
    }
    scene.add(this.group);
  }

  setVisible(v) { this.group.visible = v; }
  get visible() { return this.group.visible; }
}
