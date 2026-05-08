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

// Handle missing config gracefully
// We use environmental variables primarily to support GitHub/Vercel/External builds
const getFirebaseConfig = () => {
  // Default from environment variables
  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || '(default)'
  };

  // If env variables are missing, we check for the AI Studio generated config
  // We use a safe check to avoid build-time errors on platforms where this file doesn't exist
  if (!envConfig.apiKey || !envConfig.projectId) {
    try {
      // @ts-ignore
      const config = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG || '{}');
      if (config.apiKey) return config;
    } catch (e) {
      console.warn("Could not parse VITE_FIREBASE_CONFIG");
    }
  }

  return envConfig;
};

// We will attempt to import the config file only if we are in development or if it's explicitly allowed
// To avoid build errors, we'll use a more standard approach for AI Studio
import aiStudioConfig from '../../firebase-applet-config.json';

const firebaseConfig = (aiStudioConfig && aiStudioConfig.apiKey) ? aiStudioConfig : getFirebaseConfig();

const appAvailable = !!(firebaseConfig && (firebaseConfig.apiKey || firebaseConfig.projectId));
const app = appAvailable ? (!getApps().length ? initializeApp(firebaseConfig) : getApp()) : null;

// Explicitly initialize services with safety checks
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app, firebaseConfig?.firestoreDatabaseId || '(default)') : null;

// Validate Connection to Firestore
async function testConnection() {
  if (!db) return;
  try {
    const { getDocFromServer, doc: firestoreDoc } = await import('firebase/firestore');
    // Using a more reliable way to test connection
    await getDocFromServer(firestoreDoc(db, '_connection_test_', 'ping')).catch(() => {
      // Ignore if document not found, just checking if we can reached the server
    });
    console.log('Firebase connection check completed');
  } catch (error) {
    console.warn("Firebase connection warning:", error);
  }
}
testConnection();

export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Check if running in "Mock Mode"
export const isMockMode = !app;

// Mock database using localStorage if Firebase is not ready
const MOCK_STORAGE_KEY = 'atomic_solutions_db';
const getMockDB = () => JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) || '{ "users": {}, "bookings": {}, "services": {}, "settings": {}, "gallery": {} }');
const saveMockDB = (data: any) => localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(data));

export const dataService = {
  async getDoc(path: string, id: string) {
    if (!isMockMode && db) {
      try {
        const snap = await getDoc(doc(db, path, id));
        return snap.exists() ? snap.data() : null;
      } catch (e) { handleFirestoreError(e, OperationType.GET, `${path}/${id}`); }
    } else {
      return getMockDB()[path]?.[id] || null;
    }
  },

  async setDoc(path: string, id: string, data: any) {
    if (!isMockMode && db) {
      try { await setDoc(doc(db, path, id), data); }
      catch (e) { handleFirestoreError(e, OperationType.WRITE, `${path}/${id}`); }
    } else {
      const dbData = getMockDB();
      if (!dbData[path]) dbData[path] = {};
      dbData[path][id] = data;
      saveMockDB(dbData);
    }
  },

  async list(path: string, constraints: any[] = []) {
    if (!isMockMode && db) {
      try {
        // Map simple query objects to Firestore where constraints if needed
        const processedConstraints = constraints.map(c => 
          (c && typeof c === 'object' && 'field' in c) 
            ? where(c.field, c.operator, c.value) 
            : c
        );
        const q = query(collection(db, path), ...processedConstraints);
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ ...d.data(), id: d.id }));
      } catch (e) { handleFirestoreError(e, OperationType.LIST, path); }
    } else {
      let data = Object.values(getMockDB()[path] || {});
      // Simple mock filtering
      constraints.forEach(c => {
        if (c && typeof c === 'object' && 'field' in c) {
          data = data.filter((item: any) => item[c.field] == c.value);
        }
      });
      return data;
    }
  },

  async getCollection(path: string, constraints: any[] = []) {
    return this.list(path, constraints);
  },

  subscribe(path: string, callback: (data: any[]) => void, constraints: any[] = []) {
    if (!isMockMode && db) {
      const q = query(collection(db, path), ...constraints);
      return onSnapshot(q, (snap) => {
        callback(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      }, (e) => handleFirestoreError(e, OperationType.LIST, path));
    } else {
      callback(Object.values(getMockDB()[path] || {}));
      return () => {};
    }
  },

  async updateDoc(path: string, id: string, data: any) {
    if (!isMockMode && db) {
      try { await updateDoc(doc(db, path, id), data); }
      catch (e) { handleFirestoreError(e, OperationType.UPDATE, `${path}/${id}`); }
    } else {
      const dbData = getMockDB();
      if (dbData[path]?.[id]) {
        dbData[path][id] = { ...dbData[path][id], ...data };
        saveMockDB(dbData);
      }
    }
  },

  async deleteDoc(path: string, id: string) {
    if (!isMockMode && db) {
      try { await deleteDoc(doc(db, path, id)); }
      catch (e) { handleFirestoreError(e, OperationType.DELETE, `${path}/${id}`); }
    } else {
      const dbData = getMockDB();
      if (dbData[path]) delete dbData[path][id];
      saveMockDB(dbData);
    }
  },

  async addDoc(path: string, data: any) {
    if (!isMockMode && db) {
      try {
        const docRef = await addDoc(collection(db, path), data);
        return { ...data, id: docRef.id };
      } catch (e) { handleFirestoreError(e, OperationType.WRITE, path); }
    } else {
      const id = `mock-${Date.now()}`;
      const dbData = getMockDB();
      if (!dbData[path]) dbData[path] = {};
      dbData[path][id] = { ...data, id };
      saveMockDB(dbData);
      return { ...data, id };
    }
  }
};
