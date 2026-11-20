import type { Membership, User } from '../../domain/shared/entities';
import { Role } from '../../domain/shared/enums';
import { badRequest } from '../../domain/shared/errors';

export interface TrainerUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Effective routine permission: always true for ADMIN, membership flag for TRAINER. */
  canManageRoutines: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTrainerInput {
  name?: string;
  email?: string;
  password?: string;
  active?: boolean;
}

export interface UpdateTrainerInput {
  name?: string;
  email?: string;
  active?: boolean;
}

export interface ResetTrainerPasswordInput {
  password?: string;
}

export interface UpdateStaffAccessInput {
  role?: Role;
  canManageRoutines?: boolean;
}

export function isStaffRole(role: unknown): role is Role {
  return role === Role.ADMIN || role === Role.TRAINER;
}

export function toTrainerUser(user: User, membership?: Membership): TrainerUser {
  const role = (membership?.role ?? user.role) as Role;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role,
    canManageRoutines: role === Role.ADMIN || Boolean(membership?.canManageRoutines),
    active: Boolean(user.active && (membership?.active ?? true)),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function normalizeName(name?: string): string {
  const normalized = name?.trim();
  if (!normalized) throw badRequest('El nombre es obligatorio');
  return normalized;
}

export function normalizeEmail(email?: string): string {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) throw badRequest('El email es obligatorio');
  return normalized;
}

export function validatePassword(password?: string): string {
  if (!password || password.length < 8) {
    throw badRequest('La contraseña debe tener al menos 8 caracteres');
  }
  return password;
}
