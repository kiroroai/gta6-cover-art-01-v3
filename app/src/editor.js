// Neon Vice Cover Maker — editor, panel layout, grades and PNG export.
// Everything runs locally: user photos are read with FileReader / object URLs
// on this device only and are never sent anywhere.

const FORMATS = {
  square: { w: 1080, h: 1080, label: '1080 × 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 × 1350' },
  wide: { w: 1920, h: 1080, label: '1920 × 1080' },
};

const GRADES = {
  sunset: { filter: 'saturate(1.35) contrast(1.08) sepia(0.30) hue-rotate(-8deg)', top: 'rgba(255,94,58,0.20)', bottom: 'rgba(64,10,90,0.30)' },
  neon: { filter: 'saturate(1.75) contrast(1.16) hue-rotate(10deg) brightness(1.05)', top: 'rgba(255,0,128,0.16)', bottom: 'rgba(0,180,255,0.20)' },
  noir: { filter: 'saturate(0.22) contrast(1.32) brightness(0.92)', top: 'rgba(0,0,0,0.18)', bottom: 'rgba(0,0,0,0.42)' },
};

// The multi-panel GTA-style layout, as fractions of the export canvas.
// focusX/focusY say which part of the featured artwork each panel shows first.
const PANEL_DEFS = [
  { id: 'hero', name: 'Hero', x: 0.0, y: 0.0, w: 0.52, h: 0.68, focusX: 0.35, focusY: 0.30 },
  { id: 'car', name: 'Supercar', x: 0.52, y: 0.0, w: 0.48, h: 0.34, focusX: 0.82, focusY: 0.28 },
  { id: 'heli', name: 'Helicopter', x: 0.52, y: 0.34, w: 0.48, h: 0.34, focusX: 0.78, focusY: 0.50 },
  { id: 'swamp', name: 'Airboat', x: 0.0, y: 0.68, w: 0.34, h: 0.32, focusX: 0.17, focusY: 0.85 },
  { id: 'beach', name: 'Beach', x: 0.34, y: 0.68, w: 0.33, h: 0.32, focusX: 0.52, focusY: 0.86 },
  { id: 'boat', name: 'Speedboat', x: 0.67, y: 0.68, w: 0.33, h: 0.32, focusX: 0.85, focusY: 0.85 },
];

const state = {
  view: 'editor',
  grade: 'sunset',
  format: 'square',
  title: 'NEON VICE',
  caption: 'One city. Every temptation.',
  selected: 'hero',
  panels: new Map(),
  userImage: null,
};

function makePanelState(def, img) {
  return { def, img, zoom: 1, ox: 0, oy: 0 };
}

function loadImageFromSrc(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Draw one panel: clip to its rectangle, cover-fit its image with the
// panel's zoom and pan, tinted by the active grade filter.
function drawPanelImage(ctx, panel, W, H) {
  const { def } = panel;
  const px = def.x * W, py = def.y * H, pw = def.w * W, ph = def.h * H;
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();
  ctx.fillStyle = '#1b0b30';
  ctx.fillRect(px, py, pw, ph);
  const img = panel.img;
  if (img) {
    const scale = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * panel.zoom;
    const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
    // Base position centres the panel's focus point, then the user's pan applies.
    let dx = px + pw / 2 - def.focusX * dw + panel.ox * pw;
    let dy = py + ph / 2 - def.focusY * dh + panel.oy * ph;
    dx = Math.min(px, Math.max(px + pw - dw, dx));
    dy = Math.min(py, Math.max(py + ph - dh, dy));
    ctx.filter = GRADES[state.grade].filter;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.filter = 'none';
  }
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = Math.max(3, W * 0.004);
  ctx.strokeRect(px, py, pw, ph);
  if (state.selected === def.id && W === previewCanvas.width) {
    ctx.strokeStyle = '#ff9a3d';
    ctx.lineWidth = Math.max(4, W * 0.007);
    ctx.strokeRect(px + 3, py + 3, pw - 6, ph - 6);
  }
  ctx.restore();
}

function drawGradeOverlay(ctx, W, H) {
  const g = GRADES[state.grade];
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, g.top);
  grad.addColorStop(1, g.bottom);
  ctx.save();
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawTitleAndCaption(ctx, W, H) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const titleSize = Math.round(H * 0.105);
  ctx.font = `900 ${titleSize}px "Arial Black", Arial, sans-serif`;
  const ty = H * 0.085;
  ctx.lineWidth = titleSize * 0.16;
  ctx.strokeStyle = '#14041f';
  ctx.strokeText(state.title.toUpperCase(), W / 2, ty);
  const grad = ctx.createLinearGradient(0, ty - titleSize / 2, 0, ty + titleSize / 2);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.55, '#ffe9a8');
  grad.addColorStop(1, '#ff9a3d');
  ctx.fillStyle = grad;
  ctx.fillText(state.title.toUpperCase(), W / 2, ty);
  // Caption band along the bottom edge.
  const bandH = H * 0.075;
  ctx.fillStyle = 'rgba(10,2,20,0.78)';
  ctx.fillRect(0, H - bandH, W, bandH);
  ctx.font = `700 ${Math.round(bandH * 0.42)}px Arial, sans-serif`;
  ctx.fillStyle = '#ffd9a8';
  ctx.fillText(state.caption.toUpperCase(), W / 2, H - bandH / 2);
  ctx.restore();
}

