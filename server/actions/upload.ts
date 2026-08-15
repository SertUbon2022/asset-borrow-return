'use server';

import 'server-only';
import fs from 'fs/promises';
import path from 'path';
import { getCurrentUserSession } from './auth';

/**
 * Reusable helper to process and persist uploaded image file or base64 data
 */
async function processAndSaveImage(
  formData: FormData,
  folder: 'assets' | 'announcements',
  prefix: string
): Promise<{ success: boolean; url?: string; message?: string }> {
  const file = formData.get('file') as File | null;
  const base64Data = formData.get('base64') as string | null;

  if (!file && !base64Data) {
    return { success: false, message: 'ไม่พบไฟล์รูปภาพหรือข้อมูลภาพถ่าย' };
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
  await fs.mkdir(uploadDir, { recursive: true });

  let fileName = '';
  let buffer: Buffer;

  if (file) {
    const ext = path.extname(file.name) || '.jpg';
    const cleanExt = ext.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)/) ? ext : '.jpg';
    fileName = `${prefix}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}${cleanExt}`;

    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } else if (base64Data) {
    fileName = `${prefix}-cam-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}.jpg`;
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    }
  } else {
    return { success: false, message: 'รูปแบบไฟล์รูปภาพไม่ถูกต้อง' };
  }

  const filePath = path.join(uploadDir, fileName);
  await fs.writeFile(filePath, buffer);

  return {
    success: true,
    url: `/uploads/${folder}/${fileName}`,
  };
}

export async function uploadAssetImageAction(formData: FormData) {
  try {
    const userSession = await getCurrentUserSession();
    if (!userSession || userSession.role !== 'admin') {
      return {
        success: false,
        message: 'ปฏิเสธการทำรายการ: สิทธิ์เฉพาะเจ้าหน้าที่ IT Administrator เท่านั้น',
      };
    }

    const result = await processAndSaveImage(formData, 'assets', 'asset');
    if (!result.success) {
      return { success: false, message: result.message || 'เกิดข้อผิดพลาดในการบันทึกไฟล์รูปภาพ' };
    }

    return {
      success: true,
      message: 'อัปโหลดรูปภาพครุภัณฑ์เรียบร้อยแล้ว',
      url: result.url,
    };
  } catch (err: unknown) {
    console.error('Error uploading asset image:', err);
    return { success: false, message: 'เกิดข้อผิดพลาดในการบันทึกไฟล์รูปภาพ' };
  }
}

export async function uploadAnnouncementImageAction(formData: FormData) {
  try {
    const userSession = await getCurrentUserSession();
    if (!userSession || userSession.role !== 'admin') {
      return {
        success: false,
        message: 'ปฏิเสธการทำรายการ: สิทธิ์เฉพาะเจ้าหน้าที่ IT Administrator เท่านั้น',
      };
    }

    const result = await processAndSaveImage(formData, 'announcements', 'ann');
    if (!result.success) {
      return { success: false, message: result.message || 'เกิดข้อผิดพลาดในการบันทึกไฟล์รูปภาพข่าว' };
    }

    return {
      success: true,
      message: 'อัปโหลดรูปภาพข่าวประชาสัมพันธ์เรียบร้อยแล้ว',
      url: result.url,
    };
  } catch (err: unknown) {
    console.error('Error uploading announcement image:', err);
    return { success: false, message: 'เกิดข้อผิดพลาดในการบันทึกไฟล์รูปภาพข่าว' };
  }
}

export async function deleteAssetImageAction(imageUrl: string) {
  try {
    const userSession = await getCurrentUserSession();
    if (!userSession || userSession.role !== 'admin') {
      return {
        success: false,
        message: 'ปฏิเสธการทำรายการ: สิทธิ์เฉพาะเจ้าหน้าที่ IT Administrator เท่านั้น',
      };
    }

    if (!imageUrl) {
      return { success: true, message: 'ยกเลิกการแสดงผลรูปภาพเรียบร้อยแล้ว' };
    }

    let subDir = 'assets';
    let relativePath = '';

    if (imageUrl.startsWith('/uploads/assets/')) {
      subDir = 'assets';
      relativePath = imageUrl.replace('/uploads/assets/', '');
    } else if (imageUrl.startsWith('/uploads/announcements/')) {
      subDir = 'announcements';
      relativePath = imageUrl.replace('/uploads/announcements/', '');
    } else {
      return { success: true, message: 'ยกเลิกการแสดงผลรูปภาพเรียบร้อยแล้ว' };
    }

    const safeFileName = path.basename(relativePath);
    const filePath = path.join(process.cwd(), 'public', 'uploads', subDir, safeFileName);

    try {
      await fs.unlink(filePath);
    } catch {
      // File may already be removed or missing, treat as success
    }

    return { success: true, message: 'ลบไฟล์รูปภาพออกจากโฟลเดอร์เรียบร้อยแล้ว' };
  } catch (err: unknown) {
    console.error('Error deleting image file:', err);
    return { success: false, message: 'เกิดข้อผิดพลาดในการลบไฟล์รูปภาพ' };
  }
}
