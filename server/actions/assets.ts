'use server';

import 'server-only';
import { db } from '@/db';
import { assets, borrow_requests, activity_logs } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUserSession } from './auth';

const createAssetSchema = z.object({
  assetTag: z.string().min(2, 'กรุณาระบุรหัสครุภัณฑ์ (Asset Tag)'),
  name: z.string().min(2, 'กรุณาระบุชื่ออุปกรณ์ไอที'),
  categoryId: z.number().positive('กรุณาเลือกหมวดหมู่อุปกรณ์'),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  status: z.enum(['available', 'borrowed', 'maintenance', 'retired']),
  location: z.string().optional(),
  borrowDurationDays: z.number().int().positive().optional().default(7),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

export async function createAssetAction(formData: {
  assetTag: string;
  name: string;
  categoryId: number;
  model?: string;
  serialNumber?: string;
  status: 'available' | 'borrowed' | 'maintenance' | 'retired';
  location?: string;
  borrowDurationDays?: number;
  description?: string;
  imageUrl?: string;
}) {
  try {
    const userSession = await getCurrentUserSession();
    if (!userSession || userSession.role !== 'admin') {
      return {
        success: false,
        message: 'ปฏิเสธการทำรายการ: สิทธิ์เฉพาะเจ้าหน้าที่ IT Administrator เท่านั้น',
      };
    }

    const validated = createAssetSchema.parse(formData);

    // Check if asset_tag already exists
    const existing = await db.query.assets.findFirst({
      where: eq(assets.asset_tag, validated.assetTag),
    });

    if (existing) {
      return {
        success: false,
        message: `รหัสครุภัณฑ์ "${validated.assetTag}" มีอยู่ในระบบแล้ว กรุณาระบุรหัสอื่น`,
      };
    }

    const [newAsset] = await db
      .insert(assets)
      .values({
        asset_tag: validated.assetTag,
        name: validated.name,
        category_id: validated.categoryId,
        model: validated.model || null,
        serial_number: validated.serialNumber || null,
        status: validated.status,
        location: validated.location || 'คลังพัสดุ กปภ.',
        borrow_duration_days: validated.borrowDurationDays || 7,
        description: validated.description || '',
        image_url: validated.imageUrl || null,
      })
      .returning();

    const newAssetId = newAsset.id;

    await db.insert(activity_logs).values({
      user_id: userSession.id,
      action: 'CREATE_ASSET',
      details: `แอดมิน (${userSession.name}) เพิ่มครุภัณฑ์ไอทีใหม่: ${validated.name} (${validated.assetTag})`,
    });

    revalidatePath('/');
    revalidatePath('/assets');
    revalidatePath('/admin/assets');

    return {
      success: true,
      message: 'เพิ่มรายการครุภัณฑ์ไอทีใหม่เรียบร้อยแล้ว',
      assetId: newAssetId,
    };
  } catch (err: unknown) {
    console.error('Error creating asset:', err);
    return {
      success: false,
      message: err instanceof z.ZodError ? err.issues[0].message : 'เกิดข้อผิดพลาดในการสร้างครุภัณฑ์',
    };
  }
}

export async function updateAssetAction(
  id: number,
  formData: {
    assetTag: string;
    name: string;
    categoryId: number;
    model?: string;
    serialNumber?: string;
    status: 'available' | 'borrowed' | 'maintenance' | 'retired';
    location?: string;
    borrowDurationDays?: number;
    description?: string;
    imageUrl?: string;
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

    const validated = createAssetSchema.parse(formData);

    await db
      .update(assets)
      .set({
        asset_tag: validated.assetTag,
        name: validated.name,
        category_id: validated.categoryId,
        model: validated.model || null,
        serial_number: validated.serialNumber || null,
        status: validated.status,
        location: validated.location || 'คลังพัสดุ กปภ.',
        borrow_duration_days: validated.borrowDurationDays || 7,
        description: validated.description || '',
        image_url: validated.imageUrl || null,
        updated_at: new Date(),
      })
      .where(eq(assets.id, id));

    await db.insert(activity_logs).values({
      user_id: userSession.id,
      action: 'UPDATE_ASSET',
      details: `แอดมิน (${userSession.name}) แก้ไขครุภัณฑ์ไอที #${id}: ${validated.name} (${validated.assetTag})`,
    });

    revalidatePath('/');
    revalidatePath('/assets');
    revalidatePath('/admin/assets');

    return { success: true, message: 'แก้ไขข้อมูลครุภัณฑ์ไอทีเรียบร้อยแล้ว' };
  } catch (err: unknown) {
    console.error('Error updating asset:', err);
    return {
      success: false,
      message: err instanceof z.ZodError ? err.issues[0].message : 'เกิดข้อผิดพลาดในการแก้ไขครุภัณฑ์',
    };
  }
}

export async function toggleAssetMaintenanceAction(id: number, reason?: string) {
  try {
    const userSession = await getCurrentUserSession();
    if (!userSession || userSession.role !== 'admin') {
      return {
        success: false,
        message: 'ปฏิเสธการทำรายการ: สิทธิ์เฉพาะเจ้าหน้าที่ IT Administrator เท่านั้น',
      };
    }

    const existingAsset = await db.query.assets.findFirst({
      where: eq(assets.id, id),
    });

    if (!existingAsset) {
      return { success: false, message: 'ไม่พบครุภัณฑ์ที่ต้องการส่งซ่อม' };
    }

    if (existingAsset.status === 'borrowed') {
      return {
        success: false,
        message: 'ไม่สามารถส่งซ่อมครุภัณฑ์ที่กำลังถูกยืมใช้งานอยู่ได้ กรุณารับคืนอุปกรณ์ก่อน',
      };
    }

    const newStatus = existingAsset.status === 'maintenance' ? 'available' : 'maintenance';

    await db
      .update(assets)
      .set({
        status: newStatus,
        updated_at: new Date(),
      })
      .where(eq(assets.id, id));

    const actionText = newStatus === 'maintenance' ? 'ส่งซ่อมบำรุง' : 'ซ่อมเสร็จคืนสภาพพร้อมใช้งาน';
    const logDetails = `แอดมิน (${userSession.name}) ${actionText} ครุภัณฑ์ #${id} (${existingAsset.name})${reason ? `: ${reason}` : ''}`;

    await db.insert(activity_logs).values({
      user_id: userSession.id,
      action: newStatus === 'maintenance' ? 'SEND_MAINTENANCE' : 'RESTORE_AVAILABLE',
      details: logDetails,
    });

    revalidatePath('/');
    revalidatePath('/assets');
    revalidatePath('/admin/assets');

    return {
      success: true,
      message: `เปลี่ยนสถานะครุภัณฑ์เป็น "${newStatus === 'maintenance' ? 'ส่งซ่อมบำรุง' : 'พร้อมใช้งาน'}" เรียบร้อยแล้ว`,
      newStatus,
    };
  } catch (err: unknown) {
    console.error('Error toggling asset maintenance:', err);
    return { success: false, message: 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะส่งซ่อม' };
  }
}

export async function deleteAssetAction(id: number) {
  try {
    const userSession = await getCurrentUserSession();
    if (!userSession || userSession.role !== 'admin') {
      return {
        success: false,
        message: 'ปฏิเสธการทำรายการ: สิทธิ์เฉพาะเจ้าหน้าที่ IT Administrator เท่านั้น',
      };
    }

    const existingAsset = await db.query.assets.findFirst({
      where: eq(assets.id, id),
    });

    if (!existingAsset) {
      return { success: false, message: 'ไม่พบครุภัณฑ์ไอทีที่ต้องการลบ' };
    }

    // MANDATORY PRE-DELETION CHECK 1: Check asset status directly
    if (existingAsset.status === 'borrowed') {
      return {
        success: false,
        message: `ไม่สามารถลบครุภัณฑ์ "${existingAsset.name}" (${existingAsset.asset_tag}) ได้ เนื่องจากอุปกรณ์ถูกยืมใช้งานอยู่ กรุณารับคืนอุปกรณ์ก่อนดำเนินการลบ`,
      };
    }

    // MANDATORY PRE-DELETION CHECK 2: Check active borrow requests linked to this asset
    const activeRequests = await db.query.borrow_requests.findMany({
      where: and(
        eq(borrow_requests.asset_id, id),
        inArray(borrow_requests.status, ['pending', 'approved', 'borrowed'])
      ),
    });

    if (activeRequests.length > 0) {
      return {
        success: false,
        message: `ไม่สามารถลบครุภัณฑ์ "${existingAsset.name}" ได้ เนื่องจากยังมีคำขอยืมอยู่ในสถานะรออนุมัติหรือยืมใช้งานอยู่จำนวน ${activeRequests.length} รายการ`,
      };
    }

    await db.delete(assets).where(eq(assets.id, id));

    await db.insert(activity_logs).values({
      user_id: userSession.id,
      action: 'DELETE_ASSET',
      details: `แอดมิน (${userSession.name}) ลบครุภัณฑ์ไอที #${id}: ${existingAsset.name} (${existingAsset.asset_tag})`,
    });

    revalidatePath('/');
    revalidatePath('/assets');
    revalidatePath('/admin/assets');

    return { success: true, message: 'ลบรายการครุภัณฑ์ไอทีเรียบร้อยแล้ว' };
  } catch (err: unknown) {
    console.error('Error deleting asset:', err);
    return { success: false, message: 'เกิดข้อผิดพลาดในการลบครุภัณฑ์ไอที' };
  }
}
