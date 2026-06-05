import { PrismaClient } from '@prisma/client';
import { Role } from '../src/types/domain';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
  console.log('Starting database seed...');

  // Create ADMIN user
  const adminPasswordHash = await bcrypt.hash('Admin1234!', SALT_ROUNDS);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gym.com' },
    update: {},
    create: {
      name: 'Admin Principal',
      email: 'admin@gym.com',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      active: true,
    },
  });
  console.log(`✓ Admin user created/updated: ${admin.email} (id: ${admin.id})`);

  // Create TRAINER user
  const trainerPasswordHash = await bcrypt.hash('Trainer1234!', SALT_ROUNDS);
  const trainer = await prisma.user.upsert({
    where: { email: 'trainer@gym.com' },
    update: {},
    create: {
      name: 'Entrenador Demo',
      email: 'trainer@gym.com',
      passwordHash: trainerPasswordHash,
      role: Role.TRAINER,
      active: true,
    },
  });
  console.log(`✓ Trainer user created/updated: ${trainer.email} (id: ${trainer.id})`);

  console.log('Seed completed successfully.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
