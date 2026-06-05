import { beforeAll, describe, expect, it } from 'vitest';
import bcrypt from 'bcrypt';
import prisma from '../../prisma/client';
import { Role, Status } from '../../types/domain';
import { listClients } from './clients.service';

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

  await prisma.client.createMany({
    data: [
      {
        firstName: 'Filtro',
        lastName: 'Coincide',
        birthDate: new Date('1990-01-01T00:00:00.000Z'),
        status: Status.ACTIVE,
      },
      {
        firstName: 'Otra',
        lastName: 'Persona',
        birthDate: new Date('1990-01-01T00:00:00.000Z'),
        status: Status.ACTIVE,
      },
      {
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
    const clients = await listClients('Filtro');

    expect(clients.length).toBeGreaterThan(0);
    expect(clients.every((client) => client.status === Status.ACTIVE)).toBe(true);
    expect(
      clients.every((client) =>
        `${client.firstName} ${client.lastName}`.toLowerCase().includes('filtro'),
      ),
    ).toBe(true);
  });

  it('can include inactive clients for admin views', async () => {
    const clients = await listClients('Inactivo', true);

    expect(clients.some((client) => client.status === Status.INACTIVE)).toBe(true);
  });
});
