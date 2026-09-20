# 3D 项目中心 (Energy Galaxy) 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 Three.js 构建静态多文件的 3D 星系项目中心,以行星轨道式展示 30 个 GitHub 项目,支持点击飞入查看详情、状态筛选、五状态(规划/开发/维护/更新/修复)配置。

**Architecture:** 纯静态 ES Module 项目,零构建零网络依赖。`index.html` 内联 importmap 将 `three` 映射到本地 `vendor/three.module.js`;`js/data.js` 导出项目与状态配置;`js/scene.js` 构建星空/中心核/轨道/行星并暴露 `update()` 动画;`js/main.js` 处理拾取、相机飞入、详情面板、筛选与 Esc。入口 module 组装三者并启动渲染循环。

**Tech Stack:** Three.js 0.160.0(本地 vendor)、OrbitControls(addons)、原生 CanvasTexture 生成 glow/标签、无打包器。

**设计文档:** `docs/superpowers/specs/2026-08-09-3d-project-center-design.md`

**执行环境说明:** 当前目录非 git 仓库。每任务末尾的 commit 步骤在用户初始化 git 后才执行;否则跳过。文件行数限制 500 行内。

**验证方式:** 本计划无自动化测试框架,每个任务通过本地 HTTP 服务 + 浏览器(playwright MCP)验证。WebGL 页面在 playwright 中以软件渲染(SwiftShader)工作。

---

### Task 1: 下载 Three.js 与 OrbitControls 到 vendor/

**Files:**
- Create: `3d-project-center/vendor/three.module.js`
- Create: `3d-project-center/vendor/OrbitControls.js`

- [ ] **Step 1: 创建目录并下载依赖**

```bash
mkdir -p /home/wwwroot/bag/open/3d-project-center/vendor
cd /home/wwwroot/bag/open/3d-project-center/vendor
curl -fsSL -o three.module.js https://unpkg.com/three@0.160.0/build/three.module.js
curl -fsSL -o OrbitControls.js https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js
```

- [ ] **Step 2: 验证下载**

Run: `wc -c /home/wwwroot/bag/open/3d-project-center/vendor/three.module.js /home/wwwroot/bag/open/3d-project-center/vendor/OrbitControls.js`
Expected: three.module.js ≈ 1.2MB(1200000 左右),OrbitControls.js ≈ 50KB。两个文件均为非空文本(可通过 `head -c 200 three.module.js` 查看开头注释确认)。

- [ ] **Step 3: 提交(仅当 git 已初始化)**

```bash
git add 3d-project-center/vendor/
git commit -m "chore: vendor three.js 0.160.0 and OrbitControls"
```

---

### Task 2: index.html 骨架与 style.css

**Files:**
- Create: `3d-project-center/index.html`
- Create: `3d-project-center/css/style.css`

- [ ] **Step 1: 创建 `3d-project-center/index.html`**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>3D 项目中心 · Energy Galaxy</title>
<link rel="stylesheet" href="css/style.css">
<script type="importmap">
{
  "imports": {
    "three": "./vendor/three.module.js"
  }
}
</script>
</head>
<body>
<div id="app">
  <canvas id="scene"></canvas>

  <div id="hud">
    <h1>项目中心 <span class="sub">ENERGY GALAXY</span></h1>
    <div id="filters">
      <button class="filter-btn active" data-status="all">全部</button>
      <button class="filter-btn" data-status="planning">规划</button>
      <button class="filter-btn" data-status="development">开发</button>
      <button class="filter-btn" data-status="maintenance">维护</button>
      <button class="filter-btn" data-status="update">更新</button>
      <button class="filter-btn" data-status="fix">修复</button>
    </div>
  </div>

  <div id="legend">
    <div class="legend-item" style="--c:#C0C4CC">规划</div>
    <div class="legend-item" style="--c:#4A9EFF">开发</div>
    <div class="legend-item" style="--c:#34C77B">维护</div>
    <div class="legend-item" style="--c:#A78BFA">更新</div>
    <div class="legend-item" style="--c:#FF5A5A">修复</div>
  </div>

  <div id="hint">拖动旋转 · 滚轮缩放 · 点击行星查看项目 · Esc 返回全景</div>

  <div id="detail-panel" class="hidden">
    <button id="panel-close" aria-label="关闭">×</button>
    <div id="panel-content"></div>
  </div>

  <div id="webgl-fallback" class="hidden">您的浏览器不支持 WebGL,无法显示 3D 场景。</div>
