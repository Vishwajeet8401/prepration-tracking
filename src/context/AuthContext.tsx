import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  userProfile: any | null;
  authLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const fetchUserProfileWithRetry = async (retries = 3, delay = 250) => {
          try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const snap = await getDoc(userDocRef);
            if (snap.exists()) {
              setUserProfile(snap.data());
            } else {
              const initialProfile = {
                id: currentUser.uid,
                email: currentUser.email || '',
                name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Candidate',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              await setDoc(userDocRef, initialProfile);
              setUserProfile(initialProfile);
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
            updatedAt: new Date().toISOString()
          });
        });
      } else {
        setUserProfile(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, authLoading }}>
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
