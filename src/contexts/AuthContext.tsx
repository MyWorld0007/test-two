'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useEffect } from 'react';
import type { AuthenticatedUser, EndUserProfile, ConsultantProfile, AdminProfile, UserRole } from '@/lib/types';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User as FirebaseUser, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { getUserProfile, createUserProfileDocument, updateUserProfileDocument, createConsultantByAdmin } from '@/lib/firestore';

interface AuthContextType {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUserProfile: (updatedProfileData: Partial<EndUserProfile | ConsultantProfile | AdminProfile>) => Promise<void>;
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
            // Tag the login activity with a timestamp and the user's role for clarity.
           const lastLoginData = { 
               lastLoginAt: new Date().toISOString(),
               role: userProfile.role // Explicitly tag the role during login activity
            };
           await updateUserProfileDocument(firebaseUser.uid, lastLoginData);
           // Update the profile object before setting it in state
           userProfile.profile = { ...userProfile.profile, lastLoginAt: lastLoginData.lastLoginAt };
           setUser(userProfile);
        } else {
            // This is a new user (likely via Google sign-in) who doesn't have a profile doc yet.
            const nameParts = firebaseUser.displayName?.split(' ') || ['New', 'User'];
            const firstName = nameParts[0];
            const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
            // For simplicity, new Google sign-ups are defaulted to 'enduser'
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
      // onAuthStateChanged will handle setting the user state.
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
      } else if (error.code === 'auth/operation-not-allowed') {
        message = 'Email/Password sign-in is not enabled. Please enable it in the Firebase Console.';
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
      // onAuthStateChanged will set the user state.
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
            message = 'The password is too weak.';
            break;
        case 'auth/operation-not-allowed':
          message = 'Email/Password sign-up is not enabled. Please enable it in the Firebase Console.';
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
          // onAuthStateChanged will handle the logic of setting the user or creating a new one
          setIsLoading(false);
          return { success: true };
      } catch (error: any)          {
          console.error("Google Sign-In Error:", error);
          setIsLoading(false);
          let message = 'An unknown error occurred.';
          switch(error.code) {
            case 'auth/operation-not-allowed':
              message = 'Google Sign-In is not enabled. Please enable it in the Firebase Console.';
              break;
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
      // User re-authenticated, now they can change the password
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
      // Optimistically update local state for immediate UI feedback
      const newProfile = { ...user.profile, ...updatedProfileData } as EndUserProfile | ConsultantProfile | AdminProfile;
      const updatedUser = { ...user, profile: newProfile };
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUserProfile, registerWithEmailAndPassword, signInWithGoogle, changeUserPassword }}>
      {children}
    </AuthContext.Provider>
  );
}
