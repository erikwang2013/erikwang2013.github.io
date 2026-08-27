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
  ctx.fillStyle = 'rgba(13, 21, 45, 0.5)';
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
  scene.fog = new T.FogExp2(0x0b1020, 0.055);

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
      map: tex, transparent: true, opacity: 0.42,
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
    group.rotation.y += 0.00012;
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

/* 启动：延迟到空闲再加载 1.3MB three 模块，首屏不等待背景 */
function startBackground() {
  const boot = async () => {
    if (new URLSearchParams(location.search).has('nogl')) { fallback(); return; }
    try {
      const T = await import('./vendor/three.module.js');
      await initScene(T);
    } catch {
      fallback();
    }
  };
  if ('requestIdleCallback' in window) requestIdleCallback(boot, { timeout: 1500 });
  else setTimeout(boot, 150);
}
startBackground();

/* PDF 下载：html2canvas 渲染 + jsPDF 手动分页，绕开浏览器打印对话框页眉页脚，不依赖服务器。
   html2canvas 1.x 无媒体模拟，onclone 里把 style.css 的 @media print 规则注入克隆文档复用。 */
function injectPrintStyles(doc) {
  const rules = [];
  for (const sheet of document.styleSheets) {
    let cssRules;
    try { cssRules = sheet.cssRules; } catch { continue; } // 跨域样式表访问会抛 SecurityError，跳过而不是让整个 PDF 失败
    for (const rule of cssRules) {
      if (rule.type === CSSRule.MEDIA_RULE && rule.media.mediaText.includes('print')) {
        rules.push(rule.cssText.replace(/^@media print\s*\{/, '').replace(/\}\s*$/, ''));
      }
    }
  }
  const style = doc.createElement('style');
  style.textContent = rules.join('\n');
  doc.head.appendChild(style);
}