</div>

<script type="module">
import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { buildScene } from './js/scene.js';
import { initInteraction } from './js/main.js';

const fallback = document.getElementById('webgl-fallback');
try {
  new THREE.WebGLRenderer();
} catch (err) {
  fallback.classList.remove('hidden');
  throw err;
}

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('scene').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 6;
controls.maxDistance = 90;

const HOME = { pos: new THREE.Vector3(0, 30, 44), target: new THREE.Vector3(0, 0, 0) };
camera.position.copy(HOME.pos);
controls.target.copy(HOME.target);

const galaxy = buildScene(scene);
const interaction = initInteraction({ renderer, scene, camera, controls, galaxy, home: HOME });

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  galaxy.update(dt, camera);
  interaction.update(dt);
  controls.update();
  renderer.render(scene, camera);
}
animate();
</script>
</body>
</html>
```

- [ ] **Step 2: 创建 `3d-project-center/css/style.css`**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: radial-gradient(ellipse at center, #0b1026 0%, #05070f 70%, #020308 100%);
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  color: #dbe4ff;
  user-select: none;
}

#app { position: relative; width: 100%; height: 100%; }
#scene { position: absolute; inset: 0; display: block; }

/* ---------- HUD ---------- */
#hud {
  position: absolute;
  top: 22px;
  left: 24px;
  z-index: 10;
  pointer-events: none;
}
#hud h1 {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #eaf2ff;
  text-shadow: 0 0 18px rgba(74, 158, 255, 0.55);
}
#hud h1 .sub {
  display: block;
  font-size: 11px;
  letter-spacing: 5px;
  color: #7f9bd4;
  margin-top: 4px;
}
#filters {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  pointer-events: auto;
}
.filter-btn {
  padding: 6px 14px;
  font-size: 13px;
  color: #a9c0ea;
  background: rgba(20, 32, 68, 0.55);
  border: 1px solid rgba(110, 145, 205, 0.35);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s;
}
.filter-btn:hover { background: rgba(40, 60, 110, 0.7); }
.filter-btn.active {
  color: #fff;
  background: rgba(74, 158, 255, 0.3);
  border-color: #4a9eff;
  box-shadow: 0 0 12px rgba(74, 158, 255, 0.35);
}

/* ---------- 图例 ---------- */
#legend {
  position: absolute;
  right: 24px;
  bottom: 22px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: #9db4dc;
  background: rgba(10, 16, 38, 0.5);
  border: 1px solid rgba(110, 145, 205, 0.25);
  border-radius: 10px;
  padding: 10px 14px;
}
.legend-item { display: flex; align-items: center; gap: 8px; }
.legend-item::before {
  content: "";
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--c);
  box-shadow: 0 0 8px var(--c);
}

/* ---------- 操作提示 ---------- */
#hint {
  position: absolute;
  left: 50%;
  bottom: 22px;
  transform: translateX(-50%);
  z-index: 10;
  font-size: 12px;
  color: #6e84b0;
  background: rgba(10, 16, 38, 0.45);
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid rgba(110, 145, 205, 0.2);
}

/* ---------- 详情面板 ---------- */
#detail-panel {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 20;
  width: 380px;
  height: 100%;
  padding: 56px 34px 34px;
  background: linear-gradient(180deg, rgba(16, 26, 58, 0.92), rgba(8, 13, 32, 0.96));
  border-left: 1px solid rgba(110, 145, 205, 0.35);
  box-shadow: -18px 0 50px rgba(0, 0, 0, 0.55);
  transform: translateX(100%);
  transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.3, 1);
  overflow-y: auto;
}
#detail-panel.open { transform: translateX(0); }
#detail-panel.hidden { display: none; }

#panel-close {
  position: absolute;
  top: 18px;
  right: 20px;
  width: 34px;
  height: 34px;
  font-size: 20px;
  line-height: 1;
  color: #9db4dc;
  background: rgba(40, 60, 110, 0.4);
  border: 1px solid rgba(110, 145, 205, 0.35);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}
#panel-close:hover { color: #fff; background: rgba(74, 158, 255, 0.35); }

#panel-content h2 {
  font-size: 24px;
  font-weight: 700;
  color: #eaf2ff;
  margin-bottom: 6px;
}
#panel-content .en {
  font-size: 14px;
  color: #7f9bd4;
  letter-spacing: 1px;
  margin-bottom: 16px;
}
#panel-content .meta { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
.badge {
  padding: 4px 12px;
  font-size: 13px;
  border-radius: 999px;
  color: #fff;
  background: color-mix(in srgb, var(--c) 30%, transparent);
  border: 1px solid var(--c);
  box-shadow: 0 0 10px color-mix(in srgb, var(--c) 45%, transparent);
}
.lang {
  font-size: 12px;
  color: #a9c0ea;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(110, 145, 205, 0.35);
}
#panel-content .desc {
  font-size: 14px;
  line-height: 1.9;
  color: #b9cbea;
  margin-bottom: 28px;
}
.github-btn {
  display: inline-block;
  padding: 10px 22px;
  font-size: 14px;
  color: #fff;
  text-decoration: none;
  background: linear-gradient(90deg, #2d6cdf, #4a9eff);
  border-radius: 10px;
  box-shadow: 0 4px 18px rgba(74, 158, 255, 0.4);
  transition: transform 0.15s, box-shadow 0.15s;
}
.github-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(74, 158, 255, 0.55); }

/* ---------- 兜底提示 ---------- */
#webgl-fallback {
  position: absolute;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #ffd9d9;
  background: #0b1026;
}
.hidden { display: none !important; }
```

