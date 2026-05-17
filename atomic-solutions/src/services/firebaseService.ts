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
// Check if keys are placeholders or empty
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

// Handle missing config gracefully
const getFirebaseConfig = async () => {
  // 1. Try environment variables first (most reliable in production/deployment)
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

  if (envConfig.apiKey && !isInvalidValue(envConfig.apiKey)) {
    console.log("Using environment variables for project:", envConfig.projectId);
    return envConfig;
  }

  // 2. Try the generated config file (common in local AI Studio dev environment)
  try {
    const response = await fetch("/firebase-applet-config.json").catch(() => null);
    if (response && response.ok) {
      const config = await response.json();
      if (config && config.apiKey && !isInvalidValue(config.apiKey)) {
        console.log("Using firebase-applet-config.json");
        return config;
      }
    }
  } catch (e) {
    // Silent catch
  }

  // 3. Try window config (fallback for some embedded scenarios)
  // @ts-ignore
  if (typeof window !== 'undefined' && window.__FIREBASE_CONFIG__ && !isInvalidValue(window.__FIREBASE_CONFIG__.apiKey)) {
    console.log("Using window.__FIREBASE_CONFIG__");
    // @ts-ignore
    return window.__FIREBASE_CONFIG__;
  }

  console.warn("NO VALID FIREBASE CONFIG FOUND. Entering Mock Mode. To use real Firebase, please ensure you have set up Firebase.");
  return null;
};

// Check if running in "Mock Mode"
let isMocked = true;
let app: any = null;
let auth: any = null;
let db: any = null;

let _resolveReady: (v: boolean) => void;
export const firebaseReady = new Promise<boolean>((resolve) => {
  _resolveReady = resolve;
  
  // Safety timeout for firebaseReady to prevent infinite app hang
  setTimeout(() => {
    if (_resolveReady) {
      console.warn("Firebase initialization timed out, defaulting to mock mode for safety");
      isMocked = true;
      _resolveReady(false);
    }
  }, 5000);
});

const initializeFirebase = async () => {
  const firebaseConfig = await getFirebaseConfig();
  const appAvailable = !!(firebaseConfig && !isInvalidValue(firebaseConfig.apiKey));
  
  if (appAvailable) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app, (firebaseConfig as any)?.firestoreDatabaseId || '(default)');
    isMocked = false;
    
    // Validate Connection to Firestore in background
    testConnection(db);
    _resolveReady(true);
  } else {
    console.warn("Firebase not available, using mock mode");
    isMocked = true;
    _resolveReady(false);
  }
};

// Initialize immediately but don't block module load
initializeFirebase().catch(err => {
  console.error("Critical error during Firebase initialization:", err);
});

export { auth, db };
export const isMockMode = () => isMocked;

// Validate Connection to Firestore
async function testConnection(dbInstance: any) {
  if (!dbInstance) return;
  try {
    const { getDocFromServer, doc: firestoreDoc } = await import('firebase/firestore');
    // Using a more reliable way to test connection
    await getDocFromServer(firestoreDoc(dbInstance, '_connection_test_', 'ping')).catch((err) => {
      // If it's a permission error, it means we ARE connected but just can't read the test doc
      if (err.code === 'permission-denied') {
        console.log('Firebase connection verified (permission denied on test path is normal)');
        return;
      }
      throw err;
    });
    console.log('Firebase connection check completed');
  } catch (error) {
    console.warn("Firebase connection warning:", error);
  }
}

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
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || false,
      isAnonymous: auth?.currentUser?.isAnonymous || false,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  
  const stringified = safeStringify(errInfo);
  console.error('[Firestore Error]', operationType, path, errInfo.error);
  
  // Throw a standard Error with the message, but attach the info for debugging if needed
  const finalError = new Error(errInfo.error || 'Unknown Firestore error');
  (finalError as any).firestoreInfo = errInfo;
  (finalError as any).stringified = stringified;
  throw finalError;
}

