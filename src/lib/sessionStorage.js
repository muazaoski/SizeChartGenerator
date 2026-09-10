const DB_NAME = 'sizechartpls-sessions';
let connection;

function openDatabase() {
    if (!connection) connection = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => request.result.createObjectStore('sessions');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => { connection = null; reject(request.error); };
    });
    return connection;
}

export async function loadSession() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const request = db.transaction('sessions').objectStore('sessions').get('current');
        request.onsuccess = () => resolve(request.result?.version === 1 ? request.result.state : null);
        request.onerror = () => reject(request.error);
    });
}

export async function saveSession(state) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('sessions', 'readwrite');
        tx.objectStore('sessions').put({ version: 1, state, savedAt: Date.now() }, 'current');
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('Session save aborted'));
    });
}
