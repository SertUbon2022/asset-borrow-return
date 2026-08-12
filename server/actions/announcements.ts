'use server';

import 'server-only';
import { db } from '@/db';
import { announcements, activity_logs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUserSession } from './auth';

const announcementSchema = z.object({
  title: z.string().min(3, 'กรุณาระบุหัวข้อข่าวอย่างน้อย 3 ตัวอักษร'),
  content: z.string().min(5, 'กรุณาระบุเนื้อหาข่าวอย่างน้อย 5 ตัวอักษร'),
  category: z.enum(['important', 'update', 'security', 'maintenance']),
  isPinned: z.boolean().optional().default(false),
  imageUrls: z.array(z.string()).optional().default([]),
});

export async function createAnnouncementAction(formData: {
  title: string;
  content: string;
  category: 'important' | 'update' | 'security' | 'maintenance';
  isPinned?: boolean;
  imageUrls?: string[];
}) {
  try {
    const userSession = await getCurrentUserSession();
    if (!userSession || userSession.role !== 'admin') {
      return {
        success: false,
        message: 'ปฏิเสธการทำรายการ: สิทธิ์เฉพาะเจ้าหน้าที่ IT Administrator เท่านั้น',
      };
    }

    const validated = announcementSchema.parse(formData);

    const [newAnnouncement] = await db
      .insert(announcements)
      .values({
        title: validated.title,
        content: validated.content,
        category: validated.category,
        is_pinned: validated.isPinned || false,
        image_urls: JSON.stringify(validated.imageUrls || []),
        created_by: userSession.id,
      })
      .returning();

    const newAnnouncementId = newAnnouncement.id;

    await db.insert(activity_logs).values({
      user_id: userSession.id,
      action: 'CREATE_ANNOUNCEMENT',
      details: `แอดมิน (${userSession.name}) สร้างข่าวประกาศใหม่: ${validated.title}`,
    });

    revalidatePath('/');
    revalidatePath('/admin/announcements');

    return {
      success: true,
      message: 'สร้างข่าวประชาสัมพันธ์เรียบร้อยแล้ว',
      announcementId: newAnnouncementId,
    };
  } catch (err: unknown) {
    console.error('Error creating announcement:', err);
    return {
      success: false,
      message: err instanceof z.ZodError ? err.issues[0].message : 'เกิดข้อผิดพลาดในการสร้างข่าวประกาศ',
    };
  }
}

export async function updateAnnouncementAction(
  id: number,
  formData: {
    title: string;
    content: string;
    category: 'important' | 'update' | 'security' | 'maintenance';
    isPinned?: boolean;
    imageUrls?: string[];
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

    const validated = announcementSchema.parse(formData);

    await db
      .update(announcements)
      .set({
        title: validated.title,
        content: validated.content,
        category: validated.category,
        is_pinned: validated.isPinned || false,
        image_urls: JSON.stringify(validated.imageUrls || []),
        updated_at: new Date(),
      })
      .where(eq(announcements.id, id));

    await db.insert(activity_logs).values({
      user_id: userSession.id,
      action: 'UPDATE_ANNOUNCEMENT',
      details: `แอดมิน (${userSession.name}) แก้ไขข่าวประกาศ #${id}: ${validated.title}`,
    });

    revalidatePath('/');
    revalidatePath('/admin/announcements');

    return { success: true, message: 'แก้ไขข่าวประชาสัมพันธ์เรียบร้อยแล้ว' };
  } catch (err: unknown) {
    console.error('Error updating announcement:', err);
    return {
      success: false,
      message: err instanceof z.ZodError ? err.issues[0].message : 'เกิดข้อผิดพลาดในการแก้ไขข่าวประกาศ',
    };
  }
}

export async function deleteAnnouncementAction(id: number) {
  try {
    const userSession = await getCurrentUserSession();
    if (!userSession || userSession.role !== 'admin') {
      return {
        success: false,
        message: 'ปฏิเสธการทำรายการ: สิทธิ์เฉพาะเจ้าหน้าที่ IT Administrator เท่านั้น',
      };
    }

    const existing = await db.query.announcements.findFirst({
      where: eq(announcements.id, id),
    });

    if (!existing) {
      return { success: false, message: 'ไม่พบข่าวประกาศที่ต้องการลบ' };
    }

    await db.delete(announcements).where(eq(announcements.id, id));

    await db.insert(activity_logs).values({
      user_id: userSession.id,
      action: 'DELETE_ANNOUNCEMENT',
      details: `แอดมิน (${userSession.name}) ลบข่าวประกาศ #${id}: ${existing.title}`,
    });

    revalidatePath('/');
    revalidatePath('/admin/announcements');

    return { success: true, message: 'ลบข่าวประชาสัมพันธ์เรียบร้อยแล้ว' };
  } catch (err: unknown) {
    console.error('Error deleting announcement:', err);
    return { success: false, message: 'เกิดข้อผิดพลาดในการลบข่าวประกาศ' };
  }
}