function drawCover(ctx, W, H) {
  ctx.save();
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  for (const def of PANEL_DEFS) drawPanelImage(ctx, state.panels.get(def.id), W, H);
  drawGradeOverlay(ctx, W, H);
  drawTitleAndCaption(ctx, W, H);
  ctx.restore();
}

const previewCanvas = document.getElementById('stage');
function renderPreview() {
  const fmt = FORMATS[state.format];
  if (previewCanvas.width !== fmt.w || previewCanvas.height !== fmt.h) {
    previewCanvas.width = fmt.w;
    previewCanvas.height = fmt.h;
  }
  drawCover(previewCanvas.getContext('2d'), fmt.w, fmt.h);
}

function exportPng() {
  const fmt = FORMATS[state.format];
  const out = document.createElement('canvas');
  out.width = fmt.w;
  out.height = fmt.h;
  const keepSelected = state.selected;
  state.selected = '__none__';
  drawCover(out.getContext('2d'), fmt.w, fmt.h);
  state.selected = keepSelected;
  renderPreview();
  out.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-vice-cover-${fmt.w}x${fmt.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }, 'image/png');
}

function setView(name) {
  state.view = name;
  document.body.dataset.view = name;
  for (const el of document.querySelectorAll('.view')) el.classList.remove('active');
  document.getElementById(`view-${name}`).classList.add('active');
  for (const el of document.querySelectorAll('.tab')) {
    el.classList.toggle('active', el.dataset.view === name);
  }
}

function selectPanel(id) {
  state.selected = id;
  const def = PANEL_DEFS.find((d) => d.id === id);
  document.getElementById('selected-panel-name').textContent = def.name;
  document.getElementById('zoom-slider').value = String(Math.round(state.panels.get(id).zoom * 100));
  for (const btn of document.querySelectorAll('#panel-buttons button')) {
    btn.classList.toggle('active', btn.dataset.panel === id);
  }
  renderPreview();
}

function assignUserImageToPanel(id) {
  if (!state.userImage) return;
  const panel = state.panels.get(id);
  panel.img = state.userImage;
  panel.def = { ...panel.def, focusX: 0.5, focusY: 0.5 };
  panel.zoom = 1; panel.ox = 0; panel.oy = 0;
}

async function useFeaturedArtwork() {
  const img = await loadImageFromSrc('cover.jpg');
  for (const def of PANEL_DEFS) {
    const panel = state.panels.get(def.id);
    panel.img = img;
    panel.def = def;
    panel.zoom = 1; panel.ox = 0; panel.oy = 0;
  }
  renderPreview();
}

