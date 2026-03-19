import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/shared/lib/firebase/client";
import { UserProfile } from "./types";

const usersCollection = "users";

export async function createUserProfile(uid: string, email: string): Promise<void> {
  const db = getFirebaseDb();
  await setDoc(doc(db, usersCollection, uid), {
    uid,
    email,
    role: "employee",
    createdAt: serverTimestamp(),
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const db = getFirebaseDb();
  const snapshot = await getDoc(doc(db, usersCollection, uid));

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data() as Omit<UserProfile, "createdAt"> & {
    createdAt?: { toDate: () => Date };
  };

  return {
    uid: data.uid,
    email: data.email,
    role: data.role,
    createdAt: data.createdAt?.toDate().toISOString() ?? new Date().toISOString(),
  };
}
