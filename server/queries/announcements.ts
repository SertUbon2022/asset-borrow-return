import 'server-only';
import { db } from '@/db';
import { announcements } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function getAnnouncements() {
  return await db.query.announcements.findMany({
    with: {
      author: true,
    },
    orderBy: [desc(announcements.is_pinned), desc(announcements.published_at)],
  });
}

export async function getAnnouncementById(id: number) {
  return await db.query.announcements.findFirst({
    where: eq(announcements.id, id),
    with: {
      author: true,
    },
  });
}
