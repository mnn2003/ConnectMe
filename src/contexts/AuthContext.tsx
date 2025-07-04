import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, onSnapshot, collection, query, where } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  onlineUsers: string[];
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Error boundary component
class AuthErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Auth Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="auth-error">Authentication service is currently unavailable. Please try again later.</div>;
    }
    return this.props.children;
  }
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isActive, setIsActive] = useState(true);

  // Track user activity
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      setIsActive(true);
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        setIsActive(false);
      }, 5 * 60 * 1000); // 5 minutes of inactivity
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    resetTimer(); // Initialize timer

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, []);

  // Update online status based on activity
  useEffect(() => {
    if (!currentUser?.uid) return;

    const updateOnlineStatus = async () => {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          isOnline: isActive,
          lastSeen: serverTimestamp()
        });
      } catch (error) {
        console.error('Error updating online status:', error);
      }
    };

    updateOnlineStatus();
  }, [isActive, currentUser?.uid]);

  const safeUpdateProfile = async (updates: Partial<User>) => {
    if (!currentUser?.uid) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), updates);
      if (userProfile) {
        setUserProfile({ ...userProfile, ...updates });
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      throw err;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Logged in successfully!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });
      
      const userDoc: User = {
        id: result.user.uid,
        name,
        email,
        photoURL: result.user.photoURL || '',
        status: 'Hey there! I am using ConnectMe.',
        lastSeen: new Date(),
        isOnline: true,
        blockedUsers: [],
        createdAt: new Date()
      };

      await setDoc(doc(db, 'users', result.user.uid), {
        ...userDoc,
        lastSeen: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      toast.success('Account created successfully!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        const newUser: User = {
          id: result.user.uid,
          name: result.user.displayName || 'Unknown User',
          email: result.user.email || '',
          photoURL: result.user.photoURL || '',
          status: 'Hey there! I am using ConnectMe.',
          lastSeen: new Date(),
          isOnline: true,
          blockedUsers: [],
          createdAt: new Date()
        };

        await setDoc(doc(db, 'users', result.user.uid), {
          ...newUser,
          lastSeen: serverTimestamp(),
          createdAt: serverTimestamp()
        });
      }

      toast.success('Logged in with Google!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (currentUser?.uid) {
        await safeUpdateProfile({
          isOnline: false,
          lastSeen: new Date()
        });
      }
      await signOut(auth);
      toast.success('Logged out successfully!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    try {
      await safeUpdateProfile(updates);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  // Update online status periodically
  useEffect(() => {
    if (!currentUser?.uid || !isActive) return;

    const updateOnlineStatus = async () => {
      try {
        await safeUpdateProfile({
          isOnline: true,
          lastSeen: new Date()
        });
      } catch (error) {
        console.error('Error updating online status:', error);
      }
    };

    updateOnlineStatus();
    const interval = setInterval(updateOnlineStatus, 30000); // Update every 30 seconds

    const handleVisibilityChange = () => {
      if (!document.hidden && isActive) {
        updateOnlineStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser?.uid, isActive]);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setCurrentUser(user);
        
        if (user?.uid) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            
            // Safely handle timestamps
            const lastSeenValue = userData.lastSeen;
            const lastSeenDate = lastSeenValue 
              ? (lastSeenValue instanceof Date ? lastSeenValue : new Date((lastSeenValue as any).seconds * 1000))
              : new Date();
            
            const profileData: User = {
              ...userData,
              lastSeen: lastSeenDate,
              createdAt: userData.createdAt instanceof Date 
                ? userData.createdAt 
                : new Date((userData.createdAt as any).seconds * 1000)
            };
            
            setUserProfile(profileData);
            
            await safeUpdateProfile({
              isOnline: true,
              lastSeen: new Date()
            });

            const profileUnsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
              if (doc.exists()) {
                const data = doc.data() as User;
                const updatedLastSeen = data.lastSeen 
                  ? (data.lastSeen instanceof Date ? data.lastSeen : new Date((data.lastSeen as any).seconds * 1000))
                  : new Date();
                
                setUserProfile({
                  ...data,
                  lastSeen: updatedLastSeen
                });
              }
            });

            return () => profileUnsubscribe();
          }
        } else {
          setUserProfile(null);
        }
      } catch (err) {
        console.error("Auth state change error:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Listen for online users
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = onSnapshot(
      query(collection(db, 'users'), 
        where('isOnline', '==', true),
        where('id', '!=', currentUser.uid)
      ),
      (snapshot) => {
        const onlineIds = snapshot.docs.map(doc => doc.id);
        setOnlineUsers(onlineIds);
      },
      (err) => {
        console.error("Online users listener error:", err);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  if (error) {
    return <div className="auth-error">Authentication service error. Please refresh the page.</div>;
  }

  const value = {
    currentUser,
    userProfile,
    loading,
    onlineUsers,
    login,
    register,
    loginWithGoogle,
    logout,
    resetPassword,
    updateUserProfile
  };

  return (
    <AuthErrorBoundary>
      <AuthContext.Provider value={value}>
        {!loading && children}
      </AuthContext.Provider>
    </AuthErrorBoundary>
  );
};