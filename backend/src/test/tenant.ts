import prisma from '../prisma/client';
import { Role } from '../types/domain';

export const TEST_ORGANIZATION_ID = 'org_tumeta';
export const TEST_TENANT_ID = 'tenant_tumeta';

export async function ensureTestTenant(): Promise<void> {
  await prisma.organization.upsert({
    where: { slug: 'tumeta' },
    update: { active: true },
    create: {
      id: TEST_ORGANIZATION_ID,
      name: 'TuMeta',
      slug: 'tumeta',
      active: true,
    },
  });

  await prisma.tenant.upsert({
    where: { slug: 'tumeta-personal-training' },
    update: { active: true },
    create: {
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
}

export async function ensureTenantMembership(userId: string, role: Role): Promise<void> {
  await ensureTestTenant();
  await prisma.userTenantMembership.upsert({
    where: { userId_tenantId: { userId, tenantId: TEST_TENANT_ID } },
    update: { role, active: true },
    create: { userId, tenantId: TEST_TENANT_ID, role, active: true },
  });
}
