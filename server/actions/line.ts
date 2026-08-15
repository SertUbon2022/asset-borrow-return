'use server';

import 'server-only';
import { db } from '@/db';
import { users, activity_logs } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { getCurrentUserSession } from './auth';
import { verifyUserInLineGroup, getLineGroupSummary, verifyLineIdToken } from '@/lib/line';
import { checkRateLimit, recordFailedAttempt, resetRateLimit, getClientIp } from '@/lib/rate-limit';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const linkLineSchema = z.object({
  lineUserId: z.string().min(5, 'LINE User ID ไม่ถูกต้อง'),
  displayName: z.string().optional(),
  pictureUrl: z.string().optional(),
  idToken: z.string().optional(),
});

export type ActionResponse<T = undefined> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
};

/**
 * Verifies LINE Group membership and links the LINE account to the current logged-in user.
 */
export async function linkLineAccount(
  data: z.infer<typeof linkLineSchema>
): Promise<ActionResponse<{ lineUserId: string; displayName?: string }>> {
  try {
    const session = await getCurrentUserSession();
    if (!session) {
      return {
        success: false,
        error: 'กรุณาเข้าสู่ระบบก่อนทำรายการผูกบัญชี LINE',
      };
    }

    const validated = linkLineSchema.parse(data);
    let lineUserId = validated.lineUserId.trim();

    // 0. Verify ID Token if provided for cryptographic authenticity
    if (validated.idToken && validated.idToken.trim()) {
      const tokenVerification = await verifyLineIdToken(validated.idToken);
      if (!tokenVerification.isValid || !tokenVerification.userId) {
        return {
          success: false,
          error: tokenVerification.error || 'LINE ID Token ไม่ถูกต้องหรือหมดอายุ',
        };
      }
      lineUserId = tokenVerification.userId;
    }

    // 1. Verify that the user is an active member in the designated LINE Group
    const verification = await verifyUserInLineGroup(lineUserId);
    if (!verification.isMember) {
      return {
        success: false,
        error:
          verification.error ||
          'ไม่สามารถผูกบัญชีได้: บัญชี LINE ของท่านยังไม่ได้เข้าร่วมกลุ่ม LINE ทางการของระบบ หรือ LINE Bot ยังไม่ได้อยู่ในกลุ่ม',
      };
    }

    // 2. Check if this LINE User ID is already linked to another system user
    const existingOtherUser = await db.query.users.findFirst({
      where: and(eq(users.line_user_id, lineUserId), ne(users.id, session.id)),
    });

    if (existingOtherUser) {
      return {
        success: false,
        error: `บัญชี LINE นี้ถูกผูกกับผู้ใช้งานท่านอื่นในระบบแล้ว (${existingOtherUser.name})`,
      };
    }

    const finalDisplayName = verification.displayName || validated.displayName || 'LINE User';
    const finalPictureUrl = verification.pictureUrl || validated.pictureUrl || null;

    // 3. Save LINE user details into database
    await db
      .update(users)
      .set({
        line_user_id: lineUserId,
        line_display_name: finalDisplayName,
        line_picture_url: finalPictureUrl,
        updated_at: new Date(),
      })
      .where(eq(users.id, session.id));

    // 4. Record Activity Log
    await db.insert(activity_logs).values({
      user_id: session.id,
      action: 'ผูกบัญชี LINE สำเร็จ',
      details: `ผูกบัญชี LINE ID: ${lineUserId} (${finalDisplayName}) พร้อมตรวจสอบสมาชิกกลุ่ม LINE สำเร็จ`,
    });

    revalidatePath('/', 'layout');
    revalidatePath('/borrow');
    revalidatePath('/admin/users');

    return {
      success: true,
      message: `ผูกบัญชี LINE (${finalDisplayName}) กับระบบเรียบร้อยแล้ว`,
      data: {
        lineUserId,
        displayName: finalDisplayName,
      },
    };
  } catch (err: unknown) {
    console.error('Error linking LINE account:', err);
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues[0].message };
    }
    return {
      success: false,
      error: 'เกิดข้อผิดพลาดของระบบในการผูกบัญชี LINE',
    };
  }
}

