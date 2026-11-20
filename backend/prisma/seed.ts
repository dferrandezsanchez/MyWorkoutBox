import { PrismaClient } from '@prisma/client';
import { PerformanceUnit, Role, Status } from '../src/types/domain';
import { BASE_EXERCISES } from '../src/domain/exercise-library';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;
const PLATFORM_PRIMARY = '#14B8A6';
const PLATFORM_PRIMARY_HOVER = '#2DD4BF';
const PLATFORM_PRIMARY_SOFT = '#5EEAD4';



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
        muscleGroup: exercise.muscleGroup,
        libraryKey: exercise.slug,
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
        muscleGroup: exercise.muscleGroup,
        libraryKey: exercise.slug,
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
      name: 'Demo STELIOS',
      active: true,
    },
    create: {
      id: 'org_demo_myworkoutbox',
      name: 'Demo STELIOS',
      slug: 'demo-myworkoutbox',
      active: true,
    },
  });
  console.log(`✓ Demo organization ready: ${organization.name} (id: ${organization.id})`);

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'myworkoutbox-demo-center' },
    update: {
      organizationId: organization.id,
      name: 'STELIOS Demo Center',
      appName: 'STELIOS',
      shortName: 'Demo Center',
      mark: 'S',
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
      name: 'STELIOS Demo Center',
      slug: 'myworkoutbox-demo-center',
      appName: 'STELIOS',
      shortName: 'Demo Center',
      mark: 'S',
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

  const measurementCount = await seedMeasurementsAndGoals(tenant.id, clients, admin.id);
  console.log(`✓ Demo measurements ready: ${measurementCount}`);

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

  const routines = await seedRoutines(tenant.id, admin.id);
  console.log(`✓ Demo routines ready: ${routines.templates} templates, ${routines.plans} client plans`);
}

type DemoRoutineExercise = [slug: string, targetSets: number | null, targetReps: string | null, notes?: string];

const DEMO_ROUTINES: Array<{ id: string; name: string; notes: string; exercises: DemoRoutineExercise[] }> = [
  {
    id: 'demo_routine_a',
    name: 'Pierna y core',
    notes: 'Calentamiento 10 min de movilidad de cadera. Descanso 2 min entre series de sentadilla.',
    exercises: [
      ['sentadilla', 4, '6'],
      ['zancadas', 3, '10 por pierna'],
      ['plancha_frontal', 3, '45 s'],
    ],
  },
  {
    id: 'demo_routine_b',
    name: 'Tirón y bisagra',
    notes: 'Priorizar técnica en peso muerto; subir carga solo si la última serie sale limpia.',
    exercises: [
      ['peso_muerto', 4, '5'],
      ['dominadas', 4, 'Máx. con técnica', 'Banda si no llega a 5'],
      ['plancha_frontal', 2, '60 s'],
    ],
  },
  {
    id: 'demo_routine_c',
    name: 'Acondicionamiento',
    notes: 'Formato circuito. Registrar tiempos para comparar semana a semana.',
    exercises: [
      ['burpees', 3, '12'],
      ['carrera', 3, '1000 m'],
      ['zancadas', 2, '12 por pierna'],
    ],
  },
  {
    id: 'demo_routine_eval',
    name: 'Evaluación inicial',
    notes: 'Primera sesión de un cliente nuevo: marcas de referencia en básicos.',
    exercises: [
      ['sentadilla', 1, 'RM 5'],
      ['peso_muerto', 1, 'RM 5'],
      ['dominadas', 1, 'Máx.'],
      ['plancha_frontal', 1, 'Máx.'],
      ['carrera', 1, '1000 m'],
    ],
  },
];

