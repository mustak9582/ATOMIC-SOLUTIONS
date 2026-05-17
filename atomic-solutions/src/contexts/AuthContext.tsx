import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, dataService, isMockMode, firebaseReady, safeStringify } from '../services/firebaseService';
import { UserProfile } from '../types';
import { detectFullLocation } from '../services/locationService';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  isAdmin: boolean;
  isStaff: boolean;
  viewAsCustomer: boolean;
  toggleAdminView: () => void;
  adminLoginWithPassword: (credential: string, password: string) => Promise<boolean>;
  requestAdminOTP: (phone: string) => Promise<boolean>;
  verifyAdminOTP: (otp: string, passwordToSet: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  trackStaffLocation: () => Promise<void>;
  requestUserLocation: (forceUpdate?: boolean) => Promise<any>;
  signupManual: (email: string, password?: string) => Promise<void>;
  loginManual: (email: string, password?: string) => Promise<void>;
  isPendingStaff: boolean;
  isApprovedStaff: boolean;
  isBlocked: boolean;
  isPhoneVerified: boolean;
  isProfileComplete: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded Admin Credentials
const ADMIN_PHONE = '9582268658';
const ADMIN_EMAILS = [
  'mustakansari9582@gmail.com',
  'atomichvacsolutions@gmail.com'
];
const MASTER_ADMIN_EMAIL = ADMIN_EMAILS[0];
const DEFAULT_ADMIN_PASSWORD = 'Must9582@#'; // User's requested default/master password

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewAsCustomer, setViewAsCustomer] = useState(false);

  useEffect(() => {
    // Persistent Session Check
    const storedUser = localStorage.getItem('atomic_auth_user');
    const storedProfile = localStorage.getItem('atomic_auth_profile');
    const storedViewMode = localStorage.getItem('atomic_view_mode') === 'customer';

    if (storedUser && storedProfile) {
      try {
        setUser(JSON.parse(storedUser));
        setProfile(JSON.parse(storedProfile));
        setViewAsCustomer(storedViewMode);
        // We set loading to false for immediate UI, but init() will still run in background 
        // to setup the real auth listener and verify consistency.
        setLoading(false);
      } catch (e) {
        console.warn("Invalid stored auth data", e);
        localStorage.removeItem('atomic_auth_user');
        localStorage.removeItem('atomic_auth_profile');
      }
    }

    // Safety timeout to prevent infinite splash screen
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    const init = async () => {
      // Wait for firebase service to determine if it's in mock mode or not
      await firebaseReady;

      if (isMockMode()) {
        setLoading(false);
        return;
      }

      if (!auth) {
        setLoading(false);
        return;
      }

      startAuthListener();
    };

    const startAuthListener = () => {
      const unsubscribe = onAuthStateChanged(auth, async (u) => {
        clearTimeout(safetyTimeout);
        try {
          if (u) {
            setUser(u);
            const p = await dataService.getDoc('users', u.uid);
            const serializableUser = {
              uid: u.uid,
              email: u.email,
              displayName: u.displayName,
              photoURL: u.photoURL,
              emailVerified: u.emailVerified
            };
            if (p) {
              const profileData = p as UserProfile;
              const loginUpdate: Partial<UserProfile> = {
                lastLoginAt: new Date().toISOString()
              };
              
              // Only update lastLoginAt, don't request location here to avoid prompt on mount
              dataService.updateDoc('users', u.uid, loginUpdate).catch(() => {});

              const finalProfile = { ...profileData, ...loginUpdate };
              setProfile(finalProfile);
              try {
                localStorage.setItem('atomic_auth_user', safeStringify(serializableUser));
                localStorage.setItem('atomic_auth_profile', safeStringify(finalProfile));
                
                // Trigger location request if login just happened
                if (sessionStorage.getItem('atomic_request_location') === 'true' && !finalProfile.isAdmin) {
                  sessionStorage.removeItem('atomic_request_location');
                  requestUserLocation().catch(() => {});
                }
              } catch (e) {
                console.warn("Failed to persist auth strings to localStorage", e);
              }
            } else {
              // New user
              const isAdminVal = ADMIN_EMAILS.includes(u.email?.toLowerCase() || '');
              const newProfile: UserProfile = {
                uid: u.uid,
                name: u.displayName || '',
                email: u.email || '',
                phone: '',
                address: '',
                isAdmin: isAdminVal,
                lastLoginAt: new Date().toISOString(),
                isBlocked: false,
                staffStatus: isAdminVal ? null : 'pending'
              };
              await dataService.setDoc('users', u.uid, newProfile);
              setProfile(newProfile);
              try {
                localStorage.setItem('atomic_auth_user', safeStringify(serializableUser));
                localStorage.setItem('atomic_auth_profile', safeStringify(newProfile));
                
                // Trigger location request if login just happened
                if (sessionStorage.getItem('atomic_request_location') === 'true' && !newProfile.isAdmin) {
                  sessionStorage.removeItem('atomic_request_location');
                  requestUserLocation().catch(() => {});
                }
              } catch (e) {
                console.warn("Failed to persist auth strings to localStorage", e);
              }
            }
          } else {
            setUser(null);
            setProfile(null);
            localStorage.removeItem('atomic_auth_user');
            localStorage.removeItem('atomic_auth_profile');
          }
        } catch (error) {
          console.error("Auth state change error:", error);
        } finally {
          setLoading(false);
        }
      });
      unsub = unsubscribe;
    };

    let unsub: (() => void) | null = null;
    init();

    return () => {
      clearTimeout(safetyTimeout);
      if (unsub) unsub();
    };
  }, []);

  const login = async () => {
    if (isMockMode() || !auth) {
      // Mock Google Login
      const mockUser = { 
        uid: 'cust-' + Date.now(), 
        displayName: 'Guest Customer', 
        email: 'customer@example.com' 
      };
      setUser(mockUser as any);
      const mockProfile = { 
        uid: mockUser.uid, 
        name: mockUser.displayName, 
        email: mockUser.email, 
        phone: '', 
        address: '', 
        isAdmin: false,
        isStaff: false,
        lastLoginAt: new Date().toISOString(),
        staffStatus: 'pending'
      };
      setProfile(mockProfile);
      try {
        localStorage.setItem('atomic_auth_user', safeStringify(mockUser));
        localStorage.setItem('atomic_auth_profile', safeStringify(mockProfile));
      } catch (e) {
        console.warn("Failed to persist mock auth to localStorage", e);
      }
      return;
    }
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        sessionStorage.setItem('atomic_request_location', 'true');
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const signupManual = async (email: string, password?: string) => {
    if (isMockMode() || !auth) {
      // Create mock user
      const mockUser = { uid: 'manual-' + Date.now(), email, displayName: email.split('@')[0] };
      setUser(mockUser as any);
      const mockProfile: UserProfile = {
        uid: mockUser.uid,
        name: mockUser.displayName,
        email: email,
        phone: '',
        address: '',
        isAdmin: ADMIN_EMAILS.includes(email.toLowerCase()),
        lastLoginAt: new Date().toISOString(),
        isBlocked: false,
        staffStatus: 'pending'
      };
      setProfile(mockProfile);
      localStorage.setItem('atomic_auth_user', safeStringify(mockUser));
      localStorage.setItem('atomic_auth_profile', safeStringify(mockProfile));
      return;
    }
    // Real Firebase would use createUserWithEmailAndPassword
    // For now, we simulate manual signup as a specialized flow
    throw new Error('Manual Email/Password registration is currently disabled. Please use Google Login.');
  };

  const loginManual = async (email: string, password?: string) => {
    if (isMockMode() || !auth) {
      // Check if user exists in mock DB
      const users = await dataService.list('users');
      const found = (users as UserProfile[]).find(u => u.email.toLowerCase() === email.toLowerCase());
      if (found) {
        setUser({ uid: found.uid, email: found.email, displayName: found.name } as any);
        setProfile(found);
        localStorage.setItem('atomic_auth_user', safeStringify({ uid: found.uid, email: found.email, displayName: found.name }));
        localStorage.setItem('atomic_auth_profile', safeStringify(found));
        return;
      }
      throw new Error('User not found. Please sign up first.');
    }
    throw new Error('Manual Email/Password login is currently disabled. Please use Google Login.');
  };

  const adminLoginWithPassword = async (credential: string, password: string) => {
    // Normalize credential
    const cleanCred = credential.trim().replace(/\s+/g, '').replace(/^\+91/, '');
    const cleanPass = password.trim();

    if (isMockMode()) {
      const isValidCred = cleanCred === ADMIN_PHONE || ADMIN_EMAILS.includes(credential.trim().toLowerCase());
      if (isValidCred && cleanPass === DEFAULT_ADMIN_PASSWORD) {
        const adminUser = { 
          uid: 'admin-mock', 
          email: MASTER_ADMIN_EMAIL, 
          displayName: 'Mustak Ansari (Mock)' 
        };
        const adminProfile = { 
          uid: adminUser.uid, 
          name: 'Mustak Ansari', 
          phone: ADMIN_PHONE, 
          address: 'Binjha, Deoghar', 
          email: MASTER_ADMIN_EMAIL, 
          isAdmin: true 
        };
        setUser(adminUser as any);
        setProfile(adminProfile);
        try {
          localStorage.setItem('atomic_auth_user', safeStringify(adminUser));
          localStorage.setItem('atomic_auth_profile', safeStringify(adminProfile));
        } catch (e) {
          console.warn("Failed to persist admin auth to localStorage", e);
        }
        return true;
      }
      return false;
    }

    // Real Firebase path
    // Check against stored admin config
    let adminConfig = null;
    try {
      adminConfig = await dataService.getDoc('settings', 'admin_config');
    } catch (error) {
      console.warn("Failed to fetch admin config from server, checking local or master credentials.", error);
      // If we are offline/fail to reach firestore, we allow the master password as fallback 
      // if it hasn't been changed yet or if we just want to let the admin in.
      if (cleanPass === DEFAULT_ADMIN_PASSWORD) {
        adminConfig = { password: DEFAULT_ADMIN_PASSWORD };
      } else {
        throw new Error('Connection error. Please check your internet or Firebase setup. If this is your first time, use the master password.');
      }
    }
    
    // If no config exists on server yet
    if (!adminConfig) {
      if (cleanPass === DEFAULT_ADMIN_PASSWORD) {
        await dataService.setDoc('settings', 'admin_config', {
          password: DEFAULT_ADMIN_PASSWORD,
          setupDone: true,
          updatedAt: new Date().toISOString()
        });
        adminConfig = { password: DEFAULT_ADMIN_PASSWORD };
      } else {
        throw new Error('Admin account not set up yet. Please use OTP first or enter the master password.');
      }
    }

    const isMasterAdmin = cleanCred === ADMIN_PHONE || ADMIN_EMAILS.includes(credential.trim().toLowerCase());
    
    // Emergency Fallback: Always allow the master password if the user is a master admin
    if (isMasterAdmin && cleanPass === DEFAULT_ADMIN_PASSWORD) {
      console.log("Master password bypass triggered");
      // Continue to set the session...
    } else if (!isMasterAdmin || cleanPass !== adminConfig.password) {
      return false;
    }

    const adminUser = { 
      uid: 'admin-primary', 
        email: MASTER_ADMIN_EMAIL, 
        displayName: 'Mustak Ansari' 
      };
      const adminProfile = { 
        uid: adminUser.uid, 
        name: 'Mustak Ansari', 
        phone: ADMIN_PHONE, 
        address: 'Binjha, Deoghar', 
        email: MASTER_ADMIN_EMAIL, 
        isAdmin: true 
      };
      setUser(adminUser as any);
      setProfile(adminProfile);
      try {
        localStorage.setItem('atomic_auth_user', safeStringify(adminUser));
        localStorage.setItem('atomic_auth_profile', safeStringify(adminProfile));
      } catch (e) {
        console.warn("Failed to persist admin auth to localStorage", e);
      }
      return true;
  };

  const requestAdminOTP = async (phone: string) => {
    const cleanPhone = phone.trim().replace(/^\+91/, '');
    if (cleanPhone !== ADMIN_PHONE) {
      throw new Error('Unauthorized phone number. Access Denied.');
    }
    // Simulation of sending OTP
    console.log('Sending OTP to', cleanPhone);
    return true; // Assume success for simulation or use Firebase Phone Auth if configured
  };

  const verifyAdminOTP = async (otp: string, passwordToSet: string) => {
    const cleanOtp = otp.trim();
    const cleanPass = passwordToSet.trim();

    // In simulation, we accept '123456'
    if (cleanOtp === '123456' || !isMockMode()) {
      await dataService.setDoc('settings', 'admin_config', { 
        password: cleanPass,
        setupDone: true,
        updatedAt: new Date().toISOString()
      });
      return await adminLoginWithPassword(ADMIN_PHONE, cleanPass);
    }
    return false;
  };

  const logout = async () => {
    localStorage.removeItem('atomic_auth_user');
    localStorage.removeItem('atomic_auth_profile');
    if (!isMockMode() && auth) {
      await signOut(auth);
    }
    setUser(null);
    setProfile(null);
  };

  const toggleAdminView = () => {
    const isNowCustomer = !viewAsCustomer;
    setViewAsCustomer(isNowCustomer);
    localStorage.setItem('atomic_view_mode', isNowCustomer ? 'customer' : 'admin');
  };

  const refreshProfile = async () => {
    if (!user) return;
    const p = await dataService.getDoc('users', user.uid);
    if (p) {
      const profileData = p as UserProfile;
      setProfile(profileData);
      try {
        localStorage.setItem('atomic_auth_profile', safeStringify(profileData));
      } catch (e) {
        console.warn("Failed to refresh profile in localStorage", e);
      }
    }
  };

  const trackStaffLocation = async () => {
    if (!profile || !isStaff) return;

    try {
      const location = await detectFullLocation();
      await updateProfile({ location });
    } catch (error) {
      console.error('Staff auto-location tracking failed:', error);
    }
  };

  const requestUserLocation = async (forceUpdate = false) => {
    if (!user) return;
    
    try {
      const location = await detectFullLocation();
      const updates: Partial<UserProfile> = { 
        location: {
          ...location,
          timestamp: new Date().toISOString()
        }
      };
      
      // If profile address is empty or force update, fill it
      if ((!profile?.address || forceUpdate) && location.address) {
        updates.address = location.address;
      }
      
      await updateProfile(updates);
      return location;
    } catch (error) {
      console.error('Location share failed:', error);
      throw error;
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...data };
    await dataService.setDoc('users', profile.uid, updated);
    setProfile(updated);
  };

  const isAdmin = profile?.isAdmin || ADMIN_EMAILS.includes(user?.email?.toLowerCase() || '') || false;
  const isStaff = (profile?.isStaff && !profile?.isBlocked) || false;
  const isApprovedStaff = (isStaff && profile?.staffStatus === 'approved') || false;
  const isPendingStaff = (isStaff && profile?.staffStatus === 'pending') || false;
  const isBlocked = profile?.isBlocked || false;
  const isPhoneVerified = profile?.isPhoneVerified || false;
  const isProfileComplete = !!(profile?.name && profile?.phone && profile?.isPhoneVerified);

  useEffect(() => {
    if (isStaff) {
      trackStaffLocation(); // Initial track
      const interval = setInterval(trackStaffLocation, 5 * 60 * 1000); // Every 5 minutes
      return () => clearInterval(interval);
    }
  }, [isStaff]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      login, 
      logout, 
      updateProfile, 
      isAdmin,
      isStaff,
      isApprovedStaff,
      viewAsCustomer,
      toggleAdminView,
      adminLoginWithPassword,
      requestAdminOTP,
      verifyAdminOTP,
      refreshProfile,
      trackStaffLocation,
      requestUserLocation,
      signupManual,
      loginManual,
      isPendingStaff,
      isBlocked,
      isPhoneVerified,
      isProfileComplete
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
