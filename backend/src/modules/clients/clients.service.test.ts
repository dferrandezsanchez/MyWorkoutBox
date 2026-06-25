import { beforeAll, describe, expect, it } from 'vitest';
import bcrypt from 'bcrypt';
import prisma from '../../infrastructure/prisma/prisma-client';
import { Role, Status } from '../../types/domain';
import { createContainer } from '../../main/container';
import { ensureTenantMembership, TEST_TENANT_ID } from '../../test/tenant';

const actorEmail = 'clients-service-test@gym.com';
let actorUserId: string;

beforeAll(async () => {
  const actor = await prisma.user.upsert({
    where: { email: actorEmail },
    update: { role: Role.ADMIN, active: true },
    create: {
      name: 'Clients Service Test',
      email: actorEmail,
      passwordHash: await bcrypt.hash('Clients1234!', 10),
      role: Role.ADMIN,
      active: true,
    },
  });
  actorUserId = actor.id;
  await ensureTenantMembership(actor.id, Role.ADMIN);

  await prisma.client.createMany({
    data: [
      {
        tenantId: TEST_TENANT_ID,
        firstName: 'Filtro',
        lastName: 'Coincide',
        birthDate: new Date('1990-01-01T00:00:00.000Z'),
        status: Status.ACTIVE,
      },
      {
        tenantId: TEST_TENANT_ID,
        firstName: 'Otra',
        lastName: 'Persona',
        birthDate: new Date('1990-01-01T00:00:00.000Z'),
        status: Status.ACTIVE,
      },
      {
        tenantId: TEST_TENANT_ID,
        firstName: 'Filtro',
        lastName: 'Inactivo',
        birthDate: new Date('1990-01-01T00:00:00.000Z'),
        status: Status.INACTIVE,
      },
    ],
  });

  expect(actorUserId).toBeTruthy();
});

describe('clients.service listClients', () => {
  it('filters active clients by name or surname', async () => {
    // Feature: control-marcas-entrenamiento, Property 1: Filtro de búsqueda de clientes es inclusivo y case-insensitive
    const clients = await createContainer().clients.list.execute(TEST_TENANT_ID, 'Filtro');

    expect(clients.length).toBeGreaterThan(0);
    expect(clients.every((client) => client.status === Status.ACTIVE)).toBe(true);
    expect(
      clients.every((client) =>
        `${client.firstName} ${client.lastName}`.toLowerCase().includes('filtro'),
      ),
    ).toBe(true);
  });

  it('can include inactive clients for admin views', async () => {
    const clients = await createContainer().clients.list.execute(TEST_TENANT_ID, 'Inactivo', true);

    expect(clients.some((client) => client.status === Status.INACTIVE)).toBe(true);
  });
});
