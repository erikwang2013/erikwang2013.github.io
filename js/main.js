/* Erik 3D theme - three.js effects */
'use strict';

(function () {
  var cfg = window.ERIK || {};
  var root = cfg.root || '/';
  var threeCfg = cfg.three || {};
  var styleCfg = cfg.style || {};
  /* 场景工厂与贴图工具在 scenes.js(先于本文件加载) */
  var S = window.ErikScenes || {};
  var hexToRGB = S.hexToRGB, makeCircleTexture = S.makeCircleTexture, makeGlowTexture = S.makeGlowTexture,
      makeEmojiTexture = S.makeEmojiTexture, makeTunnel = S.makeTunnel, makeOrbit = S.makeOrbit, makeSpectrum = S.makeSpectrum;
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
})();
