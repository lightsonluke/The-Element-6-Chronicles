// Device-local clip persistence using IndexedDB.
// Native browser recording only. No cloud upload and no media-processing library.
const DB_NAME = 'element6_clips_native';
const STORE = 'clips';
const VERSION = 1;
const MAX_CLIPS = 30;

function openDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) return reject(new Error('IndexedDB unavailable'));
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      let store;
      if (!db.objectStoreNames.contains(STORE)) {
        store = db.createObjectStore(STORE, { keyPath: 'id' });
      } else {
        store = request.transaction.objectStore(STORE);
      }
      if (!store.indexNames.contains('created')) {
        store.createIndex('created', 'created', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB open failed'));
  });
}

export async function saveClipBlob(id, blob, meta = {}) {
  if (!blob || blob.size <= 0) throw new Error('Empty clip');

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const created = Date.now();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({
      id,
      blob,
      created,
      mime: meta.mime || blob.type || 'video/webm',
      extension: meta.extension || (String(blob.type).includes('mp4') ? 'mp4' : 'webm'),
      size: blob.size,
      duration: Number(meta.duration) || 30,
    });
    tx.oncomplete = () => {
      db.close();
      resolve({ id, created });
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error('Clip save failed'));
    };
  });
}

export async function listClipMetadata() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const request = tx.objectStore(STORE).getAll();
    request.onsuccess = () => {
      db.close();
      resolve((request.result || [])
        .filter(row => row?.blob?.size || row?.size)
        .map(row => ({
          id: row.id,
          created: row.created,
          mime: row.mime || row.blob?.type || 'video/webm',
          extension: row.extension || (String(row.mime || row.blob?.type).includes('mp4') ? 'mp4' : 'webm'),
          size: row.size || row.blob?.size || 0,
          duration: row.duration || 30,
        }))
        .sort((a, b) => (b.created || 0) - (a.created || 0)));
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function trimClips(max = MAX_CLIPS) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const request = store.getAll();
    request.onsuccess = () => {
      const rows = (request.result || []).sort((a, b) => (b.created || 0) - (a.created || 0));
      rows.slice(Math.max(0, max)).forEach(row => store.delete(row.id));
    };
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function getClipBlob(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const request = tx.objectStore(STORE).get(id);
    request.onsuccess = () => {
      db.close();
      resolve(request.result?.blob || null);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function deleteClipBlob(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