/**
 * Unlinks the LINE account from the current logged-in user.
 */
export async function unlinkLineAccount(): Promise<ActionResponse> {
  try {
    const session = await getCurrentUserSession();
    if (!session) {
      return {
        success: false,
        error: 'กรุณาเข้าสู่ระบบก่อนทำรายการ',
      };
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, session.id),
    });

    if (!currentUser?.line_user_id) {
      return {
        success: false,
        error: 'บัญชีของท่านยังไม่ได้ผูกกับ LINE',
      };
    }

    const prevLineName = currentUser.line_display_name || currentUser.line_user_id;

    // Remove LINE linkage
    await db
      .update(users)
      .set({
        line_user_id: null,
        line_display_name: null,
        line_picture_url: null,
        updated_at: new Date(),
      })
      .where(eq(users.id, session.id));

    // Record Activity Log
    await db.insert(activity_logs).values({
      user_id: session.id,
      action: 'ยกเลิกการผูกบัญชี LINE',
      details: `ยกเลิกการผูกบัญชี LINE (${prevLineName})`,
    });

    revalidatePath('/', 'layout');
    revalidatePath('/borrow');
    revalidatePath('/admin/users');

    return {
      success: true,
      message: 'ยกเลิกการผูกบัญชี LINE เรียบร้อยแล้ว',
    };
  } catch (err) {
    console.error('Error unlinking LINE account:', err);
    return {
      success: false,
      error: 'เกิดข้อผิดพลาดในการยกเลิกการผูกบัญชี LINE',
    };
  }
}

/**
 * Retrieves the current LINE linking status and designated group information.
 */
export async function getLineLinkInfo(): Promise<{
  isLinked: boolean;
  lineUserId: string | null;
  lineDisplayName: string | null;
  linePictureUrl: string | null;
  groupSummary: {
    groupId: string;
    groupName?: string;
    pictureUrl?: string;
  } | null;
  liffIdConfigured: boolean;
}> {
  try {
    const session = await getCurrentUserSession();
    if (!session) {
      return {
        isLinked: false,
        lineUserId: null,
        lineDisplayName: null,
        linePictureUrl: null,
        groupSummary: null,
        liffIdConfigured: Boolean(process.env.NEXT_PUBLIC_LINE_LIFF_ID),
      };
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.id),
    });

    const groupSummary = await getLineGroupSummary();

    return {
      isLinked: Boolean(user?.line_user_id),
      lineUserId: user?.line_user_id || null,
      lineDisplayName: user?.line_display_name || null,
      linePictureUrl: user?.line_picture_url || null,
      groupSummary,
      liffIdConfigured: Boolean(process.env.NEXT_PUBLIC_LINE_LIFF_ID),
    };
  } catch (err) {
    console.error('Error getting LINE link info:', err);
    return {
      isLinked: false,
      lineUserId: null,
      lineDisplayName: null,
      linePictureUrl: null,
      groupSummary: null,
      liffIdConfigured: Boolean(process.env.NEXT_PUBLIC_LINE_LIFF_ID),
    };
  }
}

export type LineAuthResult =
  | { status: 'authenticated'; user: { id: number; name: string; role: 'admin' | 'user'; email: string } }
  | { status: 'needs_link'; lineProfile: { lineUserId: string; displayName?: string; pictureUrl?: string } }
  | { status: 'not_in_group'; error: string }
  | { status: 'unauthorized_role'; error: string };

/**
 * Verifies LINE Group membership and auto-logs in the user if already linked,
 * or instructs the client to link the account.
 */