- [ ] **Step 3: 验证**

Run: `python3 -m http.server 8000 --directory /home/wwwroot/bag/open/3d-project-center &` 后用 playwright MCP `browser_navigate` 打开 `http://localhost:8000`,再 `browser_take_screenshot`。
Expected: 页面渲染暗色背景,左上角显示「项目中心」标题和 6 个筛选按钮,右下角图例,底部操作提示,中央为黑色 canvas 区域(场景代码未加载前显示透明)。页面无 JS 错误(`browser_console_messages` 检查)。

- [ ] **Step 4: 提交(可选)**

```bash
git add 3d-project-center/index.html 3d-project-center/css/
git commit -m "feat: page skeleton with HUD, legend and detail panel"
```

---

### Task 3: 项目数据 js/data.js

**Files:**
- Create: `3d-project-center/js/data.js`

- [ ] **Step 1: 创建 `3d-project-center/js/data.js`**

```js
export const STATUS = {
  planning:    { label: '规划', color: '#C0C4CC' },
  development: { label: '开发', color: '#4A9EFF' },
  maintenance: { label: '维护', color: '#34C77B' },
  update:      { label: '更新', color: '#A78BFA' },
  fix:         { label: '修复', color: '#FF5A5A' },
};

export const STATUS_ORDER = ['planning', 'development', 'maintenance', 'update', 'fix'];

export const PROJECTS = [
  { id: 'erp-php',                  nameZh: '开放ERP系统',          nameEn: 'Open ERP',                 githubUrl: 'https://github.com/erikwang2013/erp-php',                  status: 'development', language: 'PHP',  description: '开源企业资源计划系统,覆盖采购、库存、销售、财务等核心业务模块。' },
  { id: 'property-management',      nameZh: '物业管理系统',          nameEn: 'Property Management Platform', githubUrl: 'https://github.com/erikwang2013/property-management-platform', status: 'development', language: 'PHP',  description: '物业管理平台,涵盖收费、报修、业主服务与小区运营管理。' },
  { id: 'erik-shop',                nameZh: '跨境电商平台',          nameEn: 'Erik Shop',                githubUrl: 'https://github.com/erikwang2013/erik-shop',                status: 'development', language: 'PHP',  description: '跨境电子商务平台,支持多语言、多币种与海外支付渠道。' },
  { id: 'ads-php',                  nameZh: '多平台广告管理系统',    nameEn: 'Ads Platform',             githubUrl: 'https://github.com/erikwang2013/ads-php',                  status: 'development', language: 'PHP',  description: '多平台广告投放管理系统,聚合渠道投放、数据统计与效果分析。' },
  { id: 'cloud-php',                nameZh: '全球云资源交易平台',    nameEn: 'Cloud Platform',           githubUrl: 'https://github.com/erikwang2013/cloud-php',                status: 'development', language: 'PHP',  description: '全球云资源交易平台,提供云主机、带宽等资源的购买与调度。' },
  { id: 'game-platform-php',        nameZh: '全球游戏聚合平台',      nameEn: 'Global Game Platform',     githubUrl: 'https://github.com/erikwang2013/game-platform-php',        status: 'development', language: 'PHP',  description: '全球游戏聚合平台,集成多地区游戏发行与渠道分发能力。' },
  { id: 'appointment-php',          nameZh: '预约服务系统',          nameEn: 'Appointment Service',      githubUrl: 'https://github.com/erikwang2013/appointment-php',          status: 'development', language: 'PHP',  description: '通用预约服务系统,支持多门店、多服务的在线预约与管理。' },
  { id: 'xhprof-webman',            nameZh: 'xhprof-webman',         nameEn: 'xhprof-webman',            githubUrl: 'https://github.com/erikwang2013/xhprof-webman',            status: 'development', language: 'PHP',  description: 'webman 框架的 xhprof 性能分析集成组件。' },
  { id: 'webman-scout',             nameZh: 'webman-scout',          nameEn: 'webman-scout',             githubUrl: 'https://github.com/erikwang2013/webman-scout',             status: 'development', language: 'PHP',  description: 'webman 框架的全文搜索组件,基于 Laravel Scout 设计思路。' },
  { id: 'jwt-webman',               nameZh: 'jwt-webman',            nameEn: 'jwt-webman',               githubUrl: 'https://github.com/erikwang2013/jwt-webman',               status: 'development', language: 'PHP',  description: 'webman 框架的 JWT 认证中间件与工具库。' },
  { id: 'encryption',               nameZh: 'encryption',            nameEn: 'encryption',               githubUrl: 'https://github.com/erikwang2013/encryption',               status: 'development', language: 'PHP',  description: '通用加密解密工具库,提供常见对称与非对称加密封装。' },
  { id: 'season',                   nameZh: 'season',                nameEn: 'season',                   githubUrl: 'https://github.com/erikwang2013/season',                   status: 'development', language: 'PHP',  description: '通用 PHP 工具集,提供日期、集合等常用功能封装。' },
  { id: 'aetherupload-webman',      nameZh: 'aetherupload-webman',   nameEn: 'aetherupload-webman',      githubUrl: 'https://github.com/erikwang2013/aetherupload-webman',      status: 'development', language: 'PHP',  description: 'AetherUpload 大文件分片上传组件的 webman 适配。' },
  { id: 'encryptable',              nameZh: 'encryptable',           nameEn: 'encryptable',              githubUrl: 'https://github.com/erikwang2013/encryptable',              status: 'development', language: 'PHP',  description: '模型字段透明加密组件,自动加密写入、解密读取。' },
  { id: 'consul-php',               nameZh: 'consul-php',            nameEn: 'consul-php',               githubUrl: 'https://github.com/erikwang2013/consul-php',               status: 'development', language: 'PHP',  description: 'Consul 服务发现与配置中心的 PHP 客户端。' },
  { id: 'etcd',                     nameZh: 'etcd',                  nameEn: 'etcd',                     githubUrl: 'https://github.com/erikwang2013/etcd',                     status: 'development', language: 'PHP',  description: 'etcd 分布式键值存储的 PHP 客户端。' },
  { id: 'clickhouse-php',           nameZh: 'clickhouse-php',        nameEn: 'clickhouse-php',           githubUrl: 'https://github.com/erikwang2013/clickhouse-php',           status: 'development', language: 'PHP',  description: 'ClickHouse 列式数据库的 PHP 客户端封装。' },
  { id: 'hashids',                  nameZh: 'hashids',               nameEn: 'hashids',                  githubUrl: 'https://github.com/erikwang2013/hashids',                  status: 'development', language: 'PHP',  description: 'Hashids 短 ID 生成库,将数字混淆为不可猜测的短字符串。' },
  { id: 'poster-php',               nameZh: 'poster-php',            nameEn: 'poster-php',               githubUrl: 'https://github.com/erikwang2013/poster-php',               status: 'development', language: 'PHP',  description: 'PHP 海报生成库,基于图片合成生成分享海报。' },
  { id: 'security-php',             nameZh: 'security-php',          nameEn: 'security-php',             githubUrl: 'https://github.com/erikwang2013/security-php',             status: 'development', language: 'PHP',  description: 'PHP 安全工具库,提供输入过滤、防注入等安全防护封装。' },
  { id: 'snowflake-php',            nameZh: 'snowflake-php',         nameEn: 'snowflake-php',            githubUrl: 'https://github.com/erikwang2013/snowflake-php',            status: 'development', language: 'PHP',  description: '雪花算法分布式 ID 生成器 PHP 实现。' },
  { id: 'industrial-protocols',     nameZh: '工业协议库',            nameEn: 'Industrial Protocols',      githubUrl: 'https://github.com/erikwang2013/industrial-protocols',     status: 'development', language: 'PHP',  description: '工业控制协议解析与通信库(Modbus 等)。' },
  { id: 'security-rust',            nameZh: 'Security Rust',         nameEn: 'Security Rust',            githubUrl: 'https://github.com/erikwang2013/security-rust',            status: 'development', language: 'Rust',  description: 'Rust 安全工具库,提供加解密、哈希与安全编码封装。' },
  { id: 'security-go',              nameZh: 'Security Go',           nameEn: 'Security Go',              githubUrl: 'https://github.com/erikwang2013/security-go',              status: 'development', language: 'Go',    description: 'Go 安全工具库,提供加解密、认证与安全防护组件。' },
  { id: 'e-cat',                    nameZh: 'Ecat 微服务框架',        nameEn: 'Ecat',                     githubUrl: 'https://github.com/erikwang2013/e-cat',                    status: 'development', language: 'Rust',  description: 'Rust 微服务框架,提供服务发现、配置与调用链能力。' },
  { id: 'bee-rust',                 nameZh: 'Beerust Web 框架',      nameEn: 'Beerust',                  githubUrl: 'https://github.com/erikwang2013/bee-rust',                 status: 'development', language: 'Rust',  description: 'Rust Web 框架,提供路由、中间件与模板渲染能力。' },
  { id: 'coding-to-rust',           nameZh: 'Coding to Rust',        nameEn: 'Coding to Rust',           githubUrl: 'https://github.com/erikwang2013/coding-to-rust',           status: 'development', language: 'Rust',  description: '面向 PHP 开发者的 Rust 入门与迁移指南项目。' },
  { id: 'druid-rust',               nameZh: 'Druid Rust',            nameEn: 'Druid Rust',               githubUrl: 'https://github.com/erikwang2013/druid-rust',               status: 'development', language: 'Rust',  description: 'Druid 数据查询引擎的 Rust 实现与移植。' },
  { id: 'ai-desgin',                nameZh: 'AI Design',             nameEn: 'AI Design',                githubUrl: 'https://github.com/erikwang2013/ai-desgin',                status: 'development', language: 'AI',    description: 'AI 辅助设计工具与生成式设计相关项目。' },
  { id: 'canal-rust',               nameZh: 'Canal Rust',            nameEn: 'Canal Rust',               githubUrl: 'https://github.com/erikwang2013/canal-rust',               status: 'development', language: 'Rust',  description: '阿里巴巴 Canal 数据库增量订阅的 Rust 实现。' },
];
```

