/* Erik feats.js — 搜索 / 灯箱 / 复制 / 动态标题 / 一言 */
/* 取词：i18n.js 没加载/被关掉时用中文原文兜底 */
function erikT(key, args, fallback) {
  return window.erikt ? window.erikt(key, args, fallback) : fallback;
}
/* 亮/暗切换 */
(function () {
  var btn = document.getElementById('theme-toggle');
  if (!btn) return;
  var icon = btn.querySelector('.theme-icon');

  function syncInline(light) {
    /* main.js 会把配置色内联到 <html> 上,亮色时需清掉,否则覆盖 .erik-light */
    var r = document.documentElement;
    var c = (window.ERIK && window.ERIK.style) || {};
    var map = { '--primary': c.primary, '--secondary': c.secondary, '--accent': c.accent, '--bg-top': c.bgTop, '--bg-bottom': c.bgBottom };
    if (light) {
      ['--primary', '--secondary', '--accent', '--bg-top', '--bg-bottom'].forEach(function (k) { r.style.removeProperty(k); });
    } else {
      for (var k in map) { if (map[k]) r.style.setProperty(k, map[k]); }
    }
  }
  function apply(light) {
    document.documentElement.classList.toggle('erik-light', light);
    if (icon) icon.textContent = light ? '☀️' : '🌙';
    localStorage.setItem('erik-theme', light ? 'light' : 'dark');
    syncInline(light);
  }
  var isLight = () => document.documentElement.classList.contains('erik-light');
  btn.addEventListener('click', function () { apply(!isLight()); });
  var saved = localStorage.getItem('erik-theme');
  if (saved === 'light' && !isLight()) apply(true);
  else syncInline(isLight());
  if (icon) icon.textContent = isLight() ? '☀️' : '🌙';
})();

