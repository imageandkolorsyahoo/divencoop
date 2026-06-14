// ============================================================
// db.js — IndexedDB Offline Queue
// ============================================================
const DB = (() => {
  const DB_NAME = "DGCoopDB", DB_VER = 1;
  let _db = null;

  function open() {
    return new Promise((res, rej) => {
      if (_db) return res(_db);
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("queue"))
          db.createObjectStore("queue", { keyPath: "id", autoIncrement: true });
        if (!db.objectStoreNames.contains("cache"))
          db.createObjectStore("cache", { keyPath: "key" });
      };
      req.onsuccess = e => { _db = e.target.result; res(_db); };
      req.onerror   = e => rej(e.target.error);
    });
  }

  async function queueAction(item) {
    const db    = await open();
    const store = db.transaction("queue","readwrite").objectStore("queue");
    return new Promise((res, rej) => {
      const r = store.add({ ...item, queued: Date.now() });
      r.onsuccess = () => res(r.result);
      r.onerror   = e => rej(e.target.error);
    });
  }

  async function getPendingQueue() {
    const db    = await open();
    const store = db.transaction("queue","readonly").objectStore("queue");
    return new Promise((res, rej) => {
      const r = store.getAll();
      r.onsuccess = () => res(r.result);
      r.onerror   = e => rej(e.target.error);
    });
  }

  async function clearQueue() {
    const db    = await open();
    const store = db.transaction("queue","readwrite").objectStore("queue");
    return new Promise((res, rej) => {
      const r = store.clear();
      r.onsuccess = () => res();
      r.onerror   = e => rej(e.target.error);
    });
  }

  async function syncQueue() {
    const pending = await getPendingQueue();
    if (!pending.length) return { synced: 0, failed: 0 };
    const res = await API.sync.push(pending);
    if (res?.success) {
      await clearQueue();
      return { synced: res.data?.processed || 0, failed: res.data?.failed || 0 };
    }
    return { synced: 0, failed: pending.length };
  }

  async function cacheSet(key, value) {
    const db    = await open();
    const store = db.transaction("cache","readwrite").objectStore("cache");
    return new Promise((res, rej) => {
      const r = store.put({ key, value, ts: Date.now() });
      r.onsuccess = () => res();
      r.onerror   = e => rej(e.target.error);
    });
  }

  async function cacheGet(key, maxAgeMs = 300000) {
    const db    = await open();
    const store = db.transaction("cache","readonly").objectStore("cache");
    return new Promise((res, rej) => {
      const r = store.get(key);
      r.onsuccess = () => {
        const d = r.result;
        if (!d || Date.now()-d.ts > maxAgeMs) return res(null);
        res(d.value);
      };
      r.onerror = e => rej(e.target.error);
    });
  }

  async function clearAll() {
    const db = await open();
    await Promise.all(
      Array.from(db.objectStoreNames).map(name =>
        new Promise(res => {
          const t = db.transaction(name,"readwrite");
          t.objectStore(name).clear().onsuccess = res;
        })
      )
    );
  }

  return { queueAction, getPendingQueue, clearQueue, syncQueue, cacheSet, cacheGet, clearAll };
})();
