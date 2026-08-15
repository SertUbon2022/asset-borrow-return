import 'server-only';
import { db } from '@/db';
import { borrow_requests, categories, activity_logs, BorrowRequest } from '@/db/schema';
import { desc, eq, and, lt } from 'drizzle-orm';

export async function getCategories() {
  return await db.select().from(categories).orderBy(categories.id);
}

export async function getBorrowRequests(statusFilter?: string, userId?: number) {
  const conditions = [];

  if (userId) {
    conditions.push(eq(borrow_requests.user_id, userId));
  }

  if (statusFilter && statusFilter !== 'all') {
    if (statusFilter === 'overdue') {
      conditions.push(
        and(
          eq(borrow_requests.status, 'borrowed'),
          lt(borrow_requests.expected_return_date, new Date())
        )
      );
    } else {
      conditions.push(eq(borrow_requests.status, statusFilter as BorrowRequest['status']));
    }
  }

  return await db.query.borrow_requests.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
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
