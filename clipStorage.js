// Device-local clip persistence using IndexedDB.
// Native browser recording only. No cloud upload and no media-processing library.
// v4 stores the real output MIME/extension and uses the final MP4 as the playback preview.
// This keeps clips valid after refresh and avoids WebM-preview/MP4-main mismatches.
const DB_NAME = 'element6_clips_native_v4';
const STORE = 'clips';
const VERSION = 1;
const MAX_CLIPS = 30;
const MAX_REPLAYS = 50;

async function normalizeVideoBlob(blob) {
  if (!blob) return null;
  try {
    const head = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
    const isWebM = head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3;
    const isMP4 = head[4] === 0x66 && head[5] === 0x74 && head[6] === 0x79 && head[7] === 0x70;
    if (isWebM && !String(blob.type || '').includes('webm')) return new Blob([blob], { type: 'video/webm' });
    if (isMP4 && !String(blob.type || '').includes('mp4')) return new Blob([blob], { type: 'video/mp4' });
  } catch {}
  return blob;
}

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
      mime: meta.mime || blob.type || 'video/mp4',
      extension: meta.extension || (String(meta.mime || blob.type || '').includes('mp4') ? 'mp4' : 'webm'),
      size: blob.size,
      duration: Number(meta.duration) || 30,
      previewBlob: meta.previewBlob || blob,
      replay: Boolean(meta.replay),
      replayMeta: meta.replayMeta || null,
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
          replay: Boolean(row.replay),
          replayMeta: row.replayMeta || null,
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
      resolve(normalizeVideoBlob(request.result?.blob || null));
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


export async function refreshClipMetadata() {
  return listClipMetadata();
}

export async function getClipPreviewBlob(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const request = tx.objectStore(STORE).get(id);
    request.onsuccess = () => {
      db.close();
      normalizeVideoBlob(request.result?.previewBlob || request.result?.blob || null).then(resolve).catch(() => resolve(request.result?.previewBlob || request.result?.blob || null));
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}


export async function saveReplayBlob(id, blob, meta = {}) {
  return saveClipBlob(id, blob, {
    ...meta,
    replay: true,
    replayMeta: meta.replayMeta || null,
    mime: meta.mime || blob?.type || 'video/mp4',
    extension: meta.extension || 'mp4',
  });
}

export async function deleteAllReplays() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const request = store.getAll();
    request.onsuccess = () => {
      for (const row of request.result || []) if (row?.replay) store.delete(row.id);
    };
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function listReplayMetadata() {
  const rows = await listClipMetadata();
  return rows.filter(row => row.replay).slice(0, MAX_REPLAYS);
}