function wireControls() {
  for (const tab of document.querySelectorAll('.tab')) {
    tab.addEventListener('click', () => setView(tab.dataset.view));
  }
  const panelButtons = document.getElementById('panel-buttons');
  for (const def of PANEL_DEFS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = def.name;
    btn.dataset.panel = def.id;
    btn.id = `panel-btn-${def.id}`;
    btn.addEventListener('click', () => selectPanel(def.id));
    panelButtons.appendChild(btn);
  }
  document.getElementById('photo-input').addEventListener('change', (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    loadImageFromSrc(url).then((img) => {
      state.userImage = img;
      assignUserImageToPanel(state.selected);
      renderPreview();
    });
  });
  document.getElementById('fill-all-btn').addEventListener('click', () => {
    for (const def of PANEL_DEFS) assignUserImageToPanel(def.id);
    renderPreview();
  });
  document.getElementById('sample-btn').addEventListener('click', () => { useFeaturedArtwork(); });
  document.getElementById('zoom-slider').addEventListener('input', (event) => {
    state.panels.get(state.selected).zoom = Number(event.target.value) / 100;
    renderPreview();
  });
  document.getElementById('title-input').addEventListener('input', (event) => {
    state.title = event.target.value || 'NEON VICE';
    renderPreview();
  });
  document.getElementById('caption-input').addEventListener('input', (event) => {
    state.caption = event.target.value || '';
    renderPreview();
  });
  for (const btn of document.querySelectorAll('.grade')) {
    btn.addEventListener('click', () => {
      state.grade = btn.dataset.grade;
      for (const b of document.querySelectorAll('.grade')) b.classList.toggle('active', b === btn);
      renderPreview();
    });
  }
  for (const btn of document.querySelectorAll('.format')) {
    btn.addEventListener('click', () => {
      state.format = btn.dataset.format;
      for (const b of document.querySelectorAll('.format')) b.classList.toggle('active', b === btn);
      renderPreview();
    });
  }
  document.getElementById('export-btn').addEventListener('click', exportPng);

  // Drag inside the preview to pan the selected panel's photo.
  let drag = null;
  previewCanvas.addEventListener('pointerdown', (event) => {
    const rect = previewCanvas.getBoundingClientRect();
    const nx = (event.clientX - rect.left) / rect.width;
    const ny = (event.clientY - rect.top) / rect.height;
    const hit = PANEL_DEFS.find((d) => nx >= d.x && nx < d.x + d.w && ny >= d.y && ny < d.y + d.h);
    if (hit && hit.id !== state.selected) selectPanel(hit.id);
    drag = { x: event.clientX, y: event.clientY };
    previewCanvas.setPointerCapture(event.pointerId);
  });
  previewCanvas.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const rect = previewCanvas.getBoundingClientRect();
    const panel = state.panels.get(state.selected);
    panel.ox += (event.clientX - drag.x) / (rect.width * panel.def.w);
    panel.oy += (event.clientY - drag.y) / (rect.height * panel.def.h);
    drag = { x: event.clientX, y: event.clientY };
    renderPreview();
  });
  previewCanvas.addEventListener('pointerup', () => { drag = null; });
}

async function boot() {
  for (const def of PANEL_DEFS) state.panels.set(def.id, makePanelState(def, null));
  wireControls();
  document.querySelector('.grade[data-grade="sunset"]').classList.add('active');
  document.querySelector('.format[data-format="square"]').classList.add('active');
  await useFeaturedArtwork();
  selectPanel('hero');
  const params = new URLSearchParams(location.search);
  if (params.get('title')) {
    state.title = params.get('title');
    document.getElementById('title-input').value = state.title;
  }
  if (params.get('caption')) {
    state.caption = params.get('caption');
    document.getElementById('caption-input').value = state.caption;
  }
  if (params.get('grade') && GRADES[params.get('grade')]) state.grade = params.get('grade');
  if (params.get('format') && FORMATS[params.get('format')]) state.format = params.get('format');
  renderPreview();
  setView(params.get('view') || 'editor');
  window.__neonViceReady = true;
  document.body.dataset.ready = 'true';
}

boot();
