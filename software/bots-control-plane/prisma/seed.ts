import { prisma } from '../lib/prisma';
import { hash } from 'bcryptjs';

async function main() {
  console.log('[DB] Starting seed...');
  
  // Test database connection first
  try {
    const testQuery = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('[DB] Database connection test:', testQuery);
  } catch (error) {
    console.error('[DB] Database connection failed:', error);
    return;
  }
  
  const users = [
    { email: 'demo.creator@example.com', role: 'creator' },
    { email: 'demo.agency@example.com', role: 'agency' },
    { email: 'demo.admin@example.com', role: 'admin' },
  ];
  
  for (const u of users) {
    try {
      const hashedPassword = await hash('demopass', 10);
      const result = await prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: {
          email: u.email,
          role: u.role as any,
          passwordHash: hashedPassword,
        },
      });
      console.log(`[DB] Seeded user: ${u.email} (${u.role}) - ID: ${result.id}`);
    } catch (error) {
      console.error(`[DB] Failed to seed user ${u.email}:`, error);
    }
  }
  
  // Verify users were created
  const userCount = await prisma.user.count();
  console.log(`[DB] Total users in database: ${userCount}`);
  
  console.log('[DB] Seeded demo users with password "demopass"');
}

main()
  .catch((e) => {
    console.error('[DB] Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
