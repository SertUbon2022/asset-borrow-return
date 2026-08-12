import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { categories } from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is missing.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function seed() {
  console.log('🌱 Starting optional DB seeding...');

  try {
    // Insert categories if empty
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

    console.log('🎉 Seeding check finished!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
}

seed();
