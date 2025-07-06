export type UserRole = 'enduser' | 'consultant' | 'admin';

export type AccessRequestStatus = 'pending' | 'approved' | 'declined';

export interface AccessRequest {
  requestId: string;
  consultantId: string;
  consultantName: string;
  status: AccessRequestStatus;
  requestedAt: string;
  rejectionCount?: number;
}

export type DocumentCategory = 'Lab' | 'Clinical' | 'Hospital' | 'Estimate' | 'Other';

export interface Document {
  id: string;
  name: string;
  url: string; // For mock, this could be a placeholder or data URI
  uploadedAt: string;
  category: DocumentCategory;
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
  role: 'enduser';
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
  accessRequests: AccessRequest[];
  lastLoginAt?: string;
}

export interface ConsultantProfile {
  role: 'consultant';
  consultantId: string;
  firstName: string;
  middleName?: string;
  lastName:string;
  email: string;
  qualification: string;
  qualificationNumber: string;
  totalExperience: number; // years
  specializationField: string;
  attendedUsers: { userId: string; name: string; lastViewed: string }[];
  lastLoginAt?: string;
}

export interface AdminProfile {
  role: 'admin';
  adminId: string;
  name: string;
  email: string;
  lastLoginAt?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  profile: EndUserProfile | ConsultantProfile | AdminProfile;
}

export interface InsurancePolicy {
  id: string;
  companyName: string;
  policyType: string;
  insuredAmount: number;
  policyDocument: {
    name: string;
    url: string;
  };
  createdAt: string;
}
