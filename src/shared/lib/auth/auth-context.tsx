"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getFirebaseAuth } from "@/shared/lib/firebase/client";
import { createUserProfile, getUserProfile } from "@/entities/user/model/user-service";
import { UserProfile } from "@/entities/user/model/types";

interface AuthContextValue {
  firebaseUser: User | null;
  user: UserProfile | null;
  loading: boolean;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function createFallbackProfile(firebaseUser: User): UserProfile {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email ?? "",
    role: "employee",
    createdAt: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);

      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const profile = await getUserProfile(currentUser.uid);
        setUser(profile ?? createFallbackProfile(currentUser));
      } catch (error) {
        // Firestore rules may temporarily block profile reads during setup.
        console.error("Failed to read user profile from Firestore:", error);
        setUser(createFallbackProfile(currentUser));
      }
      setLoading(false);
    });
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    const credential = await createUserWithEmailAndPassword(auth, email, password);

    try {
      await createUserProfile(credential.user.uid, email);
      const profile = await getUserProfile(credential.user.uid);
      setUser(profile ?? createFallbackProfile(credential.user));
    } catch (error) {
      console.error("Failed to create/read user profile after registration:", error);
      setUser(createFallbackProfile(credential.user));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    const credential = await signInWithEmailAndPassword(auth, email, password);

    try {
      const profile = await getUserProfile(credential.user.uid);
      setUser(profile ?? createFallbackProfile(credential.user));
    } catch (error) {
      console.error("Failed to read user profile after login:", error);
      setUser(createFallbackProfile(credential.user));
    }
  }, []);

  const logout = useCallback(async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ firebaseUser, user, loading, register, login, logout }),
    [firebaseUser, user, loading, register, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
