import { PrismaClient } from '@prisma/client';
import { PerformanceUnit, Role, Status } from '../src/types/domain';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;
const PLATFORM_PRIMARY = '#2563EB';
const PLATFORM_PRIMARY_HOVER = '#1D4ED8';
const PLATFORM_PRIMARY_SOFT = '#93C5FD';

const BASE_EXERCISES = [
  {
    slug: 'dominadas',
    name: 'Dominadas',
    category: 'strength',
    movementPattern: 'pull',
    evaluationType: 'repetitions',
    improvementDirection: 'higher',
    defaultUnit: PerformanceUnit.repetitions,
    description: 'Dominadas estrictas con registro de agarre, asistencia y lastre.',
    measurementFields: [
      { key: 'value', label: 'Repeticiones', unit: PerformanceUnit.repetitions, required: true, primary: true },
      { key: 'weight', label: 'Peso adicional', unit: PerformanceUnit.kg, required: false },
    ],
    variantGroups: [
      { key: 'agarre', label: 'Agarre', options: ['Prono', 'Supino', 'Neutro'], required: false },
      { key: 'asistencia', label: 'Asistencia', options: ['Libre', 'Banda', 'Máquina'], required: false },
    ],
  },
  {
    slug: 'peso_muerto',
    name: 'Peso muerto',
    category: 'strength',
    movementPattern: 'hinge',
    evaluationType: 'weight_reps',
    improvementDirection: 'higher',
    defaultUnit: PerformanceUnit.kg,
    description: 'Peso muerto con variante y repeticiones.',
    measurementFields: [
      { key: 'value', label: 'Peso', unit: PerformanceUnit.kg, required: true, primary: true },
      { key: 'repetitions', label: 'Repeticiones', unit: PerformanceUnit.repetitions, required: true },
    ],
    variantGroups: [
      { key: 'variante', label: 'Variante', options: ['Convencional', 'Sumo', 'Rumano'], required: false },
    ],
  },
  {
    slug: 'sentadilla',
    name: 'Sentadilla',
    category: 'strength',
    movementPattern: 'squat',
    evaluationType: 'weight_reps',
    improvementDirection: 'higher',
    defaultUnit: PerformanceUnit.kg,
    description: 'Sentadilla con variante y repeticiones.',
    measurementFields: [
      { key: 'value', label: 'Peso', unit: PerformanceUnit.kg, required: true, primary: true },
      { key: 'repetitions', label: 'Repeticiones', unit: PerformanceUnit.repetitions, required: true },
    ],
    variantGroups: [
      { key: 'variante', label: 'Variante', options: ['Trasera', 'Frontal', 'Goblet'], required: false },
    ],
  },
  {
    slug: 'zancadas',
    name: 'Zancadas',
    category: 'functional',
    movementPattern: 'lunge',
    evaluationType: 'weight_reps',
    improvementDirection: 'higher',
    defaultUnit: PerformanceUnit.kg,
    description: 'Zancadas con peso y repeticiones por pierna.',
    measurementFields: [
      { key: 'value', label: 'Peso', unit: PerformanceUnit.kg, required: true, primary: true },
      { key: 'repetitions', label: 'Reps por pierna', unit: PerformanceUnit.repetitions, required: true },
    ],
    variantGroups: [
      { key: 'variante', label: 'Variante', options: ['Caminando', 'Atrás', 'Búlgara'], required: false },
    ],
  },
  {
    slug: 'plancha_frontal',
    name: 'Plancha frontal',
    category: 'core',
    movementPattern: 'core',
    evaluationType: 'max_time',
    improvementDirection: 'higher',
    defaultUnit: PerformanceUnit.seconds,
    description: 'Tiempo máximo con técnica estable.',
    measurementFields: [
      { key: 'value', label: 'Tiempo', unit: PerformanceUnit.seconds, required: true, primary: true },
    ],
    variantGroups: [
      { key: 'variante', label: 'Variante', options: ['Frontal', 'Lateral izquierda', 'Lateral derecha'], required: false },
    ],
  },
  {
    slug: 'burpees',
    name: 'Burpees',
    category: 'functional',
    movementPattern: 'conditioning',
    evaluationType: 'repetitions',
    improvementDirection: 'higher',
    defaultUnit: PerformanceUnit.repetitions,
    description: 'Repeticiones completadas con estándar definido por el centro.',
    measurementFields: [
      { key: 'value', label: 'Repeticiones', unit: PerformanceUnit.repetitions, required: true, primary: true },
      { key: 'duration', label: 'Tiempo límite', unit: PerformanceUnit.minutes, required: false },
    ],
    variantGroups: [
      { key: 'variante', label: 'Variante', options: ['Estándar', 'Over bar', 'Box-facing'], required: false },
    ],
  },
  {
    slug: 'carrera',
    name: 'Carrera',
    category: 'endurance',
    movementPattern: 'locomotion',
    evaluationType: 'time_to_complete',
    improvementDirection: 'lower',
    defaultUnit: PerformanceUnit.seconds,
    description: 'Tiempo para completar una distancia definida.',
    measurementFields: [
      { key: 'value', label: 'Tiempo', unit: PerformanceUnit.seconds, required: true, primary: true },
      { key: 'distance', label: 'Distancia', unit: PerformanceUnit.meters, required: true },
    ],
    variantGroups: [
      { key: 'distancia_objetivo', label: 'Distancia objetivo', options: ['400 m', '1 km', '5 km'], required: false },
    ],
  },
] as const;

