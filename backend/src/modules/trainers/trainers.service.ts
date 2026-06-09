import bcrypt from 'bcrypt';
import type { User } from '@prisma/client';
import prisma from '../../prisma/client';
import { AppError } from '../../middleware/errorHandler';
import { Role } from '../../types/domain';

export interface TrainerUser {
  id: string;
  name: string;
  email: string;
  role: Role;
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

function toTrainerUser(user: User): TrainerUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
    active: user.active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function normalizeName(name?: string): string {
  const normalized = name?.trim();
  if (!normalized) {
    throw new AppError('El nombre es obligatorio', 400);
  }
  return normalized;
}

function normalizeEmail(email?: string): string {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) {
    throw new AppError('El email es obligatorio', 400);
  }
  return normalized;
}

function validatePassword(password?: string): string {
  if (!password || password.length < 8) {
    throw new AppError('La contraseña debe tener al menos 8 caracteres', 400);
  }
  return password;
}

async function assertEmailAvailable(email: string, currentUserId?: string): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== currentUserId) {
    throw new AppError('Ya existe un usuario con ese email', 409);
  }
}

export async function listTrainers(includeInactive = true): Promise<TrainerUser[]> {
  const users = await prisma.user.findMany({
    where: {
      role: Role.TRAINER,
      ...(includeInactive ? {} : { active: true }),
    },
    orderBy: { name: 'asc' },
  });

  return users.map(toTrainerUser);
}

export async function getTrainer(id: string): Promise<TrainerUser> {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user || user.role !== Role.TRAINER) {
    throw new AppError('Recurso no encontrado', 404);
  }

  return toTrainerUser(user);
}

export async function createTrainer(data: CreateTrainerInput): Promise<TrainerUser> {
  const name = normalizeName(data.name);
  const email = normalizeEmail(data.email);
  const password = validatePassword(data.password);

  await assertEmailAvailable(email);

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: Role.TRAINER,
      active: data.active ?? true,
    },
  });

  return toTrainerUser(user);
}

export async function updateTrainer(id: string, data: UpdateTrainerInput): Promise<TrainerUser> {
  await getTrainer(id);

  const updateData: { name?: string; email?: string; active?: boolean } = {};

  if (data.name !== undefined) {
    updateData.name = normalizeName(data.name);
  }

  if (data.email !== undefined) {
    updateData.email = normalizeEmail(data.email);
    await assertEmailAvailable(updateData.email, id);
  }

  if (data.active !== undefined) {
    updateData.active = Boolean(data.active);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  return toTrainerUser(user);
}

export async function setTrainerActive(id: string, active: boolean): Promise<TrainerUser> {
  await getTrainer(id);

  const user = await prisma.user.update({
    where: { id },
    data: { active },
  });

  return toTrainerUser(user);
}

export async function resetTrainerPassword(
  id: string,
  data: ResetTrainerPasswordInput,
): Promise<void> {
  await getTrainer(id);

  const password = validatePassword(data.password);
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id },
    data: { passwordHash },
  });
}
