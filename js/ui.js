/** DOM UI: info panel, organelle legend and the bottom control bar. */
import { ORGANELLES } from './data.js';

const hex = (key) => '#' + ORGANELLES[key].color.toString(16).padStart(6, '0');

export function createUI(actions) {
  const legend = document.getElementById('legend');
  const info = document.getElementById('info');
  const hint = document.getElementById('hint');

  /* ---------- legend chips ---------- */
  const chips = new Map();
  for (const [key, o] of Object.entries(ORGANELLES)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.style.setProperty('--c', hex(key));
    b.innerHTML = `<span class="dot" aria-hidden="true"></span><span>${o.name}</span>`;
    b.addEventListener('click', () => actions.focus(key));
    legend.appendChild(b);
    chips.set(key, b);
  }

  /* ---------- info panel ---------- */
  function showWelcome() {
    info.innerHTML = `
      <button class="close" aria-label="Close">×</button>
      <div class="info-tag" style="--c: var(--accent)">
        <span class="dot"></span><h2>Welcome aboard!</h2>
      </div>
      <p class="desc">
        You are floating inside a human (eukaryotic) cell, magnified
        roughly <strong>a million times</strong>. Every colored structure is an
        organelle — a tiny specialized machine keeping the cell alive.
      </p>
      <p class="desc">
        <strong>Click anything</strong> to learn what it does, pick a name
        from the list on the left, or sit back and take the guided tour.
        On a VR headset, press <em>Enter&nbsp;VR</em> and point at organelles
        with your controller.
      </p>
      <p class="fact" style="--c: var(--accent)">
        <strong>Model note</strong>
        Organelle sizes, shapes and counts are simplified for clarity.
      </p>
      <button class="panel-cta" id="cta-tour">▶ Start the guided tour</button>`;
    info.classList.add('open');
    info.querySelector('.close').addEventListener('click', actions.deselect);
    info.querySelector('#cta-tour').addEventListener('click', actions.toggleTour);
  }

  function showInfo(key) {
    const o = ORGANELLES[key];
    info.innerHTML = `
      <button class="close" aria-label="Close">×</button>
      <div class="info-tag" style="--c: ${hex(key)}">
        <span class="dot"></span><h2>${o.name}</h2>
      </div>
      <p class="latin">${o.latin}</p>
      <p class="desc">${o.description}</p>
      <p class="fact" style="--c: ${hex(key)}"><strong>Did you know?</strong>${o.fact}</p>`;
    info.classList.add('open');
    info.querySelector('.close').addEventListener('click', actions.deselect);
    chips.forEach((c) => c.classList.remove('active'));
    chips.get(key)?.classList.add('active');
    chips.get(key)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    hideHint();
  }

  function closePanel() {
    info.classList.remove('open');
    chips.forEach((c) => c.classList.remove('active'));
  }

  /* ---------- hint auto-fade ---------- */
  let hintHidden = false;
  function hideHint() {
    if (hintHidden) return;
    hintHidden = true;
    hint.classList.add('faded');
  }
  setTimeout(hideHint, 14000);

  /* ---------- control bar ---------- */
  const bind = (id, fn) => document.getElementById(id).addEventListener('click', fn);
  bind('btn-tour', actions.toggleTour);
  bind('btn-labels', actions.toggleLabels);
  bind('btn-cut', actions.toggleCutaway);
  bind('btn-reset', actions.resetView);
  bind('btn-vr', actions.enterVR);

  const setActive = (id, on) => {
    const el = document.getElementById(id);
    el.classList.toggle('active', on);
    el.setAttribute('aria-pressed', String(on));
  };

  return {
    showWelcome,
    showInfo,
    closePanel,
    hideHint,
    showVRButton: (supported) => { document.getElementById('btn-vr').hidden = !supported; },
    setLabelsActive: (v) => setActive('btn-labels', v),
    setCutawayActive: (v) => setActive('btn-cut', v),
    setTourActive: (v) => {
      setActive('btn-tour', v);
      document.getElementById('btn-tour').innerHTML = v ? '⏹&nbsp;Stop' : '▶&nbsp;Tour';
    },
  };
}
