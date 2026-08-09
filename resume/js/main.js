/* Three.js 背景与页面交互。
   背景：技术关键词 chip（图标+文字）缓慢漂浮，低透明度、深度雾化，不抢内容焦点。
   降级路径：本地 three 模块加载失败 / WebGL 上下文创建失败 / 显式 ?nogl=1 → body.no-webgl（CSS 星点背景接管）。 */
const canvas = document.getElementById('bg-canvas');
const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function fallback() { document.body.classList.add('no-webgl'); }

const KEYWORDS = [
  { name: 'PHP', icon: 'php' },
  { name: 'Go', icon: 'golang' },
  { name: 'Laravel', icon: 'laravel' },
  { name: 'MySQL', icon: 'mysql' },
  { name: 'Redis', icon: 'redis' },
  { name: 'Elasticsearch', icon: 'elasticsearch' },
  { name: 'Docker', icon: 'docker' },
  { name: 'Kubernetes', icon: 'kubernetes' },
  { name: 'GraphQL', icon: 'graphql' },
  { name: 'Flutter', icon: 'flutter' },
  { name: 'RabbitMQ', icon: 'rabbitmq' },
  { name: 'Nginx', icon: 'nginx' },
];

function loadIcon(name) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = 'js/vendor/icons/' + name + '.svg';
  });
}

function makeChipTexture(kw, icon, dpr, T) {
  const pad = 12, iconSize = 18, gap = 9;
  const font = '600 13px system-ui, sans-serif';
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  g.font = font;
  const textW = g.measureText(kw.name).width;
  const w = pad + iconSize + gap + textW + pad;
  const h = pad + iconSize + pad;
  c.width = Math.ceil(w * dpr);
  c.height = Math.ceil(h * dpr);
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  const rad = h / 2;
  ctx.beginPath();
  ctx.moveTo(rad, 0);
  ctx.arcTo(w, 0, w, h, rad);
  ctx.arcTo(w, h, 0, h, rad);
  ctx.arcTo(0, h, 0, 0, rad);
  ctx.arcTo(0, 0, w, 0, rad);
  ctx.closePath();
  ctx.fillStyle = 'rgba(13, 21, 45, 0.62)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
  if (icon) ctx.drawImage(icon, pad, pad, iconSize, iconSize);
  ctx.fillStyle = 'rgba(219, 234, 254, 0.85)';
  ctx.font = font;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(kw.name, pad + iconSize + gap, h / 2 + 0.5);
  return new T.CanvasTexture(c);
}

async function initScene(T) {
  if (new URLSearchParams(location.search).has('nogl')) { fallback(); return; }

  const scene = new T.Scene();
  scene.fog = new T.FogExp2(0x0b1020, 0.04);

  const camera = new T.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
  camera.position.z = 18;

  const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);

  const icons = await Promise.all(KEYWORDS.map((k) => loadIcon(k.icon)));
  const dpr = Math.min(devicePixelRatio, 2);
  const kScale = 0.01;
  const chips = [];
  const group = new T.Group();
  KEYWORDS.forEach((kw, i) => {
    const tex = makeChipTexture(kw, icons[i], dpr, T);
    const sprite = new T.Sprite(new T.SpriteMaterial({
      map: tex, transparent: true, opacity: 0.72,
      depthWrite: false, fog: true,
    }));
    const r = 6.5 + Math.random() * 4.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    sprite.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi),
    );
    const cw = tex.image.width / dpr;
    const ch = tex.image.height / dpr;
    sprite.scale.set(cw * kScale, ch * kScale, 1);
    sprite.userData = {
      baseY: sprite.position.y,
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 0.5,
      amp: 0.2 + Math.random() * 0.3,
    };
    group.add(sprite);
    chips.push(sprite);
  });
  scene.add(group);

  let tx = 0, ty = 0, cx = 0, cy = 0;
  const finePointer = matchMedia('(pointer: fine)').matches;
  if (finePointer && !prefersReduced) {
    addEventListener('pointermove', (e) => {
      tx = (e.clientX / innerWidth - 0.5) * 2;
      ty = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  function animate(t) {
    if (!prefersReduced) requestAnimationFrame(animate);
    cx += (tx - cx) * 0.05;
    cy += (ty - cy) * 0.05;
    group.rotation.y += 0.0003;
    for (const s of chips) {
      const u = s.userData;
      s.position.y = u.baseY + Math.sin(t * 0.001 * u.speed + u.phase) * u.amp;
    }
    camera.position.x = cx * 2.2;
    camera.position.y = cy * 1.6;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  animate(performance.now());

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
}

/* 滚动淡入 */
(function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (prefersReduced || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    }
  }, { threshold: 0.08 });
  els.forEach((el, i) => {
    el.style.transitionDelay = (i % 4) * 60 + 'ms';
    io.observe(el);
  });
})();

/* 导航高亮 */
(function initSpy() {
  const links = document.querySelectorAll('.nav-links a');
  const spy = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        const id = e.target.id;
        links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
      }
    }
  }, { rootMargin: '-40% 0px -55% 0px' });
  ['skills', 'strengths', 'experience', 'projects', 'education'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) spy.observe(el);
  });
})();

/* 返回顶部 */
const backTop = document.getElementById('back-top');
const updateBackTop = () => backTop.classList.toggle('show', scrollY > 400);
updateBackTop();
addEventListener('scroll', updateBackTop, { passive: true });
backTop.addEventListener('click', () => window.scrollTo({
  top: 0, behavior: prefersReduced ? 'auto' : 'smooth',
}));

/* 顶部滚动进度条 */
const progressBar = document.getElementById('scroll-progress');
const updateProgress = () => {
  const h = document.documentElement.scrollHeight - innerHeight;
  progressBar.style.transform = 'scaleX(' + (h > 0 ? Math.min(scrollY / h, 1) : 0) + ')';
};
updateProgress();
addEventListener('scroll', updateProgress, { passive: true });
addEventListener('resize', updateProgress);

/* 鼠标跟随光斑（桌面端） */
const glow = document.getElementById('glow');
if (matchMedia('(pointer: fine)').matches && matchMedia('(min-width: 768px)').matches && !prefersReduced) {
  glow.style.display = 'block';
  let gx = innerWidth / 2, gy = innerHeight / 2, tgx = gx, tgy = gy;
  addEventListener('pointermove', (e) => { tgx = e.clientX; tgy = e.clientY; }, { passive: true });
  (function glowLoop() {
    requestAnimationFrame(glowLoop);
    gx += (tgx - gx) * 0.08;
    gy += (tgy - gy) * 0.08;
    glow.style.transform = 'translate(' + (gx - 240) + 'px,' + (gy - 240) + 'px)';
  })();
}

/* 启动 */
(async function boot() {
  try {
    const T = await import('./vendor/three.module.js');
    await initScene(T);
  } catch {
    fallback();
  }
})();