export async function verifyAndHandleLineAction(
  lineUserId: string,
  displayName?: string,
  pictureUrl?: string,
  idToken?: string
): Promise<LineAuthResult> {
  try {
    let targetUserId = lineUserId.trim();
    let targetDisplayName = displayName;
    let targetPictureUrl = pictureUrl;

    // 0. If idToken is provided, verify with LINE OAuth API for cryptographic authenticity
    if (idToken && idToken.trim()) {
      const tokenVerification = await verifyLineIdToken(idToken);
      if (!tokenVerification.isValid || !tokenVerification.userId) {
        return {
          status: 'not_in_group',
          error: tokenVerification.error || 'การยืนยันตัวตน LINE ID Token ไม่ถูกต้องหรือหมดอายุ',
        };
      }
      targetUserId = tokenVerification.userId;
      if (tokenVerification.displayName) targetDisplayName = tokenVerification.displayName;
      if (tokenVerification.pictureUrl) targetPictureUrl = tokenVerification.pictureUrl;
    }

    if (!targetUserId) {
      return { status: 'not_in_group', error: 'ไม่พบ LINE User ID' };
    }

    // 1. Check if user is in the designated LINE Group
    const verification = await verifyUserInLineGroup(targetUserId);
    if (!verification.isMember) {
      return {
        status: 'not_in_group',
        error:
          verification.error ||
          'คุณไม่ได้เป็นสมาชิกในกลุ่ม LINE ทางการของระบบ หรือ LINE Bot ยังไม่ได้อยู่ในกลุ่ม',
      };
    }

    const finalDisplayName = verification.displayName || targetDisplayName || 'LINE User';
    const finalPictureUrl = verification.pictureUrl || targetPictureUrl;

    // 2. Check if user is already linked in Database
    const existingUser = await db.query.users.findFirst({
      where: eq(users.line_user_id, targetUserId),
    });

    if (existingUser) {
      if (existingUser.role !== 'admin') {
        return {
          status: 'unauthorized_role',
          error: `บัญชี LINE (${finalDisplayName}) ผูกกับพนักงานทั่วไป (${existingUser.name}) ไม่มีสิทธิ์อนุมัติคำขอยืมอุปกรณ์ (ต้องการสิทธิ์ IT Admin)`,
        };
      }

      // Import createSessionForUser from auth
      const { createSessionForUser } = await import('./auth');
      await createSessionForUser(existingUser.id);

      return {
        status: 'authenticated',
        user: {
          id: existingUser.id,
          name: existingUser.name,
          role: existingUser.role,
          email: existingUser.email,
        },
      };
    }

    // 3. User is in the group, but has NOT linked account yet
    return {
      status: 'needs_link',
      lineProfile: {
        lineUserId: targetUserId,
        displayName: finalDisplayName,
        pictureUrl: finalPictureUrl,
      },
    };
  } catch (err) {
    console.error('Error verifying LINE action:', err);
    return {
      status: 'not_in_group',
      error: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์กับ LINE API',
    };
  }
}

const linkAndLoginSchema = z.object({
  lineUserId: z.string().min(5, 'LINE User ID ไม่ถูกต้อง'),
  displayName: z.string().optional(),
  pictureUrl: z.string().optional(),
  idToken: z.string().optional(),
  email: z.string().email('กรุณาระบุอีเมลให้ถูกต้อง'),
  password: z.string().min(1, 'กรุณาระบุรหัสผ่าน'),
});

/**
 * Links LINE Account with user credentials and authenticates simultaneously.
 */
