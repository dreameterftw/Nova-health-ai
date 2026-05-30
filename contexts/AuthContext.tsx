"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  updateProfile,
  type User
} from "firebase/auth";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isAuthenticated: boolean;
  consent?: {
    healthDataProcessing: boolean;
    emotionAnalysis: boolean;
    aiInteraction: boolean;
    timestamp?: Date;
    version?: string;
  };
  familyCircle?: { name: string; phone: string; relation: string }[];
  // Clinical Profile
  bloodGroup?: string;
  allergies?: string[];
  medications?: string[];
  weight?: number; // kg
  height?: number; // cm
  bloodPressure?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateConsent: (consent: UserProfile["consent"]) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const LOCAL_PROFILE_PREFIX = "nova_user_profile:";
const FIRESTORE_TIMEOUT_MS = 8000;

function serializeProfile(profile: UserProfile): string {
  return JSON.stringify(JSON.parse(JSON.stringify(profile)));
}

function getLocalProfile(userId: string): Partial<UserProfile> | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = localStorage.getItem(`${LOCAL_PROFILE_PREFIX}${userId}`);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveLocalProfile(profile: UserProfile) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(`${LOCAL_PROFILE_PREFIX}${profile.id}`, serializeProfile(profile));
  } catch {
    // Local persistence is best-effort; auth state should still update in memory.
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`${label} timed out`)), ms);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeout));
  });
}

function getAuthErrorMessage(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("auth/unauthorized-domain")) {
    return "This app domain is not allowed in Firebase Authentication yet. Add localhost and the deployed Vercel domain in Firebase Console > Authentication > Settings > Authorized domains.";
  }

  if (message.includes("auth/email-already-in-use")) {
    return "An account already exists with this email. Please sign in instead.";
  }

  if (message.includes("auth/invalid-credential") || message.includes("auth/wrong-password")) {
    return "The email or password is incorrect.";
  }

  if (message.includes("auth/weak-password")) {
    return "Please use a stronger password with at least 6 characters.";
  }

  if (message.includes("auth/invalid-email")) {
    return "Please enter a valid email address.";
  }

  return message || fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const lastSyncedProfileRef = useRef("");
  const profileSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cloudProfileSyncDisabledRef = useRef(false);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        // Initial state from Firebase Auth
        const initialProfile: UserProfile = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
          email: firebaseUser.email || "",
          avatar: firebaseUser.photoURL || undefined,
          isAuthenticated: true,
        };
        const localProfile = getLocalProfile(firebaseUser.uid);

        try {
          // Attempt to load extended profile from Firestore
          const { doc, getDoc } = await import("firebase/firestore");
          const { db } = await import("@/lib/firebase");
          const userDoc = await withTimeout(
            getDoc(doc(db, "users", firebaseUser.uid)),
            FIRESTORE_TIMEOUT_MS,
            "Loading profile"
          );

          if (userDoc.exists()) {
            const data = userDoc.data();
            const profile = {
              ...initialProfile,
              ...localProfile,
              ...data,
              isAuthenticated: true, // Ensure this remains true
            } as UserProfile;
            lastSyncedProfileRef.current = serializeProfile(profile);
            saveLocalProfile(profile);
            setUser(profile);
          } else {
            const profile = { ...initialProfile, ...localProfile, isAuthenticated: true } as UserProfile;
            saveLocalProfile(profile);
            setUser(profile);
          }
        } catch (e) {
          cloudProfileSyncDisabledRef.current = true;
          const profile = { ...initialProfile, ...localProfile, isAuthenticated: true } as UserProfile;
          lastSyncedProfileRef.current = serializeProfile(profile);
          saveLocalProfile(profile);
          setUser(profile);
        }
      } else {
        cloudProfileSyncDisabledRef.current = false;
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // State will be updated by onAuthStateChanged listener
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error, "Failed to sign in."));
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);

      const newProfile = {
        id: result.user.uid,
        name: result.user.displayName || result.user.email?.split("@")[0] || "User",
        email: result.user.email || "",
        avatar: result.user.photoURL || undefined,
        isAuthenticated: true,
      };
      saveLocalProfile(newProfile);

      try {
        // Check if user profile exists in Firestore, create if not
        const { doc, getDoc, setDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const userDoc = await getDoc(doc(db, "users", result.user.uid));

        if (!userDoc.exists()) {
          await setDoc(doc(db, "users", result.user.uid), newProfile);
        }
      } catch {
        cloudProfileSyncDisabledRef.current = true;
      }
      
      // State will be updated by onAuthStateChanged listener
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error, "Google sign in failed."));
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(firebaseUser, { displayName: name });
      
      const newProfile = {
        id: firebaseUser.uid,
        name,
        email,
        isAuthenticated: true,
      } as UserProfile;
      saveLocalProfile(newProfile);

      try {
        // Create initial profile in Firestore
        const { doc, setDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        await setDoc(doc(db, "users", firebaseUser.uid), newProfile);
      } catch {
        cloudProfileSyncDisabledRef.current = true;
      }
      
      // State will be updated by onAuthStateChanged listener
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error, "Registration failed."));
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  // Persistent Profile Sync
  useEffect(() => {
    if (!user || !user.isAuthenticated) return;
    saveLocalProfile(user);

    const serialized = serializeProfile(user);
    if (serialized === lastSyncedProfileRef.current) return;
    if (cloudProfileSyncDisabledRef.current) {
      lastSyncedProfileRef.current = serialized;
      return;
    }

    if (profileSyncTimerRef.current) {
      clearTimeout(profileSyncTimerRef.current);
    }

    profileSyncTimerRef.current = setTimeout(async () => {
      try {
        const { doc, setDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const firebaseData = JSON.parse(serialized);
        await setDoc(doc(db, "users", user.id), firebaseData, { merge: true });
        lastSyncedProfileRef.current = serialized;
      } catch (e) {
        cloudProfileSyncDisabledRef.current = true;
        lastSyncedProfileRef.current = serialized;
      }
    }, 500);

    return () => {
      if (profileSyncTimerRef.current) {
        clearTimeout(profileSyncTimerRef.current);
      }
    };
  }, [user]);

  const updateConsent = useCallback(async (consent: UserProfile["consent"]) => {
    if (!user) {
      throw new Error("Please sign in before accepting consent.");
    }

    const updated = { ...user, consent };
    lastSyncedProfileRef.current = serializeProfile(updated);
    setUser(updated);
    saveLocalProfile(updated);

    void (async () => {
      if (cloudProfileSyncDisabledRef.current) return;

      try {
        const { doc, setDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        await withTimeout(
          setDoc(doc(db, "users", user.id), { consent }, { merge: true }),
          FIRESTORE_TIMEOUT_MS,
          "Saving consent"
        );
      } catch (error) {
        cloudProfileSyncDisabledRef.current = true;
      }
    })();
  }, [user]);

  const updateProfileData = useCallback(async (data: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      saveLocalProfile(updated);
      return updated;
    });
    // Sync to Firestore is handled by the useEffect [user]
  }, []);

  return (
    <AuthContext.Provider value={{
      user, authLoading, login, register, logout, updateConsent,
      loginWithGoogle,
      updateProfile: updateProfileData
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
