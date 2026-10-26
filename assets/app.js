// Темна студія: scroll-driven 3D portfolio. Data lives in works.json.
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;

const data = await (await fetch('works.json')).json();
const WORKS = data.works, C = data.contacts;
const byId = Object.fromEntries(WORKS.map(w => [w.id, w]));
const NICHE = Object.fromEntries(data.niches.map(n => [n.id, n.name]));
const FEAT = data.featured.map(id => byId[id]).filter(Boolean);
const ORDER = [...FEAT, ...WORKS.filter(w => !FEAT.includes(w))];
const BN = Object.fromEntries(data.briefNiches.map(n => [n.id, n]));

/* ---------------- scroll ---------------- */
// native scrolling; the camera itself is damped, so motion stays smooth
// light smooth-wheel; falls back to native scrolling if the page can't move itself
const SS = { on: matchMedia('(pointer: fine)').matches && !reduced, can: matchMedia('(pointer: fine)').matches && !reduced, tgt: 0, cur: 0, run: false, ok: false };
const ssStep = () => {
  const now = performance.now(), dt = Math.min(.05, (now - (SS.last || now)) / 1000 || .016); SS.last = now;
  SS.cur += (SS.tgt - SS.cur) * (1 - Math.exp(-dt * 7));
  if (Math.abs(SS.tgt - SS.cur) < .5) { SS.cur = SS.tgt; SS.run = false; }
  scrollTo(0, SS.cur);
  if (SS.run) requestAnimationFrame(ssStep); else SS.last = 0;
};
addEventListener('wheel', e => {
  if (!SS.on || e.ctrlKey || document.documentElement.style.overflow === 'hidden') return;
  if (e.target.closest && e.target.closest('.cat-in,dialog,select,textarea,.nlist')) return;
  e.preventDefault();
  const dy = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
  if (!SS.run) { SS.tgt = SS.cur = scrollY; }
  const max = document.documentElement.scrollHeight - innerHeight;
  SS.tgt = clamp(SS.tgt + dy * 1.1, 0, max);
  if (!SS.run) { SS.run = true; requestAnimationFrame(ssStep); }
  if (!SS.ok) {
    const y0 = scrollY, want = SS.tgt;
    setTimeout(() => {
      if (Math.abs(scrollY - y0) < 1 && Math.abs(want - y0) > 4) { SS.on = false; SS.run = false; scrollBy(0, want - y0); }
      else SS.ok = true;
    }, 220);
  }
}, { passive: false });
const lockScroll = on => { SS.run = false; document.documentElement.style.overflow = on ? 'hidden' : ''; };
// eased scroll for guided moves (e.g. click on the monitor in «Чому я»)
let tweenId = 0;
function tweenScroll(y, dur = 1600) {
  const id = ++tweenId, y0 = scrollY, t0 = performance.now(); SS.run = false;
  const st = () => {
    if (id !== tweenId) return;
    const k = clamp((performance.now() - t0) / dur), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    scrollTo(0, y0 + (y - y0) * e);
    if (k < 1) requestAnimationFrame(st);
  };
  requestAnimationFrame(st);
}
addEventListener('wheel', () => { tweenId++; }, { passive: true });
// jump with a cinematic camera flight instead of scrolling through every section
const W = { t0: -1e9, dur: 1500 };
function go(el) {
  if (!el) return;
  const y = el.getBoundingClientRect().top + scrollY;
  if (Math.abs(y - scrollY) < 4) return;
  document.body.classList.add('warping');
  W.pending = () => {
    SS.run = false; scrollTo({ top: y, behavior: 'instant' });
    W.t0 = performance.now();
    setTimeout(() => document.body.classList.remove('warping'), 60);
  };
  setTimeout(() => { if (W.pending) { W.pending(); W.pending = null; } }, 230);
}

/* ---------------- DOM ---------------- */
const tgUrl = 'https://t.me/' + C.telegram.replace('@', '');
const igUrl = 'https://instagram.com/' + C.instagram.replace('@', '');
$$('[data-c="name"]').forEach(e => e.textContent = C.name);
$$('[data-c="tg-link"]').forEach(e => e.href = tgUrl);
$$('[data-c="ig-link"]').forEach(e => e.href = igUrl);
$$('[data-c="tel-link"]').forEach(e => e.href = 'tel:' + (C.phoneRaw || C.phone.replace(/[^+\d]/g, '')));
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
  li.firstChild.onclick = () => go(a);
  rail.append(li);
});

// in-page links fly the camera
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]'); if (!a) return;
  const el = document.querySelector(a.getAttribute('href')); if (!el) return;
  e.preventDefault(); a.blur();
  if (a.getAttribute('href') === '#works') openCatalog(); else go(el);
});
$('#home').onclick = () => go($('#hero'));

// niches
let curNiche = data.niches[0].id;
const nchips = $('#nchips');
data.niches.forEach(n => {
  const b = document.createElement('button');
  b.type = 'button'; b.role = 'tab'; b.textContent = n.name; b.dataset.n = n.id;
  b.onclick = () => setNiche(n.id);
  nchips.append(b);
});
{ const b = document.createElement('button'); b.type = 'button'; b.role = 'tab'; b.textContent = 'Інша'; b.dataset.n = 'insha'; b.onclick = () => setNiche('insha'); nchips.append(b); }
function setNiche(id) {
  curNiche = id;
  $$('#nchips button').forEach(b => b.setAttribute('aria-selected', b.dataset.n === id));
  const other = id === 'insha';
  $('#insha').hidden = !other; $('#nlist').hidden = other; $('#nhint').hidden = other;
  if (other) return;
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

// catalogue of all works
const catEl = $('#catalog'), catGrid = $('#cat-grid'), catChips = $('#cat-chips');
let catFilter = 'all', catReturn = false;
$('#cat-n').textContent = WORKS.length;
[{ id: 'all', name: 'Усі' }, ...data.niches].forEach(n => {
  const cnt = n.id === 'all' ? WORKS.length : WORKS.filter(w => w.niche === n.id).length;
  if (!cnt) return;
  const b = document.createElement('button'); b.type = 'button'; b.role = 'tab'; b.dataset.n = n.id;
  b.innerHTML = `${n.name} <small>${cnt}</small>`;
  b.onclick = () => { catFilter = n.id; renderCat(); };
  catChips.append(b);
});
function renderCat() {
  $$('#cat-chips button').forEach(b => b.setAttribute('aria-selected', b.dataset.n === catFilter));
  const list = ORDER.filter(w => catFilter === 'all' || w.niche === catFilter);
  catGrid.innerHTML = list.map(w => `<li><button type="button" class="card" data-cid="${w.id}">
    <span class="cv"><img src="media/${w.id}.jpg" alt="" loading="lazy"><i class="pl">${PLAY_SVG}</i><em>${w.dur} с</em></span>
    <b>${w.title}</b><small>${NICHE[w.niche]} · ${w.style}</small></button></li>`).join('');
}
function openCatalog() {
  renderCat(); catEl.classList.add('on'); catEl.setAttribute('aria-hidden', 'false'); document.body.classList.add('cat');
  lockScroll(true); setTimeout(() => $('#cat-x').focus({ preventScroll: true }), 50);
}
function closeCatalog() {
  catEl.classList.remove('on'); catEl.setAttribute('aria-hidden', 'true'); document.body.classList.remove('cat');
  catGrid.querySelectorAll('video').forEach(v => v.remove()); lockScroll(false);
}
$('#cat-x').onclick = closeCatalog;
catEl.addEventListener('click', e => {
  const c = e.target.closest('.card');
  if (c) { closeCatalog(); catReturn = true; openWork(c.dataset.cid); return; }
  if (e.target === catEl || e.target.classList.contains('cat-in')) closeCatalog();
});
addEventListener('keydown', e => { if (e.key === 'Escape' && catEl.classList.contains('on')) closeCatalog(); });
if (finePointer) {
  catGrid.addEventListener('pointerover', e => {
    const c = e.target.closest('.card'); if (!c || c.querySelector('video')) return;
    const v = document.createElement('video'); Object.assign(v, { muted: true, loop: true, playsInline: true, src: `media/${c.dataset.cid}.mp4` });
    v.setAttribute('playsinline', ''); v.oncanplay = () => v.classList.add('on');
    c.querySelector('.cv').append(v); v.play().catch(() => {});
  });
  catGrid.addEventListener('pointerout', e => {
    const c = e.target.closest('.card'); if (!c || c.contains(e.relatedTarget)) return;
    const v = c.querySelector('video'); if (v) { v.pause(); v.remove(); }
  });
}

// copy + toast
const toast = $('#toast'); let toastT;
function say(msg) { toast.textContent = msg; toast.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('on'), 2600); }
async function copy(text, msg) {
  try { await navigator.clipboard.writeText(text); say(msg || 'Скопійовано'); }
  catch { say('Виділіть текст і скопіюйте вручну'); }
}
$$('.cp').forEach(b => b.onclick = () => copy(C[b.dataset.copy], 'Скопійовано: ' + C[b.dataset.copy]));

