export type UserRole = "employee" | "admin";

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: string;
}
