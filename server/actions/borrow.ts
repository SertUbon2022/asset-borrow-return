'use server';

import 'server-only';
import { db } from '@/db';
import { borrow_requests, assets, activity_logs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUserSession } from './auth';
import { sendBorrowRequestLineNotification } from '@/lib/line';

const createBorrowSchema = z.object({
  assetId: z.number().positive('กรุณาระบุรหัสครุภัณฑ์'),
  expectedReturnDate: z.string().min(1, 'กรุณาระบุกำหนดวันคืน'),
  durationDays: z.number().int().positive().optional().default(7),
  purpose: z.string().min(3, 'กรุณาระบุวัตถุประสงค์การยืมอย่างน้อย 3 ตัวอักษร'),
  userId: z.number().optional(),
});

export async function createBorrowRequestAction(formData: {
  assetId: number;
  expectedReturnDate: string;
  durationDays?: number;
  purpose: string;
  userId?: number;
}) {
  try {
    const userSession = await getCurrentUserSession();
    if (!userSession) {
      return { success: false, message: 'กรุณาเข้าสู่ระบบก่อนทำการยื่นคำขอยืม' };
    }

    const validated = createBorrowSchema.parse(formData);

    // Verify asset exists and is available
    const asset = await db.query.assets.findFirst({
      where: eq(assets.id, validated.assetId),
      with: { category: true },
    });

    if (!asset) {
      return { success: false, message: 'ไม่พบครุภัณฑ์ที่ระบุในระบบ' };
    }

    if (asset.status !== 'available') {
      return { success: false, message: 'ครุภัณฑ์รายการนี้ไม่ได้อยู่ในสถานะพร้อมยืม' };
    }

    // Insert borrow request
    const returnDate = new Date(validated.expectedReturnDate);
    const calculatedDuration = validated.durationDays || Math.max(1, Math.ceil((returnDate.getTime() - Date.now()) / (1000 * 3600 * 24)));
    const [newRequest] = await db
      .insert(borrow_requests)
      .values({
        user_id: userSession.id,
        asset_id: validated.assetId,
        expected_return_date: returnDate,
        duration_days: calculatedDuration,
        purpose: validated.purpose,
        status: 'pending',
      })
      .returning();

    const newRequestId = newRequest.id;

    // Log activity
    await db.insert(activity_logs).values({
      request_id: newRequestId,
      user_id: userSession.id,
      action: 'SUBMIT_REQUEST',
      details: `ยื่นคำขอยืมอุปกรณ์ ${asset.name} (${asset.asset_tag})`,
    });

    // Send LINE Flex Message notification to LINE group/channel (non-blocking)
    sendBorrowRequestLineNotification({
      requestId: newRequestId,
      userName: userSession.name,
      userDepartment: userSession.department,
      assetName: asset.name,
      assetTag: asset.asset_tag,
      categoryName: asset.category?.name,
      imageUrl: asset.image_url,
      requestDate: new Date(),
      expectedReturnDate: returnDate,
      durationDays: calculatedDuration,
      purpose: validated.purpose,
    }).catch((err) => console.error('[LINE API Async Error]', err));

    revalidatePath('/');
    revalidatePath('/assets');
    revalidatePath('/borrow');
    revalidatePath('/admin/requests');

    return { success: true, message: 'ส่งคำขอยืมอุปกรณ์ไอทีเรียบร้อยแล้ว' };
  } catch (err: unknown) {
    console.error('Error creating borrow request:', err);
    return {
      success: false,
      message: err instanceof z.ZodError ? err.issues[0].message : 'เกิดข้อผิดพลาดในการทำรายการ',
    };
  }
}

