import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  Timestamp,
  orderBy
} from 'firebase/firestore';

const isInvalidValue = (val: any) => {
  if (!val) return true;
  if (typeof val !== 'string') return false;
  const v = val.toLowerCase();
  return v === '' || 
         v === 'undefined' || 
         v === 'null' || 
         v.includes('my_') || 
         v.includes('your_') || 
         v.includes('placeholder');
};

const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const rawAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const rawProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const rawStorageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const rawSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const rawAppId = import.meta.env.VITE_FIREBASE_APP_ID;
const rawMeasurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;

const firebaseConfig = {
  apiKey: !isInvalidValue(rawApiKey) ? rawApiKey : "AIzaSyDPFEKzp4HoS8D3F2D3wrQYTJGtTUNzL3k",
  authDomain: !isInvalidValue(rawAuthDomain) ? rawAuthDomain : "atomic-solution.firebaseapp.com",
  projectId: !isInvalidValue(rawProjectId) ? rawProjectId : "atomic-solution",
  storageBucket: !isInvalidValue(rawStorageBucket) ? rawStorageBucket : "atomic-solution.firebasestorage.app",
  messagingSenderId: !isInvalidValue(rawSenderId) ? rawSenderId : "876246031512",
  appId: !isInvalidValue(rawAppId) ? rawAppId : "1:876246031512:web:893f89aecb8ebe2dab44ed",
  measurementId: !isInvalidValue(rawMeasurementId) ? rawMeasurementId : "G-QLWLMV8Z6W"
};

const getFirebaseConfig = async () => {
  return firebaseConfig;
};

let app: any = null;
let auth: any = null;
let db: any = null;

let _resolveReady: (v: boolean) => void;
export const firebaseReady = new Promise<boolean>((resolve) => {
  _resolveReady = resolve;
});

const initializeFirebase = async () => {
  try {
    const firebaseConfig = await getFirebaseConfig();
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app, (firebaseConfig as any)?.firestoreDatabaseId || '(default)');
    _resolveReady(true);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    _resolveReady(false);
  }
};

initializeFirebase();

export { auth, db };
export const isMockMode = () => false; // Removed mock mode

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const safeStringify = (obj: any, indent = 0): string => {
  try {
    return JSON.stringify(obj, null, indent);
  } catch (e) {
    return '[Unreadable Object]';
  }
};

export const sanitizeForFirestore = (obj: any): any => {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  const clean: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = sanitizeForFirestore(value);
    }
  }
  return clean;
};

// Persistent Deleted IDs tracking to prevent deleted documents from resurrecting on refresh/re-sync
const getDeletedIds = (path: string): Set<string> => {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('atomic_deleted_' + path);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    }
  } catch (e) {}
  return new Set();
};

const markIdDeleted = (path: string, id: string) => {
  if (!id) return;
  try {
    if (typeof window !== 'undefined') {
      const set = getDeletedIds(path);
      set.add(id);
      localStorage.setItem('atomic_deleted_' + path, JSON.stringify(Array.from(set)));
    }
  } catch (e) {}
};

const unmarkIdDeleted = (path: string, id: string) => {
  if (!id) return;
  try {
    if (typeof window !== 'undefined') {
      const set = getDeletedIds(path);
      if (set.has(id)) {
        set.delete(id);
        localStorage.setItem('atomic_deleted_' + path, JSON.stringify(Array.from(set)));
      }
    }
  } catch (e) {}
};

