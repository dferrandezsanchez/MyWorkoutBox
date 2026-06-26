import prisma from '../infrastructure/prisma/prisma-client';
import { Role } from '../types/domain';

export const TEST_ORGANIZATION_ID = 'org_tumeta';
export const TEST_TENANT_ID = 'tenant_tumeta';

function isUniqueConstraintError(error: unknown): error is { code: string } {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

export async function ensureTestTenant(): Promise<void> {
  try {
    await prisma.organization.create({
      data: {
        id: TEST_ORGANIZATION_ID,
        name: 'TuMeta',
        slug: 'tumeta',
        active: true,
      },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    await prisma.organization.update({
      where: { id: TEST_ORGANIZATION_ID },
      data: {
        name: 'TuMeta',
        slug: 'tumeta',
        active: true,
      },
    });
  }

  try {
    await prisma.tenant.create({
      data: {
        id: TEST_TENANT_ID,
        organizationId: TEST_ORGANIZATION_ID,
        name: 'TuMeta Personal Training',
        slug: 'tumeta-personal-training',
        appName: 'tumeta',
        shortName: 'TuMeta',
        mark: 't',
        claim: 'Personal Training',
        description: 'Control de clientes, ejercicios y progresion.',
        primary: '#ED702D',
        primaryHover: '#D96424',
        primarySoft: '#F29A6A',
        active: true,
      },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    await prisma.tenant.update({
      where: { id: TEST_TENANT_ID },
      data: {
        organizationId: TEST_ORGANIZATION_ID,
        name: 'TuMeta Personal Training',
        slug: 'tumeta-personal-training',
        appName: 'tumeta',
        shortName: 'TuMeta',
        mark: 't',
        claim: 'Personal Training',
        description: 'Control de clientes, ejercicios y progresion.',
        primary: '#ED702D',
        primaryHover: '#D96424',
        primarySoft: '#F29A6A',
        active: true,
      },
    });
  }
}

export async function ensureTenantMembership(userId: string, role: Role): Promise<void> {
  await ensureTestTenant();
  await prisma.userTenantMembership.upsert({
    where: { userId_tenantId: { userId, tenantId: TEST_TENANT_ID } },
    update: { role, active: true },
    create: { userId, tenantId: TEST_TENANT_ID, role, active: true },
  });
}
