import { BASE_EXERCISES } from '../../domain/exercise-library';
import { badRequest } from '../../domain/shared/errors';
import type { CenterRepository, CreateExerciseData } from '../../domain/repositories';
import type { LibraryExercise } from '../../domain/exercise-library';
import type { PasswordGenerator, PasswordHasher } from '../ports';
import { normalizeEmail, normalizeName, validatePassword } from '../trainers/trainer-inputs';
import { normalizeCenterName, resolveCenterSlug } from './center-naming';

export interface ProvisionCenterInput {
  name: string;
  adminName: string;
  adminEmail: string;
  /** When omitted a strong password is generated and returned once. */
  adminPassword?: string;
  slug?: string;
  /** Load the starter exercise catalog. Defaults to true. */
  starterExercises?: boolean;
  /** Validate and report what would be created without writing anything. */
  dryRun?: boolean;
}

export interface ProvisionCenterResult {
  status: 'created' | 'exists' | 'dry-run';
  name: string;
  slug: string;
  adminEmail: string;
  organizationId: string | null;
  tenantId: string | null;
  adminCreated: boolean;
  /** Only set when a new admin was created with a generated password. Show it once. */
  generatedPassword: string | null;
  exercisesCreated: number;
}

function toExerciseData(exercise: LibraryExercise): CreateExerciseData {
  return {
    name: exercise.name,
    category: exercise.category,
    movementPattern: exercise.movementPattern,
    evaluationType: exercise.evaluationType,
    improvementDirection: exercise.improvementDirection,
    defaultUnit: exercise.defaultUnit,
    measurementFields: JSON.stringify(exercise.measurementFields),
    variantGroups: JSON.stringify(exercise.variantGroups),
    description: exercise.description,
  };
}

/** One "@", something on both sides and a dot inside the domain. Deliberately simple: the real check is that mail arrives. */
function isEmailLike(email: string): boolean {
  if (/\s/.test(email)) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  const dot = domain.lastIndexOf('.');
  return local.length > 0 && dot > 0 && dot < domain.length - 1;
}

function parseAdminEmail(raw: string): string {
  const email = normalizeEmail(raw);
  if (!isEmailLike(email)) throw badRequest('El email del administrador no es válido', ['adminEmail']);
  return email;
}

/**
 * Creates a new training center with its first admin. Shared by the operator
 * script today and by self-service sign-up later.
 *
 * Safe to repeat: if a center with the same identifier already exists nothing is
 * changed. Other centers are never touched, and an existing user keeps their password.
 */
export class ProvisionCenterUseCase {
  constructor(
    private readonly centers: CenterRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly passwordGenerator: PasswordGenerator,
  ) {}

  async execute(input: ProvisionCenterInput): Promise<ProvisionCenterResult> {
    const name = normalizeCenterName(input.name);
    const slug = resolveCenterSlug(name, input.slug);
    const adminName = normalizeName(input.adminName);
    const adminEmail = parseAdminEmail(input.adminEmail);
    const providedPassword = input.adminPassword === undefined ? undefined : validatePassword(input.adminPassword);
    const exercises = input.starterExercises === false ? [] : BASE_EXERCISES.map(toExerciseData);

    const base = { name, slug, adminEmail };
    const existing = await this.centers.findOrganizationBySlug(slug);
    if (existing) {
      return {
        ...base,
        status: 'exists',
        organizationId: existing.id,
        tenantId: existing.tenantId,
        adminCreated: false,
        generatedPassword: null,
        exercisesCreated: 0,
      };
    }

    if (input.dryRun) {
      return { ...base, status: 'dry-run', organizationId: null, tenantId: null, adminCreated: false, generatedPassword: null, exercisesCreated: exercises.length };
    }

    const password = providedPassword ?? this.passwordGenerator.generate();
    const provisioned = await this.centers.provision({
      organization: { name, slug },
      tenant: { name, slug },
      admin: { name: adminName, email: adminEmail, passwordHash: await this.passwordHasher.hash(password) },
      exercises,
    });

    return {
      ...base,
      status: 'created',
      organizationId: provisioned.organizationId,
      tenantId: provisioned.tenantId,
      adminCreated: provisioned.adminCreated,
      generatedPassword: provisioned.adminCreated && !providedPassword ? password : null,
      exercisesCreated: provisioned.exercisesCreated,
    };
  }
}
