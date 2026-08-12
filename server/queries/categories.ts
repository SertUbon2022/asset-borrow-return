import 'server-only';
import { db } from '@/db';
import { categories, assets } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export async function getCategoriesWithAssetCount() {
  const allCategories = await db.select().from(categories).orderBy(desc(categories.id));

  // Get asset count per category
  const assetCounts = await db
    .select({
      categoryId: assets.category_id,
      count: sql<number>`count(*)`,
    })
    .from(assets)
    .groupBy(assets.category_id);

  const countMap = new Map<number, number>();
  assetCounts.forEach((row) => {
    countMap.set(row.categoryId, Number(row.count));
  });

  return allCategories.map((cat) => ({
    ...cat,
    assetCount: countMap.get(cat.id) || 0,
  }));
}

export async function getCategoryById(id: number) {
  const [cat] = await db.select().from(categories).where(eq(categories.id, id));
  return cat || null;
}