export const dataService = {
  async getDoc<T = any>(path: string, id: string): Promise<T | null> {
    const deletedIds = getDeletedIds(path);
    if (deletedIds.has(id)) return null;

    if (!db) return null;
    const snap = await getDoc(doc(db, path, id));
    if (!snap.exists()) return null;
    const data = { id: snap.id, ...snap.data() } as any;
    if (data.isDeleted || data._deleted || data.status === 'Deleted') return null;
    return data as T;
  },

  async setDoc(path: string, id: string, data: any) {
    unmarkIdDeleted(path, id);
    const sanitized = sanitizeForFirestore(data);
    const full = { ...sanitized, id };

    try {
      if (typeof window !== 'undefined') {
        const localKey = 'atomic_local_' + path;
        const existing: any[] = JSON.parse(localStorage.getItem(localKey) || '[]');
        const idx = existing.findIndex((d: any) => d.id === id);
        if (idx !== -1) existing[idx] = { ...existing[idx], ...full };
        else existing.unshift(full);
        localStorage.setItem(localKey, JSON.stringify(existing));
        window.dispatchEvent(new CustomEvent(`atomic_${path}_updated`, { detail: full }));
      }
    } catch (e) {}

    try {
      if (['bookings', 'notifications', 'invoices'].includes(path)) {
        fetch(`/api/${path}/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(full)
        }).catch(() => {});
      }
    } catch (e) {}

    if (db) {
      try {
        await setDoc(doc(db, path, id), sanitized, { merge: true });
      } catch (err: any) {
        console.warn(`Firestore setDoc fallback on ${path}:`, err?.message || err);
      }
    }
  },

  async list<T = any>(path: string, constraints: any[] = []): Promise<T[]> {
    const deletedIds = getDeletedIds(path);
    const isValid = (d: any) => d && d.id && !deletedIds.has(d.id) && !d.isDeleted && !d._deleted && d.status !== 'Deleted';

    if (!db) {
      try {
        if (typeof window !== 'undefined') {
          const local = JSON.parse(localStorage.getItem('atomic_local_' + path) || '[]');
          return local.filter(isValid);
        }
      } catch (err) {}
      return [];
    }

    try {
      const processedConstraints = constraints.map(c => 
        (c && typeof c === 'object' && 'field' in c) 
          ? where(c.field, c.operator, c.value) 
          : c
      );
      const q = query(collection(db, path), ...processedConstraints);
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as any as T));
      return list.filter(isValid);
    } catch (e) {
      try {
        if (typeof window !== 'undefined') {
          const local = JSON.parse(localStorage.getItem('atomic_local_' + path) || '[]');
          return local.filter(isValid);
        }
      } catch (err) {}
      return [];
    }
  },

  async getCollection<T = any>(path: string, constraints: any[] = []): Promise<T[]> {
    return dataService.list<T>(path, constraints);
  },

  subscribe<T = any>(path: string, callback: (data: T[]) => void, constraints: any[] = [], onError?: (err: any) => void) {
    const localKey = 'atomic_local_' + path;

    const getMerged = (fsDocs: any[] = []) => {
      const deletedIds = getDeletedIds(path);
      const isValid = (d: any) => d && d.id && !deletedIds.has(d.id) && !d.isDeleted && !d._deleted && d.status !== 'Deleted';

      let localDocs: any[] = [];
      try {
        if (typeof window !== 'undefined') {
          localDocs = JSON.parse(localStorage.getItem(localKey) || '[]');
        }
      } catch (e) {}

      const map = new Map<string, any>();
      localDocs.filter(isValid).forEach(d => { if (d && d.id) map.set(d.id, d); });
      fsDocs.filter(isValid).forEach(d => { if (d && d.id) map.set(d.id, { ...(map.get(d.id) || {}), ...d }); });

      let list = Array.from(map.values()).filter(isValid);
      if (constraints && constraints.length > 0) {
        constraints.forEach(c => {
          if (c && typeof c === 'object' && 'field' in c && c.operator === '==') {
            list = list.filter((item: any) => item[c.field] === c.value);
          }
        });
      }
      return list as T[];
    };

    // Initial server sync
    if (['bookings', 'notifications', 'invoices'].includes(path)) {
      fetch(`/api/${path}`)
        .then(res => res.ok ? res.json() : null)
        .then(serverDocs => {
          if (Array.isArray(serverDocs)) {
            const deletedIds = getDeletedIds(path);
            const isValid = (d: any) => d && d.id && !deletedIds.has(d.id) && !d.isDeleted && !d._deleted && d.status !== 'Deleted';
            const validServerDocs = serverDocs.filter(isValid);

            try {
              if (typeof window !== 'undefined') {
                const current: any[] = JSON.parse(localStorage.getItem(localKey) || '[]').filter(isValid);
                const map = new Map();
                current.forEach(d => { if (d?.id) map.set(d.id, d); });
                validServerDocs.forEach(d => { if (d?.id) map.set(d.id, { ...(map.get(d.id) || {}), ...d }); });
                localStorage.setItem(localKey, JSON.stringify(Array.from(map.values())));
              }
            } catch (e) {}
            callback(getMerged());
          }
        })
        .catch(() => {});
    }

    const handleLocalChange = () => {
      callback(getMerged());
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(`atomic_${path}_updated`, handleLocalChange);
      window.addEventListener('storage', handleLocalChange);
    }

    // Deliver immediately
    callback(getMerged());

    if (!db) {
      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener(`atomic_${path}_updated`, handleLocalChange);
          window.removeEventListener('storage', handleLocalChange);
        }
      };
    }

    try {
      const processedConstraints = constraints.map(c => 
        (c && typeof c === 'object' && 'field' in c) 
          ? where(c.field as string, c.operator as any, c.value) 
          : c
      );
      const q = query(collection(db, path), ...processedConstraints);
      const unsub = onSnapshot(q, (snap) => {
        const fsList = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        callback(getMerged(fsList));
      }, (e) => {
        console.warn(`Firestore subscription fallback for ${path}:`, e?.message || e);
        callback(getMerged());
        if (onError) onError(e);
      });

      return () => {
        unsub();
        if (typeof window !== 'undefined') {
          window.removeEventListener(`atomic_${path}_updated`, handleLocalChange);
          window.removeEventListener('storage', handleLocalChange);
        }
      };
    } catch (e) {
      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener(`atomic_${path}_updated`, handleLocalChange);
          window.removeEventListener('storage', handleLocalChange);
        }
      };
    }
  },

  async updateDoc(path: string, id: string, data: any) {
    const sanitized = sanitizeForFirestore(data);

    try {
      if (typeof window !== 'undefined') {
        const localKey = 'atomic_local_' + path;
        const existing: any[] = JSON.parse(localStorage.getItem(localKey) || '[]');
        const idx = existing.findIndex((d: any) => d.id === id);
        if (idx !== -1) {
          existing[idx] = { ...existing[idx], ...sanitized };
          localStorage.setItem(localKey, JSON.stringify(existing));
          window.dispatchEvent(new CustomEvent(`atomic_${path}_updated`, { detail: existing[idx] }));
        }
      }
    } catch (e) {}

    try {
      if (['bookings', 'notifications', 'invoices'].includes(path)) {
        fetch(`/api/${path}/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sanitized)
        }).catch(() => {});
      }
    } catch (e) {}

    if (db) {
      try {
        await updateDoc(doc(db, path, id), sanitized);
      } catch (err: any) {
        console.warn(`Firestore updateDoc fallback on ${path}:`, err?.message || err);
      }
    }
  },

  async deleteDoc(path: string, id: string) {
    if (!id) return;
    markIdDeleted(path, id);

    try {
      if (typeof window !== 'undefined') {
        const localKey = 'atomic_local_' + path;
        const existing: any[] = JSON.parse(localStorage.getItem(localKey) || '[]');
        const filtered = existing.filter((d: any) => d && d.id !== id);
        localStorage.setItem(localKey, JSON.stringify(filtered));
        window.dispatchEvent(new CustomEvent(`atomic_${path}_updated`, { detail: { id, deleted: true } }));
      }
    } catch (e) {}

    try {
      if (['bookings', 'notifications', 'services', 'invoices'].includes(path)) {
        await fetch(`/api/${path}/${encodeURIComponent(id)}`, {
          method: 'DELETE'
        });
      }
    } catch (e) {}

    if (db) {
      try {
        await deleteDoc(doc(db, path, id));
      } catch (err: any) {
        console.warn(`Firestore deleteDoc fallback on ${path}:`, err?.message || err);
        try {
          await setDoc(doc(db, path, id), { isDeleted: true, status: 'Deleted', _deleted: true }, { merge: true });
        } catch (err2: any) {}
      }
    }
  },

  async addDoc(path: string, data: any) {
    const sanitized = sanitizeForFirestore(data);
    const assignedId = sanitized.id || `${path}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    unmarkIdDeleted(path, assignedId);
    const fullDoc = { ...sanitized, id: assignedId };

    // 1. Always save to local cache and server immediately
    try {
      if (typeof window !== 'undefined') {
        const localKey = 'atomic_local_' + path;
        const existing: any[] = JSON.parse(localStorage.getItem(localKey) || '[]');
        const existingIdx = existing.findIndex((d: any) => d.id === assignedId);
        if (existingIdx !== -1) existing[existingIdx] = fullDoc;
        else existing.unshift(fullDoc);
        localStorage.setItem(localKey, JSON.stringify(existing));
        window.dispatchEvent(new CustomEvent(`atomic_${path}_updated`, { detail: fullDoc }));
      }
    } catch (e) {}

    try {
      if (['bookings', 'notifications', 'invoices'].includes(path)) {
        fetch(`/api/${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullDoc)
        }).catch(() => {});
      }
    } catch (e) {}

    // 3. Attempt Firestore
    if (db) {
      try {
        const docRef = await addDoc(collection(db, path), sanitized);
        unmarkIdDeleted(path, docRef.id);
        return { ...sanitized, id: docRef.id };
      } catch (err: any) {
        console.warn(`Firestore addDoc permission/network fallback on ${path}:`, err?.message || err);
        return fullDoc;
      }
    }

    return fullDoc;
  },

  subscribeDoc(path: string, id: string, callback: (data: any) => void) {
    if (!db) return () => {};
    const docRef = doc(db, path, id);
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        callback({ ...snap.data(), id: snap.id });
      } else {
        callback(null);
      }
    });
  }
};