- [ ] **Step 2: 验证**

Run: `node -e "import('/home/wwwroot/bag/open/3d-project-center/js/data.js').then(m => { console.log('count:', m.PROJECTS.length, 'statuses:', Object.keys(m.STATUS).length) })"`(需要 node ≥ 14 支持 ESM import)。
Expected: 输出 `count: 30 statuses: 5`。

- [ ] **Step 3: 提交(可选)**

```bash
git add 3d-project-center/js/data.js
git commit -m "feat: project data with 30 projects and 5 statuses"
```

---

### Task 4: 场景构建 js/scene.js

**Files:**
- Create: `3d-project-center/js/scene.js`

- [ ] **Step 1: 创建 `3d-project-center/js/scene.js`**

```js
import * as THREE from 'three';
import { PROJECTS, STATUS, STATUS_ORDER } from './data.js';

export const ORBIT_RADIUS = {
  planning: 10,
  development: 14,
  maintenance: 18,
  update: 22,
  fix: 26,
};

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
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(canvas),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  sprite.scale.set(scale, scale, 1);
  return sprite;
}

function makeLabelSprite(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.font = 'bold 52px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#dfe9ff';
  ctx.fillText(text, 256, 64);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(canvas),
    transparent: true,
    depthWrite: false,
  }));
  sprite.scale.set(4.4, 1.1, 1);
  sprite.position.y = 1.2;
  return sprite;
}

export function buildScene(scene) {
  // ---------- 星空 ----------
  const starCount = 2200;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 120 + Math.random() * 120;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPos[i * 3 + 2] = r * Math.cos(phi);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: 0x9fb8d9, size: 0.35, transparent: true, opacity: 0.9,
  })));

  // ---------- 中心能量核 ----------
  const core = new THREE.Group();
  core.add(new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x6fb7ff }),
  ));
  core.add(new THREE.Mesh(
    new THREE.SphereGeometry(1.9, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x7fb2ff, transparent: true, opacity: 0.15, side: THREE.DoubleSide }),
  ));
  core.add(makeGlowSprite('#4a9eff', 9));
  const corePCount = 260;
  const corePPos = new Float32Array(corePCount * 3);
  for (let i = 0; i < corePCount; i++) {
    const r = Math.cbrt(Math.random()) * 1.6;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    corePPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    corePPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    corePPos[i * 3 + 2] = r * Math.cos(phi);
  }
  const corePGeo = new THREE.BufferGeometry();
  corePGeo.setAttribute('position', new THREE.BufferAttribute(corePPos, 3));
  core.add(new THREE.Points(corePGeo, new THREE.PointsMaterial({
    color: 0xa8d4ff, size: 0.06, transparent: true, opacity: 0.9,
  })));
  scene.add(core);

  // ---------- 轨道 ----------
  const orbitGroups = {};
  STATUS_ORDER.forEach((status) => {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(ORBIT_RADIUS[status] - 0.03, ORBIT_RADIUS[status] + 0.03, 128),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(STATUS[status].color),
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    g.add(ring);
    scene.add(g);
    orbitGroups[status] = g;
  });

  // ---------- 行星 ----------
  const planetGroups = [];
  const pickables = [];

  const perStatus = {};
  STATUS_ORDER.forEach((s) => { perStatus[s] = PROJECTS.filter((p) => p.status === s).length; });
  const seen = {};
  STATUS_ORDER.forEach((s) => { seen[s] = 0; });

  PROJECTS.forEach((proj) => {
    const status = proj.status;
    const color = new THREE.Color(STATUS[status].color);
    const radius = ORBIT_RADIUS[status];
    const total = Math.max(perStatus[status], 1);
    const angle = ((seen[status] + 0.5) / total) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
    seen[status] += 1;

    const group = new THREE.Group();

    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 24, 24),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3, side: THREE.DoubleSide }),
    );
    shell.userData.projectId = proj.id;
    group.add(shell);
    pickables.push(shell);

    const coreMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 16, 16),
      new THREE.MeshBasicMaterial({ color: color.clone().lerp(new THREE.Color(0xffffff), 0.45) }),
    );
    group.add(coreMesh);

    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.72, 0.88, 32),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, side: THREE.DoubleSide }),
    );
    halo.rotation.x = -Math.PI / 2 + 0.4;
    group.add(halo);

    const glow = makeGlowSprite(STATUS[status].color, 2.6);
    group.add(glow);

    const label = makeLabelSprite(proj.nameZh);
    group.add(label);

    group.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    scene.add(group);

    const speed = 0.12 + 0.5 / radius;
    planetGroups.push({
      group, data: proj, angle, speed, radius,
      shell, coreMesh, halo, glow, label,
    });
  });

  // ---------- 更新 ----------
  function update(dt, camera) {
    core.rotation.y += dt * 0.15;
    planetGroups.forEach((p) => {
      p.angle += p.speed * dt;
      p.group.position.set(Math.cos(p.angle) * p.radius, 0, Math.sin(p.angle) * p.radius);
      p.coreMesh.rotation.y += dt * 0.8;
      if (p.data.status === 'fix') {
        const pulse = 0.55 + 0.45 * Math.sin(performance.now() * 0.006);
        p.halo.material.opacity = pulse;
      }
      const dist = camera.position.distanceTo(p.group.position);
      p.label.visible = dist < 26;
    });
  }

  return { orbitGroups, planetGroups, pickables, update };
}
```

