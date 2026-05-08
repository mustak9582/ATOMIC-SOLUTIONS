import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, dataService, isMockMode } from '../services/firebaseService';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  isAdmin: boolean;
  viewAsCustomer: boolean;
  toggleAdminView: () => void;
  adminLoginWithPassword: (credential: string, password: string) => Promise<boolean>;
  requestAdminOTP: (phone: string) => Promise<boolean>;
  verifyAdminOTP: (otp: string, passwordToSet: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded Admin Credentials
const ADMIN_PHONE = '9582268658';
const ADMIN_EMAIL = 'atomichvacsolutions@gmail.com';
const DEFAULT_ADMIN_PASSWORD = 'Must9582@#';

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
      setUser(JSON.parse(storedUser));
      setProfile(JSON.parse(storedProfile));
      setViewAsCustomer(storedViewMode);
      setLoading(false);
      return;
    }

    if (isMockMode) {
      setLoading(false);
      return;
    }

    if (!auth) {
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const p = await dataService.getDoc('users', u.uid);
        if (p) {
          const profileData = p as UserProfile;
          setProfile(profileData);
          localStorage.setItem('atomic_auth_user', JSON.stringify(u));
          localStorage.setItem('atomic_auth_profile', JSON.stringify(profileData));
        } else {
          // New user
          const newProfile: UserProfile = {
            uid: u.uid,
            name: u.displayName || '',
            email: u.email || '',
            phone: '',
            address: '',
            isAdmin: [ADMIN_EMAIL, 'mustakansari9582@gmail.com', 'atomichvacsolution@gmail.com'].includes(u.email || '')
          };
          await dataService.setDoc('users', u.uid, newProfile);
          setProfile(newProfile);
          localStorage.setItem('atomic_auth_user', JSON.stringify(u));
          localStorage.setItem('atomic_auth_profile', JSON.stringify(newProfile));
        }
      } else {
        setUser(null);
        setProfile(null);
        localStorage.removeItem('atomic_auth_user');
        localStorage.removeItem('atomic_auth_profile');
      }
      setLoading(false);
    });
  }, []);

  const login = async () => {
    if (isMockMode || !auth) {
      // Mock Google Login
      const mockUser = { 
        uid: 'cust-' + Date.now(), 
        displayName: 'Guest Customer', 
        email: 'customer@example.com' 
      } as any;
      setUser(mockUser);
      const mockProfile = { 
        uid: mockUser.uid, 
        name: mockUser.displayName, 
        email: mockUser.email, 
        phone: '', 
        address: '', 
        isAdmin: false 
      };
      setProfile(mockProfile);
      localStorage.setItem('atomic_auth_user', JSON.stringify(mockUser));
      localStorage.setItem('atomic_auth_profile', JSON.stringify(mockProfile));
      return;
    }
    await signInWithPopup(auth, googleProvider);
  };

  const adminLoginWithPassword = async (credential: string, password: string) => {
    const cleanCred = credential.trim();
    const cleanPass = password.trim();

    if (isMockMode) {
      const isValidCred = cleanCred === ADMIN_PHONE || cleanCred === ADMIN_EMAIL;
      if (isValidCred && cleanPass === DEFAULT_ADMIN_PASSWORD) {
        const adminUser = { 
          uid: 'admin-mock', 
          email: ADMIN_EMAIL, 
          displayName: 'Mushtak Ansari (Mock)' 
        } as any;
        const adminProfile = { 
          uid: adminUser.uid, 
          name: 'Mushtak Ansari', 
          phone: ADMIN_PHONE, 
          address: 'Binjha, Deoghar', 
          email: ADMIN_EMAIL, 
          isAdmin: true 
        };
        setUser(adminUser);
        setProfile(adminProfile);
        localStorage.setItem('atomic_auth_user', JSON.stringify(adminUser));
        localStorage.setItem('atomic_auth_profile', JSON.stringify(adminProfile));
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

    const isValidCred = cleanCred === ADMIN_PHONE || cleanCred === ADMIN_EMAIL;
    if (isValidCred && cleanPass === adminConfig.password) {
      const adminUser = { 
        uid: 'admin-primary', 
        email: ADMIN_EMAIL, 
        displayName: 'Mushtak Ansari' 
      } as any;
      const adminProfile = { 
        uid: adminUser.uid, 
        name: 'Mushtak Ansari', 
        phone: ADMIN_PHONE, 
        address: 'Binjha, Deoghar', 
        email: ADMIN_EMAIL, 
        isAdmin: true 
      };
      setUser(adminUser);
      setProfile(adminProfile);
      localStorage.setItem('atomic_auth_user', JSON.stringify(adminUser));
      localStorage.setItem('atomic_auth_profile', JSON.stringify(adminProfile));
      return true;
    }
    return false;
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
    if (cleanOtp === '123456' || !isMockMode) {
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
    if (!isMockMode && auth) {
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

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...data };
    await dataService.setDoc('users', profile.uid, updated);
    setProfile(updated);
  };

  const isAdmin = profile?.isAdmin || false;

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      login, 
      logout, 
      updateProfile, 
      isAdmin,
      viewAsCustomer,
      toggleAdminView,
      adminLoginWithPassword,
      requestAdminOTP,
      verifyAdminOTP
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
