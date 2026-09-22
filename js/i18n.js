/* Erik i18n.js — 中英切换（界面文案运行时替换，中文原文留在 DOM 里当兜底） */
'use strict';

(function () {
  var cfg = (window.ERIK && window.ERIK.i18n) || {};
  if (cfg.enable === false) return;

  var KEY = 'erik-lang';
  var ZH = 'zh-CN', EN = 'en';

  /* 英文词典。值可以是字符串，也可以是 [中文, 英文单数, 英文复数]（配合 data-i18n-args 的第一个数字用） */
  var DICT = {
    /* 头部 */
    'nav.search': 'Search',
    'nav.theme': 'Toggle theme',
    'nav.lang': 'Switch language',
    'nav.social': 'Social links',
    'nav.socialText': '🌐 Social',
    'nav.menu': 'Menu',
    'nav.backTop': 'Back to top 🚀',
    /* 播放器 */
    'player.expand': 'Expand player 🎵',
    'player.collapse': 'Collapse',
    'player.progress': 'Playback progress',
    'player.mode': 'Play mode',
    'player.prev': 'Previous track',
    'player.play': 'Play / Pause',
    'player.next': 'Next track',
    'player.mode.off': 'In order',
    'player.mode.all': 'Repeat all',
    'player.mode.one': 'Repeat one',
    'player.mode.shuffle': 'Shuffle',
    'player.modeTip': 'Play mode: {0} (click to switch)',
    /* 搜索 / 灯箱 / 复制 */
    'search.placeholder': 'Search posts…',
    'search.empty': 'No matching posts 🙈',
    'search.fail': 'Failed to load the search index 😢',
    'lightbox.close': 'Close',
    'lightbox.prev': 'Previous',
    'lightbox.next': 'Next',
    'copy.ok': '✅ Copied',
    /* 首页 */
    'index.hero': "Welcome to {0}'s magic world 🧙‍♂️",
    'index.posts': ['📚 {0} 篇文章', '📚 {0} post', '📚 {0} posts'],
    'index.tags': ['🏷️ {0} 个标签', '🏷️ {0} tag', '🏷️ {0} tags'],
    'index.cats': ['📂 {0} 个分类', '📂 {0} category', '📂 {0} categories'],
    'index.latest': 'Latest posts',
    /* 列表 / 归档 / 分类 / 标签 */
    'list.prev': '← Prev',
    'list.next': 'Next →',
    'list.postCount': ['{0} 篇文章', '{0} post', '{0} posts'],
    /* 归档页标题：模板自己带 .section-icon 🗂️，译文别再带图标，否则中英切换后多一个 */
    'archive.title': 'Timeline',
    'tags.title': 'All tags',
    'tag.title': 'Tag: ',
    'categories.title': 'All categories',
    'category.title': 'Category: {0}',
    'category.count': ['{0} 篇', '{0} post', '{0} posts'],
    'sidebar.posts': ['{0} 篇', '{0} post', '{0} posts'],
    'sidebar.close': 'Collapse ✕',
    /* 文章页 */
    'post.pinned': '🌟 Pinned',
    'post.readA': 'Read',
    'post.readB': 'times 👀',
    'post.words': ['📝 {0} 字', '📝 {0} word', '📝 {0} words'],
    'post.minutes': ['⏱️ {0} 分钟', '⏱️ {0} min', '⏱️ {0} min'],
    'post.author': '🧑‍💻 Author:',
    'post.link': '🔗 Permalink:',
    'post.license': '📜 License:',
    'post.licenseA': 'Licensed under',
    'post.licenseB': 'license. Please credit the source when reposting.',
    'post.reward': '🎁 Tip',
    'post.rewardAria': 'Tip the author',
    'post.alipay': '💙 Alipay',
    'post.wechat': '💚 WeChat',
    'post.navPrev': 'Previous post',
    'post.navNext': 'Next post',
    /* 页脚 / 404 / 相册 / 其它 */
    'footer.pvA': 'Total visits',
    'footer.pvB': '👀',
    'footer.uvA': 'Visitors',
    'footer.uvB': '🧑‍🚀',
    'notfound.desc': "Aliens hijacked this page 👽<br>Don't worry though — it's under control, it won't get far!",
    'notfound.home': '🚀 Back home',
    'notfound.archive': '🗂️ Browse the timeline',
    'gallery.empty': 'No photos yet — add some under the `gallery` section of _config.yml ✨',
    'encrypt.bad': 'Invalid encrypted payload 😵',
    'encrypt.ph': 'Enter password',
    'encrypt.unlock': 'Unlock',
    'encrypt.wrong': 'Wrong password, try again 🙅',
    'btn.full3d': '✨ Enable full 3D',
    'quote.open': ['「', '“'],
    'quote.close': ['」', '”'],
    'quote.by': ['—— ', '— '],
    '📬 有新消息等你': '📬 You have a new message',
    /* 文档标题（分页/分类/标签页；文章页用文章自己的标题，不换） */
    'doc.archive': '🗂️ Timeline | {0}',
    'doc.archive.year': '🗂️ Timeline: {0} | {1}',
    'doc.archive.month': '🗂️ Timeline: {0}/{1} | {2}',
    'doc.category': 'Category: {0} | {1}',
    'doc.tag': 'Tag: {0} | {1}',
    'doc.tags': 'Tags | {0}',
    'doc.categories': 'Categories | {0}'
  };

  function norm(l) {
    return /^en/i.test(String(l || '')) ? EN : ZH;
  }

  /* 语言优先级：用户选过 → 文章正文语言 → 主题默认 */
  function initial() {
    try {
      var s = localStorage.getItem(KEY);
      if (s) return norm(s);
    } catch (e) {}
    var p = window.ERIK && window.ERIK.postLang;
    if (p) return norm(p);
    return norm(cfg.default || ZH);
  }

  var lang = initial();

  /* 词条查表：配置覆盖表(theme.i18n[lang]) → 内置词典 → 空(保持原文) */
  function lookup(key, args) {
    var v = cfg[lang] && cfg[lang][key];
    if (v == null) {
      var table = lang === EN ? DICT : null;
      v = table && table[key];
    }
    if (v == null) return null;
    /* 数组：[中文, 英文] 或 [中文, 英文单数, 英文复数] */
    if (Array.isArray(v)) {
      if (lang !== EN) v = v[0];
      else v = args ? v[+args[0] === 1 ? 1 : 2] : v[1];
    }
    if (v == null) return null;
    if (args) {
      v = String(v).replace(/\{(\d+)\}/g, function (m, i) {
        return args[i] != null ? String(args[i]).trim() : m;
      });
    }
    return v;
  }

  /* 供 JS 调用：erikt('player.mode.' + mode)、erikt('copy.ok', null, '✅ 已复制')。
     key 找不到译文时返回 fallback；fallback 为空则返回 key（中文原文当 key 的配置文案就靠这个） */
  window.erikt = function (key, args, fallback) {
    var v = lookup(key, args);
    return v == null ? (fallback == null ? key : fallback) : v;
  };
  window.erikLang = lang;

  function nodes() {
    return document.querySelectorAll('[data-i18n]');
  }

  /* save=true 只在用户主动点按钮时传 —— 免得访问英文文章页就把默认语言永久存成 en */
  function apply(l, save) {
    lang = norm(l);
    window.erikLang = lang;
    var el = document.documentElement;
    el.lang = lang;
    el.setAttribute('data-lang', lang);
    el.classList.toggle('lang-en', lang === EN);
    el.classList.remove('lang-loading'); /* 文案换完了，放出 body */

    var list = nodes();
    for (var i = 0; i < list.length; i++) {
      var node = list[i];
      var key = node.getAttribute('data-i18n');
      var attrs = (node.getAttribute('data-i18n-attr') || '').split(',').filter(Boolean);
      var argsAttr = node.getAttribute('data-i18n-args');
      var args = argsAttr == null ? null : argsAttr.split('~');
      var html = node.hasAttribute('data-i18n-html');

      if (!node._zh) node._zh = { text: html ? node.innerHTML : node.textContent, attrs: {} };
      if (attrs.length) {
        attrs.forEach(function (a) {
          if (!(a in node._zh.attrs)) node._zh.attrs[a] = node.getAttribute(a);
        });
      }

      var translated = lang === EN ? lookup(key, args) : null;
      if (translated == null) {
        /* 回中文（或没配英文）：还原原文 */
        if (html) node.innerHTML = node._zh.text;
        else if (!attrs.length) node.textContent = node._zh.text;
        attrs.forEach(function (a) {
          if (node._zh.attrs[a] == null) node.removeAttribute(a);
          else node.setAttribute(a, node._zh.attrs[a]);
        });
        continue;
      }
      if (html) node.innerHTML = translated;
      else if (!attrs.length) node.textContent = translated;
      attrs.forEach(function (a) { node.setAttribute(a, translated); });
    }

    var spans = document.querySelectorAll('#lang-toggle [data-lang]');
    for (var j = 0; j < spans.length; j++) {
      spans[j].classList.toggle('active', spans[j].getAttribute('data-lang') === lang);
    }

    try { if (save) localStorage.setItem(KEY, lang); } catch (e) {}
    document.dispatchEvent(new Event('erik:lang'));
  }
  window.erikApplyLang = apply;

  var btn = document.getElementById('lang-toggle');
  if (btn) {
    btn.addEventListener('click', function () {
      var next = lang === EN ? ZH : EN;
      var alt = window.ERIK && window.ERIK.altUrl;
      if (alt) {
        /* 文章页有对译：切语言 = 跳到对译文章（已显式表态，存下来） */
        try { localStorage.setItem(KEY, norm(window.ERIK.altLang) || next); } catch (e) {}
        location.href = alt;
        return;
      }
      apply(next, true);
    }, false);
  }

  apply(lang);
})();
