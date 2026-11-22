/* Statistique Mensuelle — نسخة بلا أنترنيت: المعطيات كتبقى فالتيليفون (IndexedDB) */
(function () {
  const APP = 'statistique-mensuelle', DBN = 'sm-local', ST = 'kv';
  const store = {}; const ls = new Set();
  let idb = null;
  const clone = o => o == null ? o : JSON.parse(JSON.stringify(o));
  const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

  function openIdb() {
    return new Promise((res, rej) => {
      const r = indexedDB.open(DBN, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(ST);
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
  }
  function put(path) {
    if (!idb) return;
    const tx = idb.transaction(ST, 'readwrite'), os = tx.objectStore(ST);
    if (store[path] === undefined) os.delete(path); else os.put(store[path], path);
  }
  function putAll() {
    return new Promise((res, rej) => {
      const tx = idb.transaction(ST, 'readwrite'), os = tx.objectStore(ST);
      os.clear(); Object.keys(store).forEach(k => os.put(store[k], k));
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
  }
  const ready = (async () => {
    try {
      idb = await openIdb();
      await new Promise((res, rej) => {
        const tx = idb.transaction(ST, 'readonly'), os = tx.objectStore(ST), rq = os.openCursor();
        rq.onsuccess = () => { const c = rq.result; if (c) { store[c.key] = c.value; c.continue(); } else res(); };
        rq.onerror = () => rej(rq.error);
      });
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    } catch (e) { console.error('IndexedDB', e); }
  })();

  function notify() { ls.forEach(f => { try { f(); } catch (e) { console.error(e); } }); }
  let nT; const later = () => { clearTimeout(nT); nT = setTimeout(notify, 5); };
  function snapDoc(path) { const d = store[path]; return { id: path.split('/').pop(), exists: d !== undefined, data: () => clone(d), metadata: { fromCache: false } }; }
  function coll(path, filters) {
    const depth = path.split('/').length + 1;
    return {
      path,
      doc(id) { return docRef(path + '/' + (id || genId())); },
      where(f, op, v) { return coll(path, (filters || []).concat([[f, v]])); },
      _q() { const docs = Object.keys(store).filter(k => k.startsWith(path + '/') && k.split('/').length === depth).filter(k => (filters || []).every(([f, v]) => store[k] && store[k][f] === v)).map(snapDoc); return { docs, size: docs.length, empty: !docs.length }; },
      async get() { return this._q(); },
      onSnapshot(n) { const f = () => n(this._q()); ls.add(f); setTimeout(f, 0); return () => ls.delete(f); }
    };
  }
  function merge(a, b) { for (const k in b) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) merge(a[k], b[k]); else a[k] = b[k]; } }
  function docRef(path) {
    return {
      path, id: path.split('/').pop(),
      async get() { return snapDoc(path); },
      async set(d) { store[path] = clone(d); put(path); later(); },
      async update(d) { if (store[path] === undefined) throw { code: 'invalid_argument' }; merge(store[path], clone(d)); put(path); later(); },
      async delete() { delete store[path]; put(path); later(); },
      onSnapshot(n) { const f = () => n(snapDoc(path)); ls.add(f); setTimeout(f, 0); return () => ls.delete(f); },
      collection(p) { return coll(path + '/' + p); }
    };
  }
  const db = { doc: docRef, collection: p => coll(p) };

  function dlBlob(blob, filename) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }
  const downloads = { async save({ filename, data }) { dlBlob(data instanceof Blob ? data : new Blob([data]), filename); return { status: 'saved' }; } };

  /* المسؤول: رمز سري محلي */
  const OWNK = 'sm-own', PINK = 'sm-pin';
  const isOwn = () => localStorage.getItem(OWNK) === '1';
  const user = { isOwner: async () => isOwn() };

  window.claude = { use: async n => { await ready; return n === 'db' ? db : n === 'downloads' ? downloads : n === 'user' ? user : null; } };

  /* شريط الأدوات: نسخة احتياطية / استرجاع / المسؤول */
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  async function backup() {
    await ready;
    const who = (localStorage.getItem('sm-name') || 'TELEPHONE').replace(/[^A-Za-z0-9_-]+/g, '_');
    const body = JSON.stringify({ app: APP, v: 1, at: new Date().toISOString(), name: localStorage.getItem('sm-name') || '', data: store });
    dlBlob(new Blob([body], { type: 'application/json' }), 'SAUVEGARDE_' + who + '_' + today() + '.json');
    localStorage.setItem('sm-lastbk', String(Date.now())); bar();
  }
  function restore() {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = async () => {
      const f = inp.files[0]; if (!f) return;
      try {
        const o = JSON.parse(await f.text());
        if (!o || o.app !== APP || typeof o.data !== 'object') { alert('هاد الملف ماشي نسخة احتياطية ديال هاد التطبيق.'); return; }
        const n = Object.keys(o.data).filter(k => /\/e\//.test(k)).length;
        if (!confirm('غادي تتبدل المعطيات اللي فهاد التيليفون بالمعطيات اللي فالملف (' + n + ' تسجيلة، بتاريخ ' + String(o.at || '').slice(0, 10) + ').\nواش متأكد؟')) return;
        await ready; Object.keys(store).forEach(k => delete store[k]); Object.assign(store, o.data); await putAll();
        alert('ترجعات المعطيات.'); location.reload();
      } catch (e) { alert('ما قدرتش نقرا الملف: ' + e.message); }
    };
    inp.click();
  }
  function admin() {
    if (isOwn()) { if (confirm('تخرج من وضع المسؤول؟')) { localStorage.removeItem(OWNK); location.reload(); } return; }
    const pin = localStorage.getItem(PINK);
    if (!pin) {
      const p1 = prompt('أول مرة: ختار رمز سري ديال المسؤول (4 أرقام ولا كثر):'); if (!p1 || p1.length < 4) return;
      const p2 = prompt('عاود كتب الرمز:'); if (p1 !== p2) { alert('الرمز ماشي بحال بحال.'); return; }
      localStorage.setItem(PINK, p1); localStorage.setItem(OWNK, '1'); location.reload(); return;
    }
    const p = prompt('الرمز السري ديال المسؤول:'); if (p == null) return;
    if (p === pin) { localStorage.setItem(OWNK, '1'); location.reload(); } else alert('الرمز غالط.');
  }
  function setName() {
    const n = prompt('سمية هاد التيليفون (كتبان فسمية النسخة الاحتياطية)، مثلا: PJ TIFLET، المساعد 1، A1:', localStorage.getItem('sm-name') || '');
    if (n != null) { localStorage.setItem('sm-name', n.trim().toUpperCase()); bar(); }
  }
  function bar() {
    let b = document.getElementById('offbar');
    if (!b) {
      b = document.createElement('div'); b.id = 'offbar'; document.body.appendChild(b);
      b.addEventListener('click', e => { const a = e.target.closest('[data-off]'); if (!a) return; ({ bk: backup, rs: restore, ad: admin, nm: setName })[a.dataset.off](); });
    }
    const last = +localStorage.getItem('sm-lastbk') || 0, days = last ? Math.floor((Date.now() - last) / 864e5) : null, old = days == null || days >= 7;
    b.innerHTML = '<div class="offt">📱 ' + (localStorage.getItem('sm-name') || 'هاد التيليفون') + ' · المعطيات محفوظة غير فهاد التيليفون' + (old ? ' · <b>⚠️ ' + (days == null ? 'عمرك ما درتي نسخة احتياطية' : 'آخر نسخة احتياطية قبل ' + days + ' يام') + '</b>' : '') + '</div>' +
      '<div class="offb"><button type="button" data-off="bk">💾 نسخة احتياطية</button><button type="button" data-off="rs">📂 استرجاع</button><button type="button" data-off="nm">🏷 السمية</button><button type="button" data-off="ad">' + (isOwn() ? '🔓 المسؤول (خروج)' : '🔑 المسؤول') + '</button></div>';
  }
  document.addEventListener('DOMContentLoaded', bar);
  if (document.readyState !== 'loading') bar();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
})();