- [ ] **Step 2: 验证**

确保 Task 1/2/3 已完成。用 playwright MCP `browser_navigate` 打开 `http://localhost:8000`,等待 2 秒,`browser_take_screenshot`。
Expected: 场景渲染出星空、中心蓝色能量核、5 条半透明轨道环(最内层 10 单位灰白环为规划,14 单位蓝环上有约 30 颗蓝色行星带文字标签)、底部提示。`browser_console_messages` 无错误。

- [ ] **Step 3: 提交(可选)**

```bash
git add 3d-project-center/js/scene.js
git commit -m "feat: galaxy scene with starfield, core, orbits and planets"
```

---

### Task 5: 交互 js/main.js

**Files:**
- Create: `3d-project-center/js/main.js`

- [ ] **Step 1: 创建 `3d-project-center/js/main.js`**

```js
import { STATUS } from './data.js';

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function initInteraction({ renderer, camera, controls, galaxy, home }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const dom = renderer.domElement;

  let hovered = null;
  let selected = null;
  let state = 'idle'; // idle | flying | focused
  let fly = null;     // { fromPos, fromTarget, toPos, toTarget, t, duration }

  const panel = document.getElementById('detail-panel');
  const panelContent = document.getElementById('panel-content');
  const closeBtn = document.getElementById('panel-close');

  // ---------- 拾取 ----------
  function pick() {
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(galaxy.pickables, false);
    const rec = hits.length ? galaxy.planetGroups.find((p) => p.data.id === hits[0].object.userData.projectId) : null;
    if (rec !== hovered) {
      if (hovered && hovered !== selected) setHover(hovered, false);
      hovered = rec;
      if (hovered && hovered !== selected) setHover(hovered, true);
    }
    dom.style.cursor = rec ? 'pointer' : 'default';
  }

  function setHover(rec, on) {
    if (on) {
      rec.group.scale.set(1.3, 1.3, 1.3);
      rec.glow.scale.set(3.6, 3.6, 1);
      rec.shell.material.opacity = 0.5;
    } else {
      rec.group.scale.set(1, 1, 1);
      rec.glow.scale.set(2.6, 2.6, 1);
      rec.shell.material.opacity = 0.3;
    }
  }

  function resetSelection() {
    if (selected) {
      selected.group.scale.set(1, 1, 1);
      selected.glow.scale.set(2.6, 2.6, 1);
      selected.shell.material.opacity = 0.3;
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
  }

  // ---------- 面板 ----------
  function openPanel(proj) {
    const s = STATUS[proj.status];
    panelContent.innerHTML = `
      <h2>${proj.nameZh}</h2>
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
    setTimeout(() => panel.classList.add('hidden'), 350);
    resetSelection();
    selected = null;
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

  dom.addEventListener('pointerup', (e) => {
    if (!isDown) return;
    isDown = false;
    const dx = e.clientX - downX;
    const dy = e.clientY - downY;
    if (dx * dx + dy * dy > 25) return; // 拖动超过 5px 视为旋转,不触发点击
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(galaxy.pickables, false);
    if (!hits.length) return;
    const rec = galaxy.planetGroups.find((p) => p.data.id === hits[0].object.userData.projectId);
    if (!rec) return;

    resetSelection();
    selected = rec;
    setHover(rec, true);

    const focusPos = rec.group.position.clone().add(new THREE.Vector3(0, 1.6, 5.6));
    const focusTarget = rec.group.position.clone();
    openPanel(rec.data);
    startFly(focusPos, focusTarget, 1.0);
  });

  closeBtn.addEventListener('click', () => {
    if (state === 'focused') closePanel();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state === 'focused') closePanel();
  });

  // ---------- 筛选 ----------
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const status = btn.dataset.status;
      galaxy.orbitGroups.forEach((g, s) => { g.visible = status === 'all' || s === status; });
      galaxy.planetGroups.forEach((p) => {
        p.group.visible = status === 'all' || p.data.status === status;
      });
    });
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
      }
    }
  }

  // 调试钩子(playwright 验证用)
  window.__galaxy = {
    select(id) {
      const rec = galaxy.planetGroups.find((p) => p.data.id === id);
      if (!rec) return;
      resetSelection();
      selected = rec;
      setHover(rec, true);
      const focusPos = rec.group.position.clone().add(new THREE.Vector3(0, 1.6, 5.6));
      const focusTarget = rec.group.position.clone();
      openPanel(rec.data);
      startFly(focusPos, focusTarget, 1.0);
    },
  };

  return { update };
}
```

- [ ] **Step 2: 验证交互**

用 playwright MCP:
1. `browser_navigate` → `http://localhost:8000`
2. `browser_evaluate`: `window.__galaxy.select('erp-php')`
3. 等待 1.2 秒,`browser_take_screenshot`
Expected: 相机飞近一颗行星,行星放大,右侧详情面板滑出,显示「开放ERP系统 / Open ERP / 开发徽章(蓝)/ PHP / 描述 / 打开仓库按钮」。
4. `browser_evaluate`: `document.getElementById('detail-panel').classList.contains('open')` → 返回 `true`
5. `browser_click` 面板上的「打开仓库」链接(target=_blank 会开新 tab;验证 `<a>` 存在即可)
6. `browser_press_key` Escape → 面板关闭,1.5 秒后相机回全景(截图确认)
7. `browser_click` 筛选按钮「开发」(`data-status="development"`),`browser_evaluate`: 通过截图确认仅蓝色轨道与行星可见。

