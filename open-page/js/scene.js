import * as THREE from 'three';

const SPHERE_RADIUS = 85;

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function makeGlowSprite(colorHex, scale) {
  const { r, g, b } = hexToRgb(colorHex);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, `rgba(${r},${g},${b},0.85)`);
  grad.addColorStop(0.4, `rgba(${r},${g},${b},0.3)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  sprite.scale.set(scale, scale, 1);
  return sprite;
}

function makeEmojiSprite(emoji) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.font = '150px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 128, 134);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  }));
}

function makeLabelSprite(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.font = 'bold 40px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 16;
  ctx.fillStyle = color;
  ctx.fillText(text, 256, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  }));
  sprite.scale.set(44, 11, 1);
  sprite.position.y = 6;
  return sprite;
}

function makeRingSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = 'rgba(255,255,255,1)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(64, 64, 52, 0, Math.PI * 2);
  ctx.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  }));
  sprite.scale.set(9, 9, 1);
  return sprite;
}

function makeNebulaTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#12051f');
  grad.addColorStop(0.5, '#1f0a2e');
  grad.addColorStop(1, '#040109');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);
  const blobs = [
    { x: 200, y: 150, r: 170, c: 'rgba(255,168,66,0.22)' },
    { x: 830, y: 110, r: 140, c: 'rgba(200,80,180,0.25)' },
    { x: 520, y: 390, r: 200, c: 'rgba(150,50,220,0.26)' },
    { x: 90, y: 430, r: 120, c: 'rgba(255,130,40,0.16)' },
  ];
  blobs.forEach((b) => {
    const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    g.addColorStop(0, b.c);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
  });
  for (let i = 0; i < 420; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.8})`;
    ctx.fillRect(Math.random() * 1024, Math.random() * 512, 1.6, 1.6);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function buildScene(scene, data) {
  const { PROJECTS, STATUS } = data;
  // ---------- 星云背景 ----------
  const nebula = new THREE.Mesh(
    new THREE.SphereGeometry(680, 32, 32),
    new THREE.MeshBasicMaterial({ map: makeNebulaTexture(), side: THREE.BackSide }),
  );
  scene.add(nebula);

  // ---------- 星空 ----------
  const starCount = 2200;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 480 + Math.random() * 480;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPos[i * 3 + 2] = r * Math.cos(phi);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: 0x9fb8d9, size: 1.1, transparent: true, opacity: 0.9,
  })));

  // ---------- 中心能量核 ----------
  const core = new THREE.Group();
  core.add(new THREE.Mesh(
    new THREE.SphereGeometry(5.5, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x6fb7ff }),
  ));
  core.add(new THREE.Mesh(
    new THREE.SphereGeometry(9.5, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x7fb2ff, transparent: true, opacity: 0.15, side: THREE.DoubleSide }),
  ));
  core.add(makeGlowSprite('#4a9eff', 45));
  const corePCount = 260;
  const corePPos = new Float32Array(corePCount * 3);
  for (let i = 0; i < corePCount; i++) {
    const r = Math.cbrt(Math.random()) * 8;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    corePPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    corePPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    corePPos[i * 3 + 2] = r * Math.cos(phi);
  }
  const corePGeo = new THREE.BufferGeometry();
  corePGeo.setAttribute('position', new THREE.BufferAttribute(corePPos, 3));
  core.add(new THREE.Points(corePGeo, new THREE.PointsMaterial({
    color: 0xa8d4ff, size: 0.3, transparent: true, opacity: 0.9,
  })));

  // 旋转光环(交叉双环)
  const coreRingMat = new THREE.MeshBasicMaterial({
    color: 0x7fb2ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide,
  });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(12, 0.25, 8, 60), coreRingMat);
  core.add(ring1);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(14.5, 0.2, 8, 60), coreRingMat.clone());
  ring2.rotation.x = Math.PI / 2.6;
  ring2.rotation.y = 0.5;
  core.add(ring2);

  // 雷达扫描扇形
  const radar = new THREE.Mesh(
    new THREE.RingGeometry(52, 54.5, 128, 1, 0, Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x4a9eff, transparent: true, opacity: 0.16, side: THREE.DoubleSide }),
  );
  radar.rotation.x = -Math.PI / 2;
  core.add(radar);

  // 扩散波纹(两波错相)
  const shockMat = new THREE.MeshBasicMaterial({
    color: 0x6fb7ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide,
  });
  const shockA = new THREE.Mesh(new THREE.RingGeometry(0.98, 1, 64), shockMat);
  shockA.rotation.x = -Math.PI / 2;
  core.add(shockA);
  const shockB = new THREE.Mesh(new THREE.RingGeometry(0.98, 1, 64), shockMat.clone());
  shockB.rotation.x = -Math.PI / 2;
  core.add(shockB);

  scene.add(core);

  // ---------- 行星球壳(整体自动滚动) ----------
  const shell = new THREE.Group();
  shell.spinning = true; // 打开介绍时置 false 停止滚动
  scene.add(shell);
  const orbitLineMat = new THREE.LineBasicMaterial({
    color: 0x6fb7ff, transparent: true, opacity: 0.18,
  });

  // ---------- 行星 ----------
  const planetGroups = [];
  const pickables = [];

  PROJECTS.forEach((proj) => {
    if (!STATUS[proj.status]) {
      console.warn('[scene] 未知状态,跳过项目:', proj.id, proj.status);
    }
  });

  PROJECTS.forEach((proj) => {
    const status = proj.status;
    const baseColor = new THREE.Color(STATUS[status].color);

    const group = new THREE.Group();

    // emoji 作为行星主体
    const emojiSprite = makeEmojiSprite(proj.emoji);
    emojiSprite.userData.projectId = proj.id;
    emojiSprite.scale.set(8, 8, 1);
    group.add(emojiSprite);
    pickables.push(emojiSprite);

    const glow = makeGlowSprite(STATUS[status].color, 13);
    group.add(glow);

    // 点击扩散光环(默认隐藏,选中时由 update 扩散)
    const selectRing = makeRingSprite();
    group.add(selectRing);

    const labelColor = new THREE.Color().setHSL(Math.random(), 0.85, 0.72).getStyle();
    const label = makeLabelSprite(proj.nameZh, labelColor);
    label.userData.labelColor = labelColor;
    group.add(label);

    // 球面均匀随机分布 + 随机朝向(自转轴各异,不再沿单一方向公转)
    const u = Math.random();
    const v = Math.random();
    const theta = u * Math.PI * 2;
    const phi = Math.acos(2 * v - 1);
    const r = SPHERE_RADIUS * (0.96 + Math.random() * 0.08);
    group.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta),
    );
    group.rotation.set(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
    );
    shell.add(group);

    // 行星到中心核的放射连线(随球壳整体滚动)
    const orbitLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), group.position.clone()]),
      orbitLineMat,
    );
    shell.add(orbitLine);

    planetGroups.push({
      group, data: proj,
      glow, label, emojiSprite, selectRing,
      ringT: -1,
      spin: 0.25 + Math.random() * 0.55,
      spinning: true,
    });
  });

  // ---------- 点击爆裂粒子 ----------
  const BURST_N = 30;
  const burstPos = new Float32Array(BURST_N * 3);
  const burstVel = new Float32Array(BURST_N * 3);
  const burstGeo = new THREE.BufferGeometry();
  burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPos, 3));
  const burstMat = new THREE.PointsMaterial({
    color: 0xffffff, size: 0.55, transparent: true, opacity: 0, depthWrite: false,
  });
  const burstPts = new THREE.Points(burstGeo, burstMat);
  scene.add(burstPts);
  let burstT = -1;
  const burstDir = new THREE.Vector3();

  function burstAt(pos, colorHex) {
    burstMat.color.set(colorHex);
    for (let i = 0; i < BURST_N; i++) {
      burstDir.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
      const v = 2 + Math.random() * 6;
      burstVel[i * 3] = burstDir.x * v;
      burstVel[i * 3 + 1] = burstDir.y * v;
      burstVel[i * 3 + 2] = burstDir.z * v;
      burstPos[i * 3] = pos.x;
      burstPos[i * 3 + 1] = pos.y;
      burstPos[i * 3 + 2] = pos.z;
    }
    burstGeo.attributes.position.needsUpdate = true;
    burstT = 0;
  }

  // ---------- 更新 ----------
  function update(dt, camera) {
    dt = Math.min(dt, 0.05);
    const now = performance.now();
    nebula.rotation.y += dt * 0.008;
    core.rotation.y += dt * 0.15;
    ring1.rotation.y += dt * 0.6;
    ring2.rotation.y += dt * 0.45;
    radar.rotation.z += dt * 0.5;
    if (shell.spinning) shell.rotation.y += dt * 0.12; // 行星球壳整体自动滚动
    const t1 = (now * 0.0004) % 1;
    const t2 = (t1 + 0.5) % 1;
    shockA.scale.set(1 + t1 * 5, 1 + t1 * 5, 1 + t1 * 5);
    shockA.material.opacity = 0.55 * (1 - t1);
    shockB.scale.set(1 + t2 * 5, 1 + t2 * 5, 1 + t2 * 5);
    shockB.material.opacity = 0.55 * (1 - t2);
    planetGroups.forEach((p) => {
      if (p.spinning) p.group.rotation.y += dt * p.spin;
      if (p.ringT >= 0) {
        p.ringT += dt;
        const f = p.ringT / 0.8;
        const s = 9 + f * 16;
        p.selectRing.scale.set(s, s, 1);
        p.selectRing.material.opacity = Math.max(0, 1 - f) * 0.9;
        if (p.ringT >= 0.8) { p.ringT = -1; p.selectRing.material.opacity = 0; }
      }
      if (p.data.status === 'fix') {
        const pulse = 0.55 + 0.45 * Math.sin(now * 0.006);
        p.glow.material.opacity = pulse;
      }
    });
    if (burstT >= 0) {
      burstT += dt;
      const f = burstT / 0.8;
      burstMat.opacity = Math.max(0, 1 - f) * 0.95;
      for (let i = 0; i < BURST_N; i++) {
        burstPos[i * 3] += burstVel[i * 3] * dt;
        burstPos[i * 3 + 1] += burstVel[i * 3 + 1] * dt;
        burstPos[i * 3 + 2] += burstVel[i * 3 + 2] * dt;
      }
      burstGeo.attributes.position.needsUpdate = true;
      if (burstT >= 0.8) { burstT = -1; burstMat.opacity = 0; }
    }
  }

  return { planetGroups, pickables, update, burstAt, shell };
}
