import type { CenterRepository, ProvisionCenterData, ProvisionedCenter, ProvisionCenterUser } from '../../domain/repositories';
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

        const addAccess = async (person: ProvisionCenterUser, role: Role) => {
          const existingUser = await tx.user.findUnique({ where: { email: person.email } });
          if (existingUser && !existingUser.active) {
            throw conflict(`El email ${person.email} pertenece a un usuario desactivado; actívalo o usa otro email`);
          }
          const user =
            existingUser ??
            (await tx.user.create({
              data: { name: person.name, email: person.email, passwordHash: person.passwordHash, role, active: true },
            }));
          await tx.userTenantMembership.create({ data: { userId: user.id, tenantId: tenant.id, role, active: true } });
          return { id: user.id, created: !existingUser };
        };

        const admin = await addAccess(data.admin, Role.ADMIN);
        const trainers: ProvisionedCenter['trainers'] = [];
        for (const trainer of data.trainers) {
          const access = await addAccess(trainer, Role.TRAINER);
          trainers.push({ email: trainer.email, created: access.created });
        }

        const exercises = await tx.exercise.createMany({
          data: data.exercises.map((exercise) => ({ ...exercise, tenantId: tenant.id, status: Status.ACTIVE })),
        });

        return {
          organizationId: organization.id,
          tenantId: tenant.id,
          adminUserId: admin.id,
          adminCreated: admin.created,
          trainers,
          exercisesCreated: exercises.count,
        };
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw conflict('Ya existe un centro con ese identificador');
      throw error;
    }
  }
}
