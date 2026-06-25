import 'dotenv/config';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { PerformanceUnit, Role, Status } from '../src/types/domain';

const prisma = new PrismaClient();

const DEFAULT_BIRTH_DATE = new Date('1900-01-01T00:00:00.000Z');
const IMPORT_DATE = new Date('2025-04-01T00:00:00.000Z');
const TRAINER_EMAIL = process.env.IMPORT_TRAINER_EMAIL ?? 'admin@gym.com';
const IMPORT_TENANT_ID = process.env.IMPORT_TENANT_ID ?? 'tenant_tumeta';

const EXERCISE_GROUPS = [
  { name: 'SENTADILLA', intensityCol: 1, volumeCol: 2, observationCol: 9 },
  { name: 'ZANCADA', intensityCol: 3, volumeCol: 4, observationCol: 9 },
  { name: 'PESO MUERTO', intensityCol: 5, volumeCol: 6, observationCol: 9 },
  { name: 'STEP UP', intensityCol: 7, volumeCol: 8, observationCol: 9 },
  { name: 'FLEXIONES', intensityCol: 10, volumeCol: 11, observationCol: 18 },
  { name: 'REMOS', intensityCol: 12, volumeCol: 13, observationCol: 18 },
  { name: 'PRESS MILITAR', intensityCol: 14, volumeCol: 15, observationCol: 18 },
  { name: 'DOMINADAS', intensityCol: 16, volumeCol: 17, observationCol: 18 },
];

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function clean(value: unknown): string {
  return String(value ?? '').trim();
}

function hasMeaningfulValue(value: string): boolean {
  const normalized = value.trim();
  return normalized !== '' && normalized !== '-';
}

function splitClientName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().replace(/\s+/g, ' ').split(' ');
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

function parseRepetitions(volume: string): number | undefined {
  if (/^\d+$/.test(volume.trim())) return Number(volume.trim());
  return undefined;
}

async function getImportContext() {
  const trainer = await prisma.user.findUnique({ where: { email: TRAINER_EMAIL } });
  if (!trainer) {
    throw new Error(`No existe el trainer/import user ${TRAINER_EMAIL}. Ejecuta primero prisma:seed.`);
  }

  const membership = await prisma.userTenantMembership.findFirst({
    where: {
      userId: trainer.id,
      tenantId: IMPORT_TENANT_ID,
      active: true,
    },
  });
  if (!membership) {
    throw new Error(`El usuario importador ${TRAINER_EMAIL} no pertenece al tenant ${IMPORT_TENANT_ID}.`);
  }

  return { trainer, tenantId: IMPORT_TENANT_ID };
}

async function cleanupGeneratedValidationData() {
  const generatedUsers = await prisma.user.findMany({
    where: {
      email: {
        in: [
          'auth-test@gym.com',
          'clients-service-test@gym.com',
          'performances-test@gym.com',
          'access-admin@gym.com',
          'access-trainer@gym.com',
          'rgpd-admin@gym.com',
        ],
      },
    },
    select: { id: true },
  });
  const generatedUserIds = generatedUsers.map((user) => user.id);

  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { userId: { in: generatedUserIds } },
        { entityType: 'Client', entityId: { in: [] } },
      ],
    },
  });
  await prisma.performanceRecord.deleteMany({
    where: {
      OR: [
        { trainerId: { in: generatedUserIds } },
        { client: { firstName: { in: ['Test', 'Integration', 'Integration Updated', 'Performance', 'Performance Flow', 'RGPD', 'ANONIMIZADO', 'Filtro', 'Otra'] } } },
      ],
    },
  });
  await prisma.auditLog.deleteMany({ where: { userId: { in: generatedUserIds } } });
  await prisma.client.deleteMany({
    where: {
      OR: [
        { firstName: { in: ['Test', 'Integration', 'Integration Updated', 'Performance', 'Performance Flow', 'RGPD', 'ANONIMIZADO', 'Filtro', 'Otra'] } },
        { lastName: { in: ['Cliente', 'Client'] } },
      ],
    },
  });
  await prisma.exercise.deleteMany({
    where: {
      OR: [
        { category: 'Test' },
        { name: { contains: 'Test' } },
        { name: { contains: 'Performance Flow Exercise' } },
        { name: { contains: 'RGPD Exercise' } },
      ],
    },
  });
  await prisma.user.deleteMany({ where: { id: { in: generatedUserIds } } });
}

async function upsertClient(tenantId: string, fullName: string, actorUserId: string) {
  const { firstName, lastName } = splitClientName(fullName);
  const existing = await prisma.client.findFirst({
    where: { tenantId, firstName, lastName },
  });
  if (existing) return { client: existing, created: false };

  const client = await prisma.client.create({
    data: {
      tenantId,
      firstName,
      lastName,
      birthDate: DEFAULT_BIRTH_DATE,
      status: Status.ACTIVE,
      notes: 'Importado desde Registro de carga TuMeta - JUNIO 25.csv',
    },
  });

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: actorUserId,
      action: 'CREATE',
      entityType: 'Client',
      entityId: client.id,
      metadata: JSON.stringify({ source: 'tu-meta-csv-import' }),
    },
  });

  return { client, created: true };
}