/* 站内搜索：面板 + 实时过滤 + 高亮 */
(function () {
  var cfg = (window.ERIK && window.ERIK.search) || { enable: false };
  if (!cfg.enable) return;
  var panel = document.getElementById('search-panel');
  var input = document.getElementById('search-input');
  var list = document.getElementById('search-results');
  var empty = document.getElementById('search-empty');
  var toggle = document.getElementById('search-toggle');
  var maxResults = cfg.max_results || 10;
  var index = null;
  var failed = false;
  /* 当前语言：i18n.js 的 apply() 会同步 window.erikLang 和 html[data-lang] */
  function curLang() { return /^en/i.test(window.erikLang || '') ? 'en' : 'zh'; }

  function highlight(text, q) {
    if (!q) return escapeHtml(text);
    var i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return escapeHtml(text);
    return escapeHtml(text.slice(0, i)) + '<mark>' + escapeHtml(text.slice(i, i + q.length)) + '</mark>' + escapeHtml(text.slice(i + q.length));
  }
  function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function render(q) {
    if (!index) return;
    q = q.trim();
    var hits = [];
    if (q) {
      var ql = q.toLowerCase();
      index.forEach(function (p) {
        if ((p.lang || 'zh') !== curLang()) return;
        var hay = (p.title + ' ' + (p.tags || []).join(' ') + ' ' + (p.categories || []).join(' ') + ' ' + p.excerpt).toLowerCase();
        if (hay.indexOf(ql) >= 0) hits.push(p);
      });
      hits = hits.slice(0, maxResults);
    }
    if (empty) empty.hidden = !(q.length > 0 && hits.length === 0);
    list.innerHTML = hits.map(function (p) {
      return '<li><a href="' + escapeHtml(p.url) + '"><span class="sr-title">' + highlight(p.title, q) + '</span>' +
        '<span class="sr-meta">' + escapeHtml(p.date || '') + (p.tags && p.tags.length ? ' · ' + p.tags.map(function (t) { return '#' + escapeHtml(t); }).join(' ') : '') + '</span>' +
        (p.excerpt ? '<span class="sr-excerpt">' + highlight(p.excerpt.slice(0, 80), q) + '</span>' : '') + '</a></li>';
    }).join('');
  }

  function openPanel() {
    panel.hidden = false;
    document.body.classList.add('search-open');
    setTimeout(function () { if (input) input.focus(); }, 50);
    if (!index) {
      fetch((window.ERIK.root || '/') + 'search.json').then(function (r) { return r.json(); })
        .then(function (d) { index = d; render(input.value); })
        .catch(function () { if (empty) { failed = true; empty.textContent = erikT('search.fail', null, '搜索索引加载失败 😢'); empty.hidden = false; } });
    }
  }
  function closePanel() {
    panel.hidden = true;
    document.body.classList.remove('search-open');
  }

  if (toggle) toggle.addEventListener('click', function (e) { e.stopPropagation(); panel.hidden ? openPanel() : closePanel(); });
  if (input) input.addEventListener('input', function () { render(input.value); });
  panel.addEventListener('click', function (e) { if (e.target === panel) closePanel(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) closePanel(); });
  document.addEventListener('erik:lang', function () {
    if (failed && empty) empty.textContent = erikT('search.fail', null, '搜索索引加载失败 😢');
    /* 索引里中英都有，换语言只需按新语言重渲染（没打开过搜索面板则 index 为空，直接跳过） */
    render(input ? input.value : '');
  });
})();
/* 图片灯箱：同组切换 / 滚轮缩放 / 双击重置 / ESC 关闭 */
(function () {
  var cfg = (window.ERIK && window.ERIK.lightbox) || { enable: false };
  if (!cfg.enable) return;
  var box = document.getElementById('lightbox');
  if (!box) return;
  var img = box.querySelector('.lightbox-img');
  var cap = box.querySelector('.lightbox-caption');
  var prev = box.querySelector('.lightbox-prev');
  var next = box.querySelector('.lightbox-next');
  var close = box.querySelector('.lightbox-close');
  var group = [];
  var current = 0;
  var scale = 1;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function collect(root) {
    group = Array.prototype.slice.call((root || document).querySelectorAll(
      '.article-entry img, .gallery-masonry img'
    )).filter(function (im) {
      return im.closest && !im.closest('a');
    });
  }
  function show(i) {
    current = (i + group.length) % group.length;
    scale = 1;
    img.src = group[current].currentSrc || group[current].src;
    img.style.transform = 'scale(1)';
    cap.textContent = group[current].alt || '';
    box.hidden = false;
    document.body.classList.add('lightbox-open');
  }
  function hide() {
    box.hidden = true;
    document.body.classList.remove('lightbox-open');
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t && t.tagName === 'IMG') {
      var scope = t.closest('article, .gallery-masonry, .post-main');
      collect(scope || document);
      var idx = group.indexOf(t);
      if (idx >= 0) show(idx);
    }
  });
  close.addEventListener('click', hide);
  box.addEventListener('click', function (e) { if (e.target === box) hide(); });
  prev.addEventListener('click', function () { show(current - 1); });
  next.addEventListener('click', function () { show(current + 1); });
  document.addEventListener('keydown', function (e) {
    if (box.hidden) return;
    if (e.key === 'Escape') hide();
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
  img.addEventListener('wheel', function (e) {
    e.preventDefault();
    scale = Math.min(4, Math.max(0.5, scale - e.deltaY * 0.002));
    img.style.transform = 'scale(' + scale + ')';
  }, { passive: false });
  img.addEventListener('dblclick', function () { scale = 1; img.style.transform = 'scale(1)'; });
  if (!reduced) box.style.transition = 'opacity .25s ease';
})();
/* 代码块复制按钮 + 语言标签 */
(function () {
  var cfg = (window.ERIK && window.ERIK.copyBtn) || { enable: false };
  if (!cfg.enable) return;
  function copy(text, btn) {
    function done() {
      btn.textContent = erikT('copy.ok', null, '✅ 已复制');
      setTimeout(function () { btn.textContent = '📋'; }, 2000);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () { fallback(); });
    } else fallback();
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { btn.textContent = '❌'; }
      document.body.removeChild(ta);
    }
  }
  function init() {
    document.querySelectorAll('figure.highlight, pre:not(.code-head pre, figure.highlight pre)').forEach(function (block) {
      if (block.querySelector('.code-head')) return;
      var lang = '';
      var m = (block.className || '').match(/language-([\w-]+)/);
      if (m) lang = m[1];
      var head = document.createElement('div');
      head.className = 'code-head';
      head.innerHTML = '<span class="code-lang">' + lang + '</span><button type="button" class="code-copy">📋</button>';
      var btn = head.querySelector('.code-copy');
      var codeEl = block.querySelector('td.code') || block.querySelector('code');
      btn.addEventListener('click', function () {
        copy(codeEl ? codeEl.innerText : block.innerText, btn);
      });
      block.insertBefore(head, block.firstChild);
    });
  }
  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('load', init);
})();

/* 动态标题 */
(function () {
  var cfg = (window.ERIK && window.ERIK.dynamicTitle) || { enable: false };
  if (!cfg.enable) return;
  var wording = erikT(cfg.wording || '📬 有新消息等你');
  var orig = document.title;
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { orig = document.title; document.title = wording; }
    else document.title = orig;
  });
})();