async function exportPdf(color) {
  if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') return;
  if (document.body.classList.contains('pdf-busy')) return; // 生成中防连点
  document.body.classList.add('pdf-busy');
  if (document.fonts && document.fonts.ready) await document.fonts.ready; // 字体未就绪时克隆文档会回流，抓出缺内容的 PDF
  const hadColor = document.body.classList.contains('print-color');
  document.body.classList.toggle('print-color', color);
  // html2canvas 渲染伪元素时克隆文档的覆盖规则不生效，需在活文档里中和（黑白/彩色各取对应色）
  const live = document.createElement('style');
  const accent = color ? '#38bdf8' : '#000';
  live.textContent = '.timeline::before,.sec-title::before{background:' + accent + ' !important;background-image:none !important}' +
    '.tl-item::before{background:#fff !important;border-color:' + accent + ' !important;box-shadow:none !important}';
  document.head.appendChild(live);
  const en = document.documentElement.lang === 'en';
  const filename = en ? (color ? 'Wang-Kexun-fullstack-go-php-color.pdf' : 'Wang-Kexun-fullstack-go-php.pdf')
    : (color ? '王可勋-全栈-go-php-彩色.pdf' : '王可勋-全栈-go-php.pdf');
  let avoidTops = [];
  html2canvas(document.body, {
    scale: 2, useCORS: true,
    windowWidth: 703, windowHeight: 1049, // 与 Chrome 打印视口一致（A4 减 12/12/14mm 边距）
    ignoreElements: (el) => el.id && /^(bg-canvas|glow|scroll-progress|back-top)$/.test(el.id), // 装饰性固定元素：WebGL 画布拖慢捕获，其余无内容
    onclone: (doc) => {
      injectPrintStyles(doc);
      // .reveal 初始 opacity:0，注入打印样式后会从 0 过渡到 1；html2canvas 不等过渡完成，
      // 页面加载中点击时截到半透明内容。硬编码复位可见性并杀掉过渡/动画，内容不再依赖滚动位置与时机。
      const s = doc.createElement('style');
      s.textContent = 'html.js .reveal{opacity:1!important;transform:none!important}' +
        '*{transition:none!important;animation:none!important}';
      doc.head.appendChild(s);
      // 元素分页避让：记录顶部与高度（视口已为 703px，与捕获一致），跨切点的元素整体上移防截断
      avoidTops = [...doc.querySelectorAll('.tl-item,.card,.skill-row,.strength-row,.edu-card,.sec-title')]
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.height > 0 && r.height < 900)
        .map((r) => ({ top: r.top * 2, height: r.height * 2 })); // scale=2，canvas 像素
    },
  }).then((canvas) => {
    const pdf = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
    const mL = 34, mT = 34, mR = 34, mB = 40; // 与 @page 边距一致
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    const scale = (pw - mL - mR) / canvas.width;
    const stripH = (ph - mT - mB) / scale;
    // 末页太空（末段 < 55% 页容量）时等比微缩内容并入前页；缩放下限 0.85，避免中空页被缩得过于明显
    const n0 = Math.ceil(canvas.height / stripH - 1e-6);
    const tail = canvas.height - stripH * (n0 - 1);
    let shrink = 1;
    if (n0 > 1 && tail < stripH * 0.55) {
      const s = (n0 - 1) / (n0 - 1 + tail / stripH);
      if (s >= 0.85) shrink = s;
    }
    // 切点基于缩放后布局坐标（shrink=1 时即原始坐标）；元素底跨过或贴进切点 6pt 内才上移，避免整卡被切
    const cuts = [0];
    const H = canvas.height * shrink;
    const gap = 48 * shrink; // 避让上移留白 24csspx：section padding 在元素外，切点贴元素顶会让标题贴页顶
    while (cuts[cuts.length - 1] + stripH < H - 1) {
      let b = cuts[cuts.length - 1] + stripH;
      const near = avoidTops
        .map((o) => ({ top: o.top * shrink, bottom: (o.top + o.height) * shrink }))
        .filter((o) => o.top < b && o.bottom > b - 6);
      if (near.length) {
        const nb0 = Math.min(...near.map((o) => o.top)) - gap;
        // 切点推上后可能落进上方元素底部：紧密排列时上方元素底与避让元素顶几乎相贴，
        // 按 min-top-gap 推会切掉上方元素整段 ~20px。把切点按到最深元素底部之上 6px 处，
        // 残条 ≤6px（3css px）不可见；切点仍低于避让元素顶，不会切到它
        const hit = avoidTops
          .map((o) => ({ top: o.top * shrink, bottom: (o.top + o.height) * shrink }))
          .filter((o) => o.top < nb0 && o.bottom > nb0);
        const nb = hit.length ? Math.max(nb0, Math.max(...hit.map((o) => o.bottom)) - 6) : nb0;
        if (nb > cuts[cuts.length - 1] + 40) b = nb; // 空间不足时放弃避让，防切点倒退产生负高丢失内容
      }
      cuts.push(b);
    }
    cuts.push(H);
    const tmp = document.createElement('canvas');
    tmp.width = canvas.width;
    const tctx = tmp.getContext('2d');
    const imgW = (pw - mL - mR) * shrink;
    for (let i = 0; i < cuts.length - 1; i++) {
      const y = cuts[i] / shrink;
      const h = (cuts[i + 1] - cuts[i]) / shrink;
      tmp.height = Math.ceil(h);
      tctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
      if (i) pdf.addPage();
      pdf.addImage(tmp.toDataURL('image/jpeg', 0.95), 'JPEG', mL + (pw - mL - mR - imgW) / 2, mT, imgW, (cuts[i + 1] - cuts[i]) * scale);
      // 右下角页码 X / Y，与 add-page-numbers.py 同位置：右贴 34pt 边距、基线距底 14pt
      pdf.setFontSize(9);
      pdf.text((i + 1) + ' / ' + (cuts.length - 1), pw - mR, ph - 14, { align: 'right' });
    }
    pdf.save(filename);
  }).catch((e) => console.error('PDF 生成失败', e))
    .finally(() => {
      document.body.classList.toggle('print-color', hadColor);
      live.remove();
      document.body.classList.remove('pdf-busy');
    });
}

window.exportPdf = exportPdf; // 供 index.html 的内联委托监听调用（模块加载前点击不丢事件）

