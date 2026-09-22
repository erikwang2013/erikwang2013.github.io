/* Erik player.js — 音乐播放器（原生,底部悬浮;跨页记忆歌曲与进度） */
'use strict';

(function () {
  var cfg = window.ERIK || {};
  var root = cfg.root || '/';

  /* 取词：i18n.js 没加载/被关掉时用中文原文兜底 */
  function T(key, args, fallback) {
    return window.erikt ? window.erikt(key, args, fallback) : fallback;
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
      var label = T('player.mode.' + mode, null, MODE_LABEL[mode]);
      els.mode.title = T('player.modeTip', [label], '播放模式：' + label + '（点击切换）');
    }
    if (els.mode) {
      els.mode.addEventListener('click', function () {
        mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
        localStorage.setItem('erik-player-mode', mode);
        updateModeUI();
      }, false);
    }
    updateModeUI();
    /* 换语言后重刷提示语（i18n.js 晚于本文件也没关系，事件是之后才发的） */
    document.addEventListener('erik:lang', updateModeUI);

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

  initPlayer();
})();
