'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useEffect } from 'react';
import type { AuthenticatedUser, EndUserProfile, ConsultantProfile, AdminProfile, UserRole } from '@/lib/types';
import { mockUsersDatabase, createNewUser, getProfileByEmail } from '@/lib/mockData';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User as FirebaseUser, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

interface AuthContextType {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  login: (email: string, passwordHash: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUserProfile: (updatedProfileData: Partial<EndUserProfile | ConsultantProfile>) => void;
  registerWithEmailAndPassword: (email: string, password: string, firstName: string, lastName: string, role: UserRole) => Promise<{ success: boolean; message?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; message?: string }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setIsLoading(true);
      if (firebaseUser && firebaseUser.email) {
        let userProfile = getProfileByEmail(firebaseUser.email);
        
        // Handle case where user exists in Firebase Auth but not in our mock DB (e.g., Google sign-up)
        if (!userProfile) {
          const nameParts = firebaseUser.displayName?.split(' ') || ['New', 'User'];
          const firstName = nameParts[0];
          const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
          // For simplicity, new Google sign-ups are defaulted to 'enduser'
          userProfile = createNewUser(firebaseUser.email, firstName, lastName, 'enduser');
        }

        setUser(userProfile);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, passwordHash: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, passwordHash);
      setIsLoading(false);
      return { success: true };
    } catch (error: any) {
      console.error("Firebase Login Error:", error);
      setIsLoading(false);
      let message = 'An unknown error occurred.';
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          message = 'Invalid email or password.';
          break;
        case 'auth/invalid-email':
          message = 'Please enter a valid email address.';
          break;
        default:
          message = 'Failed to log in. Please try again later.';
      }
      return { success: false, message };
    }
  };

  const registerWithEmailAndPassword = async (email: string, password: string, firstName: string, lastName: string, role: UserRole): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
        if (getProfileByEmail(email)) {
             return { success: false, message: 'An account with this email already exists.' };
        }
      await createUserWithEmailAndPassword(auth, email, password);
      createNewUser(email, firstName, lastName, role);
      setIsLoading(false);
      return { success: true };
    } catch (error: any) {
      console.error("Firebase Registration Error:", error);
      setIsLoading(false);
      let message = 'An unknown error occurred.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'This email address is already in use.';
      }
      return { success: false, message };
    }
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; message?: string }> => {
      setIsLoading(true);
      const provider = new GoogleAuthProvider();
      try {
          await signInWithPopup(auth, provider);
          // onAuthStateChanged will handle the logic of setting the user or creating a new one
          setIsLoading(false);
          return { success: true };
      } catch (error: any) {
          console.error("Google Sign-In Error:", error);
          setIsLoading(false);
          return { success: false, message: 'Failed to sign in with Google. Please try again.' };
      }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };
  
  const updateUserProfile = (updatedProfileData: Partial<EndUserProfile | ConsultantProfile | AdminProfile>) => {
    if (user) {
      const newProfile = { ...user.profile, ...updatedProfileData } as EndUserProfile | ConsultantProfile | AdminProfile;
      const updatedUser = { ...user, profile: newProfile };
      setUser(updatedUser);
      if (user.role === 'enduser') {
         mockUsersDatabase[user.email].profileData = newProfile as EndUserProfile;
      } else if (user.role === 'consultant') {
         mockUsersDatabase[user.email].profileData = newProfile as ConsultantProfile;
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUserProfile, registerWithEmailAndPassword, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}