// fallback player (only without WebGL)
const dlg = $('#player'), pv = $('#pv');
function openDialog(id) {
  const w = byId[id]; if (!w) return;
  pv.src = 'media/' + id + '.mp4'; pv.poster = 'media/' + id + '.jpg';
  $('#pt').textContent = w.title; $('#ps').textContent = `${NICHE[w.niche]} · ${w.style} · ${w.dur} с`;
  if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  pv.muted = false; pv.play().catch(() => {});
}
function closeDialog() { pv.pause(); dlg.close ? dlg.close() : dlg.removeAttribute('open'); }
$('#px').onclick = closeDialog;
dlg.addEventListener('click', e => { if (e.target === dlg) closeDialog(); });
dlg.addEventListener('close', () => pv.pause());
let openWork = openDialog;
document.addEventListener('click', e => {
  const b = e.target.closest('.play,.nlist button'); if (b) openWork(b.dataset.id);
});

// sound toggle (scene video)
let soundOn = false;
const snd = $('#snd');
snd.onclick = () => {
  soundOn = !soundOn; snd.setAttribute('aria-pressed', soundOn);
  if (window.__vid && !document.body.classList.contains('focus')) { window.__vid.muted = !soundOn; window.__vid.play().catch(() => {}); }
  say(soundOn ? 'Звук увімкнено' : 'Звук вимкнено');
};

// home button visibility + active nav link
const homeBtn = $('#home'), navLinks = $$('.links a');
const heroIn = $('.hero-in'), heroLow = $$('.strip,.scroll-hint');
function onScroll() {
  homeBtn.classList.toggle('on', scrollY > innerHeight * .6);
  document.body.classList.toggle('scrolled', scrollY > 24);
  // the hero dissolves upward instead of sliding under the logo
  const hp = clamp(scrollY / (innerHeight * .5));
  heroIn.style.opacity = (1 - hp).toFixed(3);
  heroIn.style.transform = hp ? `translate3d(0,${(-hp * 70).toFixed(1)}px,0) scale(${(1 - hp * .05).toFixed(4)})` : '';
  heroIn.style.filter = hp > .01 ? `blur(${(hp * 8).toFixed(1)}px)` : '';
  heroLow.forEach(e => e.style.opacity = (1 - clamp(hp * 3)).toFixed(3));
  const mid = scrollY + innerHeight * .5;
  let act = null;
  for (const a of navLinks) { const el = $(a.getAttribute('href')); if (el && el.getBoundingClientRect().top + scrollY <= mid) act = a; }
  navLinks.forEach(a => a.classList.toggle('act', a === act));
}
addEventListener('scroll', onScroll, { passive: true }); onScroll();

// gentle reveal: content settles in once, from a slight offset + blur
if (!reduced && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .12 });
  $$('.feat,.why-intro,.proc-h,.steps li,.proc-cta,#niches .pnl,#brief .pnl,.ct').forEach((el, i) => {
    el.classList.add('rv');
    if (el.matches('.steps li')) el.style.transitionDelay = `${[...el.parentNode.children].indexOf(el) * 70}ms`;
    io.observe(el);
  });
}