/* 文章页首图视差：滚动时图片相对页面缓慢位移（只动 transform，不动布局） */
(function () {
  var cfg = (window.ERIK && window.ERIK.three) || {};
  if (cfg.enable === false || cfg.parallax === false) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var img = document.querySelector('.article-entry img');
  if (!img || window.innerWidth < 769) return;
  var ticking = false, RANGE = 26;
  function update() {
    ticking = false;
    var r = img.getBoundingClientRect();
    if (r.bottom < -120 || r.top > window.innerHeight + 120) return;
    var p = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
    img.style.transform = 'translateY(' + (p * RANGE).toFixed(1) + 'px) scale(1.06)';
  }
  img.style.willChange = 'transform';
  img.style.transition = 'transform .12s linear';
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
})();

/* 相册 3D 照片墙：整墙跟着光标轻微转动、图片按远近分层（窄屏/减少动效保持平面） */
(function () {
  var walls = document.querySelectorAll('.gallery-masonry');
  if (!walls.length || window.innerWidth < 769) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  Array.prototype.forEach.call(walls, function (wall) {
    wall.classList.add('wall3d');
    Array.prototype.forEach.call(wall.querySelectorAll('.gallery-item'), function (it, i) {
      it.style.transform = 'translateZ(' + ((i % 5) * 12) + 'px)';
    });
    wall.addEventListener('mousemove', function (e) {
      var r = wall.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      wall.style.transform = 'perspective(1200px) rotateY(' + (px * 10).toFixed(2) + 'deg) rotateX(' + (-py * 8).toFixed(2) + 'deg)';
    });
    wall.addEventListener('mouseleave', function () { wall.style.transform = ''; });
  });
})();

/* 移动端轻量通道：3D 回落（low 档/无 WebGL/上下文丢失）时用 Canvas2D 顶上，
   再给一个"开启完整 3D"按钮，点了写 localStorage 下次启动就按 mid 档加载 */
(function () {
  var cfg = (window.ERIK && window.ERIK.three) || {};
  if (cfg.enable === false) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var canvas = null, ctx = null, raf = 0, dots = [], emojis = [], W = 0, H = 0, t0 = 0;

  function resize() {
    if (!canvas) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!t0) t0 = now;
    var t = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);
    var pal = (cfg.particleColors || ['#a78bfa', '#22d3ee', '#f472b6', '#fbbf24']);
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      ctx.globalAlpha = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(t * d.s + d.p));
      ctx.fillStyle = pal[i % pal.length];
      ctx.beginPath();
      ctx.arc(d.x * W, d.y * H, d.r, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 0.5;
    ctx.font = '24px serif';
    ctx.textAlign = 'center';
    for (var j = 0; j < emojis.length; j++) {
      var e = emojis[j], y = (e.y0 + t * e.v) % 1.15 - 0.08;
      ctx.save();
      ctx.translate(e.x * W + Math.sin(t * 0.5 + j) * 14, (1 - y) * H);
      ctx.rotate(Math.sin(t * 0.4 + j) * 0.2);
      ctx.fillText(e.ch, 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  function start() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.id = 'bg2d';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    var n = window.innerWidth < 600 ? 60 : 110;
    for (var i = 0; i < n; i++) dots.push({ x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.6, p: Math.random() * 6.28, s: 0.3 + Math.random() * 0.8 });
    var list = (cfg.emoji && cfg.emoji.length ? cfg.emoji : ['🔮', '✨', '🚀', '🪐']);
    for (var k = 0; k < 5; k++) emojis.push({ ch: list[(k * 7) % list.length], x: 0.1 + Math.random() * 0.8, y0: Math.random(), v: 0.006 + Math.random() * 0.012 });
    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
      else if (!raf) loop(performance.now());
    });
    loop(performance.now());
  }

  function tune() {
    if (!document.body.classList.contains('no-webgl')) return;
    start();
    if (document.getElementById('full3d-btn')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'full3d-btn';
    btn.className = 'full3d-btn';
    btn.textContent = erikT('btn.full3d', null, '✨ 开启完整 3D');
    document.addEventListener('erik:lang', function () {
      btn.textContent = erikT('btn.full3d', null, '✨ 开启完整 3D');
    });
    btn.addEventListener('click', function () {
      try { localStorage.setItem('erik-full3d', '1'); } catch (e) {}
      location.reload();
    });
    document.body.appendChild(btn);
  }

  tune();
  /* 运行时降档/上下文丢失是后发生的，盯着 body 的 class 变化 */
  if (window.MutationObserver) {
    new MutationObserver(tune).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }
})();