export const chatService = {
  async sendMessage(userId, senderId, senderName, content) {
    if (!db) return;
    const timestamp = new Date().toISOString();
    
    // Create or update the main chat document
    const chatRef = doc(db, 'chats', userId);
    await setDoc(chatRef, {
      userId,
      userName: senderName,
      lastMessage: content,
      lastMessageTime: timestamp,
      unreadCountAdmin: senderId === userId ? 1 : 0, // In a real app we'd increment, but simplify for now
      unreadCountUser: senderId === 'admin' ? 1 : 0
    }, { merge: true });

    // Add message to subcollection
    const msgRef = collection(db, 'chats', userId, 'messages');
    await addDoc(msgRef, {
      senderId,
      content,
      timestamp,
      read: false
    });
  },

  subscribeToMessages(userId, callback) {
    if (!db) return () => {};
    // Query ordered by timestamp
    const q = query(
      collection(db, 'chats', userId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    }, (error) => console.error('Error fetching messages:', error));
  },

  subscribeToAllChats(callback) {
    if (!db) return () => {};
    const q = query(collection(db, 'chats'), orderBy('lastMessageTime', 'desc'));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    }, (error) => console.error('Error fetching all chats:', error));
  },
  
  async markAsRead(userId, isUser) {
    if (!db) return;
    const chatRef = doc(db, 'chats', userId);
    if (isUser) {
      await updateDoc(chatRef, { unreadCountUser: 0 });
    } else {
      await updateDoc(chatRef, { unreadCountAdmin: 0 });
    }
  }
};
