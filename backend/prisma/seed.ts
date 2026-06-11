import { PrismaClient } from '@prisma/client';
import { Role } from '../src/types/domain';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
  console.log('Starting database seed...');

  const organization = await prisma.organization.upsert({
    where: { slug: 'tumeta' },
    update: {
      name: 'TuMeta',
      active: true,
    },
    create: {
      id: 'org_tumeta',
      name: 'TuMeta',
      slug: 'tumeta',
      active: true,
    },
  });
  console.log(`✓ Organization ready: ${organization.name} (id: ${organization.id})`);

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'tumeta-personal-training' },
    update: {
      organizationId: organization.id,
      name: 'TuMeta Personal Training',
      appName: 'tumeta',
      shortName: 'TuMeta',
      mark: 't',
      claim: 'Personal Training',
      description: 'Control de clientes, ejercicios y progresión.',
      primary: '#ED702D',
      primaryHover: '#D96424',
      primarySoft: '#F29A6A',
      active: true,
    },
    create: {
      id: 'tenant_tumeta',
      organizationId: organization.id,
      name: 'TuMeta Personal Training',
      slug: 'tumeta-personal-training',
      appName: 'tumeta',
      shortName: 'TuMeta',
      mark: 't',
      claim: 'Personal Training',
      description: 'Control de clientes, ejercicios y progresión.',
      primary: '#ED702D',
      primaryHover: '#D96424',
      primarySoft: '#F29A6A',
      active: true,
    },
  });
  console.log(`✓ Tenant ready: ${tenant.name} (id: ${tenant.id})`);

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
  await prisma.userTenantMembership.upsert({
    where: { userId_tenantId: { userId: admin.id, tenantId: tenant.id } },
    update: { role: Role.ADMIN, active: true },
    create: { userId: admin.id, tenantId: tenant.id, role: Role.ADMIN, active: true },
  });

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
  await prisma.userTenantMembership.upsert({
    where: { userId_tenantId: { userId: trainer.id, tenantId: tenant.id } },
    update: { role: Role.TRAINER, active: true },
    create: { userId: trainer.id, tenantId: tenant.id, role: Role.TRAINER, active: true },
  });

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
