// 数据配置文件:data/projects.json
// 通过 HTTP 访问页面时加载(直接 file:// 打开会因浏览器 CORS 限制失败)

// 未配置 emoji 的项目:关键词自动匹配,匹配不到则按 id 哈希确定性选取
const EMOJI_KEYWORDS = [
  [/erp|erp系统/, '📦'],
  [/物业/, '🏢'],
  [/shop|电商|跨境/, '🛒'],
  [/广告/, '📢'],
  [/云|cloud/, '☁️'],
  [/游戏|game/, '🎮'],
  [/预约|appointment/, '📅'],
  [/性能|xhprof/, '📊'],
  [/搜索|scout/, '🔍'],
  [/jwt|认证|token/, '🎟️'],
  [/加密|encrypt/, '🔐'],
  [/工具|season/, '🧰'],
  [/上传|aetherupload/, '📤'],
  [/e-cat|微服务/, '🐱'],
  [/consul|服务发现/, '🧭'],
  [/etcd/, '🗄️'],
  [/clickhouse|数据库|数据查询/, '📈'],
  [/hashids|短id/, '🆔'],
  [/海报|poster/, '🖼️'],
  [/安全|security/, '🛡️'],
  [/雪花|snowflake/, '❄️'],
  [/工业|协议/, '🏭'],
  [/rust/, '🦀'],
  [/go\b/, '🐹'],
  [/bee/, '🐝'],
  [/教程|指南|迁移/, '📖'],
  [/druid/, '🧙'],
  [/ai|设计/, '🤖'],
  [/canal|同步/, '🚢'],
];
const EMOJI_FALLBACK = ['🚀', '⭐', '🔮', '💎', '🧩', '⚙️', '🌐', '🛠️'];

function resolveEmoji(proj) {
  if (proj.emoji) return proj.emoji;
  const text = `${proj.nameZh} ${proj.nameEn} ${proj.description}`.toLowerCase();
  for (const [re, e] of EMOJI_KEYWORDS) {
    if (re.test(text)) return e;
  }
  let h = 0;
  for (const ch of proj.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return EMOJI_FALLBACK[h % EMOJI_FALLBACK.length];
}

export async function loadData() {
  const res = await fetch('data/projects.json');
  if (!res.ok) throw new Error(`加载数据失败:HTTP ${res.status}`);
  const raw = await res.json();
  const STATUS = {};
  raw.statuses.forEach((s) => { STATUS[s.id] = { label: s.label, color: s.color }; });
  const PROJECTS = raw.projects.map((p) => ({ ...p, emoji: resolveEmoji(p) }));
  return { PROJECTS, STATUS, STATUS_ORDER: raw.statuses.map((s) => s.id) };
}
