import * as THREE from 'three';

const HOVER_SCALE = 1.3;
const GLOW_HOVER = 18;
const GLOW_NORMAL = 13;

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function initInteraction({ renderer, camera, controls, galaxy, home, data }) {
  const { STATUS, STATUS_ORDER } = data;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const dom = renderer.domElement;

  let hovered = null;
  let selected = null;
  let state = 'idle'; // idle | flying | focused
  let fly = null;     // { fromPos, fromTarget, toPos, toTarget, t, duration }
  let hideTimer = null;

  const panel = document.getElementById('detail-panel');
  const panelContent = document.getElementById('panel-content');
  const closeBtn = document.getElementById('panel-close');

  // ---------- 拾取 ----------
  function pick() {
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(galaxy.pickables, false);
    let rec = hits.length ? galaxy.planetGroups.find((p) => p.data.id === hits[0].object.userData.projectId) : null;
    if (rec && !rec.group.visible) rec = null;
    if (rec !== hovered) {
      if (hovered && hovered !== selected) setHover(hovered, false);
      hovered = rec;
      if (hovered && hovered !== selected) setHover(hovered, true);
    }
    dom.style.cursor = rec ? 'pointer' : 'default';
  }

  function setHover(rec, on) {
    if (on) {
      rec.group.scale.set(HOVER_SCALE, HOVER_SCALE, HOVER_SCALE);
      rec.glow.scale.set(GLOW_HOVER, GLOW_HOVER, 1);
    } else {
      rec.group.scale.set(1, 1, 1);
      rec.glow.scale.set(GLOW_NORMAL, GLOW_NORMAL, 1);
    }
  }

  function resetSelection() {
    if (selected) {
      selected.group.scale.set(1, 1, 1);
      selected.glow.scale.set(GLOW_NORMAL, GLOW_NORMAL, 1);
    }
  }

  // ---------- 相机飞行 ----------
  function startFly(toPos, toTarget, duration) {
    fly = {
      fromPos: camera.position.clone(),
      fromTarget: controls.target.clone(),
      toPos, toTarget, t: 0, duration,
    };
    state = 'flying';
    controls.enabled = false;
  }

  // ---------- 面板 ----------
  function openPanel(proj) {
    clearTimeout(hideTimer);
    const s = STATUS[proj.status];
    panelContent.innerHTML = `
      <h2>${proj.emoji} ${proj.nameZh}</h2>
      <p class="en">${proj.nameEn}</p>
      <div class="meta">
        <span class="badge" style="--c:${s.color}">${s.label}</span>
        <span class="lang">${proj.language}</span>
      </div>
      <p class="desc">${proj.description}</p>
      <a class="github-btn" href="${proj.githubUrl}" target="_blank" rel="noopener noreferrer">打开仓库 ↗</a>
    `;
    panel.classList.remove('hidden');
    requestAnimationFrame(() => panel.classList.add('open'));
  }

  function closePanel() {
    panel.classList.remove('open');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => panel.classList.add('hidden'), 350);
    resetSelection();
    if (selected) selected.spinning = true;
    galaxy.shell.spinning = true; // 关闭介绍,球壳恢复滚动
    selected = null;
    hovered = null;
    startFly(home.pos.clone(), home.target.clone(), 1.1);
  }

  // ---------- 事件 ----------
  let downX = 0;
  let downY = 0;
  let isDown = false;

  dom.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    pick();
  });

  dom.addEventListener('pointerdown', (e) => {
    downX = e.clientX;
    downY = e.clientY;
    isDown = true;
  });

  window.addEventListener('pointerup', (e) => {
    if (!isDown) return;
    isDown = false;
    const dx = e.clientX - downX;
    const dy = e.clientY - downY;
    if (dx * dx + dy * dy > 25) return; // 拖动超过 5px 视为旋转,不触发点击
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(galaxy.pickables, false);
    if (!hits.length) return;
    const rec = galaxy.planetGroups.find((p) => p.data.id === hits[0].object.userData.projectId);
    if (!rec || !rec.group.visible) return;

    resetSelection();
    selected = rec;
    rec.spinning = false;
    rec.ringT = 0;
    galaxy.shell.spinning = false; // 打开介绍,球壳整体停止滚动
    setHover(rec, true);

    // 球壳在旋转,必须用世界坐标定位聚焦与爆裂
    const wp = rec.group.getWorldPosition(new THREE.Vector3());
    const focusPos = wp.clone().add(new THREE.Vector3(0, 8, 28));
    const focusTarget = wp.clone();
    openPanel(rec.data);
    galaxy.burstAt(wp, STATUS[rec.data.status].color);
    startFly(focusPos, focusTarget, 1.0);
  });

  window.addEventListener('pointercancel', () => { isDown = false; });

  closeBtn.addEventListener('click', () => {
    if (selected) closePanel();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && selected) closePanel();
  });


  // ---------- 筛选(数据驱动生成按钮与图例) ----------
  const filtersEl = document.getElementById('filters');
  const searchInput = document.getElementById('search-input');
  const allBtn = document.createElement('button');
  allBtn.className = 'filter-btn active';
  allBtn.dataset.status = 'all';
  allBtn.style.setProperty('--c', '#4A9EFF');
  allBtn.textContent = '全部';
  filtersEl.appendChild(allBtn);
  STATUS_ORDER.forEach((id) => {
    const s = STATUS[id];
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.status = id;
    btn.style.setProperty('--c', s.color);
    btn.textContent = s.label;
    filtersEl.appendChild(btn);
  });
  let activeStatus = 'all';

  function applyFilter() {
    const q = searchInput.value.trim().toLowerCase();
    galaxy.planetGroups.forEach((p) => {
      const statusMatch = activeStatus === 'all' || p.data.status === activeStatus;
      const qMatch = !q
        || p.data.nameZh.toLowerCase().includes(q)
        || p.data.nameEn.toLowerCase().includes(q)
        || p.data.description.toLowerCase().includes(q);
      p.group.visible = statusMatch && qMatch;
    });
    if (!cardView.classList.contains('hidden')) renderCards();
  }

  const searchClear = document.getElementById('search-clear');

  searchInput.addEventListener('input', () => {
    searchClear.style.display = searchInput.value ? 'block' : 'none';
    applyFilter();
  });
  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.style.display = 'none';
    applyFilter();
    searchInput.focus();
  });

  filtersEl.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      filtersEl.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeStatus = btn.dataset.status;
      applyFilter();
    });
  });

  // ---------- 视图切换(星球 / 卡片) ----------
  const cardView = document.getElementById('card-view');
  const cardGrid = document.getElementById('card-grid');
  const pagerPrev = document.getElementById('pager-prev');
  const pagerNext = document.getElementById('pager-next');
  const pagerInfo = document.getElementById('pager-info');
  const viewGalaxyBtn = document.getElementById('view-galaxy');
  const viewCardsBtn = document.getElementById('view-cards');
  const PAGE_SIZE = 12;
  let cardPage = 0;

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function renderCards() {
    const visible = galaxy.planetGroups.filter((p) => p.group.visible);
    const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
    cardPage = Math.min(cardPage, totalPages - 1);
    const slice = visible.slice(cardPage * PAGE_SIZE, (cardPage + 1) * PAGE_SIZE);
    cardGrid.innerHTML = slice.map((p) => {
      const s = STATUS[p.data.status];
      return `
        <div class="project-card" data-id="${p.data.id}" style="--c:${s.color}">
          <div class="card-head">
            <span class="card-emoji">${p.data.emoji}</span>
            <div>
              <div class="card-name">${escapeHtml(p.data.nameZh)}</div>
              <div class="card-en">${escapeHtml(p.data.nameEn)}</div>
            </div>
          </div>
          <div class="card-meta">
            <span class="badge">${s.label}</span>
            <span class="lang">${escapeHtml(p.data.language)}</span>
          </div>
          <p class="card-desc">${escapeHtml(p.data.description)}</p>
          <a class="card-link" href="${p.data.githubUrl}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">打开仓库 ↗</a>
        </div>`;
    }).join('');
    pagerInfo.textContent = `共 ${visible.length} 个项目 · 第 ${cardPage + 1} / ${totalPages} 页`;
    pagerPrev.disabled = cardPage <= 0;
    pagerNext.disabled = cardPage >= totalPages - 1;
    cardGrid.querySelectorAll('.project-card').forEach((el, i) => {
      el.addEventListener('click', () => {
        const rec = galaxy.planetGroups.find((x) => x.data.id === el.dataset.id);
        if (!rec) return;
        resetSelection();
        selected = rec;
        rec.spinning = false;
        galaxy.shell.spinning = false;
        openPanel(rec.data);
      });

      // 入场动画(交错延迟,动画结束即清除,避免覆盖 3D 倾斜的 transform)
      el.classList.add('enter');
      el.style.animationDelay = `${Math.min(i, 8) * 45}ms`;
      el.addEventListener('animationend', () => {
        el.style.animation = 'none';
        el.classList.remove('enter');
      }, { once: true });

      // 3D 鼠标倾斜 + emoji 分层浮动
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform =
          `perspective(800px) rotateX(${(-py * 10).toFixed(2)}deg) rotateY(${(px * 10).toFixed(2)}deg) translateY(-4px)`;
        const emoji = el.querySelector('.card-emoji');
        if (emoji) emoji.style.transform =
          `translate(${(px * 10).toFixed(1)}px, ${(py * 10).toFixed(1)}px) scale(1.12)`;
      });
      el.addEventListener('mouseleave', () => {
        el.classList.add('settle');
        el.style.transform = '';
        const emoji = el.querySelector('.card-emoji');
        if (emoji) emoji.style.transform = '';
        setTimeout(() => el.classList.remove('settle'), 400);
      });
    });
  }

  pagerPrev.addEventListener('click', () => { if (cardPage > 0) { cardPage -= 1; renderCards(); } });
  pagerNext.addEventListener('click', () => { cardPage += 1; renderCards(); });

  function setView(mode) {
    viewGalaxyBtn.classList.toggle('active', mode === 'galaxy');
    viewCardsBtn.classList.toggle('active', mode === 'cards');
    document.body.classList.toggle('card-mode', mode === 'cards');
    renderer.domElement.style.display = mode === 'galaxy' ? '' : 'none';
    cardView.classList.toggle('hidden', mode !== 'cards');
    if (mode === 'cards') { cardPage = 0; renderCards(); }
    else { backTop.style.display = 'none'; }
  }
  viewGalaxyBtn.addEventListener('click', () => setView('galaxy'));
  viewCardsBtn.addEventListener('click', () => setView('cards'));

  const backTop = document.getElementById('back-top');
  window.addEventListener('scroll', () => {
    backTop.style.display = window.scrollY > 80 ? 'flex' : 'none';
  }, { passive: true });
  backTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ---------- 帧更新 ----------
  function update(dt) {
    if (state === 'flying' && fly) {
      fly.t += dt / fly.duration;
      const t = easeInOutCubic(Math.min(fly.t, 1));
      camera.position.lerpVectors(fly.fromPos, fly.toPos, t);
      controls.target.lerpVectors(fly.fromTarget, fly.toTarget, t);
      if (fly.t >= 1) {
        state = 'focused';
        fly = null;
        controls.enabled = true;
      }
    }
  }

  // 调试钩子(playwright 验证用)
  window.__galaxy = {
    groups: galaxy.planetGroups,
    select(id) {
      const rec = galaxy.planetGroups.find((p) => p.data.id === id);
      if (!rec || !rec.group.visible) return;
      resetSelection();
      selected = rec;
      rec.spinning = false;
      rec.ringT = 0;
      galaxy.shell.spinning = false;
      setHover(rec, true);
      const wp = rec.group.getWorldPosition(new THREE.Vector3());
      const focusPos = wp.clone().add(new THREE.Vector3(0, 8, 28));
      const focusTarget = wp.clone();
      openPanel(rec.data);
      galaxy.burstAt(wp, STATUS[rec.data.status].color);
      startFly(focusPos, focusTarget, 1.0);
    },
  };

  return { update };
}