- [ ] **Step 3: 提交(可选)**

```bash
git add 3d-project-center/js/main.js
git commit -m "feat: interaction - hover, click fly-in, detail panel, filter, esc"
```

---

### Task 6: 端到端验证

**Files:** 无修改

- [ ] **Step 1: 完整回归验证**

用 playwright MCP 依次验证:
1. `browser_navigate` → `http://localhost:8000`,截图:全景星系(中心核、5 轨道、30 行星、星空)
2. 控制台无错误:`browser_console_messages`(level error 为空)
3. `browser_evaluate`: `window.__galaxy.select('canal-rust')` → 等待 → 面板显示 Canal Rust
4. 逐个点击 6 个筛选按钮,截图确认轨道/行星显隐正确(所有行星同状态时,任意单状态筛选仅剩该轨道)
5. `browser_evaluate`: `document.querySelectorAll('.filter-btn').length` → `6`
6. Esc 返回全景
7. 视口 resize 后场景仍正常(无报错)

- [ ] **Step 2: 性能抽查**

`browser_evaluate`: 采样两次 `performance.now()` 间隔的动画帧率,确认在软件渲染下 ≥ 20fps(真实浏览器远高于此)。

- [ ] **Step 3: 提交(可选)**

```bash
git add 3d-project-center/
git commit -m "feat: 3d project center - energy galaxy complete"
```

---

## Self-Review(自审结果)

- **规格覆盖:** 文件结构 ✓(Task 1-2) 场景构成 ✓(Task 4) 状态配色 ✓(Task 3 data + Task 4 halo/glow) 交互流程 ✓(Task 5) 错误处理 ✓(index.html WebGL try-catch + fallback div) 性能 ✓(Points 合并、pixelRatio ≤2、标签距离隐藏) 测试 ✓(Task 6)
- **占位符:** 无 TBD/TODO;所有步骤含完整代码。
- **类型一致性:** `planetGroups` 记录字段(data/shell/coreMesh/halo/glow/label/group/angle/speed/radius)在 scene.js 定义、main.js 消费,一致;`pickables` 在 scene.js 导出、main.js 使用,一致;`ORBIT_RADIUS` 键与 `STATUS_ORDER` 一致。