export async function linkLineAndLoginAction(
  data: z.infer<typeof linkAndLoginSchema>
): Promise<ActionResponse<{ role: string; name: string }>> {
  const ip = await getClientIp();
  const normalizedEmail = data?.email?.toLowerCase().trim() || 'unknown';
  const rateLimitKey = `link_login:${ip}:${normalizedEmail}`;

  // Rate limit check: 5 attempts per 5 minutes
  const rateLimit = checkRateLimit(rateLimitKey, 5, 5 * 60 * 1000, 5 * 60 * 1000);
  if (!rateLimit.isAllowed) {
    const minutes = Math.ceil(rateLimit.retryAfterSeconds / 60);
    return {
      success: false,
      error: `คุณพยายามเข้าสู่ระบบไม่ถูกต้องเกินกำหนด กรุณารอประมาณ ${minutes} นาที แล้วลองใหม่อีกครั้ง`,
    };
  }

  try {
    const validated = linkAndLoginSchema.parse(data);
    let lineUserId = validated.lineUserId.trim();

    // 0. Verify ID Token if provided
    if (validated.idToken && validated.idToken.trim()) {
      const tokenVerification = await verifyLineIdToken(validated.idToken);
      if (!tokenVerification.isValid || !tokenVerification.userId) {
        recordFailedAttempt(rateLimitKey, 5, 5 * 60 * 1000, 5 * 60 * 1000);
        return {
          success: false,
          error: tokenVerification.error || 'LINE ID Token ไม่ถูกต้องหรือหมดอายุ',
        };
      }
      lineUserId = tokenVerification.userId;
    }

    // 1. Verify user credentials
    const user = await db.query.users.findFirst({
      where: eq(users.email, validated.email),
    });

    if (!user) {
      recordFailedAttempt(rateLimitKey, 5, 5 * 60 * 1000, 5 * 60 * 1000);
      return { success: false, error: 'ไม่พบบัญชีผู้ใช้งานที่ระบุในระบบ' };
    }

    // 2. Verify that the user is in the LINE Group
    const verification = await verifyUserInLineGroup(lineUserId);
    if (!verification.isMember) {
      recordFailedAttempt(rateLimitKey, 5, 5 * 60 * 1000, 5 * 60 * 1000);
      return {
        success: false,
        error:
          verification.error ||
          'บัญชี LINE ของท่านยังไม่ได้เข้าร่วมกลุ่ม LINE ทางการของระบบ',
      };
    }

    // 3. Verify that the line_user_id is not already linked to another user
    const existingOther = await db.query.users.findFirst({
      where: and(eq(users.line_user_id, lineUserId), ne(users.id, user.id)),
    });

    if (existingOther) {
      recordFailedAttempt(rateLimitKey, 5, 5 * 60 * 1000, 5 * 60 * 1000);
      return {
        success: false,
        error: `LINE ID นี้ถูกผูกกับผู้ใช้ท่านอื่นในระบบแล้ว (${existingOther.name})`,
      };
    }

    // Reset rate limit on success
    resetRateLimit(rateLimitKey);

    const finalDisplayName = verification.displayName || validated.displayName || 'LINE User';
    const finalPictureUrl = verification.pictureUrl || validated.pictureUrl || null;

    // 4. Save LINE details to user in database
    await db
      .update(users)
      .set({
        line_user_id: lineUserId,
        line_display_name: finalDisplayName,
        line_picture_url: finalPictureUrl,
        updated_at: new Date(),
      })
      .where(eq(users.id, user.id));

    // 5. Log Activity
    await db.insert(activity_logs).values({
      user_id: user.id,
      action: 'ผูกบัญชี LINE จากกลุ่มอนุมัติ',
      details: `ผูกบัญชี LINE ID: ${lineUserId} (${finalDisplayName}) พร้อมตรวจสอบสมาชิกกลุ่มสำเร็จ`,
    });

    // 6. Create session cookie
    const { createSessionForUser } = await import('./auth');
    await createSessionForUser(user.id);

    revalidatePath('/', 'layout');
    revalidatePath('/admin/requests');
    revalidatePath('/admin/users');

    return {
      success: true,
      message: `ผูกบัญชี LINE (${finalDisplayName}) และเข้าสู่ระบบสำเร็จ`,
      data: {
        role: user.role,
        name: user.name,
      },
    };
  } catch (err: unknown) {
    console.error('Error in linkLineAndLoginAction:', err);
    recordFailedAttempt(rateLimitKey, 5, 5 * 60 * 1000, 5 * 60 * 1000);
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues[0].message };
    }
    return {
      success: false,
      error: 'เกิดข้อผิดพลาดในการผูกบัญชี LINE และเข้าสู่ระบบ',
    };
  }
}