/** Client plans: template ids in order (A -> B -> C) and the 1-based routine that comes next. */
const DEMO_PLANS: Array<{ id: string; clientId: string; name: string; templateIds: string[]; nextPosition: number }> = [
  { id: 'demo_plan_alex', clientId: 'demo_client_alex', name: 'Fuerza 3 días', templateIds: ['demo_routine_a', 'demo_routine_b', 'demo_routine_c'], nextPosition: 2 },
  { id: 'demo_plan_marta', clientId: 'demo_client_marta', name: 'Fuerza 2 días', templateIds: ['demo_routine_a', 'demo_routine_b'], nextPosition: 1 },
  { id: 'demo_plan_javier', clientId: 'demo_client_javier', name: 'Fuerza 3 días', templateIds: ['demo_routine_a', 'demo_routine_b', 'demo_routine_c'], nextPosition: 3 },
  { id: 'demo_plan_laura', clientId: 'demo_client_laura', name: 'Fuerza y cardio', templateIds: ['demo_routine_b', 'demo_routine_c', 'demo_routine_a', 'demo_routine_c'], nextPosition: 1 },
];

/** Idempotent: re-running rewrites the demo templates and plans to this exact content. */
async function seedRoutines(tenantId: string, createdById: string): Promise<{ templates: number; plans: number }> {
  for (const routine of DEMO_ROUTINES) {
    await prisma.routineTemplate.upsert({
      where: { id: routine.id },
      update: { tenantId, name: routine.name, notes: routine.notes, status: Status.ACTIVE },
      create: { id: routine.id, tenantId, name: routine.name, notes: routine.notes, createdById, status: Status.ACTIVE },
    });
    await prisma.routineTemplateExercise.deleteMany({ where: { templateId: routine.id } });
    await prisma.routineTemplateExercise.createMany({
      data: routine.exercises.map(([slug, targetSets, targetReps, notes], index) => ({
        templateId: routine.id,
        exerciseId: `demo_ex_${slug}`,
        position: index + 1,
        targetSets,
        targetReps,
        notes: notes ?? null,
      })),
    });
  }

  for (const plan of DEMO_PLANS) {
    // One active plan per client: retire any other plan (e.g. one created by hand in the demo).
    await prisma.clientRoutinePlan.updateMany({
      where: { tenantId, clientId: plan.clientId, active: true, id: { not: plan.id } },
      data: { active: false },
    });
    await prisma.clientRoutinePlan.upsert({
      where: { id: plan.id },
      update: { tenantId, name: plan.name, active: true, nextPosition: plan.nextPosition },
      create: { id: plan.id, tenantId, clientId: plan.clientId, name: plan.name, nextPosition: plan.nextPosition, createdById },
    });
    await prisma.clientRoutinePlanItem.deleteMany({ where: { planId: plan.id } });
    await prisma.clientRoutinePlanItem.createMany({
      data: plan.templateIds.map((templateId, index) => ({ planId: plan.id, templateId, position: index + 1 })),
    });
  }

  return { templates: DEMO_ROUTINES.length, plans: DEMO_PLANS.length };
}

const SESSION_EXERCISE_SLUGS = BASE_EXERCISES.map((exercise) => exercise.slug);
const EXERCISES_PER_SESSION = 3;
const SERIES_PER_EXERCISE = 3;
const SESSIONS_PER_CLIENT = 6;
/** Days between a client's demo sessions. */
const SESSION_CADENCE_DAYS = 5;
/** The last demo clients stop training this many days ago, so the dashboard shows clients to reactivate. */
const INACTIVE_CLIENTS = 2;
const INACTIVE_OFFSET_DAYS = 18;
const DAY_MS = 24 * 60 * 60 * 1000;
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

const MEASUREMENTS_PER_CLIENT = 6;
const MEASUREMENT_EVERY_DAYS = 14;
const DEMO_GOALS: Array<{ goal: string; monthsAhead: number | null }> = [
  { goal: 'Preparar la media maratón de Valencia', monthsAhead: 4 },
  { goal: 'Boda: llegar a 75 kg con más masa muscular', monthsAhead: 7 },
  { goal: 'Volver a correr sin molestias de rodilla', monthsAhead: null },
];