// Mock database using localStorage if Firebase is not ready
const MOCK_STORAGE_KEY = 'atomic_solutions_db';
const getMockDB = () => {
  const fallbackObj = { "users": {}, "bookings": {}, "services": {}, "settings": {}, "gallery": {}, "categories": {}, "notifications": {}, "reviews": {}, "reports": {}, "invoices": {} };
  try {
    const data = typeof window !== 'undefined' ? localStorage.getItem(MOCK_STORAGE_KEY) : null;
    if (!data) return fallbackObj;
    return JSON.parse(data);
  } catch (e) {
    console.error("Error parsing mock database from localStorage:", e);
    return fallbackObj;
  }
};
const saveMockDB = (data: any) => {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, safeStringify(data));
    // Notify subscribers
    try {
      if (typeof window !== 'undefined') {
        const eventName = 'mock_db_update';
        let event: Event;
        try {
          // Use a safer way to create events across different browsers/environments
          // Note: In some restricted environments (like certain iframes), 'new CustomEvent' or 'new Event'
          // might trigger a TypeError: Illegal constructor. document.createEvent is safer.
          event = document.createEvent('Event');
          event.initEvent(eventName, true, true);
        } catch (e) {
          console.warn("Event creation failed, attempting direct broadcast if applicable", e);
          return;
        }
        window.dispatchEvent(event);
      }
    } catch (e) {
      console.warn("Failed to dispatch mock sync event", e);
    }
  } catch (e) {
    console.error("Failed to save to mock DB: JSON serialization error (likely circular structure)", e);
    // Try to remove likely culprits if we can identify them, but for now just log
  }
};

const mockSubscribers: { path: string, callback: (data: any[]) => void }[] = [];

// Intelligent fallback for offline errors
const isOfflineError = (e: any) => {
  const msg = e?.message || String(e);
  return msg.includes('offline') || msg.includes('network') || msg.includes('failed-precondition');
};

/**
 * Safely stringify an object that might contain circular references or system objects.
 */
export const safeStringify = (obj: any, indent = 0): string => {
  const cache = new WeakSet();
  
  const replacer = (key: string, value: any) => {
    try {
      // Basic types
      if (value === null || typeof value !== 'object') {
        // Still check functions as they can be circular via properties
        if (typeof value === 'function') {
           return `[Function: ${value.name || 'anonymous'}]`;
        }
        return value;
      }

      // Circular reference check
      if (cache.has(value)) {
        return '[Circular]';
      }
      
      // Handle Firebase internal objects - catch-all for obfuscated names like Y2, Ka
      // Check this BEFORE adding to cache to avoid deep traversal of SDK objects
      if (value.constructor && value.constructor.name) {
        const name = value.constructor.name;
        // Check for known SDK problematic types or mangled names (like Y2, Ka, src, etc)
        if (
          name.length <= 3 || 
          ['Firestore', 'DocumentReference', 'DocumentSnapshot', 'CollectionReference', 'Query', 'Auth', 'App', 'Y2', 'Ka', 'Yh', 'Va', 'Qa'].includes(name) ||
          // Also check for common properties that identify these internal objects
          (value.firestore && value.id) || 
          (value.app && (value.options || value.container)) ||
          // Aggressive check for properties that look like SDK internals
          (value.i && value.src && value.constructor.name.length < 5)
        ) {
           return `[SDK Object: ${name}${value.id ? ' ' + value.id : ''}]`;
        }
        
        if (['HTMLDocument', 'Window', 'Location', 'Navigator', 'Storage'].includes(name)) {
          return `[Browser ${name}]`;
        }
      }

      // Safety for objects that can't be put in WeakSet
      try {
        cache.add(value);
      } catch (e) {
        // Fallback for primitives or non-object types that somehow reached here
        return String(value);
      }

      // Handle React elements
      if (value.$$typeof) {
        return '[React Element]';
      }

      // Handle large/system objects that shouldn't be stringified
      if (typeof window !== 'undefined' && (value === window || value === document || value === navigator)) {
        return '[System Object]';
      }

      // Handle DOM elements
      if (typeof Node !== 'undefined' && value instanceof Node) {
        return `[DOM Element: ${value.nodeName}]`;
      }

      return value;
    } catch (err) {
      return '[Unreadable Object]';
    }
  };

  try {
    return JSON.stringify(obj, replacer, indent);
  } catch (e) {
    try {
      // Fallback: build a shallow clone to stringify
      const simpleObj: any = {};
      const keys = Object.keys(obj);
      for (const k of keys) {
        try {
          const val = obj[k];
          if (val === null) {
            simpleObj[k] = null;
          } else if (typeof val === 'object') {
            simpleObj[k] = Array.isArray(val) ? '[Array]' : '[Object]';
          } else if (typeof val === 'function') {
            simpleObj[k] = '[Function]';
          } else {
            simpleObj[k] = val;
          }
        } catch (inner) {
          simpleObj[k] = '[Error]';
        }
      }
      return JSON.stringify(simpleObj, null, indent);
    } catch (e2) {
      return '[Serialization Failure]';
    }
  }
};

