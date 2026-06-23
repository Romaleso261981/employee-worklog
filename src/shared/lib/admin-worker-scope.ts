export function filterItemsByWorkerEmails<T extends { userEmail: string }>(
  items: T[],
  allWorkerEmails: string[],
  selectedEmails: string[] | null,
): T[] {
  if (selectedEmails === null) {
    return items;
  }
  if (selectedEmails.length === 0) {
    return [];
  }
  if (allWorkerEmails.length > 0 && allWorkerEmails.every((email) => selectedEmails.includes(email))) {
    return items;
  }
  const allowed = new Set(selectedEmails);
  return items.filter((item) => allowed.has(item.userEmail));
}

export function isAllWorkersSelected(allWorkerEmails: string[], selectedEmails: string[] | null): boolean {
  if (selectedEmails === null || allWorkerEmails.length === 0) {
    return true;
  }
  return allWorkerEmails.every((email) => selectedEmails.includes(email));
}
