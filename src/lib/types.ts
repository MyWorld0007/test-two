export type UserRole = 'enduser' | 'consultant' | 'admin';

export interface Document {
  id: string;
  name: string;
  url: string; // For mock, this could be a placeholder or data URI
  uploadedAt: string;
  extractedText?: string;
  summary?: string;
}

export interface SessionComment {
  id: string;
  consultantId: string;
  consultantName: string;
  comment: string;
  timestamp: string;
}

export interface EndUserProfile {
  userId: string;
  uniqueId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other' | string;
  diseName?: string;
  stage?: string;
  documents: Document[];
  sessions: SessionComment[];
}

export interface ConsultantProfile {
  consultantId: string;
  firstName: string;
  middleName?: string;
  lastName:string;
  email: string;
  qualification: string;
  qualificationNumber: string;
  totalExperience: number; // years
  specializationField: string;
}

export interface AdminProfile {
  adminId: string;
  name: string;
  email: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  profile: EndUserProfile | ConsultantProfile | AdminProfile;
}
