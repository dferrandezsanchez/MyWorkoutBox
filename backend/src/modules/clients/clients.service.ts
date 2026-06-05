import { Client } from '@prisma/client';
import { Status } from '../../types/domain';
import fs from 'fs/promises';
import path from 'path';
import prisma from '../../prisma/client';
import { AppError } from '../../middleware/errorHandler';

export interface CreateClientInput {
  firstName: string;
  lastName: string;
  birthDate: Date | string;
  height?: number;
  weight?: number;
  bodyFatPercentage?: number;
  notes?: string;
  status?: Status;
}

export interface UpdateClientInput {
  firstName?: string;
  lastName?: string;
  birthDate?: Date | string;
  height?: number;
  weight?: number;
  bodyFatPercentage?: number;
  notes?: string;
  status?: Status;
}

function normalizeClientData<T extends CreateClientInput | UpdateClientInput>(data: T): T {
  const normalized = { ...data };

  if (normalized.birthDate) {
    normalized.birthDate =
      normalized.birthDate instanceof Date
        ? normalized.birthDate
        : new Date(`${normalized.birthDate}T00:00:00.000Z`);
  }

  return normalized;
}

export async function listClients(query?: string, includeInactive = false): Promise<Client[]> {
  const statusFilter = includeInactive ? undefined : Status.ACTIVE;

  if (query && query.trim() !== '') {
    return prisma.client.findMany({
      where: {
        ...(statusFilter ? { status: statusFilter } : {}),
        OR: [
          { firstName: { contains: query } },
          { lastName: { contains: query } },
        ],
      },
      orderBy: { lastName: 'asc' },
    });
  }

  return prisma.client.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: { lastName: 'asc' },
  });
}

export async function getClient(id: string): Promise<Client> {
  const client = await prisma.client.findUnique({ where: { id } });

  if (!client) {
    throw new AppError('Recurso no encontrado', 404);
  }

  return client;
}

export async function createClient(
  data: CreateClientInput,
  actorUserId: string
): Promise<Client> {
  const client = await prisma.client.create({ data: normalizeClientData(data) });

  await prisma.auditLog.create({
    data: {
      userId: actorUserId,
      action: 'CREATE',
      entityType: 'Client',
      entityId: client.id,
    },
  });

  return client;
}

export async function updateClient(
  id: string,
  data: UpdateClientInput,
  actorUserId: string
): Promise<Client> {
  // Throws 404 if not found
  await getClient(id);

  const client = await prisma.client.update({ where: { id }, data: normalizeClientData(data) });

  await prisma.auditLog.create({
    data: {
      userId: actorUserId,
      action: 'UPDATE',
      entityType: 'Client',
      entityId: id,
      metadata: JSON.stringify({ fields: Object.keys(data) }),
    },
  });

  return client;
}

export async function setClientStatus(
  id: string,
  status: Status,
  actorUserId: string
): Promise<Client> {
  // Throws 404 if not found
  await getClient(id);

  const client = await prisma.client.update({ where: { id }, data: { status } });

  await prisma.auditLog.create({
    data: {
      userId: actorUserId,
      action: 'UPDATE',
      entityType: 'Client',
      entityId: id,
      metadata: JSON.stringify({ field: 'status', value: status }),
    },
  });

  return client;
}

export async function uploadPhoto(
  id: string,
  file: Express.Multer.File,
  consentAt: Date,
  actorUserId: string
): Promise<Client> {
  // Throws 404 if not found
  await getClient(id);

  const uploadDir = path.join('uploads', 'clients');
  await fs.mkdir(uploadDir, { recursive: true });

  const destPath = path.join(uploadDir, file.filename);
  await fs.rename(file.path, destPath);

  const photoUrl = `/uploads/clients/${file.filename}`;

  const client = await prisma.client.update({
    where: { id },
    data: {
      photoUrl,
      photoConsentAt: consentAt,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: actorUserId,
      action: 'UPDATE',
      entityType: 'Client',
      entityId: id,
      metadata: JSON.stringify({ field: 'photo' }),
    },
  });

  return client;
}

// ── GDPR endpoints ────────────────────────────────────────────────────────────

export async function exportClient(
  id: string,
  actorUserId: string
): Promise<{ client: Client; performances: import('@prisma/client').PerformanceRecord[] }> {
  const client = await getClient(id);

  const performances = await prisma.performanceRecord.findMany({
    where: { clientId: id },
  });

  await prisma.auditLog.create({
    data: {
      userId: actorUserId,
      action: 'EXPORT',
      entityType: 'Client',
      entityId: id,
    },
  });

  return { client, performances };
}

export async function anonymizeClient(
  id: string,
  actorUserId: string
): Promise<Client> {
  const client = await getClient(id);

  // Delete physical photo file if present
  if (client.photoUrl) {
    const filePath = client.photoUrl.replace(/^\//, ''); // remove leading slash
    try {
      await fs.unlink(filePath);
    } catch {
      // Ignore errors if file not found
    }
  }

  const updated = await prisma.client.update({
    where: { id },
    data: {
      firstName: 'ANONIMIZADO',
      lastName: '',
      birthDate: new Date('1900-01-01'),
      photoUrl: null,
      notes: null,
      anonymizedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: actorUserId,
      action: 'ANONYMIZE',
      entityType: 'Client',
      entityId: id,
    },
  });

  return updated;
}

export async function deletePhoto(
  id: string,
  actorUserId: string
): Promise<Client> {
  const client = await getClient(id);

  // Delete physical photo file if present
  if (client.photoUrl) {
    const filePath = client.photoUrl.replace(/^\//, ''); // remove leading slash
    try {
      await fs.unlink(filePath);
    } catch {
      // Ignore errors if file not found
    }
  }

  const updated = await prisma.client.update({
    where: { id },
    data: {
      photoUrl: null,
      photoConsentAt: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: actorUserId,
      action: 'UPDATE',
      entityType: 'Client',
      entityId: id,
      metadata: JSON.stringify({ field: 'photo', action: 'delete' }),
    },
  });

  return updated;
}
