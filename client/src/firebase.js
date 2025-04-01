import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCP1cZAR-yrdgp7AxF8IdziXGFqT3efsAQ",
  authDomain: "undergod-e9f0d.firebaseapp.com",
  projectId: "undergod-e9f0d",
  storageBucket: "undergod-e9f0d.firebasestorage.app",
  messagingSenderId: "989873870632",
  appId: "1:989873870632:web:10ceeb0182d3ecd4ca621d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Create admin account if it doesn't exist
const createAdminIfNotExists = async () => {
  const adminEmail = 'admin@p40underdogs.com';
  const adminPassword = 'admin123';

  try {
    // Check if admin exists in Firestore first
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'admin'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('No admin found, creating new admin account...');
      
      // Create admin account
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      const user = userCredential.user;

      // Create admin document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name: 'Admin',
        email: adminEmail,
        role: 'admin',
        createdAt: new Date().toISOString()
      });

      console.log('Admin account created successfully');
    } else {
      console.log('Admin account already exists');
    }
  } catch (error) {
    console.error('Error in createAdminIfNotExists:', error.code, error.message);
    if (error.code === 'auth/email-already-in-use') {
      console.log('Admin auth account exists, checking Firestore...');
      try {
        // Try to sign in to get the user ID
        const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        const user = userCredential.user;
        
        // Check if admin document exists in Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          // Create admin document if it doesn't exist
          await setDoc(doc(db, 'users', user.uid), {
            name: 'Admin',
            email: adminEmail,
            role: 'admin',
            createdAt: new Date().toISOString()
          });
          console.log('Admin Firestore document created');
        }
        
        // Sign out after checking
        await signOut(auth);
      } catch (innerError) {
        console.error('Error checking admin Firestore document:', innerError);
      }
    }
  }
};

// Call createAdminIfNotExists when the app initializes
createAdminIfNotExists().catch(console.error);

// Admin login function
export const adminLogin = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user role from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();

    if (userData?.role !== 'admin') {
      await signOut(auth);
      return { user: null, role: null, error: 'Not authorized as admin' };
    }

    return { user, role: 'admin', error: null };
  } catch (error) {
    return { user: null, role: null, error: error.message };
  }
};

// Sign up function (for walkers only)
export const signUp = async (email, password, name, phoneNumber) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      name,
      email,
      role: 'walker',
      phoneNumber,
      createdAt: new Date().toISOString()
    });

    return { user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// Login function (for all users)
export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user role from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();

    return { user, role: userData?.role || 'walker', error: null };
  } catch (error) {
    return { user: null, role: null, error: error.message };
  }
};

// Create marshal account (by admin only)
export const createMarshalAccount = async (email, password, name, phoneNumber) => {
  try {
    // Store current admin user
    const currentAdmin = auth.currentUser;
    if (!currentAdmin) {
      throw new Error('No admin user found. Please log in again.');
    }
    
    // Verify current user is admin
    const adminDoc = await getDoc(doc(db, 'users', currentAdmin.uid));
    const adminData = adminDoc.data();
    
    if (adminData?.role !== 'admin') {
      throw new Error('Not authorized to create marshal accounts');
    }
    
    // Create user with marshal role
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const userData = {
      name,
      email,
      role: 'marshal',
      phoneNumber,
      createdAt: new Date().toISOString(),
      createdBy: currentAdmin.uid
    };

    // Create user in Firestore
    await setDoc(doc(db, 'users', user.uid), userData);
    
    return { user, error: null };
  } catch (error) {
    console.error('Error creating marshal:', error);
    return { user: null, error: error.message };
  }
};

// Sign out function
export const logOut = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// Get current user role
export const getCurrentUserRole = async () => {
  const user = auth.currentUser;
  if (!user) return null;

  const userDoc = await getDoc(doc(db, 'users', user.uid));
  return userDoc.data()?.role || null;
};

// Auth state observer
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const role = userDoc.data()?.role || 'walker';
      callback({ user, role });
    } else {
      callback({ user: null, role: null });
    }
  });
};

export { auth, db }; 