import 'server-only';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function getUsersList() {
  return await db.select().from(users).orderBy(desc(users.id));
}

export async function getUserById(id: number) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user || null;
}