async function upsertExercise(tenantId: string, name: string) {
  const existing = await prisma.exercise.findFirst({ where: { tenantId, name } });
  if (existing) return { exercise: existing, created: false };

  const exercise = await prisma.exercise.create({
    data: {
      tenantId,
      name,
      category: name === 'FLEXIONES' || name === 'REMOS' || name === 'PRESS MILITAR' || name === 'DOMINADAS'
        ? 'Tren superior'
        : 'Tren inferior',
      movementPattern: 'general',
      evaluationType: 'qualitative',
      improvementDirection: 'qualitative',
      defaultUnit: PerformanceUnit.text,
      measurementFields: JSON.stringify([
        { key: 'value', label: 'Marca', unit: PerformanceUnit.text, required: true, primary: true },
      ]),
      variantGroups: JSON.stringify([]),
      status: Status.ACTIVE,
      description: 'Importado desde hoja de carga TuMeta',
    },
  });

  return { exercise, created: true };
}

async function createPerformanceIfMissing(input: {
  tenantId: string;
  clientId: string;
  exerciseId: string;
  trainerId: string;
  intensity: string;
  volume: string;
  observation: string;
}) {
  const notes = [
    hasMeaningfulValue(input.volume) ? `Volumen: ${input.volume}` : '',
    hasMeaningfulValue(input.observation) ? `Observaciones: ${input.observation}` : '',
    'Importado desde Registro de carga TuMeta - JUNIO 25.csv',
  ]
    .filter(Boolean)
    .join('\n');

  const value = hasMeaningfulValue(input.intensity) ? input.intensity : `Volumen: ${input.volume}`;

  const existing = await prisma.performanceRecord.findFirst({
    where: {
      tenantId: input.tenantId,
      clientId: input.clientId,
      exerciseId: input.exerciseId,
      trainerId: input.trainerId,
      date: IMPORT_DATE,
      value,
      unit: PerformanceUnit.text,
      notes,
    },
  });
  if (existing) return false;

  const record = await prisma.performanceRecord.create({
    data: {
      tenantId: input.tenantId,
      clientId: input.clientId,
      exerciseId: input.exerciseId,
      trainerId: input.trainerId,
      value,
      unit: PerformanceUnit.text,
      repetitions: parseRepetitions(input.volume),
      date: IMPORT_DATE,
      notes,
    },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: input.tenantId,
      userId: input.trainerId,
      action: 'CREATE',
      entityType: 'PerformanceRecord',
      entityId: record.id,
      metadata: JSON.stringify({ source: 'tu-meta-csv-import' }),
    },
  });

  return true;
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    throw new Error('Uso: ts-node prisma/import-tu-meta-csv.ts <ruta-csv>');
  }

  const { trainer, tenantId } = await getImportContext();
  await cleanupGeneratedValidationData();

  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  const dataRows = rows.slice(3).filter((row) => clean(row[0]) !== '');

  let clientsCreated = 0;
  let clientsReused = 0;
  let exercisesCreated = 0;
  let exercisesReused = 0;
  let performancesCreated = 0;
  let performancesSkipped = 0;
  let emptyClientRows = 0;

  const exerciseByName = new Map<string, string>();
  for (const group of EXERCISE_GROUPS) {
    const { exercise, created } = await upsertExercise(tenantId, group.name);
    exerciseByName.set(group.name, exercise.id);
    if (created) exercisesCreated += 1;
    else exercisesReused += 1;
  }

  for (const row of dataRows) {
    const fullName = clean(row[0]);
    const hasAnyMark = EXERCISE_GROUPS.some((group) =>
      hasMeaningfulValue(clean(row[group.intensityCol])) || hasMeaningfulValue(clean(row[group.volumeCol])),
    );

    const { client, created } = await upsertClient(tenantId, fullName, trainer.id);
    if (created) clientsCreated += 1;
    else clientsReused += 1;

    if (!hasAnyMark) {
      emptyClientRows += 1;
      continue;
    }

    for (const group of EXERCISE_GROUPS) {
      const intensity = clean(row[group.intensityCol]);
      const volume = clean(row[group.volumeCol]);
      const observation = clean(row[group.observationCol]);
      if (!hasMeaningfulValue(intensity) && !hasMeaningfulValue(volume)) continue;

      const createdPerformance = await createPerformanceIfMissing({
        tenantId,
        clientId: client.id,
        exerciseId: exerciseByName.get(group.name)!,
        trainerId: trainer.id,
        intensity,
        volume,
        observation,
      });

      if (createdPerformance) performancesCreated += 1;
      else performancesSkipped += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        sourceRows: dataRows.length,
        clientsCreated,
        clientsReused,
        emptyClientRows,
        exercisesCreated,
        exercisesReused,
        performancesCreated,
        performancesSkipped,
        trainerEmail: trainer.email,
        tenantId,
        importDate: IMPORT_DATE.toISOString(),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