export async function updateBorrowRequestStatusAction(
  requestId: number,
  newStatus: 'approved' | 'rejected' | 'borrowed' | 'returned' | 'cancelled',
  adminNote?: string
) {
  try {
    // RBAC Security Guard: Requires Admin Role
    const userSession = await getCurrentUserSession();
    if (!userSession || userSession.role !== 'admin') {
      return {
        success: false,
        message: 'ปฏิเสธการทำรายการ: สิทธิ์เฉพาะเจ้าหน้าที่ IT Administrator เท่านั้น',
      };
    }

    const request = await db.query.borrow_requests.findFirst({
      where: eq(borrow_requests.id, requestId),
      with: { asset: true, user: true },
    });

    if (!request) {
      return { success: false, message: 'ไม่พบรายการคำขอยืมในระบบ' };
    }

    const isApprovalAction = newStatus === 'approved' || newStatus === 'borrowed' || newStatus === 'rejected';

    // 1. Verification check: prevent double approval or acting on already-processed requests
    if (isApprovalAction && request.status !== 'pending') {
      const statusThaiMap: Record<string, string> = {
        approved: 'ได้รับการอนุมัติแล้ว',
        borrowed: 'ได้รับการอนุมัติและส่งมอบอุปกรณ์ไปแล้ว',
        returned: 'ถูกส่งคืนอุปกรณ์เรียบร้อยแล้ว',
        rejected: 'ถูกปฏิเสธคำขอไปแล้ว',
        cancelled: 'ถูกยกเลิกคำขอไปแล้ว',
      };
      const statusMsg = statusThaiMap[request.status] || `สถานะคือ ${request.status}`;
      return {
        success: false,
        message: `คำขอนี้${statusMsg} (ไม่สามารถทำรายการซ้ำได้)`,
      };
    }

    if (newStatus === 'returned' && request.status !== 'borrowed' && request.status !== 'approved') {
      return {
        success: false,
        message: `ไม่สามารถบันทึกรับคืนได้ เนื่องจากสถานะปัจจุบันคือ "${request.status}"`,
      };
    }

    const now = new Date();

    // Synchronize request and asset status directly upon approval
    const finalRequestStatus = (newStatus === 'approved' || newStatus === 'borrowed') ? 'borrowed' : newStatus;

    const approvedBy = isApprovalAction ? userSession.id : request.approved_by;
    const approvedAt = isApprovalAction ? (request.approved_at || now) : request.approved_at;

    await db
      .update(borrow_requests)
      .set({
        status: finalRequestStatus,
        admin_note: adminNote || request.admin_note,
        approved_by: approvedBy,
        approved_at: approvedAt,
        actual_return_date: newStatus === 'returned' ? now : request.actual_return_date,
        updated_at: now,
      })
      .where(eq(borrow_requests.id, requestId));

    // Synchronize asset status
    if (finalRequestStatus === 'borrowed') {
      await db
        .update(assets)
        .set({ status: 'borrowed', updated_at: now })
        .where(eq(assets.id, request.asset_id));
    } else if (finalRequestStatus === 'returned' || finalRequestStatus === 'rejected' || finalRequestStatus === 'cancelled') {
      await db
        .update(assets)
        .set({ status: 'available', updated_at: now })
        .where(eq(assets.id, request.asset_id));
    }

    // Log activity
    const actionMap: Record<string, string> = {
      approved: 'APPROVE_REQUEST',
      rejected: 'REJECT_REQUEST',
      borrowed: 'HANDOVER_ASSET',
      returned: 'RETURN_ASSET',
      cancelled: 'CANCEL_REQUEST',
    };

    await db.insert(activity_logs).values({
      request_id: requestId,
      user_id: userSession.id,
      action: actionMap[newStatus] || 'UPDATE_STATUS',
      details: `แอดมิน (${userSession.name}) อัปเดตสถานะคำขอ #${requestId} เป็น '${newStatus}' (${request.asset.name})`,
    });

    revalidatePath('/');
    revalidatePath('/assets');
    revalidatePath('/borrow');
    revalidatePath('/admin/requests');

    return { success: true, message: 'อัปเดตสถานะคำขอยืมเรียบร้อยแล้ว' };
  } catch (err) {
    console.error('Error updating borrow request status:', err);
    return { success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ' };
  }
}