// light trail behind the cursor (desktop)
if (finePointer && !reduced) {
  const tc = $('#trail'), tx = tc.getContext('2d'), pts = [];
  const size = () => { tc.width = innerWidth * Math.min(devicePixelRatio, 2); tc.height = innerHeight * Math.min(devicePixelRatio, 2); };
  size(); addEventListener('resize', size);
  addEventListener('pointermove', e => { if (e.pointerType === 'mouse') pts.push({ x: e.clientX, y: e.clientY, t: performance.now() }); });
  const draw = () => {
    const now = performance.now(), k = tc.width / innerWidth;
    while (pts.length && now - pts[0].t > 420) pts.shift();
    tx.clearRect(0, 0, tc.width, tc.height);
    if (pts.length > 2) {
      tx.save(); tx.scale(k, k); tx.lineCap = 'round'; tx.lineJoin = 'round'; tx.globalCompositeOperation = 'lighter';
      for (let i = 1; i < pts.length; i++) {
        const a = 1 - (now - pts[i].t) / 420;
        tx.strokeStyle = `rgba(63,214,255,${a * .55})`; tx.shadowColor = '#3fd6ff'; tx.shadowBlur = 12;
        tx.lineWidth = 1 + a * 3;
        tx.beginPath(); tx.moveTo(pts[i - 1].x, pts[i - 1].y); tx.lineTo(pts[i].x, pts[i].y); tx.stroke();
      }
      tx.restore();
    }
    requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
}

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
  g.fillStyle = 'rgba(230,242,255,.8)'; g.font = `600 22px ${FONT}`; g.fillText('+38 0XX XXX XX XX', 270, 760 + (1 - e) * 20);
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
  let dpr = Math.min(devicePixelRatio, 1.5);
  r.setPixelRatio(dpr); r.setSize(innerWidth, innerHeight, false);
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.3;
  const s = new THREE.Scene(); s.background = new THREE.Color(0x03050a); s.fog = new THREE.FogExp2(0x03050a, .04);
  const cam = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, .1, 100); s.add(cam);

  const man = new THREE.LoadingManager();
  man.onProgress = (u, a, b) => fill.style.width = Math.round(a / b * 100) + '%';
  const TL = new THREE.TextureLoader(man);
  const tex = url => { const t = TL.load(url); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = r.capabilities.getMaxAnisotropy(); return t; };

  // floor
  let reflector = null;
  if (!lowEnd) {
    reflector = new Reflector(new THREE.PlaneGeometry(60, 60), { textureWidth: innerWidth * .5, textureHeight: innerHeight * .5, color: 0x1a2029 });
    reflector.rotation.x = -Math.PI / 2; s.add(reflector);
  }
  const fl2 = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0x05070c, roughness: lowEnd ? .35 : .55, metalness: lowEnd ? .6 : .2, transparent: !lowEnd, opacity: .9 }));
  fl2.rotation.x = -Math.PI / 2; fl2.position.y = .002; s.add(fl2);

  // wall + slats
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(44, 14), new THREE.MeshStandardMaterial({ color: 0x07090f, roughness: .9 }));
  wall.position.set(0.6, 6, -4.2); s.add(wall);
  const NS = 85, slats = new THREE.InstancedMesh(new THREE.BoxGeometry(.11, 9, .12), new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: .55, metalness: .1 }), NS);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < NS; i++) { m4.makeTranslation(0.6 + (i - NS / 2) * .26, 4.5, -4.05); slats.setMatrixAt(i, m4); }
  s.add(slats);
  // LED strips between the slats: a slow wave of light runs across the wall
  const leds = new THREE.InstancedMesh(new THREE.BoxGeometry(.02, 8.6, .02), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, transparent: true }), NS - 1);
  for (let i = 0; i < NS - 1; i++) { m4.makeTranslation(0.6 + (i - NS / 2 + 1) * .26 - .13, 4.5, -3.985); leds.setMatrixAt(i, m4); leds.setColorAt(i, new THREE.Color(0)); }
  s.add(leds);
  const ledC = new THREE.Color();
  // comet light trail weaving through the studio
  const trailCurve = new THREE.CatmullRomCurve3([
    V3(-6.4, 1.3, 3.4), V3(-4.2, 2.9, .4), V3(-1.6, 3.7, -1.6), V3(.6, 4.7, -2.1), V3(2.9, 3.5, -1.4),
    V3(5.3, 2.5, .6), V3(7.1, 1.7, 3.3), V3(4.2, .7, 3.9), V3(.6, 1.0, 2.3), V3(-3.1, .55, 4.1)], true, 'centripetal');
  const trailM = new THREE.ShaderMaterial({
    uniforms: { t: { value: 0 }, col: { value: new THREE.Color(0x3fd6ff) }, op: { value: 1 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    vertexShader: 'varying float vU; void main(){ vU = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float t; uniform vec3 col; uniform float op; varying float vU;
      float comet(float d){ return exp(-d * 7.0) * smoothstep(0.0, 0.004, d); }
      void main(){
        float d1 = fract(t - vU), d2 = fract(t + 0.5 - vU);
        float a = comet(d1) + 0.7 * comet(d2) + 0.035;
        float head = exp(-d1 * 140.0) + 0.7 * exp(-d2 * 140.0);
        gl_FragColor = vec4(col * (1.2 + 5.0 * head), a * op);
      }`,
  });
  const trail = new THREE.Mesh(new THREE.TubeGeometry(trailCurve, 700, .016, 6, true), trailM); s.add(trail);
  const NEONS = [];
  const neon = (w, h, col, k, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, .04), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k) })); m.position.set(x, y, z); s.add(m); m.userData = { base: new THREE.Color(col), k }; NEONS.push(m); return m; };
  neon(7, .03, 0x3fd6ff, 2.4, 0.6, 5.4, -3.9);
  neon(.035, 3.2, 0x8b7bff, 3, -7.4, 3.2, -3.9);
  neon(.035, 2.2, 0x3fd6ff, 2.5, 8.6, 2.6, -3.9);

  s.add(new THREE.AmbientLight(0x6a7aa0, .16));
  const sp = new THREE.SpotLight(0x9fe9ff, 110, 18, .7, .6, 1.5); sp.position.set(0.6, 6, -2.5); sp.target.position.set(0.6, 0, -3.5); s.add(sp, sp.target);
  const pl = (c, i, x, y, z) => { const p = new THREE.PointLight(c, i, 8, 2); p.position.set(x, y, z); s.add(p); p.userData.base = new THREE.Color(c); return p; };
  const PLS = [pl(0x3fd6ff, 14, 0.6, 2.2, -1.2), pl(0x8b7bff, 8, -3.5, 2.5, 1.5), pl(0x3fd6ff, 8, 4.5, 2, 1)];
  const ambL = new THREE.PointLight(0x3fd6ff, 0, 9, 1.6); s.add(ambL);

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

  /* ---- video panels: rounded corners, glass edge, soft glow ---- */
  const rr = (w, h, rad) => {
    const sh = new THREE.Shape(), x = -w / 2, y = -h / 2;
    sh.moveTo(x + rad, y); sh.lineTo(x + w - rad, y); sh.quadraticCurveTo(x + w, y, x + w, y + rad);
    sh.lineTo(x + w, y + h - rad); sh.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    sh.lineTo(x + rad, y + h); sh.quadraticCurveTo(x, y + h, x, y + h - rad);
    sh.lineTo(x, y + rad); sh.quadraticCurveTo(x, y, x + rad, y); return sh;
  };
  const flatUV = (geo, w, h) => { const p = geo.attributes.position, uv = geo.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + w / 2) / w, (p.getY(i) + h / 2) / h); uv.needsUpdate = true; return geo; };
  const SW = 1, SH = 1.778;
  const GEO = {
    edge: new THREE.ShapeGeometry(rr(SW + .028, SH + .028, .114), 16),
    back: new THREE.ShapeGeometry(rr(SW + .012, SH + .012, .106), 16),
    screen: flatUV(new THREE.ShapeGeometry(rr(SW, SH, .1), 16), SW, SH),
    glow: new THREE.PlaneGeometry(2.3, 3.1),
  };
  const edgeM = new THREE.MeshBasicMaterial({ color: 0xbfeaff, transparent: true, opacity: .32, depthWrite: false, toneMapped: false });
  const blackM = new THREE.MeshBasicMaterial({ color: 0x02040a });
  const glareC = document.createElement('canvas'); glareC.width = 64; glareC.height = 128;
  { const x = glareC.getContext('2d'), gr = x.createLinearGradient(0, 0, 64, 128); gr.addColorStop(0, 'rgba(255,255,255,.1)'); gr.addColorStop(.35, 'rgba(255,255,255,.02)'); gr.addColorStop(.36, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 128); }
  const glareM = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(glareC), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const haloC = document.createElement('canvas'); haloC.width = 230; haloC.height = 310;
  { const x = haloC.getContext('2d'); x.filter = 'blur(26px)'; x.fillStyle = '#fff'; x.beginPath(); x.roundRect(60, 65, 110, 180, 22); x.fill(); }
  const haloT = new THREE.CanvasTexture(haloC);

  const O = new THREE.Vector3(0.6, 0, 5.5), R = 8;
  const featSlots = [-46, -34, -22, 22, 34, 46], extra = [-58, 58, -70, 70, -82, 82];
  const HGT = { '-82': 3.3, '-70': 2.5, '-58': 3.6, '-46': 2.4, '-34': 3.8, '-22': 2.3, '22': 2.3, '34': 3.8, '46': 2.4, '58': 3.6, '70': 2.5, '82': 3.3 };
  const screens = {};
  ORDER.forEach((w, i) => {
    const ang = i < FEAT.length ? featSlots[i] : extra[i - FEAT.length]; if (ang === undefined) return;
    const a = THREE.MathUtils.degToRad(ang);
    const pos = new THREE.Vector3(O.x + R * Math.sin(a), HGT[ang], O.z - R * Math.cos(a));
    const grp = new THREE.Group(); grp.position.copy(pos); grp.rotation.y = -a;
    const haloM = new THREE.MeshBasicMaterial({ map: haloT, color: 0x3fd6ff, transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const halo = new THREE.Mesh(GEO.glow, haloM); halo.position.z = -.1; grp.add(halo);
    const ed = new THREE.Mesh(GEO.edge, edgeM); ed.position.z = -.004; grp.add(ed);
    const bk = new THREE.Mesh(GEO.back, blackM); bk.position.z = -.002; grp.add(bk);
    const poster = tex(`media/${w.id}.jpg`);
    const dim = ['gongpaper', 'bal', 'thetea'].includes(w.id) ? .72 : 1;
    const scr = new THREE.Mesh(GEO.screen, new THREE.MeshBasicMaterial({ map: poster, toneMapped: false, color: new THREE.Color(dim, dim, dim) }));
    scr.position.z = .003; scr.userData.id = w.id; grp.add(scr);
    s.add(grp);
    screens[w.id] = { grp, scr, haloM, poster, pos, n: new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)), lx: new THREE.Vector3(Math.cos(a), 0, Math.sin(a)),
      homeQ: grp.quaternion.clone(), idx: i, dim, base: pos.y, phase: i * 1.7, lvl: 1, ft: 0, hs: 1 };
  });
  monV.material.map = screens[FEAT[0].id].poster;

  // focus backdrop rides with the camera
  const FD = 3;
  const dimM = new THREE.MeshBasicMaterial({ color: 0x020409, transparent: true, opacity: 0, depthWrite: false });
  const dimP = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), dimM); dimP.position.z = -(FD + .9); cam.add(dimP);

  // dust
  const nd = lowEnd ? 220 : 520, pg = new THREE.BufferGeometry(), pts = new Float32Array(nd * 3);
  for (let i = 0; i < nd; i++) { pts[i * 3] = (Math.random() - .5) * 22 + .6; pts[i * 3 + 1] = Math.random() * 7; pts[i * 3 + 2] = (Math.random() - .5) * 12; }
  pg.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  const dotC = document.createElement('canvas'); dotC.width = dotC.height = 32;
  { const x = dotC.getContext('2d'), gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.4, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 32, 32); }
  const dust = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x9fe9ff, size: .06, map: new THREE.CanvasTexture(dotC), transparent: true, opacity: .32, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.add(dust);

  wall.material.transparent = true; slats.material.transparent = true; NEONS.forEach(m => m.material.transparent = true);
  const LIGHT = new THREE.Color(.86, .93, .96);
  const rings2 = [];
  // «Чому я»: the room dissolves into a dark void with a round stage, like a keynote product shot
  const stage = new THREE.Group(); stage.position.set(0.6, 0, -2.2); stage.visible = false; s.add(stage);
  const stageMs = [];
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.5, .16, 128), new THREE.MeshStandardMaterial({ color: 0x0a0e15, metalness: .85, roughness: .28, transparent: true, opacity: 0 }));
  disc.position.y = .08; stage.add(disc); stageMs.push(disc);
  const edgeM2 = new THREE.MeshBasicMaterial({ color: 0x3fd6ff, transparent: true, opacity: 0, toneMapped: false });
  const edge2 = new THREE.Mesh(new THREE.TorusGeometry(3.405, .012, 8, 200), edgeM2); edge2.rotation.x = Math.PI / 2; edge2.position.y = .162; stage.add(edge2); stageMs.push(edge2);
  const poolC = document.createElement('canvas'); poolC.width = poolC.height = 128;
  { const x = poolC.getContext('2d'), g2 = x.createRadialGradient(64, 64, 0, 64, 64, 64); g2.addColorStop(0, 'rgba(255,255,255,.55)'); g2.addColorStop(.5, 'rgba(255,255,255,.12)'); g2.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g2; x.fillRect(0, 0, 128, 128); }
  const poolM = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(poolC), color: 0x3fd6ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(13, 13), poolM); pool.rotation.x = -Math.PI / 2; pool.position.y = .02; stage.add(pool); pool.userData.o = .5; stageMs.push(pool);
  // outer orbit ring on the floor with a travelling arc of light
  const ringM = new THREE.ShaderMaterial({
    uniforms: { t: { value: 0 }, col: { value: new THREE.Color(0x3fd6ff) }, op: { value: 0 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide,
    vertexShader: 'varying vec2 vU; void main(){ vU = vec2(atan(position.y, position.x) / 6.2831853 + .5, 0.0); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float t; uniform vec3 col; uniform float op; varying vec2 vU;
      void main(){ float d = fract(t - vU.x); float a = .12 + exp(-d * 6.0) * .9 + exp(-fract(t + .5 - vU.x) * 6.0) * .5;
        gl_FragColor = vec4(col * (1.0 + 3.0 * exp(-d * 60.0)), a * op); }`,
  });
  for (const [rr2, w2, sp2] of [[5.2, .022, 1], [7.4, .014, -1]]) {
    const rg = new THREE.Mesh(new THREE.RingGeometry(rr2 - w2, rr2 + w2, 256, 1), ringM.clone());
    rg.rotation.x = -Math.PI / 2; rg.position.y = .03; rg.userData.sp = sp2; stage.add(rg); rings2.push(rg);
  }
  let hazeAt = 0;
  // the light beam (axis of the pull-back scene)
  const beamG = new THREE.Group(); beamG.position.set(0.6, 3.63, -2.75); s.add(beamG);
  const coreM = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xbff3ff).multiplyScalar(2.2), transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  beamG.add(new THREE.Mesh(new THREE.CylinderGeometry(.016, .016, 40, 8).translate(0, 20, 0), coreM));
  const bmC = document.createElement('canvas'); bmC.width = 64; bmC.height = 256;
  { const x = bmC.getContext('2d'); for (let yy = 0; yy < 256; yy++) { const g2 = x.createLinearGradient(0, 0, 64, 0), a = Math.pow(yy / 256, 1.6);
      g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(.5, `rgba(255,255,255,${a})`); g2.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g2; x.fillRect(0, yy, 64, 1); } }
  const glowM = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(bmC), color: 0x3fd6ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  for (const ry of [0, Math.PI / 2]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 40).translate(0, 20, 0), glowM); m.rotation.y = ry; beamG.add(m); }
  beamG.visible = false;
  // wordmark on the monitor for the pull-back
  const logoC = document.createElement('canvas'); logoC.width = 1024; logoC.height = 576;
  const logoT = new THREE.CanvasTexture(logoC); logoT.colorSpace = THREE.SRGBColorSpace;
  const drawLogo = () => {
    const x = logoC.getContext('2d'), gr = x.createRadialGradient(512, 300, 10, 512, 300, 560);
    gr.addColorStop(0, '#0e3350'); gr.addColorStop(1, '#03060c'); x.fillStyle = gr; x.fillRect(0, 0, 1024, 576);
    x.textAlign = 'center'; x.fillStyle = '#fff'; x.font = '400 84px Michroma, sans-serif'; x.letterSpacing = '26px';
    x.shadowColor = 'rgba(120,220,255,.6)'; x.shadowBlur = 24; x.fillText('KONOXA', 512 + 13, 300);
    x.font = '400 24px Michroma, sans-serif'; x.letterSpacing = '14px'; x.fillStyle = '#3fd6ff'; x.shadowColor = '#3fd6ff'; x.shadowBlur = 16;
    x.fillText('MOTION STUDIO', 512 + 7, 360); logoT.needsUpdate = true;
  };
  drawLogo(); document.fonts.load('40px Michroma').then(drawLogo).catch(() => {});

  // post
  const comp = new EffectComposer(r, new THREE.WebGLRenderTarget(innerWidth * dpr, innerHeight * dpr, { type: THREE.HalfFloatType, samples: lowEnd ? 2 : 4 }));
  comp.addPass(new RenderPass(s, cam));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .85, .6, .62);
  comp.addPass(bloom); comp.addPass(new OutputPass());
  const bloomRes = () => bloom.setSize(innerWidth * dpr * .5, innerHeight * dpr * .5);
  comp.setPixelRatio(dpr); comp.setSize(innerWidth, innerHeight); bloomRes();

  // video
  const vid = document.createElement('video');
  Object.assign(vid, { muted: true, loop: true, playsInline: true, preload: 'auto', crossOrigin: 'anonymous' });
  vid.setAttribute('playsinline', ''); vid.setAttribute('muted', '');
  window.__vid = vid;
  const vtex = new THREE.VideoTexture(vid); vtex.colorSpace = THREE.SRGBColorSpace; vtex.generateMipmaps = true; vtex.minFilter = THREE.LinearMipmapLinearFilter; vtex.anisotropy = r.capabilities.getMaxAnisotropy();
  let vidId = null;
  const wantVideo = id => {
    if (vidId === id) return;
    vidId = id; vid.src = `media/${id}.mp4`; vid.muted = !soundOn; vid.play().catch(() => {});
  };

  /* ---- viewer: the phone itself flies to you ---- */
  const FOCUS = { id: null, sound: true };
  const vw = { k: $('#vk'), t: $('#vt'), d: $('#vd'), n: $('#vn'), fill: $('#vfill'), time: $('#vtime'), play: $('#vplay'), snd: $('#vsnd') };
  const fmt = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  function openViewer(id) {
    if (!screens[id]) return openDialog(id);
    const w = byId[id];
    FOCUS.id = id; document.body.classList.add('focus'); lockScroll(true);
    vidId = id; vid.src = `media/${id}.mp4`; vid.muted = !FOCUS.sound; vid.currentTime = 0; vid.play().catch(() => {});
    vw.k.textContent = `${NICHE[w.niche]} · ${w.style}`; vw.t.textContent = w.title; vw.d.textContent = w.desc;
    const i = ORDER.indexOf(w); vw.n.textContent = `${String(i + 1).padStart(2, '0')} / ${String(ORDER.length).padStart(2, '0')}`;
    vw.snd.setAttribute('aria-pressed', FOCUS.sound);
  }
  function closeViewer() {
    if (!FOCUS.id) return;
    FOCUS.id = null; document.body.classList.remove('focus'); lockScroll(false);
    vid.muted = !soundOn;
    if (catReturn) { catReturn = false; openCatalog(); }
  }
  const step = d => { if (!FOCUS.id) return; const i = ORDER.findIndex(w => w.id === FOCUS.id); openViewer(ORDER[(i + d + ORDER.length) % ORDER.length].id); };
  openWork = openViewer;
  $('#vx').onclick = closeViewer; $('#vprev').onclick = () => step(-1); $('#vnext').onclick = () => step(1);
  vw.play.onclick = () => vid.paused ? vid.play() : vid.pause();
  vw.snd.onclick = () => { FOCUS.sound = !FOCUS.sound; vid.muted = !FOCUS.sound; vw.snd.setAttribute('aria-pressed', FOCUS.sound); };
  const track = $('#vtrack');
  const seek = e => { const b = track.getBoundingClientRect(); if (vid.duration) vid.currentTime = clamp((e.clientX - b.left) / b.width) * vid.duration; };
  track.addEventListener('pointerdown', e => { seek(e); track.setPointerCapture(e.pointerId); track.onpointermove = seek; });
  track.addEventListener('pointerup', () => track.onpointermove = null);
  addEventListener('keydown', e => {
    if (!FOCUS.id) return;
    if (e.key === 'Escape') closeViewer(); else if (e.key === 'ArrowRight') step(1); else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === ' ') { e.preventDefault(); vw.play.click(); }
  });
  let sw = null; // swipe on phones
  addEventListener('pointerdown', e => { if (FOCUS.id && e.pointerType !== 'mouse' && !e.target.closest('.vw-bar')) sw = { x: e.clientX, y: e.clientY }; });
  addEventListener('pointerup', e => {
    if (!sw) return; const dx = e.clientX - sw.x, dy = e.clientY - sw.y; sw = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1); else if (dy > 90) closeViewer();
  });

  // camera keys, one per scroll section
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  let K = [];
  // pull-back path around the light beam that rises from the monitor
  const A = V(0.6, 0, -2.75);
  function whyPose(tp) {
    const P = narrow(); let rr, h, th, ly;
    if (tp <= .55) { const q = 1 - Math.pow(1 - tp / .55, 2.2); rr = 3 + 12 * q; h = 2.6 + 8.4 * q; th = .75 * q; ly = 2.55 + 2.95 * q; }
    else { const q = ease((tp - .55) / .45); rr = 15 + 4 * q; h = 11 + 6 * q; th = .75 + .25 * q; ly = 5.5 - 1.5 * q; }
    if (P) rr = rr * 1.3 + 2.5;
    return { p: V(A.x + rr * Math.sin(th), h, A.z + rr * Math.cos(th)), l: V(A.x, ly, A.z), f: P ? 55 : 38 };
  }
  function buildKeys() {
    const P = narrow(); K = [];
    K.push(P ? { p: V(0.6, 2.7, 15), l: V(0.6, 3.3, 0), f: 55 } : { p: V(-2.4, 2.2, 11), l: V(1.6, 2.4, 0), f: 38 });
    FEAT.forEach(w => {
      const sc = screens[w.id];
      if (P) K.push({ p: sc.pos.clone().addScaledVector(sc.n, 4.3).add(V(0, -.7, 0)), l: sc.pos.clone().add(V(0, -.7, 0)), f: 52 });
      else K.push({ p: sc.pos.clone().addScaledVector(sc.n, 3.9).addScaledVector(sc.lx, -.85), l: sc.pos.clone().addScaledVector(sc.lx, -.85), f: 38 });
    });
    K.push(whyPose(0), whyPose(1));
    K.push(P ? { p: V(0.6, 2.9, 15.5), l: V(0.6, 3.8, 0), f: 55 } : { p: V(-4.4, 2.1, 10.6), l: V(-1.1, 2.3, 0), f: 38 });
    K.push(P ? { p: V(0.6, 2.35, 3.0), l: V(0.6, 1.75, -2.75), f: 52 } : { p: V(-2.4, 2.45, 4.0), l: V(-0.5, 2.5, -2.75), f: 38 });
    K.push(P ? { p: V(0.6, 7, 17), l: V(0.6, 3.6, 0), f: 55 } : { p: V(0.6, 6.2, 14), l: V(2.2, 2.4, 0), f: 38 });
  }
  buildKeys();
  const SE = [$('#hero'), ...$$('.chap'), $('#why'), $('#proc'), $('#niches'), $('#brief'), $('#contact')];
  const WHY = FEAT.length + 1, PROC = WHY + 1, procEl = $('#proc');
  let tops = [], knee = .7;
  const measure = () => {
    tops = SE.map(e => e.getBoundingClientRect().top + scrollY);
    const lb = $('#why .f5').getBoundingClientRect().bottom + scrollY;
    knee = clamp((lb - tops[WHY]) / (tops[PROC] - tops[WHY]), .2, .92);
  };
  measure();

  const camP = K[0].p.clone().add(V(0, 1.2, 7)), camL = K[0].l.clone(); let camF = K[0].f;
  const tP = new THREE.Vector3(), tL = new THREE.Vector3();
  function target() {
    const y = scrollY + 1;
    let k = 0; for (let i = 0; i < tops.length; i++) if (tops[i] <= y) k = i;
    if (k >= K.length - 1) { tP.copy(K[K.length - 1].p); tL.copy(K[K.length - 1].l); return { k: K.length - 1, e: 0, f: K[K.length - 1].f }; }
    const f = clamp((y - tops[k]) / (tops[k + 1] - tops[k]));
    if (k === WHY) {
      const tp = f < knee ? f / knee * .55 : .55 + (f - knee) / (1 - knee) * .45;
      const w = whyPose(tp); tP.copy(w.p); tL.copy(w.l);
      return { k, e: 0, f: w.f, tp };
    }
    const e = ease(clamp((f - .45) / .55));
    tP.lerpVectors(K[k].p, K[k + 1].p, e); tL.lerpVectors(K[k].l, K[k + 1].l, e);
    tP.y += Math.sin(e * Math.PI) * .5;
    return { k, e, f: K[k].f + (K[k + 1].f - K[k].f) * e };
  }

  addEventListener('resize', () => {
    r.setSize(innerWidth, innerHeight, false); comp.setSize(innerWidth, innerHeight); bloomRes();
    cam.aspect = innerWidth / innerHeight; buildKeys(); measure();
  });
  new ResizeObserver(measure).observe(document.body);

  // adaptive quality
  let slow = 0, last = performance.now(), degraded = false, vidFor0 = null, orb = 0, beam = 0, rf = 0;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const hazeEl = $('#haze');
  // quality tiers from measured frame time
  let tier = 0;
  function degrade() {
    tier++; degraded = tier >= 3;
    if (tier === 1) { dpr = 1; r.setPixelRatio(1); comp.setPixelRatio(1); comp.setSize(innerWidth, innerHeight); bloomRes(); }
    if (tier === 2) { if (reflector) reflector.visible = false; leds.visible = false; }
    if (tier === 3) { bloom.enabled = false; }
  }
  const ft = [];

  const railBtns = $$('#rail button'), caps = $$('.chap .cap');
  // pointer: parallax, hover, click
  const mouse = { x: 0, y: 0, tx: 0, ty: 0, px: -1, py: -1, has: false };
  const UI = 'a,button,input,select,label,textarea,.glass,.cap,dialog,.nav,.ct,.hero-in,.rail,.vw-bar,.vw-info,.vw-x,#home';
  const hov = document.createElement('div'); hov.className = 'hov'; document.body.append(hov);
  addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse') { mouse.tx = e.clientX / innerWidth * 2 - 1; mouse.ty = e.clientY / innerHeight * 2 - 1; }
    mouse.px = e.clientX; mouse.py = e.clientY; mouse.has = !e.target.closest(UI);
  });
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const picks = Object.values(screens).map(sc => sc.scr); monV.userData.id = null; picks.push(monV, monBg);
  let hoverId = null, curKind = 'hero';
  const calm = () => curKind === 'why' || curKind === 'proc'; // no video opening inside «Чому я»
  function pick(list = picks) {
    if (!mouse.has || mouse.px < 0) return null;
    ndc.set(mouse.px / innerWidth * 2 - 1, -(mouse.py / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, cam);
    const h = ray.intersectObjects(list, false)[0];
    return h ? h.object.userData.id : null;
  }
  document.addEventListener('click', e => {
    if (e.target.closest(UI)) return;
    mouse.px = e.clientX; mouse.py = e.clientY; mouse.has = true;
    if (FOCUS.id) { if (pick([screens[FOCUS.id].scr])) vw.play.click(); else closeViewer(); return; }
    const id = pick(calm() ? [monV, monBg] : picks);
    if (id === '__why') { const el = $('#why .why-intro'); tweenScroll(el.getBoundingClientRect().top + scrollY - innerHeight * .28, 1900); return; }
    if (id) openViewer(id);
  });

  const ambC = document.createElement('canvas'); ambC.width = 9; ambC.height = 16;
  const ambX = ambC.getContext('2d', { willReadFrequently: true });
  const amb = new THREE.Color(0x3fd6ff), ambT = new THREE.Color(0x3fd6ff), CY = new THREE.Color(0x3fd6ff), hsl = {};
  let ambAt = 0;
  function sampleAmb(src) {
    try {
      ambX.drawImage(src, 0, 0, 9, 16);
      const d = ambX.getImageData(0, 0, 9, 16).data; let rr = 0, gg = 0, bb = 0, w = 0;
      for (let i = 0; i < d.length; i += 4) {
        const R = d[i], G2 = d[i + 1], B = d[i + 2], mx = Math.max(R, G2, B), mn = Math.min(R, G2, B);
        const wt = (mx - mn + 6) * (mx / 255); rr += R * wt; gg += G2 * wt; bb += B * wt; w += wt;
      }
      if (w < 1) return;
      const c = new THREE.Color().setRGB(rr / w / 255, gg / w / 255, bb / w / 255, THREE.SRGBColorSpace); c.getHSL(hsl);
      if (hsl.s < .12) return; // near-grey frame: keep the last colour
      ambT.setHSL(hsl.h, Math.min(1, hsl.s * 1.3 + .2), .52);
    } catch { }
  }
  const rq = new THREE.Quaternion(), op = new THREE.Vector3(), NSCR = Object.keys(screens).length;
  const fwd = new THREE.Vector3(), rt = new THREE.Vector3(), up = new THREE.Vector3(), fp = new THREE.Vector3(), fq = new THREE.Quaternion(), tq = new THREE.Quaternion(), eul = new THREE.Euler(), hp = new THREE.Vector3();
  let started = false;
  function frame(now) {
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    if (started && !window.__noDegrade) {
      ft.push(dt); if (ft.length > 45) ft.shift();
      if (ft.length === 45) {
        const avg = ft.reduce((a, b) => a + b, 0) / 45;
        if (avg > .024 && !degraded) { degrade(); ft.length = 0; }

      }
    }
    const st = target();
    const near = st.e < .5 ? st.k : st.k + 1;
    const nF = FEAT.length;
    const kind = near === 0 ? 'hero' : near <= nF ? 'work' : near === WHY ? 'why' : near === PROC ? 'proc' : near === PROC + 1 ? 'niche' : near === PROC + 2 ? 'brief' : 'contact';
    const tp = kind === 'why' ? (st.tp ?? 0) : kind === 'proc' ? 1 : 0;
    const orbT = kind === 'why' ? smooth(.03, .3, tp) : kind === 'proc' ? 1 : 0;
    orb += (orbT - orb) * Math.min(1, dt * 3);
    rf += ((kind === 'why' ? smooth(0, .09, tp) : kind === 'proc' ? 1 : 0) - rf) * Math.min(1, dt * 4);
    beam += ((kind === 'why' ? smooth(0, .05, tp) : kind === 'proc' ? 1 : 0) - beam) * Math.min(1, dt * 3);
    // one uniform light veil, driven by where the light section is (not by the camera), so no seam appears
    const pr = procEl.getBoundingClientRect();
    let hz = smooth(0, 1, 1 - (pr.top - innerHeight * .06) / (innerHeight * .9));
    hz *= smooth(0, 1, (pr.bottom - innerHeight * .2) / (innerHeight * .75));
    hazeEl.style.opacity = hz.toFixed(3);
    const bl = hz > .01 && hz < .99 ? Math.sin(hz * Math.PI) * 7 : 0;
    canvas.style.filter = bl > .2 ? `blur(${bl.toFixed(1)}px)` : '';
    document.body.classList.toggle('inwhy', kind === 'why' || kind === 'proc');
    document.body.classList.toggle('inworks', kind === 'work');
    railBtns.forEach((b, i) => b.classList.toggle('on', kind === 'work' && near - 1 === i));
    const kf = st.k + st.e;
    caps.forEach((c, i) => { const o = clamp(1 - Math.abs(kf - (i + 1)) * 2.6); c.style.opacity = o; c.style.visibility = o < .01 ? 'hidden' : ''; });
    const focusAmt = Math.max(0, ...Object.values(screens).map(sc => sc.ft));
    const bs = FOCUS.id || kind === 'work' ? .3 : kind === 'brief' || kind === 'why' ? .45 : .85, bt = FOCUS.id || kind === 'work' ? .92 : .62;
    bloom.strength += (bs * (degraded ? .7 : 1) - bloom.strength) * Math.min(1, dt * 4); bloom.threshold += (bt - bloom.threshold) * Math.min(1, dt * 4);

    // camera: cinematic flight after a jump, damped follow otherwise
    if (W.t0 !== W.seen) { W.seen = W.t0; W.fp = camP.clone(); W.fl = camL.clone(); }
    const wp = (now - W.t0) / W.dur;
    if (wp < 1 && !reduced) {
      const k = clamp(wp), e = k < .5 ? 16 * k ** 5 : 1 - Math.pow(-2 * k + 2, 5) / 2;
      camP.lerpVectors(W.fp, tP, e); camL.lerpVectors(W.fl, tL, e);
      camP.y += Math.sin(e * Math.PI) * 1.4; camP.z += Math.sin(e * Math.PI) * 1.8;
      camF += (st.f - camF) * e;
    } else {
      const a = reduced ? 1 : 1 - Math.exp(-dt * 4.5);
      camP.lerp(tP, a); camL.lerp(tL, a); camF += (st.f - camF) * a;
    }
    mouse.x += (mouse.tx - mouse.x) * Math.min(1, dt * 2.5); mouse.y += (mouse.ty - mouse.y) * Math.min(1, dt * 2.5);
    const amp = reduced ? 0 : (kind === 'work' ? .35 : kind === 'brief' ? .3 : .8) * (1 - focusAmt * .8);
    fwd.subVectors(camL, camP).normalize(); rt.crossVectors(fwd, cam.up).normalize();
    cam.position.copy(camP).addScaledVector(rt, mouse.x * amp).addScaledVector(cam.up, -mouse.y * amp * .5);
    cam.fov = camF; cam.updateProjectionMatrix(); cam.lookAt(camL); cam.updateMatrixWorld();

    // what plays where
    let vidTarget = null, vidFor = null;
    if (FOCUS.id) { vidFor = FOCUS.id; vidTarget = screens[FOCUS.id].scr; }
    else if (kind === 'work') { vidFor = FEAT[near - 1].id; vidTarget = screens[vidFor].scr; }
    else if (kind === 'niche') { const w = WORKS.find(w => w.niche === curNiche); vidFor = (w || FEAT[0]).id; vidTarget = monV; }
    else if (kind === 'hero' || kind === 'contact') { vidFor = FEAT[0].id; vidTarget = monV; }
    if (vidFor) wantVideo(vidFor); vidFor0 = vidFor;
    monV.userData.id = monBg.userData.id = kind === 'why' && tp < .2 ? '__why' : kind === 'brief' || kind === 'why' || kind === 'proc' ? null : (vidFor0 || FEAT[0].id);
    curKind = kind; hoverId = FOCUS.id ? null : pick(calm() ? [monV, monBg] : picks);
    document.body.classList.toggle('pick', !!hoverId || (!!FOCUS.id && !!pick([screens[FOCUS.id].scr])));
    if (hoverId) { hov.textContent = hoverId === '__why' ? 'Натисніть, щоб дізнатися більше ↓' : byId[hoverId].title; hov.style.transform = `translate(${mouse.px + 16}px,${mouse.py + 18}px)`; hov.classList.add('on'); }
    else hov.classList.remove('on');

    const vReady = vid.readyState >= 2 && !vid.paused;
    // focus pose in front of the camera
    cam.getWorldDirection(fwd); up.set(0, 1, 0).applyQuaternion(cam.quaternion);
    const visH = 2 * FD * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)), visW = visH * cam.aspect;
    const P = narrow(), FS = Math.min((P ? .6 : .8) * visH / 1.81, (P ? .86 : .84) * visW / 1.03);
    fp.copy(cam.position).addScaledVector(fwd, FD).addScaledVector(up, P ? -.045 * visH : -.01 * visH);
    eul.set(-mouse.y * .1, mouse.x * .16, 0); tq.setFromEuler(eul); fq.copy(cam.quaternion).multiply(tq);

    const camAz = Math.atan2(cam.position.x - A.x, cam.position.z - A.z);
    for (const [id, sc] of Object.entries(screens)) {
      const on = vidTarget === sc.scr;
      const m = on && vReady ? vtex : sc.poster;
      if (sc.scr.material.map !== m) { sc.scr.material.map = m; sc.scr.material.needsUpdate = true; }
      sc.ft = clamp(sc.ft + (FOCUS.id === id ? 1 : -1) * dt / (reduced ? .01 : .85));
      const want = FOCUS.id ? (FOCUS.id === id ? 1 : .15) : kind === 'why' ? .55 : kind === 'niche' ? (curNiche === 'insha' ? .55 : byId[id].niche === curNiche ? 1 : .16) : on ? 1 : kind === 'work' ? .45 : 1;
      sc.lvl += (want - sc.lvl) * Math.min(1, dt * 5);
      const c = sc.lvl * (on ? 1 : sc.dim);
      sc.scr.material.color.setRGB(c, c, c);
      sc.haloM.opacity = (on ? .42 + Math.sin(now / 400) * .06 : hoverId === id ? .7 : .3) * (.3 + .7 * sc.lvl) * (1 - sc.ft * .6);
      sc.hs += ((hoverId === id ? 1.06 : 1) - sc.hs) * Math.min(1, dt * 8);
      hp.copy(sc.pos); if (!reduced) hp.y = sc.base + Math.sin(now / 1400 + sc.phase) * .05;
      rq.copy(sc.homeQ);
      if (orb > .001) {
        const oe = ease(orb), ang = camAz + Math.PI + (sc.idx / Math.max(1, NSCR - 1) - .5) * 3.7 + Math.sin(now / 3000 + sc.idx) * .04;
        op.set(A.x + Math.sin(ang) * 6.5, 3.4 + ((sc.idx % 3) - 1) * 1.6 + tp * 4, A.z + Math.cos(ang) * 6.5);
        hp.lerp(op, oe); rq.slerp(cam.quaternion, oe);
      }
      if (sc.ft > 0) {
        const e = ease(sc.ft);
        sc.grp.position.lerpVectors(hp, fp, e).addScaledVector(up, Math.sin(e * Math.PI) * .35);
        sc.grp.quaternion.slerpQuaternions(rq, fq, e);
        sc.grp.scale.setScalar((1 + (FS - 1) * e) * sc.hs);
        sc.grp.renderOrder = 2;
      } else { sc.grp.position.copy(hp); sc.grp.quaternion.copy(rq); sc.grp.scale.setScalar(sc.hs * (orb > .001 && orb < .999 ? Math.abs(1 - 2 * ease(orb)) : 1)); }
    }
    // ambilight: the room takes the colours of what is playing
    if (now - ambAt > 120) {
      ambAt = now;
      const src = (kind === 'why' || kind === 'proc') && !FOCUS.id ? logoC : kind === 'brief' && !FOCUS.id ? G : vReady ? vid : (screens[vidFor || FEAT[0].id].poster.image);
      if (src && (src.width || src.videoWidth)) sampleAmb(src);
    }
    amb.lerp(ambT, Math.min(1, dt * 2.2));
    const tgt = vidTarget && vidTarget !== monV ? vidTarget : null;
    if (tgt) { const sc = screens[vidFor]; ambL.position.copy(sc.grp.position).addScaledVector(sc.n, 1.3); }
    else ambL.position.set(0.6, 2.6, -1.5);
    ambL.color.copy(amb); ambL.intensity = reduced ? 10 : 16 + (FOCUS.id ? 8 : 0);
    PLS.forEach(p => p.color.copy(p.userData.base).lerp(amb, .65));
    NEONS.forEach(m => m.material.color.copy(m.userData.base).lerp(amb, .6).multiplyScalar(m.userData.k));
    glow.material.color.copy(amb);
    if (vidFor && screens[vidFor]) screens[vidFor].haloM.color.copy(amb);
    for (const [id, sc] of Object.entries(screens)) if (id !== vidFor) sc.haloM.color.lerp(CY, Math.min(1, dt * 2));
    s.background.setRGB(.012 + amb.r * .018, .02 + amb.g * .018, .04 + amb.b * .02);
    s.background.lerp(LIGHT, hz * .6); s.fog.color.copy(s.background); s.fog.density = .04 + .05 * hz;
    const ro = 1 - rf;
    stage.visible = rf > .005;
    stageMs.forEach(m => m.material.opacity = rf * (m.userData.o ?? 1));
    rings2.forEach((rg, i) => { const u = rg.material.uniforms; u.t.value = rg.userData.sp * now / (7000 + i * 4000); u.col.value.copy(amb); u.op.value = rf * (i ? .6 : 1); });
    edgeM2.color.copy(amb).multiplyScalar(2.2); poolM.color.copy(amb);
    wall.material.opacity = ro; slats.material.opacity = ro; NEONS.forEach(m => m.material.opacity = ro);
    wall.visible = slats.visible = ro > .01; NEONS.forEach(m => m.visible = ro > .01);
    beamG.visible = beam > .005; coreM.opacity = beam; glowM.opacity = beam * .5; glowM.color.copy(amb);
    const showLogo = kind === 'why' || kind === 'proc';
    if (monBg.material.map !== (showLogo ? logoT : mbT)) { monBg.material.map = showLogo ? logoT : mbT; monBg.material.needsUpdate = true; }
    monV.visible = !showLogo || !!FOCUS.id; glow.visible = !showLogo;
    if (now - hazeAt > 200) { hazeAt = now; hazeEl.style.setProperty('--amb', `${amb.r * 255 | 0},${amb.g * 255 | 0},${amb.b * 255 | 0}`); }
    dimM.color.copy(amb).multiplyScalar(.022);
    dimM.opacity = focusAmt * .82;
    let mm;
    if (kind === 'brief') { drawGen(now); genT.needsUpdate = true; mm = genT; }
    else if (vidTarget === monV && vReady) mm = vtex;
    else mm = screens[vidFor || FEAT[0].id].poster;
    if (monV.material.map !== mm) { monV.material.map = mm; monV.material.needsUpdate = true; }
    glow.material.opacity = .14 + (kind === 'brief' ? .1 : 0);
    if (!reduced) dust.rotation.y = now / 90000;
    trailM.uniforms.t.value = reduced ? .3 : now / 16000; trailM.uniforms.col.value.copy(amb); trailM.uniforms.op.value = (1 - focusAmt * .8) * (1 - orb * .7);
    for (let i = 0; i < NS - 1; i++) {
      const x = i / (NS - 1), w = Math.pow(Math.max(0, Math.sin(x * 6 - now / 1100)), 24);
      ledC.copy(amb).multiplyScalar((.015 + w * .9) * ro); leds.setColorAt(i, ledC);
    }
    leds.instanceColor.needsUpdate = true; leds.visible = ro > .01 && tier < 2;

    if (FOCUS.id) {
      const d = vid.duration || 0;
      vw.fill.style.transform = `scaleX(${d ? vid.currentTime / d : 0})`;
      vw.time.textContent = `${fmt(vid.currentTime || 0)} / ${fmt(d)}`;
      vw.play.setAttribute('aria-pressed', !vid.paused);
    }
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
