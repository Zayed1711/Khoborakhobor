/**
 * The login wall: only signed-in students (and admins) may open stories. Visitors see
 * the news feed with headlines only (see guestCard in src/lib/feed-card.ts).
 */
import { getCurrentSession, type UserSession } from "@/actions/auth";

export const canReadStories = (s: Pick<UserSession, "role" | "student"> | null | undefined): boolean =>
  !!s && (s.role === "admin" || !!s.student);

export async function viewerCanReadStories(): Promise<boolean> {
  try {
    return canReadStories(await getCurrentSession());
  } catch {
    return false;
  }
}
