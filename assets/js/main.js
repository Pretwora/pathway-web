// Pathway — поведение страницы. Без библиотек.

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Шапка: фон при прокрутке ----------
const header = document.querySelector('.header');
const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 24);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ---------- Мобильное меню ----------
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
function setMenu(open) {
  nav.classList.toggle('is-open', open);
  header.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
}
burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
nav.addEventListener('click', (e) => { if (e.target.tagName === 'A') setMenu(false); });

// ---------- Появление при прокрутке ----------
const revealObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add('is-visible');
    revealObserver.unobserve(entry.target);
  }
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 3) * 60}ms`;
  revealObserver.observe(el);
});

// ---------- Тропа между шагами прорисовывается при прокрутке ----------
const steps = document.querySelector('.steps');
if (steps) {
  const stepsObserver = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      steps.classList.add('is-drawn');
      stepsObserver.disconnect();
    }
  }, { threshold: 0.4 });
  stepsObserver.observe(steps);
}

// ---------- Сборка логотипа: та же раскадровка, что в заставке приложения ----------
(function logoAnimation() {
  const G = window.PATHWAY_LOGO;
  const svg = document.getElementById('logoAnim');
  if (!G || !svg) return;

  const NS = 'http://www.w3.org/2000/svg';
  const bandsGroup = svg.querySelector('#la-bands');
  const bands = G.bands.map((d) => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('fill', '#fff');
    p.setAttribute('opacity', '0');
    bandsGroup.appendChild(p);
    return p;
  });
  svg.querySelector('#la-road').setAttribute('d', G.road);
  svg.querySelector('#la-arrowp').setAttribute('d', G.arrow);

  const arrow = svg.querySelector('#la-arrow');
  const tile = svg.querySelector('#la-tileg');
  const flood = svg.querySelector('#la-floodc');
  const ring = svg.querySelector('#la-ringc');
  const border = svg.querySelector('#la-border');
  const xs = G.routeX;
  const ys = G.routeY;
  const last = xs.length - 1;
  tile.style.transformOrigin = '500px 500px';

  const seg = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
  const easeOut = (x) => 1 - (1 - x) ** 3;
  // cubic-bezier(.5, 0, .2, 1) — разгон и мягкое прибытие.
  function travel(x) {
    let lo = 0;
    let hi = 1;
    let t = x;
    for (let i = 0; i < 20; i++) {
      t = (lo + hi) / 2;
      const u = 1 - t;
      if (3 * u * u * t * 0.5 + 3 * u * t * t * 0.2 + t * t * t < x) lo = t;
      else hi = t;
    }
    const u = 1 - t;
    return 3 * u * t * t + t * t * t;
  }
  const catmull = (a, b, c, d, t) =>
    0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
  function routeAt(u) {
    const v = Math.min(last, Math.max(0, u));
    const i = Math.min(last - 1, Math.floor(v));
    const f = v - i;
    const i0 = Math.max(0, i - 1);
    const i3 = Math.min(last, i + 2);
    return [catmull(xs[i0], xs[i], xs[i + 1], xs[i3], f), catmull(ys[i0], ys[i], ys[i + 1], ys[i3], f)];
  }

  function frame(t) {
    const appear = easeOut(seg(t, 0, 240));
    const pop = seg(t, 860, 1200);
    const bump = Math.sin(pop * Math.PI) * 0.045 * (1 - pop * 0.3);
    tile.style.transform = `scale(${0.9 + 0.1 * appear + bump})`;
    tile.style.opacity = appear;

    const p = travel(seg(t, 120, 900));
    const u = p * last;
    const [x, y] = routeAt(u);
    const [ax, ay] = routeAt(u + 0.35);
    const [bx, by] = routeAt(u - 0.35);
    const tangent = (Math.atan2(ay - by, ax - bx) * 180) / Math.PI;
    const s = Math.min(1, Math.max(0, (p - 0.82) / 0.18));
    const settle = s * s * (3 - 2 * s);
    const rot = (tangent - G.finalAngle) * (1 - settle);
    const sc = 1 + 0.95 * (1 - p) ** 1.4;
    arrow.setAttribute('opacity', t >= 120 ? 1 : 0);
    arrow.setAttribute('transform',
      `translate(${x} ${y}) rotate(${rot}) scale(${sc}) translate(${-G.anchor.x} ${-G.anchor.y})`);

    for (let k = 0; k < bands.length; k++) {
      bands[k].setAttribute('opacity', Math.min(1, Math.max(0, (u - 1 - k + 0.2) / 0.6)));
    }

    flood.setAttribute('r', easeOut(seg(t, 860, 1280)) * 1150);
    border.setAttribute('opacity', 1 - seg(t, 860, 1080));
    const r = seg(t, 860, 1420);
    ring.setAttribute('r', 80 + easeOut(r) * 640);
    ring.setAttribute('opacity', r > 0 && r < 1 ? 0.75 * (1 - r) : 0);
    ring.setAttribute('stroke-width', 14 - 10 * r);
  }

  const END = 1600;
  if (reduceMotion) {
    frame(END);
    return;
  }
  frame(0);
  let start = null;
  function loop(now) {
    if (start === null) start = now;
    const t = now - start;
    frame(Math.min(t, END));
    if (t < END) requestAnimationFrame(loop);
  }
  // Небольшая пауза: пусть сначала встанет текст первого экрана.
  setTimeout(() => requestAnimationFrame(loop), 450);
  // Повтор по клику — приятная мелочь для тех, кто не успел досмотреть.
  svg.parentElement.addEventListener('click', () => {
    start = null;
    requestAnimationFrame(loop);
  });
})();
