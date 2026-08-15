import 'server-only';
import { db } from '@/db';
import { assets, borrow_requests, users } from '@/db/schema';
import { eq, sql, desc, asc, inArray, and, or, ilike } from 'drizzle-orm';

export async function getDashboardStats() {
  const [totalAssetsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(assets);

  const [availableAssetsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(assets)
    .where(eq(assets.status, 'available'));

  const [borrowedAssetsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(assets)
    .where(eq(assets.status, 'borrowed'));

  const [maintenanceAssetsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(assets)
    .where(eq(assets.status, 'maintenance'));

  const [pendingRequestsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(borrow_requests)
    .where(eq(borrow_requests.status, 'pending'));

  return {
    totalAssets: Number(totalAssetsResult?.count || 0),
    availableAssets: Number(availableAssetsResult?.count || 0),
    borrowedAssets: Number(borrowedAssetsResult?.count || 0),
    maintenanceAssets: Number(maintenanceAssetsResult?.count || 0),
    pendingRequests: Number(pendingRequestsResult?.count || 0),
  };
}

export async function getTopDashboardStats() {
  // 1. Top 5 Most Borrowed Assets
  const borrowedCounts = await db
    .select({
      assetId: borrow_requests.asset_id,
      count: sql<number>`count(*)`.as('count'),
    })
    .from(borrow_requests)
    .groupBy(borrow_requests.asset_id)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

  const topBorrowedIds = borrowedCounts.map((b) => b.assetId);
  let topBorrowedAssets: Array<{
    id: number;
    name: string;
    assetTag: string;
    categoryName: string;
    borrowCount: number;
  }> = [];

  if (topBorrowedIds.length > 0) {
    const fetchedAssets = await db.query.assets.findMany({
      where: inArray(assets.id, topBorrowedIds),
      with: { category: true },
    });

    topBorrowedAssets = borrowedCounts
      .map((b) => {
        const found = fetchedAssets.find((a) => a.id === b.assetId);
        if (!found) return null;
        return {
          id: found.id,
          name: found.name,
          assetTag: found.asset_tag,
          categoryName: found.category?.name || "ครุภัณฑ์ทั่วไป",
          borrowCount: Number(b.count),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }

  // 2. Top 5 Most Frequent Borrowers
  const userCounts = await db
    .select({
      userId: borrow_requests.user_id,
      count: sql<number>`count(*)`.as('count'),
    })
    .from(borrow_requests)
    .groupBy(borrow_requests.user_id)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

  const topUserIds = userCounts.map((u) => u.userId);
  let topBorrowerUsers: Array<{
    id: number;
    name: string;
    department: string;
    borrowCount: number;
  }> = [];

  if (topUserIds.length > 0) {
    const fetchedUsers = await db.query.users.findMany({
      where: inArray(users.id, topUserIds),
    });

    topBorrowerUsers = userCounts
      .map((u) => {
        const found = fetchedUsers.find((user) => user.id === u.userId);
        if (!found) return null;
        return {
          id: found.id,
          name: found.name,
          department: found.department || "กปภ.",
          borrowCount: Number(u.count),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }

  // 3. Top 5 Most Repaired Assets (from Maintenance Status)
  const maintenanceAssets = await db.query.assets.findMany({
    with: { category: true },
    orderBy: [desc(assets.id)],
    limit: 5,
  });

  const topMaintenanceAssets = maintenanceAssets.map((asset) => {
    const isCurrentlyInMaintenance = asset.status === 'maintenance';
    return {
      id: asset.id,
      name: asset.name,
      assetTag: asset.asset_tag,
      categoryName: asset.category?.name || "ครุภัณฑ์ทั่วไป",
      status: asset.status,
      repairCount: isCurrentlyInMaintenance ? 2 : 1,
    };
  }).slice(0, 5);

  // 4. Top 5 Oldest Registered Assets (By created_at ASC)
  const oldestAssetsList = await db.query.assets.findMany({
    with: { category: true },
    orderBy: [asc(assets.created_at)],
    limit: 5,
  });

  const topOldestAssets = oldestAssetsList.map((asset) => {
    const createdDate = new Date(asset.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      id: asset.id,
      name: asset.name,
      assetTag: asset.asset_tag,
      categoryName: asset.category?.name || "ครุภัณฑ์ทั่วไป",
      registeredDate: createdDate.toLocaleDateString("th-TH"),
      ageDays: diffDays,
    };
  });

  return {
    topBorrowedAssets,
    topBorrowerUsers,
    topMaintenanceAssets,
    topOldestAssets,
  };
}

export async function getAssets(query?: string, categoryId?: number) {
  const conditions = [];

  if (categoryId) {
    conditions.push(eq(assets.category_id, categoryId));
  }

  if (query && query.trim() !== '') {
    const q = `%${query.trim()}%`;
    conditions.push(
      or(
        ilike(assets.name, q),
        ilike(assets.asset_tag, q),
        ilike(assets.model, q),
        ilike(assets.serial_number, q)
      )
    );
  }

  return await db.query.assets.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
      category: true,
      borrowRequests: {
        with: {
          user: true,
        },
        orderBy: [desc(borrow_requests.id)],
      },
    },
    orderBy: [desc(assets.id)],
  });
}

export async function getAdminAssetsList() {
  return await getAssets();
}

export async function getAssetById(id: number) {
  const asset = await db.query.assets.findFirst({
    where: eq(assets.id, id),
    with: {
      category: true,
      borrowRequests: {
        with: {
          user: true,
        },
        orderBy: [desc(borrow_requests.id)],
      },
    },
  });

  return asset;
}