async function seedBaseExercises(tenantId: string, idPrefix: string) {
  for (const exercise of BASE_EXERCISES) {
    await prisma.exercise.upsert({
      where: { id: `${idPrefix}_ex_${exercise.slug}` },
      update: {
        tenantId,
        name: exercise.name,
        category: exercise.category,
        movementPattern: exercise.movementPattern,
        evaluationType: exercise.evaluationType,
        improvementDirection: exercise.improvementDirection,
        defaultUnit: exercise.defaultUnit,
        measurementFields: JSON.stringify(exercise.measurementFields),
        variantGroups: JSON.stringify(exercise.variantGroups),
        description: exercise.description,
        status: Status.ACTIVE,
      },
      create: {
        id: `${idPrefix}_ex_${exercise.slug}`,
        tenantId,
        name: exercise.name,
        category: exercise.category,
        movementPattern: exercise.movementPattern,
        evaluationType: exercise.evaluationType,
        improvementDirection: exercise.improvementDirection,
        defaultUnit: exercise.defaultUnit,
        measurementFields: JSON.stringify(exercise.measurementFields),
        variantGroups: JSON.stringify(exercise.variantGroups),
        description: exercise.description,
        status: Status.ACTIVE,
      },
    });
  }
  console.log(`✓ Base exercises ready for ${tenantId}: ${BASE_EXERCISES.length}`);
}

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

  await seedBaseExercises(tenant.id, 'demo');

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
    {
      id: 'demo_client_laura',
      firstName: 'Laura',
      lastName: 'Gómez',
      birthDate: new Date('1993-02-17T00:00:00.000Z'),
      height: 170,
      weight: 64.2,
      bodyFatPercentage: 21.4,
      notes: 'Cliente demo. Objetivo: resistencia y acondicionamiento general.',
    },
    {
      id: 'demo_client_carlos',
      firstName: 'Carlos',
      lastName: 'Herrera',
      birthDate: new Date('1990-11-09T00:00:00.000Z'),
      height: 176,
      weight: 82.3,
      bodyFatPercentage: 18.6,
      notes: 'Cliente demo. Objetivo: fuerza general y sentadilla.',
    },
    {
      id: 'demo_client_elena',
      firstName: 'Elena',
      lastName: 'Torres',
      birthDate: new Date('1996-06-21T00:00:00.000Z'),
      height: 163,
      weight: 58.9,
      bodyFatPercentage: 20.1,
      notes: 'Cliente demo. Objetivo: composición corporal y core.',
    },
    {
      id: 'demo_client_david',
      firstName: 'David',
      lastName: 'Navarro',
      birthDate: new Date('1987-08-30T00:00:00.000Z'),
      height: 184,
      weight: 91.4,
      bodyFatPercentage: 22.8,
      notes: 'Cliente demo. Objetivo: pérdida de peso y capacidad aeróbica.',
    },
    {
      id: 'demo_client_sara',
      firstName: 'Sara',
      lastName: 'Iglesias',
      birthDate: new Date('1994-12-05T00:00:00.000Z'),
      height: 168,
      weight: 60.5,
      bodyFatPercentage: 19.2,
      notes: 'Cliente demo. Objetivo: fuerza de tren superior.',
    },
    {
      id: 'demo_client_diego',
      firstName: 'Diego',
      lastName: 'Campos',
      birthDate: new Date('1985-03-14T00:00:00.000Z'),
      height: 179,
      weight: 88.7,
      bodyFatPercentage: 24.5,
      notes: 'Cliente demo. Objetivo: reacondicionamiento tras parón prolongado.',
    },
    {
      id: 'demo_client_nuria',
      firstName: 'Nuria',
      lastName: 'Vidal',
      birthDate: new Date('1992-07-22T00:00:00.000Z'),
      height: 165,
      weight: 61.8,
      bodyFatPercentage: 20.9,
      notes: 'Cliente demo. Objetivo: técnica de peso muerto y consistencia.',
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
    ['demo_perf_javier_plancha_1', 'demo_client_javier', 'demo_ex_plancha_frontal', '75', PerformanceUnit.seconds, '2026-05-18T09:30:00.000Z', null, null, 75, null, 'Variante: Frontal | Buena estabilidad'],
    ['demo_perf_javier_plancha_2', 'demo_client_javier', 'demo_ex_plancha_frontal', '95', PerformanceUnit.seconds, '2026-06-06T09:30:00.000Z', null, null, 95, null, 'Variante: Frontal | Mejor control lumbar'],
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

  const sessionCount = await seedTrainingSessions(
    tenant.id,
    trainer.id,
    clients.map((client) => client.id),
  );
  console.log(`✓ Demo training sessions ready: ${sessionCount}`);
}

