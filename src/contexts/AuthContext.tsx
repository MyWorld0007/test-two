'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useEffect } from 'react';
import type { AuthenticatedUser, UserRole, EndUserProfile, ConsultantProfile, AdminProfile } from '@/lib/types';
import { mockUsersDatabase } from '@/lib/mockData';

interface AuthContextType {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  login: (email: string, passwordHash: string) => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (updatedProfileData: Partial<EndUserProfile | ConsultantProfile>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to load user from localStorage on initial load
    try {
      const storedUser = localStorage.getItem('authUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to load user from localStorage", error);
      localStorage.removeItem('authUser');
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, passwordHash: string): Promise<boolean> => {
    setIsLoading(true);
    const dbUser = mockUsersDatabase[email.toLowerCase()];
    if (dbUser && dbUser.passwordHash === passwordHash) {
      const authenticatedUser: AuthenticatedUser = {
        id: (dbUser.profileData as any).userId || (dbUser.profileData as any).consultantId || (dbUser.profileData as any).adminId,
        email: email.toLowerCase(),
        role: dbUser.role,
        profile: dbUser.profileData,
      };
      setUser(authenticatedUser);
      localStorage.setItem('authUser', JSON.stringify(authenticatedUser));
      setIsLoading(false);
      return true;
    }
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authUser');
  };
  
  const updateUserProfile = (updatedProfileData: Partial<EndUserProfile | ConsultantProfile | AdminProfile>) => {
    if (user) {
      const newProfile = { ...user.profile, ...updatedProfileData } as EndUserProfile | ConsultantProfile | AdminProfile;
      const updatedUser = { ...user, profile: newProfile };
      setUser(updatedUser);
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
      // Also update the mock database in memory (for other users potentially viewing this data if app were real-time)
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