/* 节日飘落物（雪花/彩带）：由 main.js 判定节日后挂在 window.erikHoliday 上 */
(function () {
  var h = window.erikHoliday;
  if (!h || !h.flakes) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var box = document.createElement('div');
  box.className = 'flakes flakes-' + h.flakes;
  box.setAttribute('aria-hidden', 'true');
  var n = h.flakes === 'snow' ? 26 : 20;
  var conf = ['🎊', '🎉', '✨', '🎈'];
  for (var i = 0; i < n; i++) {
    var f = document.createElement('span');
    f.textContent = h.flakes === 'snow' ? '❄' : conf[i % conf.length];
    f.style.left = (Math.random() * 100).toFixed(1) + '%';
    f.style.fontSize = (10 + Math.random() * 12).toFixed(0) + 'px';
    f.style.opacity = (0.4 + Math.random() * 0.5).toFixed(2);
    f.style.animationDuration = (7 + Math.random() * 8).toFixed(1) + 's';
    f.style.animationDelay = (-Math.random() * 12).toFixed(1) + 's';
    box.appendChild(f);
  }
  document.body.appendChild(box);
})();

/* 一言 / 随机语录 */
(function () {
  var cfg = (window.ERIK && window.ERIK.quote) || { enable: false };
  var el = document.getElementById('site-quote');
  if (!cfg.enable || !el) return;
  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  var quotes = [
    { t: '代码是写给未来的自己看的信。', a: '' },
    { t: 'Debug 一半的时间，是在和昨天的自己聊天。', a: '' },
    { t: '最好的函数是那些你三个月后还能看懂的。', a: '' },
    { t: '保持好奇，保持谦逊，保持写代码。', a: '' },
    { t: '技术会过时，解决问题的思路不会。', a: '' },
    { t: '写注释是给未来的自己写锦囊。', a: '' },
    { t: '一个 bug 的消失，往往伴随着另一个 bug 的出现。', a: '墨菲定律·程序员版' },
    { t: '重构不是重写，是对旧代码的尊重。', a: '' },
    { t: '第一次就写对的代码是奇迹，能跑起来的代码是常态。', a: '' },
    { t: '读代码比写代码更需要勇气。', a: '' },
    { t: '凡是能用命令行解决的，就不要用鼠标。', a: '' },
    { t: '人生苦短，我用 Python。', a: '' },
    { t: '不积跬步，无以至千里；不积小流，无以成江海。', a: '荀子' },
    { t: '学而不思则罔，思而不学则殆。', a: '孔子' },
    { t: '路漫漫其修远兮，吾将上下而求索。', a: '屈原' },
    { t: '纸上得来终觉浅，绝知此事要躬行。', a: '陆游' },
    { t: 'Stay hungry, stay foolish.', a: 'Steve Jobs' },
    { t: 'Talk is cheap. Show me the code.', a: 'Linus Torvalds' },
    { t: 'Premature optimization is the root of all evil.', a: 'Donald Knuth' },
    { t: 'Any fool can write code that a computer can understand. Good programmers write code that humans can understand.', a: 'Martin Fowler' },
    { t: 'It works on my machine.', a: '每个程序员' },
    { t: 'There are only two hard things in CS: cache invalidation and naming things.', a: 'Phil Karlton' },
    { t: '先跑起来，再跑得快，最后才跑得优雅。', a: '' },
    { t: '文档写得好，锅背得少。', a: '' },
    { t: '线上无小事，备份是底线。', a: '' },
    { t: '简单是可靠的前提。', a: '' },
    { t: '自由不是想做什么就做什么，而是想不做什么就不做什么。', a: '康德' },
    { t: '生活不止眼前的 bug，还有远方的需求变更。', a: '' },
    { t: '每天进步一点点，十年后就是另一个自己。', a: '' },
    { t: 'Good things come to those who wait, but only the things left by those who hustle.', a: 'Abraham Lincoln' }
  ];
  function wrap(text, from) {
    return '<span class="quote-text">' + erikT('quote.open') + text + erikT('quote.close') + '</span>' +
      (from ? '<span class="quote-from">' + erikT('quote.by') + from + '</span>' : '');
  }
  function show() {
    var q = quotes[Math.floor(Math.random() * quotes.length)];
    el.innerHTML = wrap(q.t, q.a);
  }
  if (cfg.api) {
    fetch(cfg.api).then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.hitokoto) {
          el.innerHTML = wrap(esc(d.hitokoto), d.from ? esc(d.from) : '');
        } else show();
      }).catch(show);
  } else show();
})();
