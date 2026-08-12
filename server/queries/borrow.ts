import 'server-only';
import { db } from '@/db';
import { borrow_requests, categories, activity_logs } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function getCategories() {
  return await db.select().from(categories).orderBy(categories.id);
}

export async function getBorrowRequests(statusFilter?: string) {
  const requests = await db.query.borrow_requests.findMany({
    with: {
      user: true,
      approver: true,
      asset: {
        with: {
          category: true,
        },
      },
    },
    orderBy: [desc(borrow_requests.id)],
  });

  if (statusFilter && statusFilter !== 'all') {
    return requests.filter((r) => r.status === statusFilter);
  }

  return requests;
}

export async function getRecentActivityLogs(limit = 5) {
  return await db.query.activity_logs.findMany({
    with: {
      user: true,
      borrowRequest: {
        with: {
          asset: true,
        },
      },
    },
    orderBy: [desc(activity_logs.id)],
    limit,
  });
}
