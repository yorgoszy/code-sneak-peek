/**
 * Energy priority for the "Ενεργοί Χρήστες" list:
 * the subscription that expires soonest decides the position.
 */

export interface SubscriptionExpiryRow {
  user_id: string;
  end_date: string | null;
}

/**
 * Earliest (soonest) end_date per user. A user with several active
 * subscriptions is treated as expiring as soon as their first one does.
 */
export function earliestEndDateByUser(rows: SubscriptionExpiryRow[]): Map<string, string> {
  const earliest = new Map<string, string>();
  for (const row of rows) {
    if (!row.user_id || !row.end_date) continue;
    const current = earliest.get(row.user_id);
    if (!current || row.end_date < current) {
      earliest.set(row.user_id, row.end_date);
    }
  }
  return earliest;
}

/**
 * Sorts users ascending by remaining days (soonest expiry first).
 * Users without a known expiry go last, then alphabetical by name.
 */
export function sortUsersByExpiry<T extends { id: string; name: string | null }>(
  users: T[],
  endDates: Map<string, string>,
): T[] {
  return [...users].sort((a, b) => {
    const dateA = endDates.get(a.id);
    const dateB = endDates.get(b.id);

    if (dateA && dateB && dateA !== dateB) return dateA < dateB ? -1 : 1;
    if (dateA && !dateB) return -1;
    if (!dateA && dateB) return 1;

    const nameA = (a.name ?? "").toLocaleLowerCase("el");
    const nameB = (b.name ?? "").toLocaleLowerCase("el");
    if (nameA !== nameB) return nameA < nameB ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

/** Whole days left until expiry; 0 means it ends today. */
  if (!endDate) return null;
  const [year, month, day] = endDate.split("-").map(Number);
  if (!year || !month || !day) return null;
  const end = new Date(year, month - 1, day, 12, 0, 0);
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);
  return Math.round((end.getTime() - now.getTime()) / 86_400_000);
}
