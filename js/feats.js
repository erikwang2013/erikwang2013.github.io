/* Erik feats.js — 搜索 / 灯箱 / 复制 / 动态标题 / 一言 */
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
        .catch(function () { if (empty) { empty.textContent = '搜索索引加载失败 😢'; empty.hidden = false; } });
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
      btn.textContent = '✅ 已复制';
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
  var wording = cfg.wording || '📬 有新消息等你';
  var orig = document.title;
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { orig = document.title; document.title = wording; }
    else document.title = orig;
  });
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
  function show() {
    var q = quotes[Math.floor(Math.random() * quotes.length)];
    el.innerHTML = '<span class="quote-text">「' + q.t + '」</span>' + (q.a ? '<span class="quote-from">—— ' + q.a + '</span>' : '');
  }
  if (cfg.api) {
    fetch(cfg.api).then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.hitokoto) {
          el.innerHTML = '<span class="quote-text">「' + esc(d.hitokoto) + '」</span>' + (d.from ? '<span class="quote-from">—— ' + esc(d.from) + '</span>' : '');
        } else show();
      }).catch(show);
  } else show();
})();
