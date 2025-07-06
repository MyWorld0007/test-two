'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useEffect } from 'react';
import type { AuthenticatedUser, EndUserProfile, ConsultantProfile, AdminProfile } from '@/lib/types';
import { mockUsersDatabase } from '@/lib/mockData';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  login: (email: string, passwordHash: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUserProfile: (updatedProfileData: Partial<EndUserProfile | ConsultantProfile>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to get profile from mock data based on email.
// In a full Firebase app, this would fetch from Firestore or RTDB.
const getProfileByEmail = (email: string): AuthenticatedUser | null => {
  const dbUser = mockUsersDatabase[email.toLowerCase()];
  if (dbUser) {
    return {
      id: (dbUser.profileData as any).userId || (dbUser.profileData as any).consultantId || (dbUser.profileData as any).adminId,
      email: email.toLowerCase(),
      role: dbUser.role,
      profile: dbUser.profileData,
    };
  }
  return null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      setIsLoading(true);
      if (firebaseUser && firebaseUser.email) {
        // User is signed in via Firebase. Now, find their profile data.
        const userProfile = getProfileByEmail(firebaseUser.email);
        setUser(userProfile);
      } else {
        // User is signed out.
        setUser(null);
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = async (email: string, passwordHash: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, passwordHash);
      // onAuthStateChanged will handle setting the user state.
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

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };
  
  const updateUserProfile = (updatedProfileData: Partial<EndUserProfile | ConsultantProfile | AdminProfile>) => {
    if (user) {
      const newProfile = { ...user.profile, ...updatedProfileData } as EndUserProfile | ConsultantProfile | AdminProfile;
      const updatedUser = { ...user, profile: newProfile };
      setUser(updatedUser);
      // This is where you would save the updated profile to Firebase RTDB or Firestore
      // For now, we update the mock DB in memory to ensure other components see the changes.
      if (user.role === 'enduser') {
         mockUsersDatabase[user.email].profileData = newProfile as EndUserProfile;
      } else if (user.role === 'consultant') {
         mockUsersDatabase[user.email].profileData = newProfile as ConsultantProfile;
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
