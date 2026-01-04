"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isBlocked: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function saveUserToFirestore(user: User): Promise<{ isAdmin: boolean; isBlocked: boolean }> {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      email: user.email,
      createdAt: new Date(),
      plan: "free",
      emailNotifications: true,
      pushNotifications: true,
      telegramNotifications: true,
    });
    return { isAdmin: false, isBlocked: false };
  }

  const userData = userSnap.data();
  return {
    isAdmin: userData.isAdmin === true,
    isBlocked: userData.isBlocked === true,
  };
}

async function updateLastLogin(userId: string) {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      lastLoginAt: new Date(),
    });
  } catch (error) {
    console.error("Failed to update last login:", error);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const { isAdmin, isBlocked } = await saveUserToFirestore(user);
        setIsAdmin(isAdmin);
        setIsBlocked(isBlocked);
        await updateLastLogin(user.uid);
      } else {
        setIsAdmin(false);
        setIsBlocked(false);
      }
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Send verification email
    await sendEmailVerification(userCredential.user);
  };

  const resendVerificationEmail = async () => {
    if (user && !user.emailVerified) {
      await sendEmailVerification(user);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    // Force account selection to avoid caching issues
    provider.setCustomParameters({
      prompt: "select_account",
    });
    await signInWithPopup(auth, provider);
  };

  const signInWithGithub = async () => {
    const provider = new GithubAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isBlocked,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        signInWithGithub,
        resetPassword,
        resendVerificationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
