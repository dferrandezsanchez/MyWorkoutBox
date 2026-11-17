import type { CenterRepository, ProvisionCenterData, ProvisionedCenter } from '../../domain/repositories';
import { Role, Status } from '../../domain/shared/enums';
import { conflict } from '../../domain/shared/errors';
import prisma from '../prisma/prisma-client';

/** Legacy per-center branding columns are still NOT NULL; the app ignores them (identity is always STELIOS). */
const LEGACY_BRANDING = {
  appName: 'STELIOS',
  mark: 'S',
  claim: '',
  description: '',
  primary: '#14B8A6',
  primaryHover: '#2DD4BF',
  primarySoft: '#5EEAD4',
};

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

export class PrismaCenterRepository implements CenterRepository {
  async findOrganizationBySlug(slug: string): Promise<{ id: string; tenantId: string | null } | null> {
    const organization = await prisma.organization.findUnique({
      where: { slug },
      select: { id: true, tenants: { select: { id: true }, take: 1 } },
    });
    return organization ? { id: organization.id, tenantId: organization.tenants[0]?.id ?? null } : null;
  }

  async provision(data: ProvisionCenterData): Promise<ProvisionedCenter> {
    try {
      return await prisma.$transaction(async (tx) => {
        const organization = await tx.organization.create({
          data: { name: data.organization.name, slug: data.organization.slug, active: true },
        });
        const tenant = await tx.tenant.create({
          data: {
            organizationId: organization.id,
            name: data.tenant.name,
            slug: data.tenant.slug,
            shortName: data.tenant.name.slice(0, 40),
            ...LEGACY_BRANDING,
            active: true,
          },
        });

        const existingUser = await tx.user.findUnique({ where: { email: data.admin.email } });
        if (existingUser && !existingUser.active) {
          throw conflict('Ese email pertenece a un usuario desactivado; actívalo o usa otro email');
        }
        const admin =
          existingUser ??
          (await tx.user.create({
            data: { name: data.admin.name, email: data.admin.email, passwordHash: data.admin.passwordHash, role: Role.ADMIN, active: true },
          }));

        await tx.userTenantMembership.create({
          data: { userId: admin.id, tenantId: tenant.id, role: Role.ADMIN, active: true },
        });

        const exercises = await tx.exercise.createMany({
          data: data.exercises.map((exercise) => ({ ...exercise, tenantId: tenant.id, status: Status.ACTIVE })),
        });

        return {
          organizationId: organization.id,
          tenantId: tenant.id,
          adminUserId: admin.id,
          adminCreated: !existingUser,
          exercisesCreated: exercises.count,
        };
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw conflict('Ya existe un centro con ese identificador');
      throw error;
    }
  }
}
