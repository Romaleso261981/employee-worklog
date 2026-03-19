export interface WorkEntry {
  id: string;
  userId: string;
  userEmail: string;
  workDate: string;
  description: string;
  categoryId: string;
  categoryName: string;
  amount: number;
}

export interface CreateWorkEntryPayload {
  userId: string;
  userEmail: string;
  workDate: string;
  description: string;
  categoryId: string;
  categoryName: string;
  amount?: number;
}