const SESSION_EXERCISE_SLUGS = BASE_EXERCISES.map((exercise) => exercise.slug);
const EXERCISES_PER_SESSION = 3;
const SERIES_PER_EXERCISE = 3;
const SESSIONS_PER_CLIENT = 3;
const SESSION_DURATION_MINUTES = 45;

function seriesValues(slug: (typeof SESSION_EXERCISE_SLUGS)[number], sessionIndex: number, seriesIndex: number) {
  const progress = sessionIndex;
  switch (slug) {
    case 'dominadas': {
      const reps = 6 + progress + seriesIndex;
      return { value: String(reps), unit: PerformanceUnit.repetitions, repetitions: reps };
    }
    case 'peso_muerto': {
      const weight = 90 + progress * 10 + seriesIndex * 2.5;
      return { value: String(weight), unit: PerformanceUnit.kg, weight, repetitions: 5 };
    }
    case 'sentadilla': {
      const weight = 70 + progress * 8 + seriesIndex * 2.5;
      return { value: String(weight), unit: PerformanceUnit.kg, weight, repetitions: 6 };
    }
    case 'zancadas': {
      const weight = 18 + progress * 3 + seriesIndex;
      return { value: String(weight), unit: PerformanceUnit.kg, weight, repetitions: 10 };
    }
    case 'plancha_frontal': {
      const seconds = 45 + progress * 10 + seriesIndex * 5;
      return { value: String(seconds), unit: PerformanceUnit.seconds };
    }
    case 'burpees': {
      const reps = 10 + progress * 2 + seriesIndex;
      return { value: String(reps), unit: PerformanceUnit.repetitions, repetitions: reps };
    }
    case 'carrera': {
      const seconds = Math.max(180, 300 - progress * 10 - seriesIndex * 2);
      return { value: String(seconds), unit: PerformanceUnit.seconds, distance: 1000 };
    }
    default:
      return { value: '10', unit: PerformanceUnit.repetitions, repetitions: 10 };
  }
}

async function seedTrainingSessions(tenantId: string, trainerId: string, clientIds: string[]): Promise<number> {
  let created = 0;

  for (const [clientIndex, clientId] of clientIds.entries()) {
    for (let sessionIndex = 0; sessionIndex < SESSIONS_PER_CLIENT; sessionIndex += 1) {
      const weeksAgo = (SESSIONS_PER_CLIENT - sessionIndex) * 2;
      const startedAt = new Date('2026-07-04T09:00:00.000Z');
      startedAt.setUTCDate(startedAt.getUTCDate() - weeksAgo * 7);
      startedAt.setUTCMinutes(startedAt.getUTCMinutes() + clientIndex * 20);
      const completedAt = new Date(startedAt.getTime() + SESSION_DURATION_MINUTES * 60 * 1000);

      const sessionId = `demo_session_${clientIndex}_${sessionIndex}`;
      await prisma.trainingSession.upsert({
        where: { id: sessionId },
        update: {
          tenantId,
          clientId,
          trainerId,
          status: 'COMPLETED',
          startedAt,
          completedAt,
        },
        create: {
          id: sessionId,
          tenantId,
          clientId,
          trainerId,
          status: 'COMPLETED',
          startedAt,
          completedAt,
        },
      });
      created += 1;

      for (let exercisePosition = 0; exercisePosition < EXERCISES_PER_SESSION; exercisePosition += 1) {
        const slugIndex = (clientIndex + sessionIndex + exercisePosition) % SESSION_EXERCISE_SLUGS.length;
        const slug = SESSION_EXERCISE_SLUGS[slugIndex];
        const exerciseId = `demo_ex_${slug}`;
        const sessionExerciseId = `demo_sessionex_${clientIndex}_${sessionIndex}_${exercisePosition}`;

        await prisma.trainingSessionExercise.upsert({
          where: { id: sessionExerciseId },
          update: { sessionId, exerciseId, position: exercisePosition },
          create: { id: sessionExerciseId, sessionId, exerciseId, position: exercisePosition },
        });

        for (let seriesIndex = 0; seriesIndex < SERIES_PER_EXERCISE; seriesIndex += 1) {
          const seriesNumber = seriesIndex + 1;
          const values = seriesValues(slug, sessionIndex, seriesIndex);
          const recordDate = new Date(startedAt.getTime() + (exercisePosition * SERIES_PER_EXERCISE + seriesIndex) * 3 * 60 * 1000);
          const recordId = `demo_perf_session_${clientIndex}_${sessionIndex}_${exercisePosition}_${seriesNumber}`;

          await prisma.performanceRecord.upsert({
            where: { id: recordId },
            update: {
              tenantId,
              clientId,
              exerciseId,
              trainerId,
              sessionExerciseId,
              seriesNumber,
              date: recordDate,
              ...values,
            },
            create: {
              id: recordId,
              tenantId,
              clientId,
              exerciseId,
              trainerId,
              sessionExerciseId,
              seriesNumber,
              date: recordDate,
              ...values,
            },
          });
        }
      }
    }
  }

  return created;
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

  await seedBaseExercises(tenant.id, 'tumeta');
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
