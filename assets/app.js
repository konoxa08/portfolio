// Темна студія: scroll-driven 3D portfolio. Data lives in works.json.
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const data = await (await fetch('works.json')).json();
const WORKS = data.works, C = data.contacts;
const byId = Object.fromEntries(WORKS.map(w => [w.id, w]));
const NICHE = Object.fromEntries(data.niches.map(n => [n.id, n.name]));
const FEAT = data.featured.map(id => byId[id]).filter(Boolean);
const BN = Object.fromEntries(data.briefNiches.map(n => [n.id, n]));

/* ---------------- DOM ---------------- */
const tgUrl = 'https://t.me/' + C.telegram.replace('@', '');
const igUrl = 'https://instagram.com/' + C.instagram.replace('@', '');
$$('[data-c="name"]').forEach(e => e.textContent = C.name);
$$('[data-c="tg-link"]').forEach(e => e.href = tgUrl);
$$('[data-c="ig-link"]').forEach(e => e.href = igUrl);
$$('[data-t]').forEach(e => e.textContent = C[e.dataset.t]);
$('#count').textContent = WORKS.length;
$('#strip-n').textContent = data.niches.map(n => n.name).join(' · ');

const PLAY_SVG = '<svg viewBox="0 0 10 12" aria-hidden="true"><path d="M0 0L10 6L0 12Z"/></svg>';
const worksHost = $('#works'), rail = $('#rail');
FEAT.forEach((w, i) => {
  const a = document.createElement('article');
  a.className = 'chap'; a.id = 'w-' + w.id;
  a.innerHTML = `<div class="cap">
    <p class="eyebrow">${String(i + 1).padStart(2, '0')} / ${String(FEAT.length).padStart(2, '0')} · ${NICHE[w.niche]} · ${w.dur} с</p>
    <h2>${w.title}</h2><p class="desc">${w.desc}</p>
    <div class="meta"><span class="chip">${w.style}</span><button class="play" type="button" data-id="${w.id}">${PLAY_SVG}Дивитись зі звуком</button></div>
    <img src="media/${w.id}.jpg" alt="${w.title}" loading="lazy"></div>`;
  worksHost.append(a);
  const li = document.createElement('li');
  li.innerHTML = `<button type="button" data-i="${i}"><span>${NICHE[w.niche]}</span><i></i></button>`;
  li.firstChild.onclick = () => a.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  rail.append(li);
});

// niches
let curNiche = data.niches[0].id;
const nchips = $('#nchips');
data.niches.forEach(n => {
  const b = document.createElement('button');
  b.type = 'button'; b.role = 'tab'; b.textContent = n.name; b.dataset.n = n.id;
  b.onclick = () => setNiche(n.id);
  nchips.append(b);
});
function setNiche(id) {
  curNiche = id;
  $$('#nchips button').forEach(b => b.setAttribute('aria-selected', b.dataset.n === id));
  const list = WORKS.filter(w => w.niche === id);
  $('#nhint').textContent = `${list.length} ${list.length === 1 ? 'ролик' : list.length < 5 ? 'ролики' : 'роликів'} у цій ніші. Екрани в студії вже підсвітились.`;
  $('#nlist').innerHTML = list.map(w => `<li><button type="button" data-id="${w.id}"><img src="media/${w.id}.jpg" alt="" loading="lazy"><span><b>${w.title}</b><small>${w.style}</small></span><em>${w.dur} с</em></button></li>`).join('');
}
setNiche(curNiche);

// brief
const bNiche = $('#b-niche'), bName = $('#b-name');
bNiche.innerHTML = data.briefNiches.map(n => `<option value="${n.id}">${n.name}</option>`).join('');
const brief = { niche: 'kavyarnya', name: '', style: 'trail', t0: 0 };
const syncBrief = () => {
  brief.niche = bNiche.value; brief.name = bName.value.trim();
  brief.style = ($('#b-style input:checked') || {}).value || 'trail';
  bName.placeholder = BN[brief.niche].example;
  brief.t0 = performance.now();
};
bNiche.onchange = syncBrief; bName.oninput = syncBrief;
$$('#b-style input').forEach(r => r.onchange = syncBrief);
syncBrief();
$('#bform').addEventListener('submit', e => {
  e.preventDefault();
  const n = BN[brief.niche];
  const txt = `Привіт! Хочу ролик.\nНіша: ${n.name}\nНазва: ${brief.name || n.example}\nСтиль: ${$('#b-style input:checked + span').textContent}`;
  copy(txt, 'Бриф скопійовано. Вставте його в чат Telegram');
  window.open(tgUrl, '_blank', 'noopener');
});

