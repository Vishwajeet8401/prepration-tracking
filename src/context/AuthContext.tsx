import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  userProfile: any | null;
  authLoading: boolean;
  isNewUser: boolean;
  onboardingCompleted: boolean;
  markOnboardingComplete: (answers?: Record<string, any>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(true); // default true to avoid flash

  const markOnboardingComplete = async (answers?: Record<string, any>) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        onboardingCompleted: true,
        onboardingAnswers: answers || {},
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Could not persist onboarding answers:', err);
    }
    setOnboardingCompleted(true);
    setIsNewUser(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const fetchUserProfileWithRetry = async (retries = 3, delay = 250) => {
          try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const snap = await getDoc(userDocRef);
            if (snap.exists()) {
              const data = snap.data();
              setUserProfile(data);
              // If the doc exists but onboardingCompleted is explicitly false, show guide
              const completed = data.onboardingCompleted !== false; // treat missing field as true for old users
              setOnboardingCompleted(completed);
              setIsNewUser(!completed);
            } else {
              // Brand new user — create profile with onboardingCompleted: false
              const initialProfile = {
                id: currentUser.uid,
                email: currentUser.email || '',
                name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Candidate',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                onboardingCompleted: false,
              };
              await setDoc(userDocRef, initialProfile);
              setUserProfile(initialProfile);
              setOnboardingCompleted(false);
              setIsNewUser(true);
            }
          } catch (err: any) {
            if (retries > 0 && (err.code === 'permission-denied' || err.message?.includes('permission'))) {
              console.warn(`Profile fetch permission-denied. Retrying in ${delay}ms... (${retries} attempts left)`);
              await new Promise(resolve => setTimeout(resolve, delay));
              return fetchUserProfileWithRetry(retries - 1, delay * 2);
            } else {
              throw err;
            }
          }
        };

        fetchUserProfileWithRetry().catch((err) => {
          console.warn("Firestore user profile document is restricted (deploying firestore.rules is pending). Falling back to client-side auth profile details.");
          setUserProfile({
            id: currentUser.uid,
            email: currentUser.email || '',
            name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Active Candidate',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          // On fallback, don't show onboarding to avoid repeated prompts
          setOnboardingCompleted(true);
          setIsNewUser(false);
        });
      } else {
        setUserProfile(null);
        setOnboardingCompleted(true);
        setIsNewUser(false);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, authLoading, isNewUser, onboardingCompleted, markOnboardingComplete }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
