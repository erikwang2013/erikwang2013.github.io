/* Erik 3D theme - three.js effects */
'use strict';

(function () {
  var cfg = window.ERIK || {};
  var root = cfg.root || '/';
  var threeCfg = cfg.three || {};
  var tiltCfg = cfg.tilt || {};
  var styleCfg = cfg.style || {};
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- theme colors from config ---- */
  function applyThemeColors() {
    var r = document.documentElement;
    var c = styleCfg || {};
    var light = c.mode === 'light' ||
      (c.mode === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);
    if (light) r.classList.add('erik-light');
    /* 亮色主题由样式表 .erik-light 提供变量,内联暗色值会覆盖它 */
    if (light) return;
    var map = {
      '--primary': c.primary,
      '--secondary': c.secondary,
      '--accent': c.accent,
      '--bg-top': c.bgTop,
      '--bg-bottom': c.bgBottom
    };
    for (var k in map) {
      if (map[k]) r.style.setProperty(k, map[k]);
    }
  }

  /* ---- three.js starfield + floating emoji ---- */
  function initThree() {
    var canvas = document.getElementById('bg3d');
    if (!canvas || reduceMotion) return;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 300);
    camera.position.z = 55;

    /* stars */
    var count = threeCfg.enable === false ? 0 : Math.max(600, Math.floor((threeCfg.particleCount || 2600) * Math.min(window.innerWidth, 1600) / 1600));
    var geo = new THREE.BufferGeometry();
    var pos = new Float32Array(count * 3);
    var col = new Float32Array(count * 3);
    var palette = threeCfg.particleColors || ['#a78bfa', '#22d3ee', '#f472b6', '#fbbf24'];
    var paletteRGB = palette.map(hexToRGB);

    for (var i = 0; i < count; i++) {
      var r = Math.cbrt(Math.random()) * 90;
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      var c = paletteRGB[Math.floor(Math.random() * paletteRGB.length)];
      col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    var mat = new THREE.PointsMaterial({
      size: 0.55,
      vertexColors: true,
      transparent: true,
      opacity: typeof threeCfg.opacity === 'number' ? threeCfg.opacity : 0.55,
      depthWrite: false
    });
    var stars = new THREE.Points(geo, mat);
    scene.add(stars);

    /* floating emoji sprites */
    var emojis = threeCfg.emoji && threeCfg.emoji.length ? threeCfg.emoji : ['🛸', '🚀', '🔮', '⚡',  '🌈', '🪄', '💎', '🧪', '✨'];
    var spriteGroup = new THREE.Group();
    var n = Math.min(threeCfg.emojiCount || 14, 20);
    var sprites = [];
    for (var j = 0; j < n; j++) {
      var tex = makeEmojiTexture(emojis[j % emojis.length]);
      var smat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
      var sprite = new THREE.Sprite(smat);
      var scale = 2 + Math.random() * 4;
      sprite.scale.set(scale, scale, 1);
      sprite.position.set(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 50,
        -30 - Math.random() * 40
      );
      spriteGroup.add(sprite);
      sprites.push({ sprite: sprite, speed: 0.4 + Math.random() * 0.8, phase: Math.random() * Math.PI * 2 });
    }
    scene.add(spriteGroup);

    /* mouse parallax */
    var mouse = { x: 0, y: 0 };
    document.addEventListener('mousemove', function (e) {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    }, false);

    var clock = new THREE.Clock();
    var scrollRotate = threeCfg.scrollRotate !== false;

    function animate() {
      requestAnimationFrame(animate);
      var t = clock.getElapsedTime();
      stars.rotation.y = t * 0.02;
      stars.rotation.x = Math.sin(t * 0.03) * 0.05;

      for (var k = 0; k < sprites.length; k++) {
        sprites[k].sprite.position.y += Math.sin(t * sprites[k].speed + sprites[k].phase) * 0.008;
      }
      spriteGroup.rotation.y = t * 0.01;

      if (threeCfg.parallax !== false) {
        camera.position.x += (mouse.x * 7 - camera.position.x) * 0.04;
        camera.position.y += (mouse.y * 5 - camera.position.y) * 0.04;
        camera.lookAt(0, 0, 0);
      }

      if (scrollRotate) {
        var scrollY = window.pageYOffset || document.documentElement.scrollTop;
        stars.rotation.z += (scrollY * 0.00006 - stars.rotation.z) * 0.05;
      }

      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }, false);
  }

  function hexToRGB(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }

  function makeEmojiTexture(emoji) {
    var size = 128;
    var c = document.createElement('canvas');
    c.width = size; c.height = size;
    var ctx = c.getContext('2d');
    ctx.font = '84px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, size / 2, size / 2 + 6);
    var tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

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
      /* 均分到多行,每行内容复制 k 份做无缝左右滚动 */
      var ROWS = Math.max(3, Math.min(6, Math.ceil(n / 8))), rows = [], r, j, group;
      for (r = 0; r < ROWS; r++) { var row = document.createElement('div'); row.className = 'flow-row'; box.appendChild(row); rows.push(row); }
      items.forEach(function (el, i) { rows[i % ROWS].appendChild(el); });
      var baseDur = parseFloat(box.getAttribute('data-speed')) || 24;
      if (reduceMotion) box.classList.add('static');
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

  /* ---- 音乐播放器 (原生,底部悬浮) ---- */
  function initPlayer() {
    var audio = document.getElementById('player-audio');
    var box = document.getElementById('player-box');
    if (!audio || !box) return;
    var pc = cfg.player || {};
    var list = pc.list || [];
    if (!list.length) return;

    var idx = 0;
    var els = {
      mode: document.getElementById('player-mode'),
      play: document.getElementById('player-play'),
      prev: document.getElementById('player-prev'),
      next: document.getElementById('player-next'),
      title: document.getElementById('player-title'),
      artist: document.getElementById('player-artist'),
      cover: document.getElementById('player-cover'),
      bar: document.getElementById('player-progress'),
      time: document.getElementById('player-time'),
      vol: document.getElementById('player-volume'),
      lyricBtn: document.getElementById('player-lyric'),
      listBtn: document.getElementById('player-list-btn'),
      listPanel: document.getElementById('player-list-panel'),
      lyricPanel: document.getElementById('player-lyric-panel'),
      lyricInner: document.getElementById('player-lyric-inner'),
      plist: document.getElementById('player-plist')
    };

    // 音量：localStorage 记忆
    if (els.vol) {
      var vol = parseInt(localStorage.getItem('erik-player-vol'), 10);
      if (isNaN(vol)) vol = 80;
      audio.volume = vol / 100;
      els.vol.value = vol;
      els.vol.addEventListener('input', function () {
        audio.volume = els.vol.value / 100;
        localStorage.setItem('erik-player-vol', els.vol.value);
      });
    }

    function loadTrack(i, resumePos) {
      idx = (i + list.length) % list.length;
      var t = list[idx];
      pendingResume = !!resumePos;
      seekTarget = -1;
      audio.src = root.replace(/\/$/, '') + (t.url || '');
      if (els.cover) els.cover.src = root.replace(/\/$/, '') + (t.cover || '/img/timg.jpeg');
      if (els.title) els.title.textContent = t.name || '';
      if (els.artist) els.artist.textContent = t.artist || '';
      if (els.bar) els.bar.value = '0';
      if (els.time) els.time.textContent = '00:00 / 00:00';
      // 渲染播放列表
      if (els.plist) {
        els.plist.innerHTML = list.map(function (t, i) {
          return '<li class="pl-item' + (i === idx ? ' active' : '') + '" data-i="' + i + '">' +
            '<span class="pl-name">' + esc(t.name) + '</span><span class="pl-artist">' + esc(t.artist || '') + '</span></li>';
        }).join('');
      }
      // 歌词加载：list[].lrc 配置时解析 [mm:ss.xx]
      loadLyric(list[idx].lrc);
    }

    function fmt(s) {
      s = Math.floor(s || 0);
      var m = Math.floor(s / 60), r = s % 60;
      return (m < 10 ? '0' + m : m) + ':' + (r < 10 ? '0' + r : r);
    }

    function updateUI() {
      var playing = !audio.paused && !audio.ended;
      if (els.play) els.play.classList.toggle('playing', playing);
      box.classList.toggle('playing', playing);
    }

    function play() {
      audio.play().then(updateUI).catch(function () { updateUI(); });
    }

    /* 播放模式：顺序播放 / 列表循环 / 单曲循环 / 随机播放（localStorage 记忆，默认取配置 loop） */
    var MODES = ['off', 'all', 'one', 'shuffle'];
    var MODE_LABEL = { off: '顺序播放', all: '列表循环', one: '单曲循环', shuffle: '随机播放' };
    var mode = localStorage.getItem('erik-player-mode');
    if (MODES.indexOf(mode) < 0) mode = pc.loop || 'all';
    if (MODES.indexOf(mode) < 0) mode = 'all';
    function updateModeUI() {
      if (!els.mode) return;
      els.mode.dataset.mode = mode;
      els.mode.title = '播放模式：' + MODE_LABEL[mode] + '（点击切换）';
    }
    if (els.mode) {
      els.mode.addEventListener('click', function () {
        mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
        localStorage.setItem('erik-player-mode', mode);
        updateModeUI();
      }, false);
    }
    updateModeUI();

    function nextTrack() {
      if (mode === 'shuffle' && list.length > 1) {
        var r = idx;
        while (r === idx) r = Math.floor(Math.random() * list.length);
        loadTrack(r);
      } else {
        loadTrack(idx + 1);
      }
      play();
    }

    var mini = document.getElementById('player-mini');
    var collapse = document.getElementById('player-collapse');
    if (mini) mini.addEventListener('click', function () { box.classList.remove('collapsed'); }, false);
    if (collapse) collapse.addEventListener('click', function () { box.classList.add('collapsed'); }, false);

    // 播放列表点击切歌
    if (els.listBtn && els.plist) {
      els.listBtn.addEventListener('click', function () { togglePanel(els.listPanel); });
      els.plist.addEventListener('click', function (e) {
        var li = e.target.closest('.pl-item');
        if (!li) return;
        idx = parseInt(li.dataset.i, 10);
        loadTrack(idx);
        togglePanel(els.listPanel, true);
      });
    }
    function togglePanel(panel, forceClose) {
      if (!panel) return;
      var willShow = forceClose ? false : panel.hidden;
      if (willShow) {
        if (els.listPanel && els.listPanel !== panel) els.listPanel.hidden = true;
        if (els.lyricPanel && els.lyricPanel !== panel) els.lyricPanel.hidden = true;
      }
      panel.hidden = !willShow;
    }

    var lyricData = [];
    function esc(s) {
      return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function loadLyric(lrcPath) {
      lyricData = [];
      /* 歌词入口按钮已移除时不再加载歌词 */
      if (!els.lyricBtn) return;
      if (els.lyricBtn) els.lyricBtn.hidden = !lrcPath;
      if (!lrcPath) return;
      fetch(lrcPath).then(function (r) { return r.text(); }).then(function (txt) {
        var re = /\[(\d+):(\d+(?:\.\d+)?)\](.*)/g;
        var m;
        while ((m = re.exec(txt))) {
          var t = parseInt(m[1], 10) * 60 + parseFloat(m[2]);
          lyricData.push({ t: t, text: m[3].trim() });
        }
        lyricData.sort(function (a, b) { return a.t - b.t; });
        if (els.lyricInner) {
          els.lyricInner.innerHTML = lyricData.map(function (l) {
            return '<p class="lyric-line">' + esc(l.text) + '</p>';
          }).join('');
        }
        updateLyric(audio.currentTime);
      }).catch(function () { if (els.lyricBtn) els.lyricBtn.hidden = true; });
    }
    function updateLyric(time) {
      if (!lyricData.length || !els.lyricInner) return;
      var idx2 = 0;
      for (var i = 0; i < lyricData.length; i++) {
        if (lyricData[i].t <= time) idx2 = i; else break;
      }
      var lines = els.lyricInner.querySelectorAll('.lyric-line');
      for (var j = 0; j < lines.length; j++) {
        lines[j].classList.toggle('active', j === idx2);
      }
      if (lines[idx2] && lines[idx2].scrollIntoView) {
        lines[idx2].scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
    if (els.lyricBtn) {
      els.lyricBtn.addEventListener('click', function () { togglePanel(els.lyricPanel); });
    }

    els.play.addEventListener('click', function () {
      if (audio.paused) play(); else audio.pause();
      updateUI();
    }, false);
    els.prev.addEventListener('click', function () { loadTrack(idx - 1); play(); }, false);
    els.next.addEventListener('click', nextTrack, false);

    /* 进度条：播放时同步，拖动即时跳转；拖动中或目标位置未到达（seek 失败/未缓冲）时，不把进度条拉回当前播放位置，避免拖动被弹回 */
    /* duration 不可用（NaN/Infinity，如无 Range 支持的服务大文件元数据未就绪）时退化为 seekable 估算；仍拿不到则至少显示已播放时间 */
    var barDragging = false, seekTarget = -1;
    function getDuration() {
      var d = audio.duration;
      if (d && isFinite(d)) return d;
      if (audio.seekable && audio.seekable.length) {
        var end = audio.seekable.end(audio.seekable.length - 1);
        if (isFinite(end) && end > 0) return end;
      }
      return 0;
    }
    function refreshBar() {
      var d = getDuration();
      if (seekTarget >= 0 && !barDragging && Math.abs(audio.currentTime - seekTarget) < 0.5) seekTarget = -1;
      if (d > 0) {
        if (els.bar) {
          els.bar.max = String(d);
          if (!barDragging && seekTarget < 0) els.bar.value = String(audio.currentTime || 0);
        }
        if (els.time) els.time.textContent = fmt(seekTarget >= 0 ? seekTarget : audio.currentTime) + ' / ' + fmt(d);
      } else {
        if (els.bar) { els.bar.max = '0'; els.bar.value = '0'; }
        if (els.time) els.time.textContent = fmt(audio.currentTime);
      }
    }
    audio.addEventListener('seeked', function () {
      if (seekTarget >= 0 && Math.abs(audio.currentTime - seekTarget) < 0.5) seekTarget = -1;
      if (seekTarget >= 0 && els.bar) els.bar.value = String(seekTarget);
      refreshBar();
    }, false);
    audio.addEventListener('timeupdate', function () {
      refreshBar();
      updateLyric(audio.currentTime);
      var now = Date.now();
      if (now - lastSave > 1000) { lastSave = now; saveState(); }
    }, false);
    audio.addEventListener('durationchange', refreshBar, false);
    function canSeek(t) {
      var ranges = audio.seekable;
      if (ranges && ranges.length) {
        for (var i = 0; i < ranges.length; i++) {
          if (t >= ranges.start(i) && t <= ranges.end(i)) return true;
        }
      }
      ranges = audio.buffered;
      if (ranges && ranges.length) {
        for (var j = 0; j < ranges.length; j++) {
          if (t >= ranges.start(j) && t <= ranges.end(j)) return true;
        }
      }
      return false;
    }
    function commitSeek() {
      if (seekTarget < 0) return;
      if (canSeek(seekTarget)) audio.currentTime = seekTarget;
      refreshBar();
    }
    audio.addEventListener('progress', function () {
      refreshBar();
      if (seekTarget >= 0 && canSeek(seekTarget)) audio.currentTime = seekTarget;
    }, false);
    if (els.bar) {
      els.bar.addEventListener('pointerdown', function () { barDragging = true; }, true);
      els.bar.addEventListener('pointerup', function () { barDragging = false; commitSeek(); }, true);
      els.bar.addEventListener('pointercancel', function () { barDragging = false; commitSeek(); }, true);
      els.bar.addEventListener('input', function () {
        var t = parseFloat(els.bar.value) || 0;
        seekTarget = t;
        if (canSeek(t)) audio.currentTime = t;
        if (els.time) els.time.textContent = fmt(t) + ' / ' + fmt(getDuration());
      }, false);
    }
    audio.addEventListener('ended', function () {
      if (mode === 'one') { loadTrack(idx); play(); }
      else if (mode === 'off') updateUI();
      else nextTrack();
    }, false);
    audio.addEventListener('play', updateUI, false);
    audio.addEventListener('pause', updateUI, false);

    /* 跨页面保持歌曲与进度 */
    var lastSave = 0, restoring = true;
    setTimeout(function () { restoring = false; }, 1500);
    function saveState() {
      if (restoring) return;
      try {
        localStorage.setItem('erik-player', JSON.stringify({ idx: idx, t: audio.currentTime || 0, playing: !audio.paused && !audio.ended }));
      } catch (e) {}
    }
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem('erik-player') || 'null'); } catch (e) {}
    var resumeT = saved && saved.t ? saved.t : 0;
    var hasSavedTrack = saved && typeof saved.idx === 'number';
    var pendingResume = false;
    loadTrack(hasSavedTrack ? saved.idx : 0, hasSavedTrack);
    audio.addEventListener('loadedmetadata', function () {
      if (pendingResume) {
        pendingResume = false;
        var d0 = getDuration();
        if (resumeT) audio.currentTime = Math.min(resumeT, d0 || resumeT);
      }
      refreshBar();
    }, false);
    audio.addEventListener('play', saveState, false);
    audio.addEventListener('pause', saveState, false);
    if (saved && saved.playing) play();
    else if (pc.autoplay) play();
  }

  /* ---- boot ---- */
  applyThemeColors();

  if (window.THREE) {
    try { initThree(); }
    catch (e) { document.body.classList.add('no-webgl'); }
  } else {
    document.body.classList.add('no-webgl');
  }

  initTilt();
  initReveal();
  initScrollUI();
  initSidebar();
  initSocialToggle();
  initReward();
  initMobileNav();
  initTocScroll();
  initPlayer();
})();
