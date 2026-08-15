'use server';

import 'server-only';
import { db } from '@/db';
import { users, sessions } from '@/db/schema';
import { eq, gt, and } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import crypto from 'crypto';

const loginSchema = z.object({
  email: z.string().email('กรุณาระบุอีเมลให้ถูกต้อง'),
  password: z.string().min(1, 'กรุณาระบุรหัสผ่าน'),
});

const SESSION_COOKIE_NAME = 'pwa_session_id';
const SESSION_DURATION_DAYS = 7;

export async function createSessionForUser(userId: number) {
  const sessionId = `pwa_sess_${crypto.randomBytes(24).toString('hex')}`;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await db.insert(sessions).values({
    id: sessionId,
    user_id: userId,
    expires_at: expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return sessionId;
}

export async function loginAction(formData: { email: string; password: string }) {
  try {
    const validated = loginSchema.parse(formData);

    // Find user in database
    const user = await db.query.users.findFirst({
      where: eq(users.email, validated.email),
    });

    if (!user) {
      return { success: false, message: 'ไม่พบบัญชีผู้ใช้งานที่ระบุในระบบ' };
    }

    await createSessionForUser(user.id);

    return { success: true, message: 'เข้าสู่ระบบสำเร็จ', role: user.role };
  } catch (err: unknown) {
    console.error('Login action error:', err);
    return {
      success: false,
      message: err instanceof z.ZodError ? err.issues[0].message : 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
    };
  }
}

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (sessionId) {
      // Delete session from PostgreSQL database
      await db.delete(sessions).where(eq(sessions.id, sessionId));
    }

    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch (err) {
    console.error('Logout error:', err);
  }

  redirect('/login');
}

export async function getCurrentUserSession() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionId) {
      return null;
    }

    // Query active, non-expired session from PostgreSQL database
    const activeSession = await db.query.sessions.findFirst({
      where: and(eq(sessions.id, sessionId), gt(sessions.expires_at, new Date())),
      with: {
        user: true,
      },
    });

    if (!activeSession || !activeSession.user) {
      return null;
    }

    return {
      id: activeSession.user.id,
      email: activeSession.user.email,
      name: activeSession.user.name,
      department: activeSession.user.department,
      role: activeSession.user.role,
      lineUserId: activeSession.user.line_user_id || null,
      lineDisplayName: activeSession.user.line_display_name || null,
      linePictureUrl: activeSession.user.line_picture_url || null,
      sessionId: activeSession.id,
    };
  } catch (err) {
    console.error('Error fetching user session:', err);
    return null;
  }
}
