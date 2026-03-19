import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getFirebaseDb } from "@/shared/lib/firebase/client";
import { CreateSalaryPayoutPayload, CreateWorkEntryPayload, SalaryPayout, WorkEntry } from "./types";

export async function createWorkEntry(payload: CreateWorkEntryPayload): Promise<void> {
  const db = getFirebaseDb();
  const workEntriesCollection = collection(db, "workEntries");
  await addDoc(workEntriesCollection, {
    ...payload,
    amount: payload.amount ?? 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function listUserWorkEntries(userId: string): Promise<WorkEntry[]> {
  const db = getFirebaseDb();
  const workEntriesCollection = collection(db, "workEntries");
  const snapshot = await getDocs(query(workEntriesCollection, where("userId", "==", userId)));

  return snapshot.docs
    .map((item) => ({ id: item.id, ...(item.data() as Omit<WorkEntry, "id">) }))
    .sort((a, b) => b.workDate.localeCompare(a.workDate));
}

export async function listAllWorkEntries(): Promise<WorkEntry[]> {
  const db = getFirebaseDb();
  const workEntriesCollection = collection(db, "workEntries");
  const snapshot = await getDocs(query(workEntriesCollection, orderBy("workDate", "desc")));

  return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<WorkEntry, "id">) }));
}

export async function updateWorkAmount(workId: string, amount: number): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, "workEntries", workId), {
    amount,
    updatedAt: serverTimestamp(),
  });
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
