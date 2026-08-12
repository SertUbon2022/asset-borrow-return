'use server';

import 'server-only';
import { db } from '@/db';
import { users, sessions, activity_logs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import crypto from 'crypto';
import { getCurrentUserSession } from './auth';

const createUserSchema = z.object({
  email: z.string().email('กรุณาระบุอีเมลให้ถูกต้อง'),
  password: z.string().min(6, 'กรุณาระบุรหัสผ่านอย่างน้อย 6 ตัวอักษร'),
  name: z.string().min(2, 'กรุณาระบุชื่อ-นามสกุลผู้ใช้งานอย่างน้อย 2 ตัวอักษร'),
  department: z.string().optional(),
  role: z.enum(['user', 'admin']),
});

const updateUserSchema = z.object({
  email: z.string().email('กรุณาระบุอีเมลให้ถูกต้อง'),
  password: z.string().min(6, 'กรุณาระบุรหัสผ่านอย่างน้อย 6 ตัวอักษร').optional().or(z.literal('')),
  name: z.string().min(2, 'กรุณาระบุชื่อ-นามสกุลผู้ใช้งานอย่างน้อย 2 ตัวอักษร'),
  department: z.string().optional(),
  role: z.enum(['user', 'admin']),
});

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function createUserAction(formData: {
  email: string;
  password: string;
  name: string;
  department?: string;
  role: 'user' | 'admin';
}) {
  try {
    const userSession = await getCurrentUserSession();
    if (!userSession || userSession.role !== 'admin') {
      return {
        success: false,
        message: 'ปฏิเสธการทำรายการ: สิทธิ์เฉพาะเจ้าหน้าที่ IT Administrator เท่านั้น',
      };
    }

    const validated = createUserSchema.parse(formData);

    // Check if email already exists
    const existing = await db.query.users.findFirst({
      where: eq(users.email, validated.email),
    });

    if (existing) {
      return { success: false, message: 'อีเมลนี้ถูกใช้งานในระบบแล้ว กรุณาระบุอีเมลอื่น' };
    }

    const passwordHash = hashPassword(validated.password);

    const [newUser] = await db
      .insert(users)
      .values({
        email: validated.email,
        password_hash: passwordHash,
        name: validated.name,
        department: validated.department || 'กปภ.',
        role: validated.role,
      })
      .returning();

    const newUserId = newUser.id;

    await db.insert(activity_logs).values({
      user_id: userSession.id,
      action: 'CREATE_USER',
      details: `แอดมิน (${userSession.name}) เพิ่มผู้ใช้งานใหม่: ${validated.name} (${validated.email})`,
    });

    revalidatePath('/admin/users');

    return {
      success: true,
      message: 'เพิ่มผู้ใช้งานใหม่เรียบร้อยแล้ว',
      userId: newUserId,
    };
  } catch (err: unknown) {
    console.error('Error creating user:', err);
    return {
      success: false,
      message: err instanceof z.ZodError ? err.issues[0].message : 'เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน',
    };
  }
}

export async function updateUserAction(
  id: number,
  formData: {
    email: string;
    password?: string;
    name: string;
    department?: string;
    role: 'user' | 'admin';
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

    const validated = updateUserSchema.parse(formData);

    const updateData: Record<string, unknown> = {
      email: validated.email,
      name: validated.name,
      department: validated.department || 'กปภ.',
      role: validated.role,
      updated_at: new Date(),
    };

    if (validated.password && validated.password.trim() !== '') {
      updateData.password_hash = hashPassword(validated.password);
    }

    await db.update(users).set(updateData).where(eq(users.id, id));

    await db.insert(activity_logs).values({
      user_id: userSession.id,
      action: 'UPDATE_USER',
      details: `แอดมิน (${userSession.name}) อัปเดตข้อมูลผู้ใช้งาน #${id}: ${validated.name}`,
    });

    revalidatePath('/admin/users');

    return { success: true, message: 'แก้ไขข้อมูลผู้ใช้งานเรียบร้อยแล้ว' };
  } catch (err: unknown) {
    console.error('Error updating user:', err);
    return {
      success: false,
      message: err instanceof z.ZodError ? err.issues[0].message : 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลผู้ใช้งาน',
    };
  }
}

export async function deleteUserAction(id: number) {
  try {
    const userSession = await getCurrentUserSession();
    if (!userSession || userSession.role !== 'admin') {
      return {
        success: false,
        message: 'ปฏิเสธการทำรายการ: สิทธิ์เฉพาะเจ้าหน้าที่ IT Administrator เท่านั้น',
      };
    }

    // PREVENT SELF DELETION
    if (userSession.id === id) {
      return {
        success: false,
        message: 'ไม่สามารถลบบัญชีผู้ใช้งานของตนเองที่กำลังล็อกอินอยู่ได้',
      };
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!existingUser) {
      return { success: false, message: 'ไม่พบบัญชีผู้ใช้งานที่ต้องการลบ' };
    }

    // Clear sessions for this user
    await db.delete(sessions).where(eq(sessions.user_id, id));

    // Delete user record
    await db.delete(users).where(eq(users.id, id));

    await db.insert(activity_logs).values({
      user_id: userSession.id,
      action: 'DELETE_USER',
      details: `แอดมิน (${userSession.name}) ลบบัญชีผู้ใช้งาน #${id}: ${existingUser.name} (${existingUser.email})`,
    });

    revalidatePath('/admin/users');

    return { success: true, message: 'ลบบัญชีผู้ใช้งานเรียบร้อยแล้ว' };
  } catch (err: unknown) {
    console.error('Error deleting user:', err);
    return { success: false, message: 'เกิดข้อผิดพลาดในการลบผู้ใช้งาน' };
  }
}
