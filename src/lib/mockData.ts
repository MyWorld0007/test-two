import type { EndUserProfile, ConsultantProfile, AdminProfile, UserRole, Document, SessionComment } from './types';

export const demoEndUser: EndUserProfile = {
  userId: 'user1',
  uniqueId: 'EU12345',
  firstName: 'John',
  middleName: 'W.',
  lastName: 'Doe',
  email: 'enduser@example.com',
  phone: '9876543210',
  age: 30,
  gender: 'Male',
  diseName: 'Hypertension',
  stage: 'Stage 2',
  documents: [
    { id: 'doc1', name: 'Medical Report 1.pdf', url: '#', uploadedAt: new Date().toISOString(), extractedText: 'Sample extracted text for Medical Report 1.' },
    { id: 'doc2', name: 'Lab Results.png', url: '#', uploadedAt: new Date().toISOString() },
  ],
  sessions: [
    { id: 'session1', consultantId: 'consultant1', consultantName: 'Dr. Alice Smith', comment: 'Patient is responding well to treatment.', timestamp: new Date().toISOString() }
  ],
};

export const demoConsultant: ConsultantProfile = {
  consultantId: 'consultant1',
  firstName: 'Dr. Alice',
  lastName: 'Smith',
  email: 'consultant@example.com',
  qualification: 'MD',
  qualificationNumber: 'MD45678',
  totalExperience: 10,
  specializationField: 'Cardiology',
};

export const demoAdmin: AdminProfile = {
  adminId: 'admin1',
  name: 'Super Admin',
  email: 'admin@example.com',
};

export const mockUsersDatabase: Record<string, { passwordHash: string; role: UserRole; profileData: EndUserProfile | ConsultantProfile | AdminProfile }> = {
  'enduser@example.com': {
    passwordHash: 'Test@1234', // In a real app, this would be a bcrypt hash
    role: 'enduser',
    profileData: demoEndUser,
  },
  'consultant@example.com': {
    passwordHash: 'Consult@1234',
    role: 'consultant',
    profileData: demoConsultant,
  },
  'admin@example.com': {
    passwordHash: 'Admin@1234',
    role: 'admin',
    profileData: demoAdmin,
  },
};

export let endUserProfiles: EndUserProfile[] = [demoEndUser];
export let consultantProfiles: ConsultantProfile[] = [demoConsultant];

// Helper function to update mock data (e.g., after profile edit or document upload)
export const updateEndUserProfile = (updatedProfile: EndUserProfile) => {
  const index = endUserProfiles.findIndex(p => p.userId === updatedProfile.userId);
  if (index !== -1) {
    endUserProfiles[index] = updatedProfile;
  }
  mockUsersDatabase[updatedProfile.email].profileData = updatedProfile;
};

export const updateConsultantProfile = (updatedProfile: ConsultantProfile) => {
  const index = consultantProfiles.findIndex(p => p.consultantId === updatedProfile.consultantId);
  if (index !== -1) {
    consultantProfiles[index] = updatedProfile;
  }
  mockUsersDatabase[updatedProfile.email].profileData = updatedProfile;
};

export const addDocumentToUser = (userId: string, document: Document) => {
  const userProfile = endUserProfiles.find(p => p.userId === userId);
  if (userProfile) {
    userProfile.documents.push(document);
    updateEndUserProfile(userProfile);
  }
};

export const addCommentToUserSession = (userId: string, comment: SessionComment) => {
  const userProfile = endUserProfiles.find(p => p.userId === userId);
  if (userProfile) {
    userProfile.sessions.push(comment);
    updateEndUserProfile(userProfile);
  }
};
