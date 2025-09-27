#!/usr/bin/env tsx

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed script...");

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash: await hash("Admin123!", 10),
      role: "admin",
    },
  });
  console.log("✅ Created admin user:", adminUser.email);

  // Create creator user
  const creatorUser = await prisma.user.upsert({
    where: { email: "creator@example.com" },
    update: {},
    create: {
      email: "creator@example.com",
      passwordHash: await hash("Creator123!", 10),
      role: "creator",
    },
  });
  console.log("✅ Created creator user:", creatorUser.email);

  // Create agency user
  const agencyUser = await prisma.user.upsert({
    where: { email: "agency@example.com" },
    update: {},
    create: {
      email: "agency@example.com",
      passwordHash: await hash("Agency123!", 10),
      role: "agency",
    },
  });
  console.log("✅ Created agency user:", agencyUser.email);

  console.log("🎉 Seed script completed successfully!");
  console.log("\nTest users created:");
  console.log("Admin:   admin@example.com / Admin123!");
  console.log("Creator: creator@example.com / Creator123!");
  console.log("Agency:  agency@example.com / Agency123!");
}

main()
  .catch((e) => {
    console.error("❌ Seed script failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });