
import { db } from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import type { UserRole, EndUserProfile, ConsultantProfile, AdminProfile, AuthenticatedUser, Document as DocumentType, SessionComment, AccessRequest, AccessRequestStatus, InsurancePolicy } from './types';

// ================== User Profile Functions ==================

export const getUserProfile = async (uid: string): Promise<AuthenticatedUser | null> => {
  const userDocRef = doc(db, 'users', uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    const profileData = userDocSnap.data() as EndUserProfile | ConsultantProfile | AdminProfile;
    // Determine role based on the 'role' field in the document
    const role: UserRole = profileData.role;
    return {
      id: uid,
      email: profileData.email,
      role: role,
      profile: profileData,
    };
  } else {
    // This case might happen if an auth record exists but the firestore doc creation failed.
    return null;
  }
};

export const createUserProfileDocument = async (
  uid: string,
  email: string,
  firstName: string,
  lastName: string,
  role: UserRole
): Promise<AuthenticatedUser> => {
    let profile: EndUserProfile | ConsultantProfile | AdminProfile;

    // Based on the user's role, we create a different data structure.
    if (role === 'enduser') {
        profile = {
            role: 'enduser',
            userId: uid,
            uniqueId: `EU${Date.now().toString().slice(-5)}`,
            firstName,
            lastName,
            email,
            phone: '',
            age: 0,
            gender: 'Other',
            documents: [],
            sessions: [],
            accessRequests: [],
        };
    } else if (role === 'consultant') { 
        profile = {
            role: 'consultant',
            consultantId: uid,
            firstName,
            lastName,
            email,
            qualification: '',
            qualificationNumber: '',
            totalExperience: 0,
            specializationField: '',
            attendedUsers: [],
        };
    } else { // admin
        profile = {
            role: 'admin',
            adminId: uid,
            name: `${firstName} ${lastName}`,
            email
        }
    }
    // We save the structured profile data to the 'users' collection 
    // with the document ID being the user's authentication UID.
    await setDoc(doc(db, "users", uid), profile);
    
    // We return the complete user object for immediate use in the app.
    return { id: uid, email, role, profile };
};


export const updateUserProfileDocument = async (uid: string, data: Partial<EndUserProfile | ConsultantProfile | AdminProfile>) => {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, data);
};

export const getAllConsultants = async (): Promise<ConsultantProfile[]> => {
    const usersCollectionRef = collection(db, 'users');
    const q = query(usersCollectionRef, where('role', '==', 'consultant'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as ConsultantProfile);
};

export const getAllEndUsers = async (): Promise<EndUserProfile[]> => {
    const usersCollectionRef = collection(db, 'users');
    const q = query(usersCollectionRef, where('role', '==', 'enduser'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as EndUserProfile);
};


export const findUserByUniqueId = async (uniqueId: string): Promise<EndUserProfile | null> => {
    const usersCollectionRef = collection(db, 'users');
    const q = query(usersCollectionRef, where('uniqueId', '==', uniqueId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }
    // Assuming uniqueId is truly unique, return the first result.
    return querySnapshot.docs[0].data() as EndUserProfile;
};


// ================== Insurance Functions ==================

export const getInsurancePolicies = async (): Promise<InsurancePolicy[]> => {
    const policiesCollectionRef = collection(db, 'insurancePolicies');
    const querySnapshot = await getDocs(policiesCollectionRef);
    const policies: InsurancePolicy[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        policies.push({ 
            ...data, 
            id: doc.id,
            // Firestore Timestamps need to be converted to strings for the app
            createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
        } as InsurancePolicy);
    });
    return policies;
};

export const addInsurancePolicy = async (policy: Omit<InsurancePolicy, 'id' | 'createdAt'>): Promise<InsurancePolicy> => {
    const newPolicyData = {
        ...policy,
        createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, "insurancePolicies"), newPolicyData);
    return { ...newPolicyData, id: docRef.id, createdAt: newPolicyData.createdAt.toDate().toISOString() };
};

export const deleteInsurancePolicy = async (policyId: string): Promise<void> => {
    await deleteDoc(doc(db, "insurancePolicies", policyId));
};
