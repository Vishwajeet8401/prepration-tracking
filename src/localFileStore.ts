const DB_NAME = 'prep-tracker-local-files';
const DB_VERSION = 1;
const STORE_NAME = 'files';

export interface LocalFileRecord {
  id: string;
  name: string;
  type: string;
  blob: Blob;
  createdAt: string;
}

const LOCAL_FILE_PREFIX = 'local-file:';

let dbPromise: Promise<IDBDatabase> | null = null;

function openLocalFileDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

export function createLocalFileRef(id: string, name: string): string {
  return `${LOCAL_FILE_PREFIX}${id}:${encodeURIComponent(name)}`;
}

export function parseLocalFileRef(ref: string): { id: string; name: string } | null {
  if (!ref.startsWith(LOCAL_FILE_PREFIX)) return null;
  const body = ref.slice(LOCAL_FILE_PREFIX.length);
  const separatorIndex = body.indexOf(':');
  if (separatorIndex === -1) return null;

  return {
    id: body.slice(0, separatorIndex),
    name: decodeURIComponent(body.slice(separatorIndex + 1)),
  };
}

export async function saveLocalFile(file: Blob, name: string): Promise<string> {
  const db = await openLocalFileDb();
  const id = `file-${Date.now()}-${crypto.randomUUID()}`;
  const record: LocalFileRecord = {
    id,
    name,
    type: file.type || 'application/octet-stream',
    blob: file,
    createdAt: new Date().toISOString(),
  };

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });

  return createLocalFileRef(id, name);
}

export async function getLocalFile(ref: string): Promise<LocalFileRecord | null> {
  const parsed = parseLocalFileRef(ref);
  if (!parsed) return null;

  const db = await openLocalFileDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(parsed.id);
    request.onsuccess = () => resolve((request.result as LocalFileRecord | undefined) || null);
    request.onerror = () => reject(request.error);
  });
}

export async function openLocalFile(ref: string): Promise<void> {
  const record = await getLocalFile(ref);
  if (!record) {
    alert('This local file is not available in this browser/device.');
    return;
  }

  const objectUrl = URL.createObjectURL(record.blob);
  window.open(objectUrl, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

export async function createLocalObjectUrl(ref: string): Promise<string | null> {
  const record = await getLocalFile(ref);
  if (!record) return null;
  return URL.createObjectURL(record.blob);
}
