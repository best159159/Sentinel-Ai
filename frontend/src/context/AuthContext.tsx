'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  firebaseUser: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, location?: { lat: number; lng: number }) => Promise<void>;
  logout: () => Promise<void>;
  updateLocation: (lat: number, lng: number) => Promise<void>;
  // keep token for backward compat (returns Firebase ID token)
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        const idToken = await fbUser.getIdToken();
        setToken(idToken);

        // Load profile from Firestore
        const profileSnap = await getDoc(doc(db, 'users', fbUser.uid));
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setUser({
            _id: fbUser.uid,
            email: fbUser.email || '',
            name: data.name || fbUser.displayName || '',
            role: data.role || 'user',
            location: data.location || { lat: 0, lng: 0 },
          });
        } else {
          setUser({
            _id: fbUser.uid,
            email: fbUser.email || '',
            name: fbUser.displayName || '',
            role: 'user',
            location: { lat: 0, lng: 0 },
          });
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    location?: { lat: number; lng: number }
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });

    // Save extended profile to Firestore
    await setDoc(doc(db, 'users', cred.user.uid), {
      name,
      email,
      role: 'user',
      location: location || { lat: 0, lng: 0 },
      createdAt: serverTimestamp(),
    });
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateLocation = async (lat: number, lng: number) => {
    if (!firebaseUser) return;
    await updateDoc(doc(db, 'users', firebaseUser.uid), { location: { lat, lng } });
    if (user) setUser({ ...user, location: { lat, lng } });
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, token, login, register, logout, updateLocation }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
