/* Erik scenes.js — three.js 场景工厂（时光隧道 / 分类轨道 / 播放器频谱）与贴图工具 */
'use strict';

/* 仅在 three.js 载入后调用，故内部可直接使用全局 THREE */
(function () {
  var S = {};

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

  S.hexToRGB = hexToRGB;
  S.makeCircleTexture = makeCircleTexture;
  S.makeGlowTexture = makeGlowTexture;
  S.makeEmojiTexture = makeEmojiTexture;
  S.makeLabelSprite = makeLabelSprite;
  S.makeTunnel = makeTunnel;
  S.makeOrbit = makeOrbit;
  S.makeSpectrum = makeSpectrum;
  window.ErikScenes = S;
})();
