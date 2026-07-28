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

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDPFEKzp4HoS8D3F2D3wrQYTJGtTUNzL3k",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "atomic-solution.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "atomic-solution",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "atomic-solution.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "876246031512",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:876246031512:web:893f89aecb8ebe2dab44ed",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-QLWLMV8Z6W"
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

export const dataService = {
  async getDoc<T = any>(path: string, id: string): Promise<T | null> {
    if (!db) return null;
    const snap = await getDoc(doc(db, path, id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as any as T) : null;
  },

  async setDoc(path: string, id: string, data: any) {
    if (!db) throw new Error("Firebase DB not initialized");
    await setDoc(doc(db, path, id), data, { merge: true });
  },

  async list<T = any>(path: string, constraints: any[] = []): Promise<T[]> {
    if (!db) return [];
    const processedConstraints = constraints.map(c => 
      (c && typeof c === 'object' && 'field' in c) 
        ? where(c.field, c.operator, c.value) 
        : c
    );
    const q = query(collection(db, path), ...processedConstraints);
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as any as T));
  },

  async getCollection<T = any>(path: string, constraints: any[] = []): Promise<T[]> {
    return dataService.list<T>(path, constraints);
  },

  subscribe<T = any>(path: string, callback: (data: T[]) => void, constraints: any[] = [], onError?: (err: any) => void) {
    if (!db) return () => {};
    const processedConstraints = constraints.map(c => 
      (c && typeof c === 'object' && 'field' in c) 
        ? where(c.field as string, c.operator as any, c.value) 
        : c
    );
    const q = query(collection(db, path), ...processedConstraints);
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ ...d.data(), id: d.id } as any as T)));
    }, (e) => {
      if (onError) onError(e);
      else console.error(`Firestore subscription error on ${path}:`, e);
    });
  },

  async updateDoc(path: string, id: string, data: any) {
    if (!db) throw new Error("Firebase DB not initialized");
    await updateDoc(doc(db, path, id), data);
  },

  async deleteDoc(path: string, id: string) {
    if (!db) throw new Error("Firebase DB not initialized");
    await deleteDoc(doc(db, path, id));
  },

  async addDoc(path: string, data: any) {
    if (!db) throw new Error("Firebase DB not initialized");
    const docRef = await addDoc(collection(db, path), data);
    return { ...data, id: docRef.id };
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
