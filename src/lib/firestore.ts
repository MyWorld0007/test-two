import { db, auth } from './firebase';
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
  arrayUnion,
} from 'firebase/firestore';
import type { UserRole, EndUserProfile, ConsultantProfile, AdminProfile, AuthenticatedUser, Document as DocumentType, InsurancePolicy } from './types';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

// ================== User Profile Functions ==================

// Converts Firestore Timestamps to ISO strings for any object.
const convertTimestamps = (data: any) => {
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate().toISOString();
        }
    }
    return data;
}

export const getUserProfile = async (uid: string): Promise<AuthenticatedUser | null> => {
  const userDocRef = doc(db, 'users', uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    let profileData = userDocSnap.data();
    
    // Convert timestamps before returning
    profileData = convertTimestamps(profileData);

    return {
      id: uid,
      email: profileData.email,
      role: profileData.role,
      profile: profileData as EndUserProfile | ConsultantProfile | AdminProfile,
    };
  } else {
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
    let finalRole = role;
    const creationTimestamp = new Date().toISOString();

    if (email === 'admin@example.com') {
      finalRole = 'admin';
    }

    if (finalRole === 'enduser') {
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
            createdAt: creationTimestamp,
        };
    } else if (finalRole === 'consultant') { 
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
            createdAt: creationTimestamp,
        };
    } else {
        profile = {
            role: 'admin',
            adminId: uid,
            name: `${firstName} ${lastName}`,
            email,
            createdAt: creationTimestamp,
        }
    }

    await setDoc(doc(db, "users", uid), {...profile, createdAt: Timestamp.fromDate(new Date(creationTimestamp))});
    
    return { id: uid, email, role: finalRole, profile };
};


export const updateUserProfileDocument = async (uid: string, data: Partial<EndUserProfile | ConsultantProfile | AdminProfile>) => {
    const userDocRef = doc(db, 'users', uid);
    const dataToUpdate = { ...data };
    // Convert ISO string back to Firestore Timestamp before updating
    if (dataToUpdate.lastLoginAt) {
      dataToUpdate.lastLoginAt = Timestamp.fromDate(new Date(dataToUpdate.lastLoginAt)) as any;
    }
    await updateDoc(userDocRef, dataToUpdate);
};

export const addDocumentToUser = async (uid: string, newDoc: DocumentType) => {
  const userDocRef = doc(db, 'users', uid);
  await updateDoc(userDocRef, {
    documents: arrayUnion(newDoc)
  });
};


export const createConsultantByAdmin = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<{ success: boolean; message?: string }> => {

  try {
    // This is a temporary and insecure way to create users.
    // In a real application, this should be handled by a secure backend function
    // that uses the Firebase Admin SDK.
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await createUserProfileDocument(
      userCredential.user.uid,
      email,
      firstName,
      lastName,
      'consultant'
    );
    return { success: true };
  } catch (error: any) {
    console.error("Admin Consultant Creation Error:", error);

    let message = 'An unknown error occurred.';
    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'This email address is already registered.';
        break;
      case 'auth/invalid-email':
        message = 'The email address is not valid.';
        break;
      case 'auth/weak-password':
        message = 'The password is too weak. It must be at least 8 characters long.';
        break;
      default:
        message = 'Failed to create consultant. Please try again.';
    }
    return { success: false, message };
  }
};

export const sendPasswordResetLink = async (email: string): Promise<{ success: boolean; message?: string }> => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, message: `Password reset link sent to ${email}.` };
  } catch (error: any) {
    console.error("Password Reset Error:", error);
    let message = "An error occurred while sending the password reset email.";
    if (error.code === 'auth/user-not-found') {
        message = "There is no user corresponding to the given email."
    }
    return { success: false, message: message };
  }
};


export const getAllConsultants = async (): Promise<ConsultantProfile[]> => {
    const usersCollectionRef = collection(db, 'users');
    const q = query(usersCollectionRef, where('role', '==', 'consultant'));
    const querySnapshot = await getDocs(q);
    const consultants: ConsultantProfile[] = [];
    querySnapshot.forEach(doc => {
        let data = doc.data();
        data = convertTimestamps(data);
        consultants.push(data as ConsultantProfile)
    });
    return consultants;
};

export const getAllAdmins = async (): Promise<AdminProfile[]> => {
    const usersCollectionRef = collection(db, 'users');
    const q = query(usersCollectionRef, where('role', '==', 'admin'));
    const querySnapshot = await getDocs(q);
    const admins: AdminProfile[] = [];
    querySnapshot.forEach(doc => {
        let data = doc.data();
        data = convertTimestamps(data);
        admins.push(data as AdminProfile)
    });
    return admins;
};

export const getAllEndUsers = async (): Promise<EndUserProfile[]> => {
    const usersCollectionRef = collection(db, 'users');
    const q = query(usersCollectionRef, where('role', '==', 'enduser'));
    const querySnapshot = await getDocs(q);
    const users: EndUserProfile[] = [];
    querySnapshot.forEach(doc => {
        let data = doc.data();
        data = convertTimestamps(data);
        users.push(data as EndUserProfile)
    });
    return users;
};

export const findUserByUniqueId = async (uniqueId: string): Promise<EndUserProfile | null> => {
    const usersCollectionRef = collection(db, 'users');
    const q = query(usersCollectionRef, where('uniqueId', '==', uniqueId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }
    let data = querySnapshot.docs[0].data();
    data = convertTimestamps(data);
    return data as EndUserProfile;
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

// ================== KPI Functions ==================

export const getEndUsersCount = async (): Promise<number> => {
    const usersCollectionRef = collection(db, 'users');
    const q = query(usersCollectionRef, where('role', '==', 'enduser'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
};

export const getConsultantsCount = async (): Promise<number> => {
    const usersCollectionRef = collection(db, 'users');
    const q = query(usersCollectionRef, where('role', '==', 'consultant'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
};

export const getNewEndUsersCount = async (days: number): Promise<number> => {
    const usersCollectionRef = collection(db, 'users');
    const d = new Date();
    d.setDate(d.getDate() - days);
    const dateLimit = Timestamp.fromDate(d);
    
    const q = query(
        usersCollectionRef, 
        where('role', '==', 'enduser'),
        where('createdAt', '>=', dateLimit)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
};

export const getNewConsultantsCount = async (days: number): Promise<number> => {
    const usersCollectionRef = collection(db, 'users');
    const d = new Date();
    d.setDate(d.getDate() - days);
    const dateLimit = Timestamp.fromDate(d);
    
    const q = query(
        usersCollectionRef, 
        where('role', '==', 'consultant'),
        where('createdAt', '>=', dateLimit)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
};