// copy + toast
const toast = $('#toast'); let toastT;
function say(msg) { toast.textContent = msg; toast.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('on'), 2600); }
async function copy(text, msg) {
  try { await navigator.clipboard.writeText(text); say(msg || 'Скопійовано'); }
  catch { say('Виділіть текст і скопіюйте вручну'); }
}
$$('.cp').forEach(b => b.onclick = () => copy(C[b.dataset.copy], 'Скопійовано: ' + C[b.dataset.copy]));

// player
const dlg = $('#player'), pv = $('#pv');
function openPlayer(id) {
  const w = byId[id]; if (!w) return;
  pv.src = 'media/' + id + '.mp4'; pv.poster = 'media/' + id + '.jpg';
  $('#pt').textContent = w.title; $('#ps').textContent = `${NICHE[w.niche]} · ${w.style} · ${w.dur} с`;
  if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  pv.muted = false; pv.play().catch(() => {});
}
function closePlayer() { pv.pause(); dlg.close ? dlg.close() : dlg.removeAttribute('open'); }
document.addEventListener('click', e => {
  const b = e.target.closest('.play,.nlist button'); if (b) openPlayer(b.dataset.id);
});
$('#px').onclick = closePlayer;
dlg.addEventListener('click', e => { if (e.target === dlg) closePlayer(); });
dlg.addEventListener('close', () => pv.pause());

// sound toggle (scene video)
let soundOn = false;
const snd = $('#snd');
snd.onclick = () => {
  soundOn = !soundOn; snd.setAttribute('aria-pressed', soundOn);
  if (window.__vid) { window.__vid.muted = !soundOn; window.__vid.play().catch(() => {}); }
  say(soundOn ? 'Звук увімкнено' : 'Звук вимкнено');
};

