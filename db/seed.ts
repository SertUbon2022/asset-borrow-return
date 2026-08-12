import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import crypto from 'crypto';
import * as schema from './schema';
import { categories, users } from './schema';
import { eq } from 'drizzle-orm';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is missing.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function seed() {
  console.log('🌱 Starting DB seeding...');

  try {
    // 1. Seed Categories if empty
    const existingCategories = await db.select().from(categories);
    if (existingCategories.length === 0) {
      await db.insert(categories).values([
        { name: 'Laptops & Workstations', icon: 'laptop', description: 'Portable computers for development and corporate use' },
        { name: 'Monitors & Displays', icon: 'monitor', description: '4K Monitors, Ultra-wide, and Ergonomic displays' },
        { name: 'Smartphones & Tablets', icon: 'tablet', description: 'Mobile testing devices and tablets' },
        { name: 'Networking & Accessories', icon: 'wifi', description: 'Routers, switches, and dongles' },
        { name: 'Peripherals & Audio', icon: 'headphones', description: 'Keyboards, mice, and headsets' },
      ]);
      console.log('✅ Categories seeded.');
    } else {
      console.log('ℹ️ Categories table already has data. Skipping.');
    }

    // 2. Seed Users (2 Admins & 5 Regular Users)
    const defaultPasswordHash = hashPassword('123456');

    const mockUsers = [
      // 2 Admin Users
      {
        email: 'admin@company.com',
        password_hash: defaultPasswordHash,
        name: 'สมชาย รักษาดี (IT Admin 1)',
        department: 'กองเทคโนโลยีสารสนเทศ (IT)',
        role: 'admin' as const,
      },
      {
        email: 'admin2@company.com',
        password_hash: defaultPasswordHash,
        name: 'วิภาดา สายชล (IT Admin 2)',
        department: 'กองเทคโนโลยีสารสนเทศ (IT)',
        role: 'admin' as const,
      },
      // 5 Regular Users
      {
        email: 'user@company.com',
        password_hash: defaultPasswordHash,
        name: 'พงศธร มั่นคง',
        department: 'กองการบริการและลูกค้าสัมพันธ์',
        role: 'user' as const,
      },
      {
        email: 'user2@company.com',
        password_hash: defaultPasswordHash,
        name: 'นภาลัย มีสุข',
        department: 'กองบัญชีและการเงิน',
        role: 'user' as const,
      },
      {
        email: 'user3@company.com',
        password_hash: defaultPasswordHash,
        name: 'ชัชวาลย์ กล้าหาญ',
        department: 'กองแผนงานและพัฒนาองค์กร',
        role: 'user' as const,
      },
      {
        email: 'user4@company.com',
        password_hash: defaultPasswordHash,
        name: 'อารียา ปัญญาดี',
        department: 'กองบริหารทรัพยากรบุคคล',
        role: 'user' as const,
      },
      {
        email: 'user5@company.com',
        password_hash: defaultPasswordHash,
        name: 'กิตติพงษ์ วิเศษ',
        department: 'กองวิศวกรรมการประปา',
        role: 'user' as const,
      },
    ];

    let insertedCount = 0;
    for (const mockUser of mockUsers) {
      const existing = await db.query.users.findFirst({
        where: eq(users.email, mockUser.email),
      });

      if (!existing) {
        await db.insert(users).values(mockUser);
        insertedCount++;
      }
    }

    if (insertedCount > 0) {
      console.log(`✅ Seeded ${insertedCount} new users (2 Admins, 5 Users).`);
    } else {
      console.log('ℹ️ Users table already contains mock users. Skipping.');
    }

    console.log('🎉 Seeding check finished successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
}

seed();
