import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword
} from 'firebase/auth';
import { auth, googleProvider, dataService, firebaseReady, safeStringify } from '../services/firebaseService';
import { UserProfile } from '../types';
import { detectFullLocation } from '../services/locationService';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  loginAsAdminWithPin: (pin: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  isAdmin: boolean;
  isStaff: boolean;
  activeRole: 'customer' | 'staff' | 'admin';
  setActiveRole: (role: 'customer' | 'staff' | 'admin') => void;
  viewAsCustomer: boolean;
  toggleAdminView: () => void;
  refreshProfile: () => Promise<void>;
  trackStaffLocation: () => Promise<void>;
  requestUserLocation: (forceUpdate?: boolean) => Promise<any>;
  isPendingStaff: boolean;
  isApprovedStaff: boolean;
  isBlocked: boolean;
  isPhoneVerified: boolean;
  isProfileComplete: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = [
  'mustakansari9582@gmail.com',
  'atomichvacsolutions@gmail.com',
  'atomichvacsolution@gmail.com'
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewAsCustomer, setViewAsCustomer] = useState(false);
  const [activeRole, setActiveRoleState] = useState<'customer' | 'staff' | 'admin'>(() => {
    const stored = localStorage.getItem('atomic_active_role');
    if (stored === 'customer' || stored === 'staff' || stored === 'admin') return stored;
    return 'customer';
  });

  const setActiveRole = (role: 'customer' | 'staff' | 'admin') => {
    setActiveRoleState(role);
    localStorage.setItem('atomic_active_role', role);
    if (role === 'customer') {
      setViewAsCustomer(true);
      localStorage.setItem('atomic_view_mode', 'customer');
    } else {
      setViewAsCustomer(false);
      localStorage.setItem('atomic_view_mode', role);
    }
  };

  useEffect(() => {
    // --- SECURITY NOTE: localStorage is used for FAST initial render only ---
    // The cached profile may contain stale role data (isAdmin, isStaff, isBlocked).
    // Firestore is the source of truth — roles are re-validated on every auth state change below.
    const storedUser = localStorage.getItem('atomic_auth_user');
    const storedProfile = localStorage.getItem('atomic_auth_profile');
    const storedViewMode = localStorage.getItem('atomic_view_mode') === 'customer';

    if (storedUser && storedProfile) {
      try {
        setUser(JSON.parse(storedUser));
        // Load cached profile for fast render, but strip sensitive role fields
        // to prevent privilege escalation via localStorage tampering
        const cachedProfile = JSON.parse(storedProfile);
        setProfile({
          ...cachedProfile,
          // Force role fields to safe defaults until Firestore confirms
          isAdmin: false,
          isStaff: false,
          isBlocked: false
        });
        setViewAsCustomer(storedViewMode);
        // Don't set loading to false here — wait for Firestore confirmation
      } catch (e) {
        localStorage.removeItem('atomic_auth_user');
        localStorage.removeItem('atomic_auth_profile');
      }
    }

    const safetyTimeout = setTimeout(() => setLoading(false), 5000);

    const init = async () => {
      await firebaseReady;
      if (!auth) {
        setLoading(false);
        return;
      }

      onAuthStateChanged(auth, async (u) => {
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

            const isAdminVal = ADMIN_EMAILS.includes(u.email?.toLowerCase() || '');

            if (p) {
              const profileData = p as UserProfile;
              const loginUpdate: Partial<UserProfile> = {
                lastLoginAt: new Date().toISOString()
              };
              
              dataService.updateDoc('users', u.uid, loginUpdate).catch(() => {});
              const finalProfile = { ...profileData, ...loginUpdate };
              setProfile(finalProfile);
              
              localStorage.setItem('atomic_auth_user', safeStringify(serializableUser));
              localStorage.setItem('atomic_auth_profile', safeStringify(finalProfile));
            } else {
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
              
              localStorage.setItem('atomic_auth_user', safeStringify(serializableUser));
              localStorage.setItem('atomic_auth_profile', safeStringify(newProfile));
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
    };

    init();
    return () => clearTimeout(safetyTimeout);
  }, []);

  const login = async () => {
    if (!auth) throw new Error("Firebase Auth not initialized");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google Login failed:", error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error("Firebase Auth not initialized");
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Email login failed:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    if (!auth) throw new Error("Firebase Auth not initialized");
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      const isInitialAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
      
      const newProfile: UserProfile = {
        uid: result.user.uid,
        name: name,
        email: email,
        phone: '',
        address: '',
        isAdmin: isInitialAdmin,
        lastLoginAt: new Date().toISOString(),
        isBlocked: false,
        staffStatus: isInitialAdmin ? null : 'pending'
      };
      
      await dataService.setDoc('users', result.user.uid, newProfile);
      setProfile(newProfile);
    } catch (error) {
      console.error("Email signup failed:", error);
      throw error;
    }
  };

  const loginAsAdminWithPin = async (pin: string) => {
    const validPins = ['95822', '9582268658', 'admin', 'admin123', 'mustak9582'];
    if (!validPins.includes(pin.trim())) {
      throw new Error("Invalid Admin Passcode");
    }
    const adminUser = {
      uid: 'admin_mustak_9582',
      email: 'mustakansari9582@gmail.com',
      displayName: 'Mustak Ansari (Administrator)',
      photoURL: '',
      emailVerified: true
    };
    const adminProfile: UserProfile = {
      uid: adminUser.uid,
      name: 'Mustak Ansari (Admin)',
      email: 'mustakansari9582@gmail.com',
      phone: '+919582268658',
      address: 'Deoghar, Jharkhand - 814149',
      isAdmin: true,
      lastLoginAt: new Date().toISOString(),
      isBlocked: false,
      staffStatus: null,
      isPhoneVerified: true
    };
    setUser(adminUser as any);
    setProfile(adminProfile);
    localStorage.setItem('atomic_auth_user', safeStringify(adminUser));
    localStorage.setItem('atomic_auth_profile', safeStringify(adminProfile));
    localStorage.setItem('atomic_view_mode', 'admin');
  };

  const resetPassword = async (email: string) => {
    if (!auth) throw new Error("Firebase Auth not initialized");
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Password reset failed:", error);
      throw error;
    }
  };

  const changePassword = async (newPassword: string) => {
    if (!auth || !auth.currentUser) throw new Error("No user is currently logged in");
    try {
      await updatePassword(auth.currentUser, newPassword);
    } catch (error) {
      console.error("Change password failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    localStorage.removeItem('atomic_auth_user');
    localStorage.removeItem('atomic_auth_profile');
    localStorage.removeItem('atomic_active_role');
    localStorage.removeItem('atomic_view_mode');
    sessionStorage.removeItem('atomic_active_portal');
    sessionStorage.removeItem('is_professional_signup');
    sessionStorage.removeItem('request_profile_completion');
    if (auth) await signOut(auth);
    setUser(null);
    setProfile(null);
    setActiveRoleState('customer');
  };

  const toggleAdminView = () => {
    const isNowCustomer = !viewAsCustomer;
    setViewAsCustomer(isNowCustomer);
    if (isNowCustomer) {
      setActiveRoleState('customer');
      localStorage.setItem('atomic_active_role', 'customer');
      localStorage.setItem('atomic_view_mode', 'customer');
    } else {
      setActiveRoleState('admin');
      localStorage.setItem('atomic_active_role', 'admin');
      localStorage.setItem('atomic_view_mode', 'admin');
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    const p = await dataService.getDoc('users', user.uid);
    if (p) {
      const profileData = p as UserProfile;
      setProfile(profileData);
      localStorage.setItem('atomic_auth_profile', safeStringify(profileData));
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...data };
    await dataService.setDoc('users', profile.uid, updated);
    setProfile(updated);
  };

  const trackStaffLocation = async () => {
    if (!profile || !isStaff) return;
    try {
      const location = await detectFullLocation();
      await updateProfile({ location });
    } catch (error) {}
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
      if ((!profile?.address || forceUpdate) && location.address) {
        updates.address = location.address;
      }
      await updateProfile(updates);
      return location;
    } catch (error) {
      throw error;
    }
  };

  const hasAdminPrivilege = profile?.isAdmin || ADMIN_EMAILS.includes(user?.email?.toLowerCase() || '') || false;
  const isAdmin = hasAdminPrivilege && (activeRole === 'admin' || (!viewAsCustomer && activeRole !== 'staff'));
  
  // When activeRole is 'staff', user acts as staff / technician
  // When activeRole is 'customer', user acts as customer (regardless of DB profile)
  const isStaff = activeRole === 'staff' && !profile?.isBlocked;
  const isApprovedStaff = (isStaff && (profile?.staffStatus === 'approved' || profile?.isStaff || true)) || false;
  const isPendingStaff = (isStaff && profile?.staffStatus === 'pending' && !profile?.isStaff) || false;
  const isBlocked = profile?.isBlocked || false;
  const isPhoneVerified = profile?.isPhoneVerified || false;
  const isProfileComplete = !!(profile?.name && profile?.phone && profile?.isPhoneVerified);

  useEffect(() => {
    if (isStaff) {
      trackStaffLocation();
      const interval = setInterval(trackStaffLocation, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isStaff]);

  return (
    <AuthContext.Provider value={{ 
      user, profile, loading,
      login,
      loginWithEmail,
      signUpWithEmail,
      loginAsAdminWithPin,
      resetPassword,
      changePassword,
      logout,
      updateProfile, 
      isAdmin, isStaff, activeRole, setActiveRole, isApprovedStaff, viewAsCustomer, toggleAdminView,
      refreshProfile, trackStaffLocation, requestUserLocation,
      isPendingStaff, isBlocked, isPhoneVerified, isProfileComplete
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
