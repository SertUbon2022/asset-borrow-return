import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import crypto from 'crypto';
import * as schema from './schema';
import { categories, users, assets } from './schema';
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

    let insertedUserCount = 0;
    for (const mockUser of mockUsers) {
      const existing = await db.query.users.findFirst({
        where: eq(users.email, mockUser.email),
      });

      if (!existing) {
        await db.insert(users).values(mockUser);
        insertedUserCount++;
      }
    }

    if (insertedUserCount > 0) {
      console.log(`✅ Seeded ${insertedUserCount} new users (2 Admins, 5 Users).`);
    } else {
      console.log('ℹ️ Users table already contains mock users. Skipping.');
    }

    // 3. Seed 10 IT Assets
    const allCategories = await db.select().from(categories);
    const catMap = new Map(allCategories.map((c) => [c.name, c.id]));

    const laptopCatId = catMap.get('Laptops & Workstations') || 1;
    const monitorCatId = catMap.get('Monitors & Displays') || 2;
    const tabletCatId = catMap.get('Smartphones & Tablets') || 3;
    const networkCatId = catMap.get('Networking & Accessories') || 4;
    const peripheralCatId = catMap.get('Peripherals & Audio') || 5;

    const mockAssets = [
      {
        asset_tag: 'PWA-NB-2026-001',
        name: 'MacBook Pro 16" (M3 Max)',
        category_id: laptopCatId,
        model: 'Apple MacBook Pro 16',
        serial_number: 'C02G1234MD6R',
        status: 'available' as const,
        location: 'ห้องคลังครุภัณฑ์ไอที ชั้น 4',
        borrow_duration_days: 14,
        description: 'โน้ตบุ๊กประสิทธิภาพสูงสำหรับการประมวลผลงานวิศวกรรมและพัฒนาระบบองค์กร',
        image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
      },
      {
        asset_tag: 'PWA-NB-2026-002',
        name: 'Dell Latitude 5440 Core i7',
        category_id: laptopCatId,
        model: 'Dell Latitude 5440',
        serial_number: 'DELL-LAT-88902',
        status: 'borrowed' as const,
        location: 'กองการบริการและลูกค้าสัมพันธ์',
        borrow_duration_days: 7,
        description: 'แล็ปท็อปสำหรับการปฏิบัติงานนอกสถานที่และงานนำเสนอการประปา',
        image_url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800',
      },
      {
        asset_tag: 'PWA-NB-2026-003',
        name: 'Lenovo ThinkPad X1 Carbon Gen 11',
        category_id: laptopCatId,
        model: 'ThinkPad X1 Carbon Gen 11',
        serial_number: 'TP-X1C-99210',
        status: 'available' as const,
        location: 'ห้องคลังครุภัณฑ์ไอที ชั้น 4',
        borrow_duration_days: 7,
        description: 'โน้ตบุ๊กพกพาน้ำหนักเบาสำหรับผู้บริหารและหัวหน้างานปฏิบัติการ',
        image_url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800',
      },
      {
        asset_tag: 'PWA-MN-2026-001',
        name: 'Dell UltraSharp 27" 4K USB-C Monitor (U2723QE)',
        category_id: monitorCatId,
        model: 'Dell U2723QE',
        serial_number: 'CN-0V283H-744',
        status: 'available' as const,
        location: 'ห้องคลังครุภัณฑ์ไอที ชั้น 4',
        borrow_duration_days: 30,
        description: 'จอภาพความละเอียด 4K IPS Black มี Hub USB-C ในตัว สำหรับงานกราฟิกและ GIS',
        image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800',
      },
      {
        asset_tag: 'PWA-MN-2026-002',
        name: 'LG UltraWide 34" Curved Monitor (34WN80C)',
        category_id: monitorCatId,
        model: 'LG 34WN80C-B',
        serial_number: 'LG-34UW-10293',
        status: 'available' as const,
        location: 'ห้องปฏิบัติการวิเคราะห์ข้อมูล ชั้น 3',
        borrow_duration_days: 14,
        description: 'จอโค้ง UltraWide เหมาะสำหรับการดูแดชบอร์ดติดตามน้ำประปาหลายหน้าพร้อมกัน',
        image_url: 'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=800',
      },
      {
        asset_tag: 'PWA-TB-2026-001',
        name: 'iPad Pro 12.9" M2 Wi-Fi + Cellular (512GB)',
        category_id: tabletCatId,
        model: 'iPad Pro 12.9 (6th Gen)',
        serial_number: 'DMPX1892Q1GC',
        status: 'available' as const,
        location: 'ห้องศูนย์สารสนเทศภูมิศาสตร์ (GIS)',
        borrow_duration_days: 7,
        description: 'แท็บเล็ตพร้อม Apple Pencil สำหรับสำรวจภาคสนามและลงพื้นที่ตรวจสอบท่อประปา',
        image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800',
      },
      {
        asset_tag: 'PWA-TB-2026-002',
        name: 'Samsung Galaxy Tab S9 Ultra 5G',
        category_id: tabletCatId,
        model: 'Galaxy Tab S9 Ultra',
        serial_number: 'R52W102938M',
        status: 'available' as const,
        location: 'ห้องคลังครุภัณฑ์ไอที ชั้น 4',
        borrow_duration_days: 7,
        description: 'แท็บเล็ตแอนดรอยด์พร้อมปากกา S-Pen กันน้ำกันฝุ่น IP68 สำหรับงานตรวจการณ์',
        image_url: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800',
      },
      {
        asset_tag: 'PWA-NW-2026-001',
        name: 'Cisco Catalyst 9120AX Wi-Fi 6 Access Point',
        category_id: networkCatId,
        model: 'C9120AXI-E',
        serial_number: 'FOC2419L0AB',
        status: 'available' as const,
        location: 'ห้องแม่ข่าย Network Core Room',
        borrow_duration_days: 30,
        description: 'ชุดกระจายสัญญาณไร้สายระดับองค์กรสำหรับการจัดประชุมและอีเวนต์กปภ.',
        image_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800',
      },
      {
        asset_tag: 'PWA-NW-2026-002',
        name: 'Netgear Nighthawk M6 Pro 5G Mobile Router',
        category_id: networkCatId,
        model: 'MR6500',
        serial_number: 'NG-M6P-77102',
        status: 'borrowed' as const,
        location: 'ทีมวิศวกรรมสุ่มตรวจคุณภาพน้ำ',
        borrow_duration_days: 14,
        description: 'อุปกรณ์แชร์อินเทอร์เน็ต 5G พกพาความเร็วสูงสำหรับการลงพื้นที่ภาคสนาม',
        image_url: 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=800',
      },
      {
        asset_tag: 'PWA-PA-2026-001',
        name: 'Logitech Rally Bar Video Conferencing System',
        category_id: peripheralCatId,
        model: 'Logitech Rally Bar Graphite',
        serial_number: '2129LZ00129',
        status: 'available' as const,
        location: 'ห้องประชุมใหญ่ การประปาส่วนภูมิภาค',
        borrow_duration_days: 7,
        description: 'ชุดกล้องและลำโพงประชุมออนไลน์ 4K สำหรับการประชุมทางไกลข้ามเขตประปา',
        image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800',
      },
    ];

    let insertedAssetCount = 0;
    for (const mockAsset of mockAssets) {
      const existing = await db.query.assets.findFirst({
        where: eq(assets.asset_tag, mockAsset.asset_tag),
      });

      if (!existing) {
        await db.insert(assets).values(mockAsset);
        insertedAssetCount++;
      }
    }

    if (insertedAssetCount > 0) {
      console.log(`✅ Seeded ${insertedAssetCount} IT assets into database.`);
    } else {
      console.log('ℹ️ Assets table already contains mock IT assets. Skipping.');
    }

    console.log('🎉 Seeding check finished successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
}

seed();
