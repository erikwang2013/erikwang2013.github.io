# 3D 项目中心 (Energy Galaxy) — 设计文档

日期:2026-08-09
状态:已确认

## 目标

用 Three.js 构建一个开源的 3D 项目中心,以"星系/行星轨道式"布局展示 30 个 GitHub 项目。每个项目可单独查看,并带规划/开发/维护/更新/修复五种状态。

## 关键决策(用户确认)

| 决策点 | 选择 |
|--------|------|
| 布局形态 | 星系/行星轨道式,按状态分层轨道 |
| 行星风格 | 能量行星风:半透明球壳 + 粒子核心 + 状态色光环 |
| 状态数据 | 30 个项目初始全部为「开发」,配置化可随时修改 |
| 技术形态 | 静态多文件,本地引入 three.js(vendor),零构建、零网络依赖 |
| 详情展示 | 点击 → 相机飞入 + HTML 详情面板 |

## 文件结构

```
/home/wwwroot/bag/open/3d-project-center/
├── index.html              # 单页入口
├── css/style.css           # HUD、详情面板、筛选 UI 样式
├── js/
│   ├── data.js             # 29 个项目配置(全局 PROJECTS 数组)
│   ├── scene.js            # 场景构建:轨道、行星、星空、中心核
│   └── main.js             # 交互:相机飞入、点击拾取、面板控制、筛选
└── vendor/
    └── three.module.js     # Three.js 本地副本(ES Module)
```

所有 JS 使用 ES Modules,index.html 以 `<script type="module">` 方式引入。双击 index.html 即可运行,无需任何构建工具。

## 场景构成

| 元素 | 实现要点 |
|------|----------|
| 中心能量核 | 半透明发光球(ShaderMaterial 或 MeshBasicMaterial + glow sprite)+ 内部粒子,缓慢自转 |
| 5 条轨道 | 按状态分层,从内到外:规划→开发→维护→更新→修复;半透明圆环(RingGeometry/LineLoop),轨道半径递增 |
| 30 颗能量行星 | 半透明球壳 + 发光粒子核心 + 状态色光环(粒子环或环状 Sprite);按状态分布到对应轨道;公转 + 自转;行星轨道相位随机 |
| 项目标签 | Sprite 文字标签(CanvasTexture 生成),近景显示、远景隐藏(按相机距离切换) |
| 星空背景 | 数千颗随机粒子(Points),深空背景 |
| 轨道动画 | 不同轨道公转速度不同(内快外慢),由统一时钟驱动 |

## 状态配色

| 状态 | 颜色 | 额外效果 |
|------|------|----------|
| 规划 | #C0C4CC 灰白 | 无 |
| 开发 | #4A9EFF 亮蓝 | 无 |
| 维护 | #34C77B 绿色 | 无 |
| 更新 | #A78BFA 紫色 | 无 |
| 修复 | #FF5A5A 红色 | 光环脉冲闪烁 |

状态色映射到行星核心光、光环和 HUD 徽章。项目均为中文名 + 英文名双显示。

## 项目数据 (js/data.js)

每个项目字段:`id, nameZh(中文名), nameEn(英文名), githubUrl, status, language, description`。

- 30 个项目(用户列表实为 30 个),状态初始全部为 `development`(开发)。
- 两个笔误链接修正为 GitHub 惯例格式:
  - aetherupload-webman → `https://github.com/erikwang2013/aetherupload-webman`
  - consul-php → `https://github.com/erikwang2013/consul-php`
- 描述由项目类型合理撰写(业务系统/框架/工具类),保持简短。

## 交互流程

1. **悬停**:行星放大 1.3x + 光环增亮,cursor: pointer
2. **点击**:相机沿直线平滑飞向行星(TWEEN 或手动缓动)→ 行星居中 → 右侧详情面板滑出
3. **详情面板**:中文名/英文名/状态徽章/语言标签/描述/GitHub 链接/「打开仓库」按钮(新标签页)
4. **HUD 左上**:标题 + 状态筛选按钮(全部/规划/开发/维护/更新/修复),筛选时非目标轨道行星淡出/隐藏
5. **图例**:右下角五状态色说明;左下角操作提示(拖动旋转/滚轮缩放/点击查看)
6. **Esc**:关闭面板,相机飞回全景视角

## 错误处理

- WebGL 不支持:显示提示文案并中止
- three.module.js 加载失败:页面显示错误提示
- 无网络依赖:所有资源本地化

## 性能

- 粒子使用合并的 Points,不逐个创建 Mesh
- renderer.setPixelRatio 限制(≤2)
- 行星 Mesh 数量小(30),Sprite 标签按距离控制显示

## 测试方式

浏览器打开 index.html,验证:
- 场景渲染(中心核/轨道/行星/星空)
- 悬停高亮、点击飞入、面板展示
- 状态筛选按钮
- Esc 返回全景
- 面板内 GitHub 链接跳转
