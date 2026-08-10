/* Erik encrypt.js — AES-GCM 解密渲染（PBKDF2 参数与 CLI 工具一致） */
(function () {
  var gate = document.getElementById('encrypt-gate');
  var entry = document.querySelector('.article-entry');
  if (!gate || !entry) return;
  var cfg = (window.ERIK && window.ERIK.encrypt) || false;
  if (!cfg) return;

  var input = document.getElementById('encrypt-input');
  var btn = document.getElementById('encrypt-btn');
  var err = document.getElementById('encrypt-error');
  var cipherText = entry.innerText.trim();
  var cacheKey = 'erik-enc-' + location.pathname;
  var ttl = 7 * 24 * 3600 * 1000;

  function getCached() {
    try {
      var raw = localStorage.getItem(cacheKey);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (Date.now() - o.t > ttl) { localStorage.removeItem(cacheKey); return null; }
      return o.p;
    } catch (e) { return null; }
  }
  function setCached(p) {
    try { localStorage.setItem(cacheKey, JSON.stringify({ p: p, t: Date.now() })); } catch (e) {}
  }

  function derive(password, salt) {
    return crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey'])
      .then(function (k) {
        return crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
          k, { name: 'AES-GCM', length: 256 }, true, ['decrypt']
        );
      });
  }
  function sha256(buf) {
    return crypto.subtle.digest('SHA-256', buf).then(function (d) {
      return btoa(String.fromCharCode.apply(null, new Uint8Array(d)));
    });
  }

  function unlock(password) {
    var parts = cipherText.split(':');
    if (parts[0] !== 'erik-enc' || parts[1] !== 'v1' || parts.length !== 7) {
      if (err) { err.textContent = '密文格式无效 😵'; err.hidden = false; }
      return;
    }
    var salt = Uint8Array.from(atob(parts[2]), function (c) { return c.charCodeAt(0); });
    var iv = Uint8Array.from(atob(parts[3]), function (c) { return c.charCodeAt(0); });
    var wantHash = parts[4];
    var tag = Uint8Array.from(atob(parts[5]), function (c) { return c.charCodeAt(0); });
    var body = Uint8Array.from(atob(parts[6]), function (c) { return c.charCodeAt(0); });
    var combined = new Uint8Array(body.length + tag.length);
    combined.set(body, 0);
    combined.set(tag, body.length);

    derive(password, salt).then(function (key) {
      return crypto.subtle.exportKey('raw', key).then(function (raw) { return { key: key, raw: raw }; });
    }).then(function (o) {
      return sha256(o.raw).then(function (h) {
        if (h !== wantHash) throw new Error('bad password');
        return crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv, tagLength: 128 }, o.key, combined);
      });
    }).then(function (plainBuf) {
      entry.innerHTML = new TextDecoder().decode(plainBuf);
      gate.remove();
      setCached(password);
      if (window.ERIK && window.ERIK.toc && typeof window.ERIK.toc.rebuild === 'function') window.ERIK.toc.rebuild();
      else if (window.rebuildToc) window.rebuildToc();
    }).catch(function () {
      if (err) { err.hidden = false; input.value = ''; }
    });
  }

  btn.addEventListener('click', function () { if (input.value) unlock(input.value); });
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && input.value) unlock(input.value); });

  var cached = getCached();
  if (cached) { unlock(cached); return; }
  entry.style.display = 'none';
})();
