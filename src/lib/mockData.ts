import type { EndUserProfile, ConsultantProfile, AdminProfile, UserRole, Document, SessionComment, AccessRequest, AccessRequestStatus, DocumentCategory } from './types';

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
    { id: 'doc1', name: 'Medical Report 1.pdf', url: '#', uploadedAt: new Date().toISOString(), category: 'Clinical', extractedText: 'Sample extracted text for Medical Report 1.' },
    { id: 'doc2', name: 'Lab Results.png', url: '#', uploadedAt: new Date().toISOString(), category: 'Lab' },
  ],
  sessions: [
    { id: 'session1', consultantId: 'consultant1', consultantName: 'Dr. Alice Smith', comment: 'Patient is responding well to treatment.', timestamp: new Date().toISOString() }
  ],
  accessRequests: [],
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
  attendedUsers: [],
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
  if (mockUsersDatabase[updatedProfile.email]) {
    mockUsersDatabase[updatedProfile.email].profileData = updatedProfile;
  }
};

export const updateConsultantProfile = (updatedProfile: ConsultantProfile) => {
  const index = consultantProfiles.findIndex(p => p.consultantId === updatedProfile.consultantId);
  if (index !== -1) {
    consultantProfiles[index] = updatedProfile;
  }
  if (mockUsersDatabase[updatedProfile.email]) {
    mockUsersDatabase[updatedProfile.email].profileData = updatedProfile;
  }
};

export const handleConsultantRequestAccess = (userId: string, consultantId: string, consultantName: string): { success: boolean; request: AccessRequest | null; message: string } => {
  const userProfile = endUserProfiles.find(p => p.userId === userId);
  if (!userProfile) {
    return { success: false, request: null, message: "User not found." };
  }

  let request = userProfile.accessRequests.find(r => r.consultantId === consultantId);

  if (request) {
    // Request already exists, check status
    if (request.status === 'pending' || request.status === 'approved') {
      return { success: false, request, message: `A request is already ${request.status}.` };
    }
    // It must be declined, check rejection count
    if ((request.rejectionCount || 0) >= 3) {
      return { success: false, request, message: "Request limit reached after 3 rejections." };
    }
    // Re-requesting
    request.status = 'pending';
    request.requestedAt = new Date().toISOString();
  } else {
    // No request exists, create a new one
    request = {
      requestId: `req_${Date.now()}`,
      consultantId: consultantId,
      consultantName: consultantName,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      rejectionCount: 0,
    };
    userProfile.accessRequests.push(request);
  }

  updateEndUserProfile(userProfile);
  return { success: true, request, message: "Request sent successfully." };
};


export const updateAccessRequest = (userId: string, requestId: string, newStatus: AccessRequestStatus) => {
  const userProfile = endUserProfiles.find(p => p.userId === userId);
  if (userProfile) {
    const requestIndex = userProfile.accessRequests.findIndex(r => r.requestId === requestId);
    if (requestIndex !== -1) {
      const request = userProfile.accessRequests[requestIndex];
      // Increment rejection count only when moving to declined status
      if (newStatus === 'declined' && request.status !== 'declined') {
        request.rejectionCount = (request.rejectionCount || 0) + 1;
      }
      request.status = newStatus;
      updateEndUserProfile(userProfile);
      return true;
    }
  }
  return false;
};

export const resetRejectionCount = (userId: string, requestId: string) => {
    const userProfile = endUserProfiles.find(p => p.userId === userId);
    if (userProfile) {
        const request = userProfile.accessRequests.find(r => r.requestId === requestId);
        if (request) {
            request.rejectionCount = 0;
            updateEndUserProfile(userProfile);
            return true;
        }
    }
    return false;
};

export const grantConsultantAccess = (userId: string, consultantId: string) => {
  const userProfile = endUserProfiles.find(p => p.userId === userId);
  const consultantProfile = consultantProfiles.find(c => c.consultantId === consultantId);

  if (userProfile && consultantProfile) {
      // If a request exists (pending/declined), update it. Otherwise, create a new one.
      const existingRequest = userProfile.accessRequests.find(r => r.consultantId === consultantId);

      if (existingRequest) {
          existingRequest.status = 'approved';
      } else {
          const newRequest: AccessRequest = {
              requestId: `req_${Date.now()}`,
              consultantId: consultantId,
              consultantName: `${consultantProfile.firstName} ${consultantProfile.lastName}`,
              status: 'approved',
              requestedAt: new Date().toISOString(),
              rejectionCount: 0,
          };
          userProfile.accessRequests.push(newRequest);
      }
      updateEndUserProfile(userProfile);
      return true;
  }
  return false;
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