/* ---------------- brief preview generator (canvas 540x960) ---------------- */
const ICONS = {
  house: ['M30 100 L100 40 L170 100 M50 85 V165 H150 V85 M85 165 V120 H115 V165', 820],
  figure: ['M84 45 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0 M100 61 V120 M100 80 L60 100 M100 80 L140 100 M100 120 L70 170 M100 120 L130 170', 520],
  cup: ['M55 80 H145 L135 160 Q133 170 120 170 H80 Q67 170 65 160 Z M145 95 Q180 95 175 125 Q170 145 138 145 M85 62 Q75 46 85 30 M115 62 Q105 46 115 30', 720],
  bag: ['M50 70 H150 L160 170 H40 Z M75 70 V55 Q75 30 100 30 Q125 30 125 55 V70', 660],
  shoe: ['M30 140 L35 100 Q60 105 80 90 L95 75 Q120 110 165 120 Q178 124 175 140 Z M30 140 H175 M60 104 L70 120 M75 96 L86 113', 640],
  book: ['M100 60 Q70 45 35 50 V160 Q70 155 100 170 Q130 155 165 160 V50 Q130 45 100 60 Z M100 60 V170', 780],
  spark: ['M100 30 Q108 92 170 100 Q108 108 100 170 Q92 108 30 100 Q92 92 100 30 Z', 560],
  plate: ['M50 100 a50 50 0 1 0 100 0 a50 50 0 1 0 -100 0 M70 100 a30 30 0 1 0 60 0 a30 30 0 1 0 -60 0 M28 50 V150 M175 50 V150 M20 50 V80 Q28 90 36 80 V50', 940],
  star: ['M100 30 L120 80 L172 82 L130 115 L145 166 L100 136 L55 166 L70 115 L28 82 L80 80 Z', 620],
};
const P2D = Object.fromEntries(Object.entries(ICONS).map(([k, [d, l]]) => [k, [new Path2D(d), l]]));
const G = document.createElement('canvas'); G.width = 540; G.height = 960;
const g = G.getContext('2d');
const PAL = {
  trail: { a: '#3fd6ff', top: '#06182a', bot: '#020509', soft: '63,214,255' },
  glass: { a: '#a6dcff', top: '#0b1030', bot: '#04060f', soft: '120,150,255' },
  kinetic: { a: '#c6ff3d', top: '#060606', bot: '#0b0f05', soft: '198,255,61' },
};
const FONT = '"Inter",-apple-system,"Segoe UI",sans-serif';
function fitLines(words, max, f0, fmin, weight) {
  for (let f = f0; f >= fmin; f -= 2) {
    g.font = `${weight} ${f}px ${FONT}`;
    const lines = []; let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (g.measureText(t).width <= max || !cur) cur = t; else { lines.push(cur); cur = w; }
    }
    lines.push(cur);
    if (lines.length <= 3 && lines.every(l => g.measureText(l).width <= max)) return { f, lines };
  }
  g.font = `${weight} ${fmin}px ${FONT}`;
  return { f: fmin, lines: [words.join(' ')] };
}
function drawGen(now) {
  const T = ((now - brief.t0) / 1000) % 6.5, S = brief.style, p = PAL[S], N = BN[brief.niche];
  const name = (brief.name || N.example).toUpperCase();
  g.save(); g.clearRect(0, 0, 540, 960);
  let gr = g.createLinearGradient(0, 0, 0, 960); gr.addColorStop(0, p.top); gr.addColorStop(1, p.bot);
  g.fillStyle = gr; g.fillRect(0, 0, 540, 960);
  const br = S === 'glass' ? .5 + .5 * Math.sin(now / 900) : .3;
  const rg = g.createRadialGradient(270, 560, 10, 270, 560, 360 + br * 90);
  rg.addColorStop(0, `rgba(${p.soft},${S === 'glass' ? .42 : .2})`); rg.addColorStop(1, `rgba(${p.soft},0)`);
  g.fillStyle = rg; g.fillRect(0, 0, 540, 960);
  if (S === 'glass') { const r2 = g.createRadialGradient(120, 220, 0, 120, 220, 300); r2.addColorStop(0, 'rgba(139,123,255,.35)'); r2.addColorStop(1, 'rgba(139,123,255,0)'); g.fillStyle = r2; g.fillRect(0, 0, 540, 960); }

  // title
  const { f, lines } = fitLines(name.split(/\s+/), 460, 88, 44, 900);
  const lh = f * .98, ty = 150;
  g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.letterSpacing = `${-f * .03}px`;
  if (S === 'kinetic') {
    const words = lines.join(' ').split(' ');
    let wi = 0;
    lines.forEach((ln, li) => {
      g.font = `900 ${f}px ${FONT}`;
      const full = g.measureText(ln).width; let x = 270 - full / 2;
      ln.split(' ').forEach(w => {
        const k = clamp((T - .15 - wi * .22) / .3), ww = g.measureText(w).width;
        if (k > 0) {
          g.save(); g.translate(x + ww / 2, ty + li * lh); g.rotate((1 - ease(k)) * -.12); g.scale(1 + (1 - ease(k)) * .4, 1 + (1 - ease(k)) * .4); g.globalAlpha = k;
          const last = wi === words.length - 1;
          if (last) { g.fillStyle = p.a; g.fillRect(-ww / 2 - 10, -f * .78, ww + 20, f * .95); g.fillStyle = '#060606'; } else g.fillStyle = '#fff';
          g.fillText(w, 0, 0); g.restore();
        }
        x += ww + g.measureText(' ').width; wi++;
      });
    });
  } else {
    const k = ease(clamp(T / .7));
    g.save(); g.translate(270, ty + (lines.length - 1) * lh / 2); g.scale(1.12 - .12 * k, 1.12 - .12 * k); g.globalAlpha = k;
    g.fillStyle = '#fff'; g.font = `900 ${f}px ${FONT}`;
    if (S === 'trail') { g.shadowColor = p.a; g.shadowBlur = 24; }
    lines.forEach((ln, i) => g.fillText(ln, 0, (i - (lines.length - 1) / 2) * lh));
    g.restore();
  }
  g.letterSpacing = '0px';
  const below = ty + (lines.length - 1) * lh + 58;
  const tk = ease(clamp((T - 1.4) / .6));
  g.globalAlpha = tk; g.fillStyle = 'rgba(230,242,255,.78)'; g.font = `500 26px ${FONT}`;
  g.fillText(N.tag, 270, below + (1 - tk) * 14); g.globalAlpha = 1;

  // icon
  const [path, len] = P2D[N.icon];
  const draw = clamp((T - .8) / 1.9), fade = 1 - clamp((T - 5.6) / .6);
  const cy = 560;
  if (S === 'glass') {
    g.save(); g.globalAlpha = ease(clamp((T - .5) / .6)) * fade;
    g.fillStyle = 'rgba(255,255,255,.07)'; g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 1.5;
    g.beginPath(); g.roundRect(130, cy - 150, 280, 280, 56); g.fill(); g.stroke();
    const sh = g.createLinearGradient(130, cy - 150, 410, cy + 130); sh.addColorStop(0, 'rgba(255,255,255,.16)'); sh.addColorStop(.5, 'rgba(255,255,255,0)');
    g.fillStyle = sh; g.fill(); g.restore();
  }
  g.save(); g.translate(270 - 100 * 1.3, cy - 10 - 100 * 1.3); g.scale(1.3, 1.3);
  g.lineCap = 'round'; g.lineJoin = 'round'; g.setLineDash([len, len]); g.lineDashOffset = len * (1 - ease(draw));
  g.globalAlpha = fade; g.strokeStyle = p.a; g.shadowColor = p.a;
  g.lineWidth = 9; g.globalAlpha = fade * .25; g.shadowBlur = 30; g.stroke(path);
  g.lineWidth = 3.2; g.globalAlpha = fade; g.shadowBlur = 14; g.strokeStyle = S === 'kinetic' ? p.a : '#d9f6ff'; g.stroke(path);
  g.restore();
  if (S === 'trail') { // light trail running into the icon
    const k = ease(clamp((T - .3) / 1.2));
    g.save(); g.strokeStyle = p.a; g.shadowColor = p.a; g.shadowBlur = 18; g.lineWidth = 3; g.globalAlpha = .85 * fade; g.lineCap = 'round';
    g.setLineDash([700, 700]); g.lineDashOffset = 700 * (1 - k);
    g.beginPath(); g.moveTo(-10, 900); g.bezierCurveTo(160, 820, 80, 720, 140, cy + 170); g.lineTo(400, cy + 170); g.stroke(); g.restore();
  }

  // end card
  const e = ease(clamp((T - 3.9) / .6));
  g.globalAlpha = e;
  g.fillStyle = S === 'kinetic' ? p.a : '#fff';
  g.beginPath(); g.roundRect(150, 790 + (1 - e) * 20, 240, 58, 29); g.fill();
  g.fillStyle = S === 'kinetic' ? '#060606' : '#04060b'; g.font = `700 22px ${FONT}`;
  g.fillText('Замовити', 270, 827 + (1 - e) * 20);
  g.fillStyle = 'rgba(230,242,255,.8)'; g.font = `600 22px ${FONT}`; g.fillText(C.phone, 270, 760 + (1 - e) * 20);
  g.globalAlpha = 1;
  // chrome
  g.textAlign = 'left'; g.font = `700 16px ${FONT}`; g.fillStyle = '#5dffb0'; g.fillText('● ПРЕВ\'Ю', 28, 44);
  g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(28, 924, 484, 3); g.fillStyle = p.a; g.fillRect(28, 924, 484 * (T / 6.5), 3);
  g.restore();
}

