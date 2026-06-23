import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getFirebaseDb } from "@/shared/lib/firebase/client";
import { getUserProfile, getUserProfileByEmail } from "@/entities/user/model/user-service";
import {
  getWorkMirrorTargetUidFromEnv,
  shouldMirrorWorkEntry,
  WORK_MIRROR_TARGET_EMAILS,
} from "@/shared/lib/work-entry-mirror";
import { UserProfile } from "@/entities/user/model/types";
import { CreateSalaryPayoutPayload, CreateWorkEntryPayload, SalaryPayout, WorkEntry } from "./types";
import { normalizeWorkPaymentStatus } from "./payment-status";

function mapWorkEntryDoc(id: string, data: Record<string, unknown>): WorkEntry {
  const entry = data as Omit<WorkEntry, "id" | "paymentStatus"> & { paymentStatus?: unknown };
  return {
    id,
    userId: entry.userId,
    userEmail: entry.userEmail,
    workDate: entry.workDate,
    description: entry.description,
    categoryId: entry.categoryId,
    categoryName: entry.categoryName,
    amount: typeof entry.amount === "number" ? entry.amount : 0,
    paymentStatus: normalizeWorkPaymentStatus(entry.paymentStatus),
    organizationAmount: typeof entry.organizationAmount === "number" ? entry.organizationAmount : 0,
    organizationPaid: entry.organizationPaid === true,
  };
}

export async function createWorkEntry(payload: CreateWorkEntryPayload): Promise<void> {
  await createWorkEntriesBatch([payload]);
}

async function createWorkEntriesBatch(payloads: CreateWorkEntryPayload[]): Promise<void> {
  const db = getFirebaseDb();
  const workEntriesCollection = collection(db, "workEntries");
  const batch = writeBatch(db);

  for (const payload of payloads) {
    const ref = doc(workEntriesCollection);
    batch.set(ref, {
      ...payload,
      amount: payload.amount ?? 0,
      paymentStatus: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
}

async function resolveMirrorTargetProfile(): Promise<UserProfile> {
  const fromEnv = getWorkMirrorTargetUidFromEnv();
  if (fromEnv) {
    const byUid = await getUserProfile(fromEnv);
    if (byUid) {
      return byUid;
    }
    return {
      uid: fromEnv,
      email: WORK_MIRROR_TARGET_EMAILS[0],
      role: "employee",
      createdAt: new Date().toISOString(),
    };
  }

  for (const email of WORK_MIRROR_TARGET_EMAILS) {
    const targetProfile = await getUserProfileByEmail(email);
    if (targetProfile?.uid) {
      return targetProfile;
    }
  }

  throw new Error("WORK_MIRROR_TARGET_NOT_FOUND");
}

/** Створює запис для автора; для bilous@gmail.com — ще копію на stratiichuk@gmail.com. */
export async function createWorkEntryForCreator(
  payload: CreateWorkEntryPayload,
  creatorEmail: string,
): Promise<void> {
  const toCreate: CreateWorkEntryPayload[] = [payload];

  if (shouldMirrorWorkEntry(creatorEmail)) {
    const mirrorTarget = await resolveMirrorTargetProfile();
    toCreate.push({
      userId: mirrorTarget.uid,
      userEmail: mirrorTarget.email,
      workDate: payload.workDate,
      description: payload.description,
      categoryId: payload.categoryId,
      categoryName: payload.categoryName,
      amount: payload.amount ?? 0,
    });
  }

  await createWorkEntriesBatch(toCreate);
}

export async function listUserWorkEntries(userId: string): Promise<WorkEntry[]> {
  const db = getFirebaseDb();
  const workEntriesCollection = collection(db, "workEntries");
  const snapshot = await getDocs(query(workEntriesCollection, where("userId", "==", userId)));

  return snapshot.docs
    .map((item) => mapWorkEntryDoc(item.id, item.data() as Record<string, unknown>))
    .sort((a, b) => b.workDate.localeCompare(a.workDate));
}

export async function listAllWorkEntries(): Promise<WorkEntry[]> {
  const db = getFirebaseDb();
  const workEntriesCollection = collection(db, "workEntries");
  const snapshot = await getDocs(query(workEntriesCollection, orderBy("workDate", "desc")));

  return snapshot.docs.map((item) => mapWorkEntryDoc(item.id, item.data() as Record<string, unknown>));
}

export async function updateWorkAmount(workId: string, amount: number): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, "workEntries", workId), {
    amount,
    updatedAt: serverTimestamp(),
  });
}

export async function updateWorkEntryAdmin(workId: string, patch: { amount: number; description: string }): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, "workEntries", workId), {
    amount: patch.amount,
    description: patch.description,
    updatedAt: serverTimestamp(),
  });
}

export async function updateWorkEntry(
  workId: string,
  patch: { workDate: string; description: string; categoryId: string; categoryName: string },
): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, "workEntries", workId), {
    workDate: patch.workDate,
    description: patch.description,
    categoryId: patch.categoryId,
    categoryName: patch.categoryName,
    updatedAt: serverTimestamp(),
  });
}

export async function updateWorkPaymentStatus(workId: string, paymentStatus: WorkEntry["paymentStatus"]): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, "workEntries", workId), {
    paymentStatus,
    updatedAt: serverTimestamp(),
  });
}

export async function updateWorkOrganizationBilling(
  workId: string,
  patch: { organizationAmount?: number; organizationPaid?: boolean },
): Promise<void> {
  const db = getFirebaseDb();
  const data: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (patch.organizationAmount !== undefined) {
    data.organizationAmount = patch.organizationAmount;
  }
  if (patch.organizationPaid !== undefined) {
    data.organizationPaid = patch.organizationPaid;
  }
  await updateDoc(doc(db, "workEntries", workId), data);
}

export async function deleteWorkEntry(workId: string): Promise<void> {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, "workEntries", workId));
}

export async function createSalaryPayout(payload: CreateSalaryPayoutPayload): Promise<void> {
  const db = getFirebaseDb();
  const salaryPayoutsCollection = collection(db, "salaryPayouts");

  await addDoc(salaryPayoutsCollection, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function listAllSalaryPayouts(): Promise<SalaryPayout[]> {
  const db = getFirebaseDb();
  const salaryPayoutsCollection = collection(db, "salaryPayouts");
  const snapshot = await getDocs(query(salaryPayoutsCollection, orderBy("payoutDate", "desc")));

  return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<SalaryPayout, "id">) }));
}

export async function listUserSalaryPayouts(userId: string): Promise<SalaryPayout[]> {
  const db = getFirebaseDb();
  const salaryPayoutsCollection = collection(db, "salaryPayouts");
  const snapshot = await getDocs(query(salaryPayoutsCollection, where("userId", "==", userId)));

  return snapshot.docs
    .map((item) => ({ id: item.id, ...(item.data() as Omit<SalaryPayout, "id">) }))
    .sort((a, b) => b.payoutDate.localeCompare(a.payoutDate));
}
