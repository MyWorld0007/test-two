'use client';

import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthenticatedUser, EndUserProfile, ConsultantProfile, AdminProfile, UserRole, Document as DocumentType } from '@/lib/types';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User as FirebaseUser, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { getUserProfile, createUserProfileDocument, updateUserProfileDocument, addDocumentToUser } from '@/lib/firestore';

interface AuthContextType {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUserProfile: (updatedProfileData: Partial<EndUserProfile | ConsultantProfile | AdminProfile>) => Promise<void>;
  addDocument: (document: DocumentType) => Promise<{ success: boolean; message?: string; }>;
  registerWithEmailAndPassword: (email: string, password: string, firstName: string, lastName: string, role: UserRole) => Promise<{ success: boolean; message?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  changeUserPassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setIsLoading(true);
      if (firebaseUser) {
        let userProfile = await getUserProfile(firebaseUser.uid);
        
        if (userProfile) {
           const lastLoginData = { 
               lastLoginAt: new Date().toISOString(),
            };
           await updateUserProfileDocument(firebaseUser.uid, lastLoginData);
           userProfile.profile = { ...userProfile.profile, lastLoginAt: lastLoginData.lastLoginAt };
           setUser(userProfile);
        } else {
            const nameParts = firebaseUser.displayName?.split(' ') || ['New', 'User'];
            const firstName = nameParts[0];
            const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
            const newUser = await createUserProfileDocument(firebaseUser.uid, firebaseUser.email!, firstName, lastName, 'enduser');
            setUser(newUser);
        }

      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setIsLoading(false);
      return { success: true };
    } catch (error: any) {
      setIsLoading(false);
      
      let message = 'Failed to log in. Please try again later.';
      const invalidCredentialCodes = ['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'];

      if (invalidCredentialCodes.includes(error.code)) {
        message = 'Invalid email or password.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else {
        console.error("Firebase Login Error:", error);
      }

      return { success: false, message };
    }
  };

  const registerWithEmailAndPassword = async (email: string, password: string, firstName: string, lastName: string, role: UserRole): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await createUserProfileDocument(userCredential.user.uid, email, firstName, lastName, role);
      setIsLoading(false);
      return { success: true };
    } catch (error: any) {
      console.error("Firebase Registration Error:", error);
      setIsLoading(false);
      let message = 'An unknown error occurred.';
       switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'This email address is already in use.';
          break;
        case 'auth/invalid-email':
          message = 'Please enter a valid email address.';
          break;
        case 'auth/weak-password':
            message = 'The password is too weak. It must be at least 8 characters long.';
            break;
        default:
          message = 'Failed to register. Please try again later.';
      }
      return { success: false, message };
    }
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; message?: string }> => {
      setIsLoading(true);
      const provider = new GoogleAuthProvider();
      try {
          await signInWithPopup(auth, provider);
          setIsLoading(false);
          return { success: true };
      } catch (error: any)          {
          console.error("Google Sign-In Error:", error);
          setIsLoading(false);
          let message = 'An unknown error occurred.';
          switch(error.code) {
            case 'auth/popup-closed-by-user':
              message = 'Sign-in window was closed before completion.';
              break;
            case 'auth/cancelled-popup-request':
              message = 'Multiple sign-in windows were opened. Please try again.';
              break;
            default:
              message = 'Failed to sign in with Google. Please try again later.';
          }
          return { success: false, message };
      }
  };
  
  const changeUserPassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    const user = auth.currentUser;
    if (!user || !user.email) {
      return { success: false, message: 'No user is currently signed in.' };
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword);

    try {
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      return { success: true, message: 'Password updated successfully.' };
    } catch (error: any) {
      let message = 'An error occurred. Please try again.';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = 'The current password you entered is incorrect.';
      } else if (error.code === 'auth/weak-password') {
          message = 'The new password is too weak. It must be at least 8 characters long.'
      }
      console.error("Password Change Error:", error);
      return { success: false, message };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };
  
  const updateUserProfile = async (updatedProfileData: Partial<EndUserProfile | ConsultantProfile | AdminProfile>) => {
    if (user) {
      await updateUserProfileDocument(user.id, updatedProfileData);
      const newProfile = { ...user.profile, ...updatedProfileData } as EndUserProfile | ConsultantProfile | AdminProfile;
      const updatedUser = { ...user, profile: newProfile };
      setUser(updatedUser);
    }
  };

  const addDocument = async (document: DocumentType): Promise<{ success: boolean; message?: string }> => {
    if (!user || user.role !== 'enduser') {
      return { success: false, message: 'User is not an end-user.' };
    }
    
    try {
      await addDocumentToUser(user.id, document);
      const currentProfile = user.profile as EndUserProfile;
      const updatedDocuments = [...(currentProfile.documents || []), document];
      const newProfile = { ...currentProfile, documents: updatedDocuments };
      setUser({ ...user, profile: newProfile });

      return { success: true };
    } catch (error) {
      console.error("Failed to add document:", error);
      return { success: false, message: 'Failed to save document to profile.' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUserProfile, addDocument, registerWithEmailAndPassword, signInWithGoogle, changeUserPassword }}>
      {children}
    </AuthContext.Provider>
  );
}