export const dataService = {
  async getDoc(path: string, id: string) {
    if (!isMockMode() && db) {
      try {
        const snap = await getDoc(doc(db, path, id));
        return snap.exists() ? snap.data() : null;
      } catch (e) { 
        if (isOfflineError(e)) {
          console.warn(`Firestore Offline: Falling back to mock for ${path}/${id}`);
          return getMockDB()[path]?.[id] || null;
        }
        handleFirestoreError(e, OperationType.GET, `${path}/${id}`); 
      }
    } else {
      return getMockDB()[path]?.[id] || null;
    }
  },

  async setDoc(path: string, id: string, data: any) {
    if (!isMockMode() && db) {
      try { await setDoc(doc(db, path, id), data); }
      catch (e) { 
        if (isOfflineError(e)) {
          console.warn(`Firestore Offline: Saving ${path}/${id} to mock DB only.`);
          const dbData = getMockDB();
          if (!dbData[path]) dbData[path] = {};
          dbData[path][id] = data;
          saveMockDB(dbData);
          return;
        }
        handleFirestoreError(e, OperationType.WRITE, `${path}/${id}`); 
      }
    } else {
      const dbData = getMockDB();
      if (!dbData[path]) dbData[path] = {};
      dbData[path][id] = data;
      saveMockDB(dbData);
    }
  },

  async list(path: string, constraints: any[] = []) {
    if (!isMockMode() && db) {
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
      } catch (e) { 
        if (isOfflineError(e)) {
          console.warn(`Firestore Offline: Listing ${path} from mock.`);
          let dataList = Object.values(getMockDB()[path] || {});
          constraints.forEach(c => {
            if (c && typeof c === 'object' && 'field' in c) {
              dataList = dataList.filter((item: any) => item[c.field] == c.value);
            }
          });
          return dataList;
        }
        handleFirestoreError(e, OperationType.LIST, path); 
      }
    } else {
      let dataList = Object.values(getMockDB()[path] || {});
      // Simple mock filtering
      constraints.forEach(c => {
        if (c && typeof c === 'object' && 'field' in c) {
          dataList = dataList.filter((item: any) => item[c.field] == c.value);
        }
      });
      return dataList;
    }
  },

  async getCollection(path: string, constraints: any[] = []) {
    return this.list(path, constraints);
  },

  subscribe(path: string, callback: (data: any[]) => void, constraints: any[] = [], onError?: (err: any) => void) {
    const processedConstraints = constraints.map(c => 
      (c && typeof c === 'object' && 'field' in c) 
        ? where(c.field as string, c.operator as any, c.value) 
        : c
    );

    const runMockCallback = () => {
      let dataList = Object.values(getMockDB()[path] || {});
      constraints.forEach(c => {
        if (c && typeof c === 'object' && 'field' in c) {
          dataList = dataList.filter((item: any) => item[c.field] == c.value);
        }
      });
      callback(dataList);
    };

    if (!isMockMode() && db) {
      try {
        const q = query(collection(db, path), ...processedConstraints);
        return onSnapshot(q, (snap) => {
          callback(snap.docs.map(d => ({ ...d.data(), id: d.id })));
        }, (e) => {
          if (onError) onError(e);
          if (isOfflineError(e)) {
            console.warn(`Firestore Offline: Subscribing to ${path} via mock helper.`);
            runMockCallback();
            const listener = () => runMockCallback();
            window.addEventListener('mock_db_update', listener);
            // This is a bit tricky since we can't return the cleanup function from here
            // but we can warn the user.
            return;
          }
          handleFirestoreError(e, OperationType.LIST, path);
        });
      } catch (e) {
        if (onError) onError(e);
        if (isOfflineError(e)) {
          runMockCallback();
          const listener = () => runMockCallback();
          window.addEventListener('mock_db_update', listener);
          return () => window.removeEventListener('mock_db_update', listener);
        }
        handleFirestoreError(e, OperationType.LIST, path);
      }
    } else {
      runMockCallback();
      const listener = () => runMockCallback();
      window.addEventListener('mock_db_update', listener);
      return () => window.removeEventListener('mock_db_update', listener);
    }
  },

  async updateDoc(path: string, id: string, data: any) {
    if (!isMockMode() && db) {
      try { await updateDoc(doc(db, path, id), data); }
      catch (e) { 
        if (isOfflineError(e)) {
          console.warn(`Firestore Offline: Updating ${path}/${id} in mock.`);
          const dbData = getMockDB();
          if (dbData[path]?.[id]) {
            dbData[path][id] = { ...dbData[path][id], ...data };
            saveMockDB(dbData);
          }
          return;
        }
        handleFirestoreError(e, OperationType.UPDATE, `${path}/${id}`); 
      }
    } else {
      const dbData = getMockDB();
      if (dbData[path]?.[id]) {
        dbData[path][id] = { ...dbData[path][id], ...data };
        saveMockDB(dbData);
      }
    }
  },

  async deleteDoc(path: string, id: string) {
    if (!isMockMode() && db) {
      try { await deleteDoc(doc(db, path, id)); }
      catch (e) { 
        if (isOfflineError(e)) {
          console.warn(`Firestore Offline: Deleting ${path}/${id} from mock.`);
          const dbData = getMockDB();
          if (dbData[path]) delete dbData[path][id];
          saveMockDB(dbData);
          return;
        }
        handleFirestoreError(e, OperationType.DELETE, `${path}/${id}`); 
      }
    } else {
      const dbData = getMockDB();
      if (dbData[path]) delete dbData[path][id];
      saveMockDB(dbData);
    }
  },

  async addDoc(path: string, data: any) {
    if (!isMockMode() && db) {
      try {
        const docRef = await addDoc(collection(db, path), data);
        return { ...data, id: docRef.id };
      } catch (e) { 
        if (isOfflineError(e)) {
          console.warn(`Firestore Offline: Adding to ${path} in mock.`);
          const id = `mock-${Date.now()}`;
          const dbData = getMockDB();
          if (!dbData[path]) dbData[path] = {};
          dbData[path][id] = { ...data, id };
          saveMockDB(dbData);
          return { ...data, id };
        }
        handleFirestoreError(e, OperationType.WRITE, path); 
      }
    } else {
      const id = `mock-${Date.now()}`;
      const dbData = getMockDB();
      if (!dbData[path]) dbData[path] = {};
      dbData[path][id] = { ...data, id };
      saveMockDB(dbData);
      return { ...data, id };
    }
  },

  subscribeDoc(path: string, id: string, callback: (data: any) => void) {
    if (!isMockMode() && db) {
      const docRef = doc(db, path, id);
      return onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          callback({ ...snap.data(), id: snap.id });
        } else {
          callback(null);
        }
      });
    } else {
      const runMockCallback = () => {
        const data = getMockDB()[path]?.[id] || null;
        callback(data);
      };
      runMockCallback();
      const listener = () => runMockCallback();
      window.addEventListener('mock_db_update', listener);
      return () => window.removeEventListener('mock_db_update', listener);
    }
  }
};
