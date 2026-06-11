import { PrismaClient } from '@prisma/client';
import { PerformanceUnit, Role, Status } from '../src/types/domain';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;
const PLATFORM_PRIMARY = '#2563EB';
const PLATFORM_PRIMARY_HOVER = '#1D4ED8';
const PLATFORM_PRIMARY_SOFT = '#93C5FD';

async function ensureUser(email: string, name: string, password: string, role: Role) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  return prisma.user.upsert({
    where: { email },
    update: {
      name,
      role,
      active: true,
    },
    create: {
      name,
      email,
      passwordHash,
      role,
      active: true,
    },
  });
}

async function ensureMembership(userId: string, tenantId: string, role: Role) {
  return prisma.userTenantMembership.upsert({
    where: { userId_tenantId: { userId, tenantId } },
    update: { role, active: true },
    create: { userId, tenantId, role, active: true },
  });
}

async function seedDemoTenant() {
  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-myworkoutbox' },
    update: {
      name: 'Demo MyWorkoutBox',
      active: true,
    },
    create: {
      id: 'org_demo_myworkoutbox',
      name: 'Demo MyWorkoutBox',
      slug: 'demo-myworkoutbox',
      active: true,
    },
  });
  console.log(`✓ Demo organization ready: ${organization.name} (id: ${organization.id})`);

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'myworkoutbox-demo-center' },
    update: {
      organizationId: organization.id,
      name: 'MyWorkoutBox Demo Center',
      appName: 'MyWorkoutBox',
      shortName: 'Demo Center',
      mark: 'MW',
      claim: 'Training Intelligence',
      description: 'Tenant de demostración con datos ficticios para validar el producto.',
      primary: PLATFORM_PRIMARY,
      primaryHover: PLATFORM_PRIMARY_HOVER,
      primarySoft: PLATFORM_PRIMARY_SOFT,
      active: true,
    },
    create: {
      id: 'tenant_demo',
      organizationId: organization.id,
      name: 'MyWorkoutBox Demo Center',
      slug: 'myworkoutbox-demo-center',
      appName: 'MyWorkoutBox',
      shortName: 'Demo Center',
      mark: 'MW',
      claim: 'Training Intelligence',
      description: 'Tenant de demostración con datos ficticios para validar el producto.',
      primary: PLATFORM_PRIMARY,
      primaryHover: PLATFORM_PRIMARY_HOVER,
      primarySoft: PLATFORM_PRIMARY_SOFT,
      active: true,
    },
  });
  console.log(`✓ Demo tenant ready: ${tenant.name} (id: ${tenant.id})`);

  const admin = await ensureUser('admin-demo@gym.com', 'Admin Demo', 'Admin1234!', Role.ADMIN);
  const trainer = await ensureUser('trainer-demo@gym.com', 'Trainer Demo', 'Trainer1234!', Role.TRAINER);
  await ensureMembership(admin.id, tenant.id, Role.ADMIN);
  await ensureMembership(trainer.id, tenant.id, Role.TRAINER);
  console.log(`✓ Demo users ready: ${admin.email}, ${trainer.email}`);

  const exercises = [
    {
      id: 'demo_ex_dominadas',
      name: 'Dominadas',
      category: 'Espalda',
      defaultUnit: PerformanceUnit.repetitions,
      description: 'Dominadas estrictas con registro de agarre en notas.',
    },
    {
      id: 'demo_ex_peso_muerto',
      name: 'Peso muerto',
      category: 'Fuerza',
      defaultUnit: PerformanceUnit.kg,
      description: 'Peso muerto convencional o variante indicada por el entrenador.',
    },
    {
      id: 'demo_ex_zancadas',
      name: 'Zancadas',
      category: 'Pierna',
      defaultUnit: PerformanceUnit.kg,
      description: 'Zancadas con registro de repeticiones por pierna.',
    },
    {
      id: 'demo_ex_plancha',
      name: 'Plancha frontal',
      category: 'Core',
      defaultUnit: PerformanceUnit.seconds,
      description: 'Tiempo máximo con técnica estable.',
    },
  ];

  for (const exercise of exercises) {
    await prisma.exercise.upsert({
      where: { id: exercise.id },
      update: {
        tenantId: tenant.id,
        name: exercise.name,
        category: exercise.category,
        defaultUnit: exercise.defaultUnit,
        description: exercise.description,
        status: Status.ACTIVE,
      },
      create: {
        ...exercise,
        tenantId: tenant.id,
        status: Status.ACTIVE,
      },
    });
  }
  console.log(`✓ Demo exercises ready: ${exercises.length}`);

  const clients = [
    {
      id: 'demo_client_alex',
      firstName: 'Alex',
      lastName: 'Molina',
      birthDate: new Date('1991-04-12T00:00:00.000Z'),
      height: 178,
      weight: 78.5,
      bodyFatPercentage: 14.2,
      notes: 'Cliente demo. Objetivo: mejorar fuerza relativa y dominadas.',
    },
    {
      id: 'demo_client_marta',
      firstName: 'Marta',
      lastName: 'Ruiz',
      birthDate: new Date('1988-09-03T00:00:00.000Z'),
      height: 166,
      weight: 62.4,
      bodyFatPercentage: 19.8,
      notes: 'Cliente demo. Objetivo: fuerza de tren inferior y consistencia semanal.',
    },
    {
      id: 'demo_client_javier',
      firstName: 'Javier',
      lastName: 'Santos',
      birthDate: new Date('1984-01-25T00:00:00.000Z'),
      height: 181,
      weight: 86.1,
      bodyFatPercentage: 17.5,
      notes: 'Cliente demo. Objetivo: técnica de peso muerto y core.',
    },
  ];

  for (const client of clients) {
    await prisma.client.upsert({
      where: { id: client.id },
      update: {
        tenantId: tenant.id,
        firstName: client.firstName,
        lastName: client.lastName,
        birthDate: client.birthDate,
        height: client.height,
        weight: client.weight,
        bodyFatPercentage: client.bodyFatPercentage,
        notes: client.notes,
        status: Status.ACTIVE,
      },
      create: {
        ...client,
        tenantId: tenant.id,
        status: Status.ACTIVE,
      },
    });
  }
  console.log(`✓ Demo clients ready: ${clients.length}`);

  const records = [
    ['demo_perf_alex_dominadas_1', 'demo_client_alex', 'demo_ex_dominadas', '5', PerformanceUnit.repetitions, '2026-04-10T10:00:00.000Z', null, 5, null, null, 'Agarre prono'],
    ['demo_perf_alex_dominadas_2', 'demo_client_alex', 'demo_ex_dominadas', '7', PerformanceUnit.repetitions, '2026-05-08T10:00:00.000Z', null, 7, null, null, 'Agarre supino'],
    ['demo_perf_alex_dominadas_3', 'demo_client_alex', 'demo_ex_dominadas', '6', PerformanceUnit.repetitions, '2026-06-05T10:00:00.000Z', null, 6, null, null, 'Agarre prono, técnica sólida'],
    ['demo_perf_alex_deadlift_1', 'demo_client_alex', 'demo_ex_peso_muerto', '110', PerformanceUnit.kg, '2026-04-17T10:00:00.000Z', 110, 5, null, null, '5 repeticiones'],
    ['demo_perf_alex_deadlift_2', 'demo_client_alex', 'demo_ex_peso_muerto', '125', PerformanceUnit.kg, '2026-06-02T10:00:00.000Z', 125, 3, null, null, '3 repeticiones'],
    ['demo_perf_marta_zancadas_1', 'demo_client_marta', 'demo_ex_zancadas', '24', PerformanceUnit.kg, '2026-05-12T11:00:00.000Z', 24, 10, null, null, '10 por pierna'],
    ['demo_perf_marta_zancadas_2', 'demo_client_marta', 'demo_ex_zancadas', '28', PerformanceUnit.kg, '2026-06-03T11:00:00.000Z', 28, 8, null, null, '8 por pierna'],
    ['demo_perf_javier_plancha_1', 'demo_client_javier', 'demo_ex_plancha', '75', PerformanceUnit.seconds, '2026-05-18T09:30:00.000Z', null, null, 75, null, 'Buena estabilidad'],
    ['demo_perf_javier_plancha_2', 'demo_client_javier', 'demo_ex_plancha', '95', PerformanceUnit.seconds, '2026-06-06T09:30:00.000Z', null, null, 95, null, 'Mejor control lumbar'],
  ] as const;

  for (const [id, clientId, exerciseId, value, unit, date, weight, repetitions, duration, distance, notes] of records) {
    await prisma.performanceRecord.upsert({
      where: { id },
      update: {
        tenantId: tenant.id,
        clientId,
        exerciseId,
        trainerId: trainer.id,
        value,
        unit,
        weight,
        repetitions,
        duration,
        distance,
        date: new Date(date),
        notes,
      },
      create: {
        id,
        tenantId: tenant.id,
        clientId,
        exerciseId,
        trainerId: trainer.id,
        value,
        unit,
        weight,
        repetitions,
        duration,
        distance,
        date: new Date(date),
        notes,
      },
    });
  }
  console.log(`✓ Demo performance records ready: ${records.length}`);
}

async function seedTuMetaTenant() {
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
  console.log(`✓ TuMeta organization ready: ${organization.name} (id: ${organization.id})`);

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
  console.log(`✓ TuMeta tenant ready: ${tenant.name} (id: ${tenant.id})`);

  const admin = await ensureUser('admin@gym.com', 'Admin Principal', 'Admin1234!', Role.ADMIN);
  console.log(`✓ TuMeta admin user ready: ${admin.email} (id: ${admin.id})`);
  await ensureMembership(admin.id, tenant.id, Role.ADMIN);

  const trainer = await ensureUser('trainer@gym.com', 'Entrenador TuMeta', 'Trainer1234!', Role.TRAINER);
  console.log(`✓ TuMeta trainer user ready: ${trainer.email} (id: ${trainer.id})`);
  await ensureMembership(trainer.id, tenant.id, Role.TRAINER);
}

async function main() {
  console.log('Starting database seed...');

  await seedDemoTenant();
  await seedTuMetaTenant();

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