/* ---------------- 3D ---------------- */
const loader = $('#loader'), fill = $('#ld-fill');
const hideLoader = () => loader.classList.add('off');
let THREE;
try {
  THREE = await import('three');
  await initScene();
} catch (err) {
  console.warn('3D off:', err);
  document.body.classList.add('nogl');
  hideLoader();
}

async function initScene() {
  const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }, { Reflector }] = await Promise.all([
    import('three/addons/postprocessing/EffectComposer.js'), import('three/addons/postprocessing/RenderPass.js'),
    import('three/addons/postprocessing/UnrealBloomPass.js'), import('three/addons/postprocessing/OutputPass.js'),
    import('three/addons/objects/Reflector.js')]);
  const canvas = $('#gl');
  const narrow = () => innerWidth / innerHeight < .8;
  const lowEnd = matchMedia('(max-width: 760px)').matches || (navigator.hardwareConcurrency || 8) <= 4;
  const r = new THREE.WebGLRenderer({ canvas, antialias: !lowEnd, powerPreference: 'high-performance' });
  if (!r.getContext()) throw new Error('no webgl');
  let dpr = Math.min(devicePixelRatio, lowEnd ? 1.5 : 1.75);
  r.setPixelRatio(dpr); r.setSize(innerWidth, innerHeight, false);
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.3;
  const s = new THREE.Scene(); s.background = new THREE.Color(0x03050a); s.fog = new THREE.FogExp2(0x03050a, .04);
  const cam = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, .1, 100);

  const man = new THREE.LoadingManager();
  man.onProgress = (u, a, b) => fill.style.width = Math.round(a / b * 100) + '%';
  const TL = new THREE.TextureLoader(man);
  const tex = url => { const t = TL.load(url); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };

  // floor
  let reflector = null;
  if (!lowEnd) {
    reflector = new Reflector(new THREE.PlaneGeometry(60, 60), { textureWidth: innerWidth * .5, textureHeight: innerHeight * .5, color: 0x1a2029 });
    reflector.rotation.x = -Math.PI / 2; s.add(reflector);
  }
  const fl2 = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0x05070c, roughness: lowEnd ? .35 : .55, metalness: lowEnd ? .6 : .2, transparent: !lowEnd, opacity: .9 }));
  fl2.rotation.x = -Math.PI / 2; fl2.position.y = .002; s.add(fl2);

  // wall + slats
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(44, 14), new THREE.MeshStandardMaterial({ color: 0x07090f, roughness: .9 }));
  wall.position.set(0.6, 6, -4.2); s.add(wall);
  const NS = 85, slats = new THREE.InstancedMesh(new THREE.BoxGeometry(.11, 9, .12), new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: .55, metalness: .1 }), NS);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < NS; i++) { m4.makeTranslation(0.6 + (i - NS / 2) * .26, 4.5, -4.05); slats.setMatrixAt(i, m4); }
  s.add(slats);
  const neon = (w, h, col, k, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, .04), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k) })); m.position.set(x, y, z); s.add(m); return m; };
  neon(7, .03, 0x3fd6ff, 2.4, 0.6, 5.4, -3.9);
  neon(.035, 3.2, 0x8b7bff, 3, -7.4, 3.2, -3.9);
  neon(.035, 2.2, 0x3fd6ff, 2.5, 8.6, 2.6, -3.9);

  s.add(new THREE.AmbientLight(0x6a7aa0, .16));
  const sp = new THREE.SpotLight(0x9fe9ff, 110, 18, .7, .6, 1.5); sp.position.set(0.6, 6, -2.5); sp.target.position.set(0.6, 0, -3.5); s.add(sp, sp.target);
  const pl = (c, i, x, y, z) => { const p = new THREE.PointLight(c, i, 8, 2); p.position.set(x, y, z); s.add(p); };
  pl(0x3fd6ff, 14, 0.6, 2.2, -1.2); pl(0x8b7bff, 8, -3.5, 2.5, 1.5); pl(0x3fd6ff, 8, 4.5, 2, 1);

  // desk + monitor
  const dark = c => new THREE.MeshStandardMaterial({ color: c, roughness: .35, metalness: .45 });
  const desk = new THREE.Mesh(new THREE.BoxGeometry(5.4, .12, 1.9), dark(0x0b0d12)); desk.position.set(0.6, 1.08, -2.2); s.add(desk);
  for (const x of [-1, 1]) { const lg = new THREE.Mesh(new THREE.BoxGeometry(.08, 1.08, 1.6), dark(0x111318)); lg.position.set(0.6 + x * 2.5, .54, -2.2); s.add(lg); }
  const kb = new THREE.Mesh(new THREE.BoxGeometry(1.5, .04, .5), new THREE.MeshStandardMaterial({ color: 0x101218, emissive: 0x0a2a44, emissiveIntensity: .6 })); kb.position.set(0.4, 1.16, -1.75); s.add(kb);
  const stand = new THREE.Mesh(new THREE.BoxGeometry(.12, .6, .12), dark(0x111318)); stand.position.set(0.6, 1.4, -2.8); s.add(stand);
  const mon = new THREE.Group(); mon.position.set(0.6, 2.55, -2.75); s.add(mon);
  mon.add(new THREE.Mesh(new THREE.BoxGeometry(3.7, 2.15, .08), dark(0x0a0b0e)));
  const mbC = document.createElement('canvas'); mbC.width = 512; mbC.height = 288;
  { const x = mbC.getContext('2d'); const gr = x.createRadialGradient(256, 160, 10, 256, 160, 300); gr.addColorStop(0, '#0c2a40'); gr.addColorStop(1, '#03060c'); x.fillStyle = gr; x.fillRect(0, 0, 512, 288); }
  const mbT = new THREE.CanvasTexture(mbC); mbT.colorSpace = THREE.SRGBColorSpace;
  const monBg = new THREE.Mesh(new THREE.PlaneGeometry(3.56, 2), new THREE.MeshBasicMaterial({ map: mbT, toneMapped: false })); monBg.position.z = .042; mon.add(monBg);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2), new THREE.MeshBasicMaterial({ color: 0x3fd6ff, transparent: true, opacity: .16, blending: THREE.AdditiveBlending, depthWrite: false })); glow.position.z = .044; mon.add(glow);
  const genT = new THREE.CanvasTexture(G); genT.colorSpace = THREE.SRGBColorSpace;
  const monV = new THREE.Mesh(new THREE.PlaneGeometry(1.125, 2), new THREE.MeshBasicMaterial({ toneMapped: false, color: new THREE.Color(.95, .95, .95) })); monV.position.z = .047; mon.add(monV);

  // floating screens on an arc around the room
  const O = new THREE.Vector3(0.6, 0, 5.5), R = 8;
  const order = [...FEAT, ...WORKS.filter(w => !FEAT.includes(w))];
  const featSlots = [-46, -34, -22, 22, 34, 46], extra = [-58, 58, -70, 70, -82, 82];
  const H = { '-82': 3.3, '-70': 2.5, '-58': 3.6, '-46': 2.4, '-34': 3.8, '-22': 2.3, '22': 2.3, '34': 3.8, '46': 2.4, '58': 3.6, '70': 2.5, '82': 3.3 };
  const screens = {};
  order.forEach((w, i) => {
    const ang = i < FEAT.length ? featSlots[i] : extra[i - FEAT.length]; if (ang === undefined) return;
    const a = THREE.MathUtils.degToRad(ang);
    const pos = new THREE.Vector3(O.x + R * Math.sin(a), H[ang], O.z - R * Math.cos(a));
    const grp = new THREE.Group(); grp.position.copy(pos); grp.rotation.y = -a;
    const fr = new THREE.Mesh(new THREE.BoxGeometry(1.08, 1.86, .05), new THREE.MeshStandardMaterial({ color: 0x0b0d12, metalness: .8, roughness: .25 })); grp.add(fr);
    const rimM = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x3fd6ff).multiplyScalar(1.3) });
    const rim = new THREE.Mesh(new THREE.PlaneGeometry(1.035, 1.813), rimM); rim.position.z = .027; grp.add(rim);
    const poster = tex(`media/${w.id}.jpg`);
    const dim = ['gongpaper', 'bal', 'thetea'].includes(w.id) ? .66 : 1;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.778), new THREE.MeshBasicMaterial({ map: poster, toneMapped: false, color: new THREE.Color(dim, dim, dim) }));
    scr.position.z = .03; grp.add(scr);
    s.add(grp);
    const n = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)), lx = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    screens[w.id] = { grp, scr, rimM, poster, pos, n, lx, dim, base: pos.y, phase: i * 1.7, lvl: 1 };
  });
  monV.material.map = screens[FEAT[0].id].poster;

  // dust
  const nd = lowEnd ? 220 : 520, pg = new THREE.BufferGeometry(), pts = new Float32Array(nd * 3);
  for (let i = 0; i < nd; i++) { pts[i * 3] = (Math.random() - .5) * 22 + .6; pts[i * 3 + 1] = Math.random() * 7; pts[i * 3 + 2] = (Math.random() - .5) * 12; }
  pg.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  const dust = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x9fe9ff, size: .025, transparent: true, opacity: .5, depthWrite: false }));
  s.add(dust);

  // post
  const comp = new EffectComposer(r);
  comp.addPass(new RenderPass(s, cam));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), .85, .6, .62);
  comp.addPass(bloom); comp.addPass(new OutputPass());
  comp.setPixelRatio(dpr); comp.setSize(innerWidth, innerHeight);

  // video
  const vid = document.createElement('video');
  Object.assign(vid, { muted: true, loop: true, playsInline: true, preload: 'auto', crossOrigin: 'anonymous' });
  vid.setAttribute('playsinline', ''); vid.setAttribute('muted', '');
  window.__vid = vid;
  const vtex = new THREE.VideoTexture(vid); vtex.colorSpace = THREE.SRGBColorSpace;
  let vidId = null;
  const wantVideo = id => {
    if (vidId === id) return;
    vidId = id; vid.src = `media/${id}.mp4`; vid.muted = !soundOn; vid.play().catch(() => {});
  };

  // camera keys, one per scroll section
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  let K = [];
  function buildKeys() {
    const P = narrow(); K = [];
    K.push(P ? { p: V(0.6, 2.7, 15), l: V(0.6, 3.3, 0), f: 55 } : { p: V(-2.4, 2.2, 11), l: V(1.6, 2.4, 0), f: 38 });
    FEAT.forEach(w => {
      const sc = screens[w.id];
      if (P) K.push({ p: sc.pos.clone().addScaledVector(sc.n, 3.1).add(V(0, -.6, 0)), l: sc.pos.clone().add(V(0, -.6, 0)), f: 52 });
      else K.push({ p: sc.pos.clone().addScaledVector(sc.n, 3.3).addScaledVector(sc.lx, -.8), l: sc.pos.clone().addScaledVector(sc.lx, -.8), f: 38 });
    });
    K.push(P ? { p: V(0.6, 2.9, 15.5), l: V(0.6, 3.8, 0), f: 55 } : { p: V(-4.4, 2.1, 10.6), l: V(-1.1, 2.3, 0), f: 38 });
    K.push(P ? { p: V(0.6, 2.35, 3.0), l: V(0.6, 1.75, -2.75), f: 52 } : { p: V(-2.4, 2.45, 4.0), l: V(-0.5, 2.5, -2.75), f: 38 });
    K.push(P ? { p: V(0.6, 7, 17), l: V(0.6, 3.6, 0), f: 55 } : { p: V(0.6, 6.2, 14), l: V(2.2, 2.4, 0), f: 38 });
  }
  buildKeys();
  const secs = () => [$('#hero'), ...$$('.chap'), $('#niches'), $('#brief'), $('#contact')];
  let SE = secs(), tops = [];
  const measure = () => { tops = SE.map(e => e.getBoundingClientRect().top + scrollY); };
  measure();

  const camP = K[0].p.clone().add(V(0, 1.2, 7)), camL = K[0].l.clone(); let camF = K[0].f;
  const tP = new THREE.Vector3(), tL = new THREE.Vector3();
  let mode = { kind: 'hero', idx: -1 };
  function target() {
    const y = scrollY + 1;
    let k = 0; for (let i = 0; i < tops.length; i++) if (tops[i] <= y) k = i;
    if (k >= K.length - 1) { tP.copy(K[K.length - 1].p); tL.copy(K[K.length - 1].l); return { k: K.length - 1, e: 0, f: K[K.length - 1].f }; }
    const f = clamp((y - tops[k]) / (tops[k + 1] - tops[k]));
    const e = ease(clamp((f - .45) / .55));
    tP.lerpVectors(K[k].p, K[k + 1].p, e); tL.lerpVectors(K[k].l, K[k + 1].l, e);
    tP.y += Math.sin(e * Math.PI) * .5;
    return { k, e, f: K[k].f + (K[k + 1].f - K[k].f) * e };
  }

  addEventListener('resize', () => {
    r.setSize(innerWidth, innerHeight, false); comp.setSize(innerWidth, innerHeight);
    bloom.setSize(innerWidth / 2, innerHeight / 2);
    cam.aspect = innerWidth / innerHeight; buildKeys(); measure();
  });
  new ResizeObserver(measure).observe(document.body);

  // adaptive quality
  let slow = 0, last = performance.now(), degraded = false;
  function degrade() { degraded = true; dpr = 1; r.setPixelRatio(1); comp.setPixelRatio(1); bloom.strength = .6; if (reflector) reflector.visible = false; }

  const railBtns = $$('#rail button'), caps = $$('.chap .cap');
  let started = false;
  function frame(now) {
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    if (started && !degraded && !window.__noDegrade) { slow = dt > .045 ? slow + dt : Math.max(0, slow - dt * .5); if (slow > 2.5) degrade(); }
    const st = target();
    const near = st.e < .5 ? st.k : st.k + 1;
    const nF = FEAT.length;
    const kind = near === 0 ? 'hero' : near <= nF ? 'work' : near === nF + 1 ? 'niche' : near === nF + 2 ? 'brief' : 'contact';
    document.body.classList.toggle('inworks', kind === 'work');
    const kf = st.k + st.e;
    caps.forEach((c, i) => { const o = clamp(1 - Math.abs(kf - (i + 1)) * 2.6); c.style.opacity = o; c.style.visibility = o < .01 ? 'hidden' : ''; });
    const bs = kind === 'work' ? .32 : kind === 'brief' ? .45 : .85, bt = kind === 'work' ? .92 : .62;
    bloom.strength += (bs * (degraded ? .7 : 1) - bloom.strength) * Math.min(1, dt * 4); bloom.threshold += (bt - bloom.threshold) * Math.min(1, dt * 4);
    railBtns.forEach((b, i) => b.classList.toggle('on', kind === 'work' && near - 1 === i));

    // camera
    const a = reduced ? 1 : 1 - Math.exp(-dt * 4.5);
    camP.lerp(tP, a); camL.lerp(tL, a); camF += (st.f - camF) * a;
    cam.position.copy(camP); cam.fov = camF; cam.updateProjectionMatrix(); cam.lookAt(camL);

    // what plays where
    let vidTarget = null, vidFor = null;
    if (kind === 'work') { vidFor = FEAT[near - 1].id; vidTarget = screens[vidFor].scr; }
    else if (kind === 'niche') { vidFor = WORKS.find(w => w.niche === curNiche).id; vidTarget = monV; }
    else if (kind === 'hero' || kind === 'contact') { vidFor = FEAT[0].id; vidTarget = monV; }
    if (vidFor) wantVideo(vidFor);
    const vReady = vid.readyState >= 2 && !vid.paused;
    for (const [id, sc] of Object.entries(screens)) {
      const on = vidTarget === sc.scr;
      const m = on && vReady ? vtex : sc.poster;
      if (sc.scr.material.map !== m) { sc.scr.material.map = m; sc.scr.material.needsUpdate = true; }
      const want = kind === 'niche' ? (byId[id].niche === curNiche ? 1 : .16) : on ? 1 : kind === 'work' ? .45 : 1;
      sc.lvl += (want - sc.lvl) * Math.min(1, dt * 5);
      const c = sc.lvl * (on ? 1 : sc.dim);
      sc.scr.material.color.setRGB(c, c, c);
      sc.rimM.color.setHex(0x3fd6ff).multiplyScalar((on ? 1.5 + Math.sin(now / 300) * .2 : 1.3) * (.35 + .65 * sc.lvl));
      if (!reduced) sc.grp.position.y = sc.base + Math.sin(now / 1400 + sc.phase) * .05;
    }
    let mm;
    if (kind === 'brief') { drawGen(now); genT.needsUpdate = true; mm = genT; }
    else if (vidTarget === monV && vReady) mm = vtex;
    else mm = screens[vidFor || FEAT[0].id].poster;
    if (monV.material.map !== mm) { monV.material.map = mm; monV.material.needsUpdate = true; }
    glow.material.opacity = .14 + (kind === 'brief' ? .1 : 0);
    if (!reduced) dust.rotation.y = now / 90000;

    comp.render();
    requestAnimationFrame(frame);
  }

  await new Promise(res => { man.onLoad = res; setTimeout(res, 8000); });
  await document.fonts.ready;
  fill.style.width = '100%';
  requestAnimationFrame(frame);
  setTimeout(() => { hideLoader(); started = true; }, 250);
  window.__ready = true;
}
if (document.body.classList.contains('nogl')) window.__ready = true;