/** Biweekly measurements trending in the right direction, plus goals for the first clients. Dates are relative to the run day. */
async function seedMeasurementsAndGoals(
  tenantId: string,
  clients: Array<{ id: string; weight: number | null; bodyFatPercentage: number | null }>,
  createdById: string,
): Promise<number> {
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 12);
  let count = 0;

  for (const [clientIndex, client] of clients.entries()) {
    const goal = DEMO_GOALS[clientIndex];
    const goalDate = goal?.monthsAhead ? new Date(todayUtc) : null;
    goalDate?.setUTCMonth(goalDate.getUTCMonth() + (goal?.monthsAhead ?? 0));
    await prisma.client.update({
      where: { id: client.id },
      data: { goal: goal?.goal ?? null, goalDate },
    });

    const baseWeight = client.weight ?? 75;
    const baseFat = client.bodyFatPercentage ?? 20;
    const baseMuscle = Math.round(baseWeight * 0.42 * 10) / 10;

    for (let index = 0; index < MEASUREMENTS_PER_CLIENT; index += 1) {
      const stepsAgo = MEASUREMENTS_PER_CLIENT - 1 - index;
      const measuredAt = new Date(todayUtc - (stepsAgo * MEASUREMENT_EVERY_DAYS + 2 + (clientIndex % 4)) * DAY_MS);
      const id = `demo_measurement_${clientIndex}_${index}`;
      const values = {
        tenantId,
        clientId: client.id,
        measuredAt,
        weight: Math.round((baseWeight + stepsAgo * 0.45) * 10) / 10,
        bodyFatPercentage: Math.round((baseFat + stepsAgo * 0.35) * 10) / 10,
        muscleMass: Math.round((baseMuscle - stepsAgo * 0.15) * 10) / 10,
        notes: null,
        createdById,
      };
      await prisma.clientMeasurement.upsert({ where: { id }, update: values, create: { id, ...values } });
      count += 1;
    }
  }

  return count;
}

async function seedTrainingSessions(tenantId: string, trainerId: string, clientIds: string[]): Promise<number> {
  let created = 0;

  for (const [clientIndex, clientId] of clientIds.entries()) {
    for (let sessionIndex = 0; sessionIndex < SESSIONS_PER_CLIENT; sessionIndex += 1) {
      // Dates are relative to the day the seed runs, so the demo always shows recent activity.
      const isInactive = clientIndex >= clientIds.length - INACTIVE_CLIENTS;
      const daysAgo =
        (SESSIONS_PER_CLIENT - 1 - sessionIndex) * SESSION_CADENCE_DAYS + 1 + (clientIndex % SESSION_CADENCE_DAYS) + (isInactive ? INACTIVE_OFFSET_DAYS : 0);
      const today = new Date();
      const startedAt = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - daysAgo * DAY_MS);
      startedAt.setUTCHours(7 + ((clientIndex * 3) % 12), (clientIndex * 20) % 60);
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

/** `SEED_ONLY=routines` adds/refreshes just the demo routines and plans, leaving other demo data untouched. */
async function seedDemoRoutinesOnly() {
  const admin = await prisma.user.findUnique({ where: { email: 'admin-demo@gym.com' } });
  const tenant = await prisma.tenant.findUnique({ where: { slug: 'demo' } }) ?? await prisma.tenant.findUnique({ where: { id: 'tenant_demo' } });
  if (!admin || !tenant) throw new Error('Demo tenant or admin-demo@gym.com not found: run the full seed first');
  const routines = await seedRoutines(tenant.id, admin.id);
  console.log(`✓ Demo routines ready: ${routines.templates} templates, ${routines.plans} client plans`);
}

async function main() {
  console.log('Starting database seed...');

  if (process.env.SEED_ONLY === 'routines') {
    await seedDemoRoutinesOnly();
    console.log('Seed completed successfully.');
    return;
  }

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
