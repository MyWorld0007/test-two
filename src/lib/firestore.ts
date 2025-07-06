
import { db, firebaseConfig } from './firebase';
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
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';


// ================== User Profile Functions ==================

export const getUserProfile = async (uid: string): Promise<AuthenticatedUser | null> => {
  const userDocRef = doc(db, 'users', uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    let profileData = userDocSnap.data();
    let role = profileData.role;
    const email = profileData.email;

    // Special check: If the user is admin@example.com but their role isn't 'admin',
    // this will self-correct the profile in Firestore to be an admin profile.
    if (email === 'admin@example.com' && role !== 'admin') {
      const name = profileData.firstName ? `${profileData.firstName} ${profileData.lastName}` : 'Admin User';
      const adminProfile: AdminProfile = {
        role: 'admin',
        adminId: uid,
        name: name,
        email: email,
        createdAt: (profileData.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
      };

      // Overwrite the incorrect profile with the correct admin profile
      await setDoc(userDocRef, {...adminProfile, createdAt: profileData.createdAt || Timestamp.now()});

      profileData = adminProfile;
      role = 'admin';
    }
    
    // Convert Timestamps to ISO strings
    if (profileData.createdAt && profileData.createdAt instanceof Timestamp) {
        profileData.createdAt = profileData.createdAt.toDate().toISOString();
    }
    if (profileData.lastLoginAt && profileData.lastLoginAt instanceof Timestamp) {
        profileData.lastLoginAt = profileData.lastLoginAt.toDate().toISOString();
    }


    return {
      id: uid,
      email: email,
      role: role,
      profile: profileData as EndUserProfile | ConsultantProfile | AdminProfile,
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
    let finalRole = role;
    const creationTimestamp = Timestamp.now();


    // Special check to enforce admin role for a specific email
    if (email === 'admin@example.com') {
      finalRole = 'admin';
    } else if (email.toLowerCase().endsWith('@mydc.com')) {
      finalRole = 'consultant';
    }

    // Based on the user's role, we create a different data structure.
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
            createdAt: creationTimestamp.toDate().toISOString(),
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
            createdAt: creationTimestamp.toDate().toISOString(),
        };
    } else { // admin
        profile = {
            role: 'admin',
            adminId: uid,
            name: `${firstName} ${lastName}`,
            email,
            createdAt: creationTimestamp.toDate().toISOString(),
        }
    }
    // We save the structured profile data to the 'users' collection 
    // with the document ID being the user's authentication UID.
    await setDoc(doc(db, "users", uid), {...profile, createdAt: creationTimestamp});
    
    // We return the complete user object for immediate use in the app.
    return { id: uid, email, role: finalRole, profile };
};


export const updateUserProfileDocument = async (uid: string, data: Partial<EndUserProfile | ConsultantProfile | AdminProfile>) => {
    const userDocRef = doc(db, 'users', uid);
    // Convert ISO string date back to Firestore Timestamp if present
    const dataToUpdate = { ...data };
    if (dataToUpdate.lastLoginAt) {
      dataToUpdate.lastLoginAt = Timestamp.fromDate(new Date(dataToUpdate.lastLoginAt)) as any;
    }
    await updateDoc(userDocRef, dataToUpdate);
};

export const createConsultantByAdmin = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<{ success: boolean; message?: string }> => {
  // Create a temporary secondary Firebase app. This allows us to create a new user
  // without affecting the currently logged-in admin's authentication state.
  const tempAppName = `temp-app-create-consultant-${Date.now()}`;
  const tempApp = initializeApp(firebaseConfig, tempAppName);
  const tempAuth = getAuth(tempApp);

  try {
    // This creates the user in Firebase Authentication using the temporary app instance.
    const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
    
    // This creates the corresponding profile document in Firestore using the main db instance.
    await createUserProfileDocument(
      userCredential.user.uid,
      email,
      firstName,
      lastName,
      'consultant'
    );
    
    // Clean up the temporary app instance after successful creation.
    await deleteApp(tempApp);
    return { success: true };
  } catch (error: any) {
    console.error("Admin Consultant Creation Error:", error);
    
    // Ensure the temporary app is cleaned up even if an error occurs.
    await deleteApp(tempApp);

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
      case 'auth/operation-not-allowed':
          message = 'Email/Password sign-up is not enabled in the Firebase Console.';
          break;
      default:
        message = 'Failed to create consultant. Please try again.';
    }
    return { success: false, message };
  }
};


export const getAllConsultants = async (): Promise<ConsultantProfile[]> => {
    const usersCollectionRef = collection(db, 'users');
    const q = query(usersCollectionRef, where('role', '==', 'consultant'));
    const querySnapshot = await getDocs(q);
    const consultants: ConsultantProfile[] = [];
    querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.createdAt && data.createdAt instanceof Timestamp) {
            data.createdAt = data.createdAt.toDate().toISOString();
        }
        if (data.lastLoginAt && data.lastLoginAt instanceof Timestamp) {
            data.lastLoginAt = data.lastLoginAt.toDate().toISOString();
        }
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
        const data = doc.data();
        if (data.createdAt && data.createdAt instanceof Timestamp) {
            data.createdAt = data.createdAt.toDate().toISOString();
        }
        if (data.lastLoginAt && data.lastLoginAt instanceof Timestamp) {
            data.lastLoginAt = data.lastLoginAt.toDate().toISOString();
        }
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
        const data = doc.data();
        if (data.createdAt && data.createdAt instanceof Timestamp) {
            data.createdAt = data.createdAt.toDate().toISOString();
        }
        if (data.lastLoginAt && data.lastLoginAt instanceof Timestamp) {
            data.lastLoginAt = data.lastLoginAt.toDate().toISOString();
        }
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
