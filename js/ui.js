/* Erik ui.js — 页面交互：卡片倾斜 / 滚动渐入 / 回到顶部 / 社交展开 / 打赏 / 侧栏 / 移动导航 / 目录高亮 */
'use strict';

(function () {
  var cfg = window.ERIK || {};
  var tiltCfg = cfg.tilt || {};
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 3D tilt on cards ---- */
  function initTilt() {
    if (reduceMotion || window.innerWidth < 900) return;
    var cards = document.querySelectorAll('.card.tilt');
    if (!cards.length) return;

    cards.forEach(function (card) {
      var max = tiltCfg.enable === false ? 0 : (tiltCfg.maxAngle || 12);
      card.addEventListener('mousemove', function (e) {
        // 光标进入链接/按钮或尾部行时冻结倾斜,否则 tilt 会把按钮推开导致无法点击
        if (e.target.closest('a, button, .article-footer, .article-meta')) {
          card.style.transform = '';
          return;
        }
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(900px) rotateY(' + (px * max) + 'deg) rotateX(' + (-py * max) + 'deg) translateZ(6px)';
        card.style.setProperty('--hue', String(parseInt((px + 0.5) * 60 + 220, 10) % 360));
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  /* ---- scroll reveal ---- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    /* 减少动态效果时直接显示,否则 reveal 元素永远保持 opacity:0 */
    if (reduceMotion) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---- scroll progress + back-top ---- */
  function initScrollUI() {
    var bar = document.getElementById('scroll-progress');
    var top = document.getElementById('back-top');
    function update() {
      var doc = document.documentElement;
      var h = doc.scrollHeight - window.innerHeight;
      var y = window.pageYOffset || doc.scrollTop;
      if (bar) bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
      if (top) top.classList.toggle('show', y > 400);
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
    if (top) top.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    }, false);
  }

  /* ---- social toggle (按内容计算停留时间,自动收起) ---- */
  function initSocialToggle() {
    var btn = document.getElementById('social-toggle');
    var panel = document.getElementById('social-panel');
    if (!btn || !panel) return;
    var timer = null;
    var wrap = btn.parentElement;

    function close() {
      clearTimeout(timer);
      panel.classList.remove('open');
      btn.classList.remove('active');
    }
    function schedule() {
      clearTimeout(timer);
      var n = panel.querySelectorAll('.social-link').length;
      var ms = Math.min(4200, Math.max(1400, 800 + n * 380));
      timer = setTimeout(close, ms);
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var opening = !panel.classList.contains('open');
      panel.classList.toggle('open');
      btn.classList.toggle('active');
      if (opening) schedule();
      else clearTimeout(timer);
    }, false);

    wrap.addEventListener('mouseenter', function () { clearTimeout(timer); }, false);
    wrap.addEventListener('mouseleave', function () {
      if (panel.classList.contains('open')) schedule();
    }, false);

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.social-wrap')) close();
    }, false);
  }

  /* ---- reward toggle ---- */
  function initReward() {
    var btn = document.getElementById('reward-toggle');
    var panel = document.getElementById('reward-panel');
    if (!btn || !panel) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      panel.classList.toggle('open');
      btn.classList.toggle('active');
    }, false);
    document.addEventListener('click', function (e) {
      if (!e.target.closest('#reward-box')) {
        panel.classList.remove('open');
        btn.classList.remove('active');
      }
    }, false);
  }

  /* ---- 侧边栏:标签流水(直接显示) + 内容抽屉 ---- */
  function initSidebar() {
    var box = document.querySelector('.float-tags'), items = box ? [].slice.call(box.querySelectorAll('.tag-item')) : [], n = items.length;
    if (n) {
      var maxShow = parseInt(box.getAttribute('data-maxshow'), 10) || 120;
      if (n > maxShow) { box.classList.add('dense'); items.forEach(function (el, i) { if (i >= maxShow) el.style.display = 'none'; }); items = items.slice(0, maxShow); n = maxShow; }
      var base = Math.floor(Math.random() * 360);
      items.forEach(function (el, i) { el.style.color = 'hsl(' + ((base + Math.round(360 * i / n)) % 360) + ', 85%, 72%)'; });
      for (var i = n - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = items[i]; items[i] = items[j]; items[j] = t; }
      /* 3D 球云模式(tagsphere.mode: sphere):标签按斐波那契均匀铺在球面,整球自转,
         每个标签套一层反向自转,保证文字始终正面朝向镜头 */
      var sphere = box.getAttribute('data-mode') === 'sphere' && !reduceMotion && window.innerWidth > 768;
      if (sphere) {
        box.classList.add('tag3d');
        var R = Math.max(90, Math.min((box.clientWidth || 280) / 2 - 30, 145));
        var dur = ((parseFloat(box.getAttribute('data-speed')) || 24) * 1.6).toFixed(1) + 's';
        box.style.setProperty('--dur', dur);
        var inner = document.createElement('div');
        inner.className = 'tag3d-inner';
        items.forEach(function (el, i) {
          var y = n > 1 ? 1 - (i / (n - 1)) * 2 : 0;
          var rr = Math.sqrt(Math.max(0, 1 - y * y)), th = i * 2.399963;
          el.style.transform = 'translate3d(calc(-50% + ' + (Math.cos(th) * rr * R).toFixed(1) + 'px),calc(-50% + ' +
            (y * R).toFixed(1) + 'px),' + (Math.sin(th) * rr * R).toFixed(1) + 'px)';
          el.innerHTML = '<span class="tag3d-t">' + el.textContent + '</span>';
          inner.appendChild(el);
        });
        box.appendChild(inner);
      } else {
        /* 均分到多行,每行内容复制 k 份做无缝左右滚动;窄屏不做跑马灯(裁切两端),改静态换行 */
        var ROWS = Math.max(3, Math.min(6, Math.ceil(n / 8))), rows = [], r, j, group;
        for (r = 0; r < ROWS; r++) { var row = document.createElement('div'); row.className = 'flow-row'; box.appendChild(row); rows.push(row); }
        items.forEach(function (el, i) { rows[i % ROWS].appendChild(el); });
        var baseDur = parseFloat(box.getAttribute('data-speed')) || 24;
        if (reduceMotion || window.innerWidth < 769) box.classList.add('static');
        else {
          var cw = box.clientWidth || 280;
          rows.forEach(function (row, i) {
            var g = row.scrollWidth, k = g ? Math.max(2, Math.min(8, Math.ceil(cw * 1.2 / g))) : 0;
            if (!k) return;
            for (j = 1, group = row.cloneNode(true); j < k; j++) row.appendChild(group.cloneNode(true));
            row.style.setProperty('--shift', (-100 / k) + '%');
            row.style.setProperty('--dur', (baseDur * k * (1 + 0.12 * i)).toFixed(1) + 's');
            row.style.setProperty('--delay', (-i * baseDur * 0.6) + 's');
          });
        }
      }
      box.addEventListener('click', function (e) {
        var el = e.target.closest ? e.target.closest('.tag-item') : null;
        if (el) { e.preventDefault(); location.href = el.getAttribute('href'); }
      }, false);
    }
    var sidebar = document.querySelector('.sidebar'), drawer = document.getElementById('sb-drawer');
    if (!sidebar || !drawer) return;
    var tabs = sidebar.querySelectorAll('.sb-tab'), open = false;
    var setPanel = function (name) { drawer.querySelectorAll('.sb-panel').forEach(function (p) { p.classList.toggle('active', p.id === name); }); tabs.forEach(function (t) { t.classList.toggle('active', t.getAttribute('data-panel') === name); }); };
    /* 抽屉与侧栏同高同顶,与侧栏留 16px 缝(右侧栏时贴其左,左侧栏时贴其右);主内容由 CSS 按 body.drawer-open 平移+3D 旋转让位 */
    var pos = function () {
      var s = sidebar.getBoundingClientRect(), GAP = 16;
      drawer.style.top = s.top + 'px'; drawer.style.bottom = 'auto';
      /* 移动端:改为下拉面板,贴头部下方垂落,上下各留 16px 缝隙(固定定位 top+bottom 保证底缝) */
      if (window.innerWidth < 769) {
        var hdr = document.querySelector('.site-header');
        drawer.style.top = ((hdr ? hdr.offsetHeight : 64) + 16) + 'px';
        drawer.style.bottom = '16px';
        drawer.style.left = '16px'; drawer.style.right = '16px';
        drawer.style.height = 'auto';
        return;
      }
      drawer.style.height = s.height + 'px';
      if (document.body.classList.contains('sidebar-left')) drawer.style.left = (s.right + GAP) + 'px';
      else drawer.style.right = (document.documentElement.clientWidth - s.left + GAP) + 'px';
    };
    var toggle = function (force) { open = force === undefined ? !open : force; drawer.classList.toggle('open', open); document.body.classList.toggle('drawer-open', open); if (open) pos(); else setPanel(''); };
    tabs.forEach(function (tab) { tab.addEventListener('click', function () { var name = tab.getAttribute('data-panel'); if (open && tab.classList.contains('active')) { toggle(false); return; } setPanel(name); toggle(true); }, false); });
    var close = drawer.querySelector('.sb-close');
    if (close) close.addEventListener('click', function () { toggle(false); }, false);
    window.addEventListener('scroll', function () { if (open) pos(); }, { passive: true });
    window.addEventListener('resize', function () { if (open) pos(); });
    pos(); /* 初始化隐藏位置:抽屉预先藏在侧栏背后,首次打开滑动不跳变 */
  }

  /* ---- mobile nav ---- */
  function initMobileNav() {
    var btn = document.getElementById('nav-toggle');
    var menu = document.querySelector('.header-menu');
    if (!btn || !menu) return;
    btn.addEventListener('click', function () {
      menu.classList.toggle('open');
      btn.classList.toggle('active');
    }, false);
  }

  /* ---- toc scroll spy ---- */
  function initTocScroll() {
    if (!cfg.isPost) return;
    var links = document.querySelectorAll('.toc a');
    if (!links.length) return;
    var headings = [];
    links.forEach(function (a) {
      var id = decodeURIComponent((a.getAttribute('href') || '').replace('#', ''));
      if (id) headings.push(document.getElementById(id));
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.id;
        links.forEach(function (a) {
          var cls = a.getAttribute('href') === '#' + id;
          a.classList.toggle('active', cls);
        });
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    headings.forEach(function (h) { if (h) io.observe(h); });
  }
  initTilt();
  initReveal();
  initScrollUI();
  initSidebar();
  initSocialToggle();
  initReward();
  initMobileNav();
  initTocScroll();
})();
