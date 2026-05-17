/** Працівник-джерело: його роботи дублюються на цільового працівника. */
export const WORK_MIRROR_SOURCE_EMAIL = "bilous@gmail.com";

/** Можливі пошти цільового працівника (різний регістр / опечатка з однією чи двома «i»). */
export const WORK_MIRROR_TARGET_EMAILS = ["stratichuk@gmail.com", "stratiichuk@gmail.com"] as const;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function shouldMirrorWorkEntry(creatorEmail: string): boolean {
  return normalizeEmail(creatorEmail) === normalizeEmail(WORK_MIRROR_SOURCE_EMAIL);
}

export function isWorkMirrorTargetEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  return WORK_MIRROR_TARGET_EMAILS.some((target) => normalizeEmail(target) === normalized);
}

/** Якщо в Firestore немає профілю за email — вкажи uid у .env.local */
export function getWorkMirrorTargetUidFromEnv(): string | null {
  const uid = process.env.NEXT_PUBLIC_WORK_MIRROR_TARGET_UID?.trim();
  return uid ? uid : null;
}
