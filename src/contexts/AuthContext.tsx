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
  hasAdminPrivilege: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  activeRole: 'customer' | 'staff' | 'admin';
  setActiveRole: (role: 'customer' | 'staff' | 'admin') => void;
  viewAsCustomer: boolean;
  toggleAdminView: () => void;
  switchToAdmin: () => void;
  switchToStaff: () => void;
  switchToCustomer: () => void;
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
        const parsedUser = JSON.parse(storedUser);
        const cachedProfile = JSON.parse(storedProfile);
        setUser(parsedUser);
        const isMaster = cachedProfile.uid === 'admin_mustak_9582' || 
                         parsedUser.uid === 'admin_mustak_9582' ||
                         ADMIN_EMAILS.includes(cachedProfile.email?.toLowerCase() || '') ||
                         ADMIN_EMAILS.includes(parsedUser.email?.toLowerCase() || '');
        setProfile({
          ...cachedProfile,
          isAdmin: isMaster ? true : (cachedProfile.isAdmin || false),
          isStaff: isMaster ? false : cachedProfile.isStaff,
          isBlocked: isMaster ? false : cachedProfile.isBlocked
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
            const stored = localStorage.getItem('atomic_auth_user');
            if (stored && (stored.includes('admin_mustak_9582') || stored.includes('mustakansari9582@gmail.com'))) {
              // Preserve admin session (e.g. logged in via PIN or master email)
              return;
            }
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

  const switchToAdmin = () => {
    setViewAsCustomer(false);
    setActiveRoleState('admin');
    localStorage.setItem('atomic_active_role', 'admin');
    localStorage.setItem('atomic_view_mode', 'admin');
  };

  const switchToStaff = () => {
    setViewAsCustomer(false);
    setActiveRoleState('staff');
    localStorage.setItem('atomic_active_role', 'staff');
    localStorage.setItem('atomic_view_mode', 'staff');
  };

  const switchToCustomer = () => {
    setViewAsCustomer(true);
    setActiveRoleState('customer');
    localStorage.setItem('atomic_active_role', 'customer');
    localStorage.setItem('atomic_view_mode', 'customer');
  };

  const toggleAdminView = () => {
    if (viewAsCustomer || activeRole !== 'admin') {
      switchToAdmin();
    } else {
      switchToCustomer();
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

  const hasAdminPrivilege = Boolean(
    profile?.isAdmin || 
    user?.uid === 'admin_mustak_9582' ||
    profile?.uid === 'admin_mustak_9582' ||
    ADMIN_EMAILS.includes(user?.email?.toLowerCase() || '') ||
    ADMIN_EMAILS.includes(profile?.email?.toLowerCase() || '')
  );
  const isAdmin = hasAdminPrivilege && (activeRole === 'admin' || (!viewAsCustomer && activeRole !== 'staff'));
  
  const hasStaffPrivilege = Boolean(profile?.isStaff || profile?.staffStatus === 'approved');
  const isStaff = (activeRole === 'staff' || (hasStaffPrivilege && !viewAsCustomer)) && !profile?.isBlocked;
  const isApprovedStaff = Boolean(
    (isStaff || hasStaffPrivilege) && 
    (profile?.staffStatus === 'approved' || profile?.isStaff) && 
    !profile?.isBlocked
  );
  const isPendingStaff = Boolean(
    !profile?.isBlocked &&
    !profile?.isStaff &&
    profile?.staffStatus === 'pending'
  );
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
      hasAdminPrivilege, isAdmin, isStaff, activeRole, setActiveRole, isApprovedStaff, viewAsCustomer, 
      toggleAdminView, switchToAdmin, switchToStaff, switchToCustomer,
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
