import 'dotenv/config';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TABLES = [
  'organizations',
  'tenants',
  'users',
  'user_tenant_memberships',
  'clients',
  'exercises',
  'performance_records',
  'audit_logs',
] as const;

type TableName = typeof TABLES[number];
type Row = Record<string, unknown>;
type ExportPayload = {
  source: string;
  exportedAt: string;
  tables: Record<TableName, Row[]>;
};

const DATE_FIELDS: Record<TableName, string[]> = {
  organizations: ['createdAt', 'updatedAt'],
  tenants: ['createdAt', 'updatedAt'],
  users: ['createdAt', 'updatedAt'],
  user_tenant_memberships: ['createdAt', 'updatedAt'],
  clients: ['birthDate', 'anonymizedAt', 'photoConsentAt', 'createdAt', 'updatedAt'],
  exercises: ['createdAt', 'updatedAt'],
  performance_records: ['date', 'createdAt', 'updatedAt'],
  audit_logs: ['createdAt'],
};

const BOOLEAN_FIELDS: Record<TableName, string[]> = {
  organizations: ['active'],
  tenants: ['active'],
  users: ['active'],
  user_tenant_memberships: ['active'],
  clients: [],
  exercises: [],
  performance_records: [],
  audit_logs: [],
};

function parseExport(path: string): ExportPayload {
  const payload = JSON.parse(fs.readFileSync(path, 'utf8')) as ExportPayload;
  for (const table of TABLES) {
    if (!Array.isArray(payload.tables?.[table])) {
      throw new Error(`Missing table in export: ${table}`);
    }
  }
  return payload;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') return value !== '0' && value.toLowerCase() !== 'false';
  return Boolean(value);
}

function normalizeRows(table: TableName, rows: Row[]): Row[] {
  return rows.map((row) => {
    const normalized = { ...row };
    for (const field of DATE_FIELDS[table]) {
      if (normalized[field] !== null && normalized[field] !== undefined) {
        normalized[field] = new Date(String(normalized[field]));
      }
    }
    for (const field of BOOLEAN_FIELDS[table]) {
      if (normalized[field] !== null && normalized[field] !== undefined) {
        normalized[field] = toBoolean(normalized[field]);
      }
    }
    if (table === 'exercises') {
      normalized.movementPattern = normalized.movementPattern ?? 'general';
      normalized.evaluationType = normalized.evaluationType ?? 'repetitions';
      normalized.improvementDirection = normalized.improvementDirection ?? 'higher';
      normalized.measurementFields = normalized.measurementFields ?? '[]';
      normalized.variantGroups = normalized.variantGroups ?? '[]';
    }
    return normalized;
  });
}

async function assertEmptyTarget() {
  const counts = await Promise.all([
    prisma.organization.count(),
    prisma.tenant.count(),
    prisma.user.count(),
    prisma.userTenantMembership.count(),
    prisma.client.count(),
    prisma.exercise.count(),
    prisma.performanceRecord.count(),
    prisma.auditLog.count(),
  ]);

  const total = counts.reduce((sum, count) => sum + count, 0);
  if (total > 0 && process.env.IMPORT_ALLOW_NON_EMPTY !== 'true') {
    throw new Error(
      'Target database is not empty. Set IMPORT_ALLOW_NON_EMPTY=true only after taking a MySQL backup and confirming this is intentional.',
    );
  }
}

async function createMany(table: TableName, rows: Row[]) {
  if (rows.length === 0) return 0;
  const data = normalizeRows(table, rows);

  switch (table) {
    case 'organizations':
      return (await prisma.organization.createMany({ data: data as any, skipDuplicates: true })).count;
    case 'tenants':
      return (await prisma.tenant.createMany({ data: data as any, skipDuplicates: true })).count;
    case 'users':
      return (await prisma.user.createMany({ data: data as any, skipDuplicates: true })).count;
    case 'user_tenant_memberships':
      return (await prisma.userTenantMembership.createMany({ data: data as any, skipDuplicates: true })).count;
    case 'clients':
      return (await prisma.client.createMany({ data: data as any, skipDuplicates: true })).count;
    case 'exercises':
      return (await prisma.exercise.createMany({ data: data as any, skipDuplicates: true })).count;
    case 'performance_records':
      return (await prisma.performanceRecord.createMany({ data: data as any, skipDuplicates: true })).count;
    case 'audit_logs':
      return (await prisma.auditLog.createMany({ data: data as any, skipDuplicates: true })).count;
  }
}

async function main() {
  const exportPath = process.argv[2];
  if (!exportPath) {
    throw new Error('Usage: ts-node prisma/import-sqlite-export.ts <export-json-path>');
  }

  const payload = parseExport(exportPath);
  await assertEmptyTarget();

  const inserted: Record<TableName, number> = {} as Record<TableName, number>;
  for (const table of TABLES) {
    inserted[table] = await createMany(table, payload.tables[table]);
  }

  const counts = {
    organizations: await prisma.organization.count(),
    tenants: await prisma.tenant.count(),
    users: await prisma.user.count(),
    userTenantMemberships: await prisma.userTenantMembership.count(),
    clients: await prisma.client.count(),
    exercises: await prisma.exercise.count(),
    performanceRecords: await prisma.performanceRecord.count(),
    auditLogs: await prisma.auditLog.count(),
  };

  console.log(JSON.stringify({ source: payload.source, exportedAt: payload.exportedAt, inserted, counts }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
