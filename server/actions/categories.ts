'use server';

import 'server-only';
import { db } from '@/db';
import { categories, assets, activity_logs } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUserSession } from './auth';

const categorySchema = z.object({
  name: z.string().min(2, 'กรุณาระบุชื่อหมวดหมู่ย่อยอย่างน้อย 2 ตัวอักษร'),
  icon: z.string().optional().default('box'),
  description: z.string().optional(),
});

export async function createCategoryAction(formData: {
  name: string;
  icon?: string;
  description?: string;
}) {
  try {
    const userSession = await getCurrentUserSession();
    if (!userSession || userSession.role !== 'admin') {
      return {
        success: false,
        message: 'ปฏิเสธการทำรายการ: สิทธิ์เฉพาะเจ้าหน้าที่ IT Administrator เท่านั้น',
      };
    }

    const validated = categorySchema.parse(formData);

    const [newCategory] = await db
      .insert(categories)
      .values({
        name: validated.name,
        icon: validated.icon || 'box',
        description: validated.description || '',
      })
      .returning();

    const newCategoryId = newCategory.id;

    await db.insert(activity_logs).values({
      user_id: userSession.id,
      action: 'CREATE_CATEGORY',
      details: `แอดมิน (${userSession.name}) สร้างหมวดหมู่อุปกรณ์ใหม่: ${validated.name}`,
    });

    revalidatePath('/');
    revalidatePath('/assets');
    revalidatePath('/admin/categories');

    return {
      success: true,
      message: 'สร้างหมวดหมู่อุปกรณ์ใหม่เรียบร้อยแล้ว',
      categoryId: newCategoryId,
    };
  } catch (err: unknown) {
    console.error('Error creating category:', err);
    return {
      success: false,
      message: err instanceof z.ZodError ? err.issues[0].message : 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่',
    };
  }
}

export async function updateCategoryAction(
  id: number,
  formData: {
    name: string;
    icon?: string;
    description?: string;
  }
) {
  try {
    const userSession = await getCurrentUserSession();
    if (!userSession || userSession.role !== 'admin') {
      return {
        success: false,
        message: 'ปฏิเสธการทำรายการ: สิทธิ์เฉพาะเจ้าหน้าที่ IT Administrator เท่านั้น',
      };
    }

    const validated = categorySchema.parse(formData);

    await db
      .update(categories)
      .set({
        name: validated.name,
        icon: validated.icon || 'box',
        description: validated.description || '',
      })
      .where(eq(categories.id, id));

    await db.insert(activity_logs).values({
      user_id: userSession.id,
      action: 'UPDATE_CATEGORY',
      details: `แอดมิน (${userSession.name}) แก้ไขหมวดหมู่อุปกรณ์ #${id}: ${validated.name}`,
    });

    revalidatePath('/');
    revalidatePath('/assets');
    revalidatePath('/admin/categories');

    return { success: true, message: 'แก้ไขหมวดหมู่อุปกรณ์เรียบร้อยแล้ว' };
  } catch (err: unknown) {
    console.error('Error updating category:', err);
    return {
      success: false,
      message: err instanceof z.ZodError ? err.issues[0].message : 'เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่',
    };
  }
}

export async function deleteCategoryAction(id: number) {
  try {
    const userSession = await getCurrentUserSession();
    if (!userSession || userSession.role !== 'admin') {
      return {
        success: false,
        message: 'ปฏิเสธการทำรายการ: สิทธิ์เฉพาะเจ้าหน้าที่ IT Administrator เท่านั้น',
      };
    }

    const existingCat = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    if (!existingCat) {
      return { success: false, message: 'ไม่พบหมวดหมู่อุปกรณ์ที่ต้องการลบ' };
    }

    // MANDATORY PRE-DELETION CHECK: Check if assets are currently referencing this category_id
    const [linkedAssetsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(assets)
      .where(eq(assets.category_id, id));

    const linkedCount = Number(linkedAssetsResult?.count || 0);

    if (linkedCount > 0) {
      return {
        success: false,
        message: `ไม่สามารถลบหมวดหมู่ "${existingCat.name}" ได้ เนื่องจากยังมีครุภัณฑ์ไอทีในหมวดนี้ใช้งานอยู่จำนวน ${linkedCount} รายการ กรุณาย้ายหรือลบครุภัณฑ์เหล่านั้นออกก่อน`,
      };
    }

    await db.delete(categories).where(eq(categories.id, id));

    await db.insert(activity_logs).values({
      user_id: userSession.id,
      action: 'DELETE_CATEGORY',
      details: `แอดมิน (${userSession.name}) ลบหมวดหมู่อุปกรณ์ #${id}: ${existingCat.name}`,
    });

    revalidatePath('/');
    revalidatePath('/assets');
    revalidatePath('/admin/categories');

    return { success: true, message: 'ลบหมวดหมู่อุปกรณ์เรียบร้อยแล้ว' };
  } catch (err: unknown) {
    console.error('Error deleting category:', err);
    return { success: false, message: 'เกิดข้อผิดพลาดในการลบหมวดหมู่อุปกรณ์' };
  }
}
