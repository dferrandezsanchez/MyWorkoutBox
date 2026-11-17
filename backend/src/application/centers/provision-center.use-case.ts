import { BASE_EXERCISES } from '../../domain/exercise-library';
import type { LibraryExercise } from '../../domain/exercise-library';
import type { CenterRepository, CreateExerciseData, ProvisionCenterUser } from '../../domain/repositories';
import { badRequest } from '../../domain/shared/errors';
import type { PasswordGenerator, PasswordHasher } from '../ports';
import { normalizeEmail, normalizeName, validatePassword } from '../trainers/trainer-inputs';
import { normalizeCenterName, resolveCenterSlug } from './center-naming';

export interface CenterPersonInput {
  name: string;
  email: string;
}

export interface ProvisionCenterInput {
  name: string;
  adminName: string;
  adminEmail: string;
  /** When omitted a strong password is generated and returned once. */
  adminPassword?: string;
  /** Trainers created together with the center. Each gets their own generated password. */
  trainers?: CenterPersonInput[];
  slug?: string;
  /** Load the starter exercise catalog. Defaults to true. */
  starterExercises?: boolean;
  /** Validate and report what would be created without writing anything. */
  dryRun?: boolean;
}

export interface ProvisionedPersonResult {
  name: string;
  email: string;
  /** False when the email already had an account: they keep their password and gain access to the new center. */
  created: boolean;
  /** Only set for new accounts with a generated password. Show it once. */
  generatedPassword: string | null;
}

export interface ProvisionCenterResult {
  status: 'created' | 'exists' | 'dry-run';
  name: string;
  slug: string;
  admin: ProvisionedPersonResult;
  trainers: ProvisionedPersonResult[];
  organizationId: string | null;
  tenantId: string | null;
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

function parsePerson(person: CenterPersonInput, role: 'administrador' | 'entrenador'): CenterPersonInput {
  const email = normalizeEmail(person.email);
  if (!isEmailLike(email)) throw badRequest(`El email del ${role} no es válido: ${email}`, [role === 'administrador' ? 'adminEmail' : 'trainers']);
  return { name: normalizeName(person.name), email };
}

/**
 * Creates a new training center with its first admin and, optionally, its trainers.
 * Shared by the operator command today and by self-service sign-up later.
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
    const admin = parsePerson({ name: input.adminName, email: input.adminEmail }, 'administrador');
    const trainers = (input.trainers ?? []).map((trainer) => parsePerson(trainer, 'entrenador'));
    const providedPassword = input.adminPassword === undefined ? undefined : validatePassword(input.adminPassword);
    const exercises = input.starterExercises === false ? [] : BASE_EXERCISES.map(toExerciseData);

    const emails = [admin.email, ...trainers.map((trainer) => trainer.email)];
    if (new Set(emails).size !== emails.length) {
      throw badRequest('Un mismo email no puede repetirse entre el administrador y los entrenadores', ['trainers']);
    }

    const untouched = (person: CenterPersonInput): ProvisionedPersonResult => ({ ...person, created: false, generatedPassword: null });
    const base = { name, slug, admin: untouched(admin), trainers: trainers.map(untouched) };

    const existing = await this.centers.findOrganizationBySlug(slug);
    if (existing) {
      return { ...base, status: 'exists', organizationId: existing.id, tenantId: existing.tenantId, exercisesCreated: 0 };
    }
    if (input.dryRun) {
      return { ...base, status: 'dry-run', organizationId: null, tenantId: null, exercisesCreated: exercises.length };
    }

    const adminPassword = providedPassword ?? this.passwordGenerator.generate();
    const trainerPasswords = trainers.map(() => this.passwordGenerator.generate());
    const withHash = async (person: CenterPersonInput, password: string): Promise<ProvisionCenterUser> => ({
      ...person,
      passwordHash: await this.passwordHasher.hash(password),
    });

    const provisioned = await this.centers.provision({
      organization: { name, slug },
      tenant: { name, slug },
      admin: await withHash(admin, adminPassword),
      trainers: await Promise.all(trainers.map((trainer, index) => withHash(trainer, trainerPasswords[index]))),
      exercises,
    });

    return {
      status: 'created',
      name,
      slug,
      organizationId: provisioned.organizationId,
      tenantId: provisioned.tenantId,
      exercisesCreated: provisioned.exercisesCreated,
      admin: {
        ...admin,
        created: provisioned.adminCreated,
        generatedPassword: provisioned.adminCreated && !providedPassword ? adminPassword : null,
      },
      trainers: trainers.map((trainer, index) => {
        const created = provisioned.trainers[index]?.created ?? false;
        return { ...trainer, created, generatedPassword: created ? trainerPasswords[index] : null };
      }),
    };
  }
}
