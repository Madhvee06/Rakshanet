// ============================================================
// useFirestore.js – Custom Hooks for Firebase Operations
// ============================================================
// These hooks make it easy to read and write Firestore data
// from any React component.
// ============================================================

import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { db, auth } from "../firebase";

// ============================================================
// 1. FIRESTORE – Add a document to any collection
// ============================================================
/**
 * Adds a document to the specified Firestore collection.
 * Automatically adds a `createdAt` timestamp.
 *
 * @example
 * const { addDocument, loading, error } = useAddDocument("reports");
 * await addDocument({ type: "flood", desc: "..." });
 */
export function useAddDocument(collectionName) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  async function addDocument(data) {
    setLoading(true);
    setError(null);
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(), // server-side timestamp
      });
      setLoading(false);
      return docRef.id; // returns the new document ID
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }

  return { addDocument, loading, error };
}

// ============================================================
// 2. FIRESTORE – Listen to a collection in real time
// ============================================================
/**
 * Subscribes to a Firestore collection and returns live data.
 * Re-renders the component automatically when data changes.
 *
 * @example
 * const { documents, loading, error } = useCollection("reports");
 */
export function useCollection(collectionName, orderByField = "createdAt") {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    // Create a query ordered by the specified field
    const q = query(
      collection(db, collectionName),
      orderBy(orderByField, "desc")
    );

    // onSnapshot = real-time listener (auto-updates)
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDocuments(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    // Clean up listener when component unmounts
    return () => unsubscribe();
  }, [collectionName, orderByField]);

  return { documents, loading, error };
}

// ============================================================
// 3. FIRESTORE – Update a specific document
// ============================================================
/**
 * Updates fields in a specific document.
 *
 * @example
 * const { updateDocument } = useUpdateDocument("volunteers");
 * await updateDocument("v1", { status: "busy" });
 */
export function useUpdateDocument(collectionName) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  async function updateDocument(docId, data) {
    setLoading(true);
    try {
      const ref = doc(db, collectionName, docId);
      await updateDoc(ref, data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return { updateDocument, loading, error };
}

// ============================================================
// 4. AUTH – Email/Password Sign Up
// ============================================================
/**
 * Creates a new user account with email and password.
 *
 * @example
 * const { signUp, loading, error } = useSignUp();
 * await signUp("test@email.com", "password123", "Ravi Kumar");
 */
export function useSignUp() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  async function signUp(email, password, displayName) {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, email, password
      );
      // Set the display name on the profile
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
      setLoading(false);
      return userCredential.user;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return { signUp, loading, error };
}

// ============================================================
// 5. AUTH – Email/Password Sign In
// ============================================================
/**
 * Signs in an existing user.
 *
 * @example
 * const { signIn, loading, error } = useSignIn();
 * await signIn("test@email.com", "password123");
 */
export function useSignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  async function signIn(email, password) {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth, email, password
      );
      setLoading(false);
      return userCredential.user;
    } catch (err) {
      // Make error messages beginner-friendly
      const messages = {
        "auth/user-not-found":  "No account found with this email.",
        "auth/wrong-password":  "Incorrect password. Please try again.",
        "auth/invalid-email":   "Please enter a valid email address.",
      };
      setError(messages[err.code] || err.message);
      setLoading(false);
    }
  }

  return { signIn, loading, error };
}

// ============================================================
// 6. AUTH – Sign Out
// ============================================================
export function useSignOut() {
  async function logout() {
    await signOut(auth);
  }
  return { logout };
}

// ============================================================
// 7. AUTH – Track current user (real-time)
// ============================================================
/**
 * Returns the currently logged-in user (or null if logged out).
 * Updates automatically when auth state changes.
 *
 * @example
 * const { user, loading } = useCurrentUser();
 */
export function useCurrentUser() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged fires whenever the user logs in/out
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { user, loading };
}
