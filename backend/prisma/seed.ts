import argon2 from 'argon2';
import { PrismaClient, RoleName } from '@prisma/client';
import { env } from '../src/config/env';
import { newReferralCode } from '../src/utils/ids';

const prisma = new PrismaClient();

async function main() {
  // Ensure all roles exist
  for (const r of Object.values(RoleName)) {
    await prisma.role.upsert({ where: { name: r }, update: {}, create: { name: r } });
  }

  // VIP plans
  await prisma.vipPlan.upsert({
    where: { code: 'WEEKLY' },
    update: { priceCoins: 49, durationDays: 7, isActive: true, title: 'VIP Weekly' },
    create: { code: 'WEEKLY', title: 'VIP Weekly', priceCoins: 49, durationDays: 7, description: '7 days of VIP access' },
  });
  await prisma.vipPlan.upsert({
    where: { code: 'MONTHLY' },
    update: { priceCoins: 149, durationDays: 30, isActive: true, title: 'VIP Monthly' },
    create: { code: 'MONTHLY', title: 'VIP Monthly', priceCoins: 149, durationDays: 30, description: '30 days of VIP access' },
  });

  // Owner (Zenus_Carlos)
  const ownerEmail = env.OWNER_EMAIL.toLowerCase();
  const ownerHash = await argon2.hash(env.OWNER_PASSWORD);
  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {},
    create: {
      email: ownerEmail,
      username: env.OWNER_USERNAME,
      passwordHash: ownerHash,
      displayName: 'Zenus Carlos',
      referralCode: newReferralCode(),
      wallet: { create: {} },
    },
  });
  for (const rn of [RoleName.OWNER, RoleName.CO_OWNER, RoleName.ADMIN]) {
    const r = await prisma.role.findUnique({ where: { name: rn } });
    if (r) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: owner.id, roleId: r.id } },
        update: {}, create: { userId: owner.id, roleId: r.id },
      });
    }
  }

  // Admin panel gmail
  const adminEmail = env.ADMIN_EMAIL.toLowerCase();
  const adminHash = await argon2.hash(env.ADMIN_PASSWORD);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      username: env.ADMIN_USERNAME,
      passwordHash: adminHash,
      displayName: 'Admin',
      referralCode: newReferralCode(),
      wallet: { create: {} },
    },
  });
  for (const rn of [RoleName.ADMIN, RoleName.PAYMENT_MANAGER, RoleName.TOURNAMENT_MANAGER, RoleName.MODERATOR, RoleName.FAM_MANAGER]) {
    const r = await prisma.role.findUnique({ where: { name: rn } });
    if (r) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: admin.id, roleId: r.id } },
        update: {}, create: { userId: admin.id, roleId: r.id },
      });
    }
  }

  console.log('Seed complete.');
  console.log(`  Owner   : ${env.OWNER_USERNAME} <${ownerEmail}>`);
  console.log(`  Admin   : ${env.ADMIN_USERNAME} <${adminEmail}>`);
  console.log('  VIP plans: WEEKLY, MONTHLY');
}

main().then(() => prisma.$disconnect()).catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
