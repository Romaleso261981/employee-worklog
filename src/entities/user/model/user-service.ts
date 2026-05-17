import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { getFirebaseDb } from "@/shared/lib/firebase/client";
import { UserProfile } from "./types";

const usersCollection = "users";

export async function createUserProfile(uid: string, email: string): Promise<void> {
  const db = getFirebaseDb();
  const normalizedEmail = email.trim().toLowerCase();
  await setDoc(doc(db, usersCollection, uid), {
    uid,
    email: normalizedEmail,
    role: "employee",
    createdAt: serverTimestamp(),
  });
}

/** Якщо в Auth є користувач, але документа в Firestore ще немає (напр. створили вручну в консолі). */
export async function ensureUserProfile(uid: string, email: string): Promise<UserProfile> {
  const existing = await getUserProfile(uid);
  if (existing) {
    return existing;
  }

  await createUserProfile(uid, email);
  const created = await getUserProfile(uid);
  if (!created) {
    return {
      uid,
      email: email.trim().toLowerCase(),
      role: "employee",
      createdAt: new Date().toISOString(),
    };
  }
  return created;
}

function mapUserDoc(
  data: Omit<UserProfile, "createdAt"> & { createdAt?: { toDate: () => Date } },
): UserProfile {
  return {
    uid: data.uid,
    email: data.email,
    role: data.role,
    createdAt: data.createdAt?.toDate().toISOString() ?? new Date().toISOString(),
  };
}

export async function getUserProfileByEmail(email: string): Promise<UserProfile | null> {
  const db = getFirebaseDb();
  const trimmed = email.trim();
  for (const candidate of [trimmed.toLowerCase(), trimmed]) {
    const snapshot = await getDocs(query(collection(db, usersCollection), where("email", "==", candidate)));
    if (!snapshot.empty) {
      return mapUserDoc(
        snapshot.docs[0].data() as Omit<UserProfile, "createdAt"> & {
          createdAt?: { toDate: () => Date };
        },
      );
    }
  }
  return null;
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
