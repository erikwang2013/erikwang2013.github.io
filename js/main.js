/* Erik 3D theme - three.js effects */
'use strict';

(function () {
  var cfg = window.ERIK || {};
  var root = cfg.root || '/';
  var threeCfg = cfg.three || {};
  var tiltCfg = cfg.tilt || {};
  var styleCfg = cfg.style || {};
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 画质档位:按设备自动判定,three.tier 可强制 high/mid/low ----
     low 档(或省流量模式)不下载 three.js,直接回落到 CSS 静态背景 */
  var QUALITY = {
    high: { dpr: 2, particles: 1, emoji: 1, planets: 1 },
    mid: { dpr: 1.5, particles: 0.55, emoji: 0.6, planets: 0.6 },
    low: { dpr: 1, particles: 0.3, emoji: 0.34, planets: 0.4 }
  };
  function pickTier() {
    var forced = threeCfg.tier;
    if (forced === 'high' || forced === 'mid' || forced === 'low') return forced;
    /* 用户在回落提示里点过"开启完整 3D":从 mid 起步,帧率不够仍会自动降档 */
    try { if (localStorage.getItem('erik-full3d') === '1') return 'mid'; } catch (e) {}
    var nav = navigator, conn = nav.connection || {};
    if (conn.saveData) return 'low';
    if (window.innerWidth < 768 || (nav.deviceMemory || 4) <= 4 || (nav.hardwareConcurrency || 4) <= 4) return 'mid';
    return 'high';
  }
  var tierName = pickTier();
  var autoTier = !threeCfg.tier || threeCfg.tier === 'auto';
  var sceneCfg = threeCfg.scenes || {};

  /* ---- 节日联动:命中当天给背景加料(emoji 塞进 3D,飘落物交给 feats.js) ----
     three.holiday: false 关闭 / 'auto' 或不填按日期判定 / 也可填节日名强制预览 */
  var FESTIVALS = {
    '1-1': { key: 'newyear', emoji: ['🎊', '🎆', '🥂'], flakes: 'confetti' },
    '2-14': { key: 'valentine', emoji: ['💘', '🌹', '💝'], flakes: null },
    '5-1': { key: 'mayday', emoji: ['🎈', '🎉'], flakes: null },
    '6-1': { key: 'children', emoji: ['🍭', '🧸', '🎠'], flakes: null },
    '10-1': { key: 'national', emoji: ['🎉', '🎆', '🎈'], flakes: 'confetti' },
    '10-31': { key: 'halloween', emoji: ['🎃', '👻', '🕷️'], flakes: null },
    '12-24': { key: 'christmas', emoji: ['🎄', '🎅', '❄️'], flakes: 'snow' },
    '12-25': { key: 'christmas', emoji: ['🎄', '🎅', '❄️'], flakes: 'snow' }
  };
  var holiday = (function () {
    var c = threeCfg.holiday, byName = {};
    if (c === false) return null;
    if (typeof c === 'string' && c !== 'auto') {
      for (var k in FESTIVALS) byName[FESTIVALS[k].key] = FESTIVALS[k];
      return byName[c] || { key: c, emoji: [], flakes: null };
    }
    var d = new Date();
    return FESTIVALS[(d.getMonth() + 1) + '-' + d.getDate()] || null;
  })();
  if (holiday) {
    window.erikHoliday = holiday;
    document.body.classList.add('holiday-' + holiday.key);
    if (holiday.emoji.length) threeCfg.emoji = holiday.emoji.concat(threeCfg.emoji || []);
  }

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

  /* ---- 归档页:时光隧道(一条光环 = 一条归档,随滚动推向相机,当前条目高亮) ---- */
  function makeTunnel(scene, nodes, palette, camera) {
    var SPACING = 16, offset = 0, tick = 0, active = 0, rings = [];
    var group = new THREE.Group();
    nodes.forEach(function (node, i) {
      var radius = 18 + (i % 4) * 2.5;
      var pts = new Float32Array(73 * 3);
      for (var a = 0; a <= 72; a++) {
        var th = a / 72 * Math.PI * 2;
        pts[a * 3] = Math.cos(th) * radius;
        pts[a * 3 + 1] = Math.sin(th) * radius;
        pts[a * 3 + 2] = 0;
      }
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
      var mat = new THREE.LineBasicMaterial({ color: palette[i % palette.length], transparent: true, opacity: 0.18 });
      var line = new THREE.Line(geo, mat);
      line.position.z = -i * SPACING;
      group.add(line);
      rings.push(mat);
    });
    scene.add(group);
    var fit = function (camera) {
      /* 窄屏按比例缩,免得外面几条轨道跑出画面 */
      group.scale.setScalar(Math.min(1, 0.55 + camera.aspect * 0.28));
    };
    fit(camera);

    return {
      group: group,
      fit: fit,
      update: function (t) {
        /* 每 6 帧量一次 DOM,避免每帧强制重排 */
        if (tick++ % 6 === 0) {
          var mid = window.innerHeight * 0.45;
          active = 0;
          for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].getBoundingClientRect().top <= mid) active = i;
          }
        }
        offset += (active * SPACING - offset) * 0.05;
        group.position.z = offset;
        group.rotation.z = t * 0.04;
        for (var j = 0; j < rings.length; j++) {
          var want = Math.abs(j * SPACING - offset) < SPACING * 0.5 ? 0.7 : 0.16;
          rings[j].opacity += (want - rings[j].opacity) * 0.08;
        }
      }
    };
  }

  /* 文字贴图:分类名/标签挂到 3D 上(画布画字,精灵永远面向相机) */
  function makeLabelSprite(text, color) {
    var fs = 44, pad = 10;
    var c = document.createElement('canvas');
    var ctx = c.getContext('2d');
    ctx.font = 'bold ' + fs + 'px sans-serif';
    c.width = Math.ceil(ctx.measureText(text).width) + pad * 2;
    c.height = fs + pad * 2;
    ctx = c.getContext('2d');
    ctx.font = 'bold ' + fs + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(text, c.width / 2, c.height / 2);
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, opacity: 0.9
    }));
    sp.scale.set(2 * c.width / c.height, 2, 1);
    return sp;
  }

  /* ---- 分类页:轨道图(中心恒星 + 一个分类一条倾斜轨道,行星上挂分类名) ---- */
  function makeOrbit(scene, nodes, palette, glowTex, camera) {
    var group = new THREE.Group();
    group.position.z = -26;
    scene.add(group);

    group.add(new THREE.Mesh(new THREE.SphereGeometry(2.2, 24, 24), new THREE.MeshBasicMaterial({ color: '#fbbf24' })));
    if (glowTex) {
      var hs = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex, color: '#fbbf24', transparent: true,
        opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false
      }));
      hs.scale.set(16, 16, 1);
      group.add(hs);
    }

    var max = Math.min(nodes.length, window.innerWidth < 769 ? 5 : 8), orb = [];
    for (var i = 0; i < max; i++) {
      var el = nodes[i].querySelector('.cat-title a') || nodes[i];
      var name = (el.textContent || '').trim().slice(0, 10);
      var color = palette[i % palette.length];
      var rad = 9 + i * 3.6;

      var pts = [];
      for (var a = 0; a <= 72; a++) {
        var th = a / 72 * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(th) * rad, 0, Math.sin(th) * rad));
      }
      var tilt = new THREE.Group();
      tilt.rotation.x = (i % 2 ? -1 : 1) * (0.3 + i * 0.05);
      tilt.rotation.z = i * 0.2;
      tilt.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.18 })
      ));

      var body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16), new THREE.MeshBasicMaterial({ color: color }));
      if (name) {
        var label = makeLabelSprite(name, color);
        label.position.y = 1.5;
        body.add(label);
      }
      tilt.add(body);
      group.add(tilt);
      orb.push({ body: body, rad: rad, ang: Math.random() * Math.PI * 2, speed: 0.1 + Math.random() * 0.1 });
    }

    var fit = function (camera) {
      /* 窄屏按比例缩,免得外面几条轨道跑出画面 */
      group.scale.setScalar(Math.min(1, 0.55 + camera.aspect * 0.28));
    };
    fit(camera);

    return {
      group: group,
      fit: fit,
      update: function (t) {
        for (var i = 0; i < orb.length; i++) {
          var o = orb[i], a = o.ang + t * o.speed;
          o.body.position.set(Math.cos(a) * o.rad, 0, Math.sin(a) * o.rad);
          o.body.rotation.y += 0.01;
        }
      }
    };
  }

  /* ---- 播放器:底部声波频谱(单次 draw call;AnalyserNode 只在播放时取值) ---- */
  function makeSpectrum(scene, palette) {
    var N = 48;
    var pos = new Float32Array(N * 3), level = new Float32Array(N), col = new Float32Array(N * 3), baseY = new Float32Array(N);
    for (var i = 0; i < N; i++) {
      var k = i / (N - 1) - 0.5;
      baseY[i] = -36 + Math.abs(k) * 2; /* 贴着画面底边;仍留一点弧,避免像一条直线 */
      pos[i * 3] = k * 118;
      pos[i * 3 + 1] = baseY[i];
      pos[i * 3 + 2] = -18;
      var c = hexToRGB(palette[i % palette.length]);
      col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aLevel', new THREE.BufferAttribute(level, 1));
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    /* 尺寸按世界单位算:cs 为透视系数(像素/世界单位),否则点数会大到糊成一片 */
    var mat = new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 1 } },
      vertexShader: 'attribute float aLevel;attribute vec3 aColor;uniform float uScale;varying float vL;varying vec3 vC;' +
        'void main(){vL=aLevel;vC=aColor;vec4 mv=modelViewMatrix*vec4(position,1.0);' +
        'gl_PointSize=(0.45+aLevel*1.4)*uScale/-mv.z;gl_Position=projectionMatrix*mv;}',
      fragmentShader: 'varying float vL;varying vec3 vC;' +
        'void main(){float d=length(gl_PointCoord-vec2(0.5));if(d>0.5)discard;' +
        'float a=smoothstep(0.5,0.0,d)*(0.3+vL*0.8);gl_FragColor=vec4(vC,a);}',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    var points = new THREE.Points(geo, mat);
    points.visible = false;
    scene.add(points);

    var analyser = null, bins = null, audioCtx = null, audio = document.getElementById('player-audio');
    function ensure() {
      if (analyser) return true;
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx || !audio) return false;
      try {
        audioCtx = new Ctx();
        var src = audioCtx.createMediaElementSource(audio); /* 只建一次,仍接回 destination 保证有声 */
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        bins = new Uint8Array(analyser.frequencyBinCount);
        src.connect(analyser);
        analyser.connect(audioCtx.destination);
      } catch (e) { analyser = null; audioCtx = null; return false; }
      return true;
    }
    if (audio) {
      audio.addEventListener('play', function () { if (ensure()) { points.visible = true; } }, false);
      audio.addEventListener('pause', function () { points.visible = false; }, false);
      audio.addEventListener('ended', function () { points.visible = false; }, false);
      /* Safari 需在手势内 resume,首次点按时补一次;失败也只是频谱不动,不影响放音 */
      document.addEventListener('pointerdown', function () {
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      }, false);
    }
    return {
      points: points,
      mat: mat,
      update: function () {
        if (!points.visible || !analyser) return 0;
        analyser.getByteFrequencyData(bins);
        var arr = geo.attributes.aLevel.array, p = geo.attributes.position.array;
        for (var i = 0; i < N; i++) {
          var v = bins[Math.floor(i / N * 40)] / 255;
          arr[i] = v;
          p[i * 3 + 1] = baseY[i] + v * 5; /* 柱条随音量立起来 */
        }
        geo.attributes.aLevel.needsUpdate = true;
        geo.attributes.position.needsUpdate = true;
        var bass = 0; /* 只取低频段驱动星空脉冲,中高频跟着抖会显得很吵 */
        for (var b = 1; b <= 8; b++) bass += bins[b] / 255;
        return bass / 8;
      }
    };
  }

  /* ---- three.js starfield + floating emoji ---- */
  function initThree() {
    var canvas = document.getElementById('bg3d');
    if (!canvas || reduceMotion) return;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, (QUALITY[tierName] || QUALITY.high).dpr));
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
      map: makeCircleTexture(),
      vertexColors: true,
      transparent: true,
      alphaTest: 0.1,
      opacity: typeof threeCfg.opacity === 'number' ? threeCfg.opacity : 0.55,
      depthWrite: false
    });
    var stars = new THREE.Points(geo, mat);
    scene.add(stars);
    var starBaseSize = mat.size, starBaseOpacity = mat.opacity;
    var glowTex = threeCfg.glow === false ? null : makeGlowTexture();

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
      /* 隔一个 emoji 给它垫一层辉光 */
      if (glowTex && j % 2 === 0) {
        var egm = new THREE.SpriteMaterial({
          map: glowTex, color: palette[j % palette.length], transparent: true,
          opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false
        });
        var egs = new THREE.Sprite(egm);
        egs.scale.set(2.6, 2.6, 1); /* 挂在 emoji 下,世界尺寸 = 父级 scale × 2.6 */
        sprite.add(egs);
      }
    }
    scene.add(spriteGroup);

    /* planets (sphere + optional ring) */
    var planets = [];
    for (var p = 0; p < 5; p++) {
      var pg = new THREE.Group();
      var pcol = palette[p % palette.length];
      pg.add(new THREE.Mesh(
        new THREE.SphereGeometry(1, 24, 24),
        new THREE.MeshBasicMaterial({ color: pcol, transparent: true, opacity: 0.85 })
      ));
      if (p % 2 === 0) {
        pg.add(new THREE.Mesh(
          new THREE.RingGeometry(1.5, 2.1, 48),
          new THREE.MeshBasicMaterial({ color: pcol, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
        ));
        pg.children[1].rotation.x = Math.PI / 2.3;
        pg.children[1].rotation.y = 0.5;
      }
      if (glowTex) {
        var pgm = new THREE.SpriteMaterial({
          map: glowTex, color: pcol, transparent: true,
          opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false
        });
        var pgs = new THREE.Sprite(pgm);
        pgs.scale.set(7, 7, 1);
        pg.add(pgs);
      }
      var ps = 0.8 + Math.random() * 1.6;
      pg.scale.set(ps, ps, ps);
      pg.position.set(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 45,
        -20 - Math.random() * 50
      );
      scene.add(pg);
      planets.push({ g: pg, speed: 0.1 + Math.random() * 0.2, phase: Math.random() * Math.PI * 2 });
    }

    /* mouse parallax */
    var mouse = { x: 0, y: 0 };
    document.addEventListener('mousemove', function (e) {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    }, false);

    /* 陀螺仪:手机靠设备倾斜做视差;iOS 13+ 要在手势里申请权限,不给就算了 */
    if (threeCfg.gyro !== false && 'ontouchstart' in window && window.DeviceOrientationEvent) {
      var onOrient = function (e) {
        if (e.gamma === null && e.beta === null) return;
        mouse.x = Math.max(-1, Math.min(1, (e.gamma || 0) / 35));
        mouse.y = Math.max(-1, Math.min(1, ((e.beta || 0) - 45) / 35));
      };
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        document.addEventListener('pointerdown', function () {
          DeviceOrientationEvent.requestPermission().then(function (s) {
            if (s === 'granted') window.addEventListener('deviceorientation', onOrient, true);
          }).catch(function () {});
        }, { once: true });
      } else window.addEventListener('deviceorientation', onOrient, true);
    }

    /* 鼠标重力:星空被光标吸过去,同时被"原位"弹簧拉回。
       CPU 端逐点算(2600 点约 0.1ms),真 GPGPU 要重写整条粒子管线,对这个量级不值 */
    var gravity = threeCfg.gravity !== false && tierName === 'high' && count > 0;
    var home = gravity ? pos.slice(0) : null;
    var vel = gravity ? new Float32Array(count * 3) : null;

    /* 真 Bloom(可选,默认关):r128 的后处理文件在 vendor/postprocessing 下,按需加载 */
    var bloomCfg = threeCfg.bloom || {};
    var composer = null, bloomPass = null;
    if (bloomCfg.enable === true && tierName === 'high' && window.THREE.EffectComposer) {
      try {
        composer = new THREE.EffectComposer(renderer);
        composer.addPass(new THREE.RenderPass(scene, camera));
        bloomPass = new THREE.UnrealBloomPass(
          new THREE.Vector2(window.innerWidth, window.innerHeight),
          bloomCfg.strength || 0.6, bloomCfg.radius || 0.5, bloomCfg.threshold || 0.65
        );
        composer.addPass(bloomPass);
        /* 走离屏合成后画布不再透明(CSS 渐变透不过来),把同一份背景渐变画进场景补上 */
        var cs = getComputedStyle(document.documentElement);
        var bc = document.createElement('canvas');
        bc.width = 2; bc.height = 256;
        var bx = bc.getContext('2d');
        var bg = bx.createLinearGradient(0, 0, 2, 256);
        bg.addColorStop(0, (cs.getPropertyValue('--bg-top') || '#0f0c29').trim());
        bg.addColorStop(1, (cs.getPropertyValue('--bg-bottom') || '#302b63').trim());
        bx.fillStyle = bg;
        bx.fillRect(0, 0, 2, 256);
        var bgPlane = new THREE.Mesh(
          new THREE.PlaneGeometry(400, 240),
          new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(bc), depthWrite: false })
        );
        bgPlane.position.z = -140;
        bgPlane.renderOrder = -1;
        scene.add(bgPlane);
      } catch (e) { composer = null; bloomPass = null; }
    }

    /* ---- 逐页场景:归档页时光隧道 / 播放器频谱 ---- */
    /* 一环一条归档,上限 12 条以兜住 draw call;年份分组页则一环一年 */
    var tunnelNodes = [].slice.call(document.querySelectorAll('.archive-item'));
    if (tunnelNodes.length < 2) tunnelNodes = [].slice.call(document.querySelectorAll('.archives-year'));
    tunnelNodes = tunnelNodes.slice(0, 12);
    var tunnel = (tunnelNodes.length > 1 && sceneCfg.tunnel !== false) ? makeTunnel(scene, tunnelNodes, palette, camera) : null;
    var spectrum = sceneCfg.spectrum !== false ? makeSpectrum(scene, palette) : null;
    var catNodes = [].slice.call(document.querySelectorAll('.cat-block'));
    var orbit = (catNodes.length > 1 && sceneCfg.orbit !== false) ? makeOrbit(scene, catNodes, palette, glowTex, camera) : null;

    var clock = new THREE.Clock();
    var scrollRotate = threeCfg.scrollRotate !== false;
    var running = true, frames = 0, fpsT0 = 0, sampled = !autoTier;

    /* 档位落地:只调分辨率与数量,不重建场景 */
    function applyQuality(name) {
      var qual = QUALITY[name] || QUALITY.high;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, qual.dpr));
      renderer.setSize(window.innerWidth, window.innerHeight);
      geo.setDrawRange(0, Math.max(600, Math.round(count * qual.particles)));
      sprites.forEach(function (s, i) { s.sprite.visible = i < Math.round(n * qual.emoji); });
      planets.forEach(function (pl, i) { pl.g.visible = i < Math.round(planets.length * qual.planets); });
      if (tunnel) tunnel.group.visible = name !== 'low';
      if (orbit) orbit.group.visible = name !== 'low';
      if (spectrum && name === 'low') spectrum.points.visible = false;
      tierName = name;
      if (window.erik3d) window.erik3d.tier = name;
    }
    applyQuality(tierName);

    /* 频谱点大小 = 世界单位 × 透视系数(随分辨率/DPR 变);横向按住视口比例铺满 */
    function spectrumScale() {
      if (!spectrum) return;
      spectrum.mat.uniforms.uScale.value = window.innerHeight * renderer.getPixelRatio() * 0.866;
      spectrum.points.scale.x = Math.min(1.2, camera.aspect * 0.614);
    }
    spectrumScale();

    function animate() {
      if (!running) return;
      requestAnimationFrame(animate);
      var t = clock.getElapsedTime();
      frames++;
      stars.rotation.y = t * 0.02;
      stars.rotation.x = Math.sin(t * 0.03) * 0.05;

      for (var k = 0; k < sprites.length; k++) {
        if (!sprites[k].sprite.visible) continue;
        sprites[k].sprite.position.y += Math.sin(t * sprites[k].speed + sprites[k].phase) * 0.008;
      }
      spriteGroup.rotation.y = t * 0.01;

      for (var q = 0; q < planets.length; q++) {
        if (!planets[q].g.visible) continue;
        planets[q].g.rotation.y += 0.002 * planets[q].speed * 10;
        planets[q].g.position.y += Math.sin(t * 0.4 + planets[q].phase) * 0.004;
      }

      /* 播放时:频谱律动 + 星空随低频脉冲;未播放时频谱不参与渲染 */
      if (spectrum) {
        var energy = spectrum.update();
        if (energy) {
          mat.size = starBaseSize * (1 + energy * 0.4);
          mat.opacity = Math.min(0.8, starBaseOpacity + energy * 0.15);
        } else if (mat.size !== starBaseSize) {
          mat.size = starBaseSize;
          mat.opacity = starBaseOpacity;
        }
      }
      if (tunnel && tunnel.group.visible) tunnel.update(t);
      if (orbit && orbit.group.visible) orbit.update(t);

      /* 光标重力:半高 = tan(30°) × 相机到 z=0 的距离 */
      if (gravity) {
        var halfH = 31.75, gx = camera.position.x + mouse.x * halfH * camera.aspect, gy = camera.position.y - mouse.y * halfH;
        for (var gi = 0; gi < count; gi++) {
          var i3 = gi * 3;
          var dx = gx - pos[i3], dy = gy - pos[i3 + 1], dz = -pos[i3 + 2];
          var r2 = dx * dx + dy * dy + dz * dz;
          var f = r2 < 2200 ? 0.0035 * (1 - r2 / 2200) : 0;
          vel[i3] = (vel[i3] + dx * f + (home[i3] - pos[i3]) * 0.0015) * 0.94;
          vel[i3 + 1] = (vel[i3 + 1] + dy * f + (home[i3 + 1] - pos[i3 + 1]) * 0.0015) * 0.94;
          vel[i3 + 2] = (vel[i3 + 2] + dz * f + (home[i3 + 2] - pos[i3 + 2]) * 0.0015) * 0.94;
          pos[i3] += vel[i3];
          pos[i3 + 1] += vel[i3 + 1];
          pos[i3 + 2] += vel[i3 + 2];
        }
        geo.attributes.position.needsUpdate = true;
      }

      if (threeCfg.parallax !== false) {
        camera.position.x += (mouse.x * 7 - camera.position.x) * 0.04;
        camera.position.y += (mouse.y * 5 - camera.position.y) * 0.04;
        camera.lookAt(0, 0, 0);
      }

      if (scrollRotate) {
        var scrollY = window.pageYOffset || document.documentElement.scrollTop;
        stars.rotation.z += (scrollY * 0.00006 - stars.rotation.z) * 0.05;
      }

      /* 自动档位:每 2.5 秒实测一次,帧率不足 35 就降一档;降到 low 停渲染回落 CSS 背景 */
      if (!sampled) {
        if (!fpsT0) fpsT0 = t;
        else if (t - fpsT0 > 2.5) {
          if (frames / (t - fpsT0) < 35) {
            applyQuality(tierName === 'high' ? 'mid' : 'low');
            if (tierName === 'low') {
              running = false;
              document.body.classList.add('no-webgl');
              canvas.style.display = 'none'; /* 停就停干净:留着最后一帧会和 CSS/Canvas2D 回落叠在一起 */
            }
          }
          fpsT0 = t;
          frames = 0;
        }
      }

      if (composer) composer.render();
      else renderer.render(scene, camera);
    }
    animate();

    /* 切后台暂停渲染循环,切回时恢复 */
    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running) requestAnimationFrame(animate);
    }, false);

    /* 上下文丢失(低端机常见):停渲染并回落到 CSS 静态背景 */
    canvas.addEventListener('webglcontextlost', function (e) {
      e.preventDefault();
      running = false;
      document.body.classList.add('no-webgl');
      canvas.style.display = 'none';
    }, false);
    canvas.addEventListener('webglcontextrestored', function () {
      if (tierName === 'low') return;
      document.body.classList.remove('no-webgl');
      canvas.style.display = '';
      running = true;
      requestAnimationFrame(animate);
    }, false);

    window.addEventListener('resize', function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      if (orbit) orbit.fit(camera);
      if (tunnel) tunnel.fit(camera);
      if (composer) composer.setSize(window.innerWidth, window.innerHeight);
      if (bloomPass) bloomPass.setSize(window.innerWidth, window.innerHeight);
      spectrumScale();
    }, false);

    /* 真机调试:控制台 erik3d.tier / erik3d.renderer.info.render */
    window.erik3d = {
      tier: tierName, renderer: renderer, scene: scene, camera: camera,
      orbit: !!orbit, gravity: gravity, bloom: !!composer,
      holiday: holiday ? holiday.key : null
    };
  }

  function hexToRGB(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }

  function makeCircleTexture() {
    var size = 32;
    var c = document.createElement('canvas');
    c.width = size; c.height = size;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.7)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }

  /* 假辉光:一张柔和的径向渐变贴图,让星球/emoji 周围有"过曝"的光晕(比真 Bloom 便宜一个数量级) */
  function makeGlowTexture() {
    var size = 128;
    var c = document.createElement('canvas');
    c.width = size; c.height = size;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.35)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.08)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
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

  /* 3D 背景按需加载:未禁用且未请求减少动效时才注入 three.js,首屏不再同步下载 600KB */
  function loadThree(cb) {
    var s = document.createElement('script');
    s.src = root.replace(/\/$/, '') + '/js/vendor/three.min.js';
    s.onload = cb;
    s.onerror = function () { document.body.classList.add('no-webgl'); };
    document.head.appendChild(s);
  }

  /* Bloom 用的后处理模块(r128 官方 examples,已放进 js/vendor/postprocessing),只有真要开时才下载 */
  var POST = ['CopyShader', 'LuminosityHighPassShader', 'Pass', 'ShaderPass', 'MaskPass', 'EffectComposer', 'RenderPass', 'UnrealBloomPass'];
  function loadPost(cb) {
    var base = root.replace(/\/$/, '') + '/js/vendor/postprocessing/', i = 0;
    (function next() {
      if (i >= POST.length) return cb();
      var s = document.createElement('script');
      s.src = base + POST[i++] + '.js';
      s.onload = next;
      s.onerror = cb; /* 拿不到就退回普通渲染 */
      document.head.appendChild(s);
    })();
  }

  function bootThree() {
    if (window.THREE) {
      try { initThree(); }
      catch (e) { document.body.classList.add('no-webgl'); if (window.console) console.error('[erik3d]', e); }
    } else {
      document.body.classList.add('no-webgl');
    }
  }

  /* low 档(或省流量模式)不下载 three.js,直接回落到 CSS 静态背景;three.always 可强制 */
  var wantBloom = !!(threeCfg.bloom && threeCfg.bloom.enable === true) && tierName === 'high' && !reduceMotion;
  if (threeCfg.enable !== false && !reduceMotion && (tierName !== 'low' || threeCfg.always === true)) {
    loadThree(function () { if (wantBloom) loadPost(bootThree); else bootThree(); });
  } else document.body.classList.add('no-webgl');

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
