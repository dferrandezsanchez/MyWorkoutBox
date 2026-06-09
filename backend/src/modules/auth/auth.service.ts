import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Role } from '../../types/domain';
import prisma from '../../prisma/client';
import { AppError } from '../../middleware/errorHandler';

export interface LoginResponse {
  token: string;
  user: PublicUser;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface UpdateMeInput {
  name?: string;
  email?: string;
}

export interface ChangePasswordInput {
  currentPassword?: string;
  newPassword?: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const user = await prisma.user.findUnique({ where: { email } });

  // Use a constant-time check even when user is not found to avoid timing attacks
  const passwordMatch = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !passwordMatch) {
    throw new AppError('Credenciales incorrectas', 401);
  }

  if (!user.active) {
    throw new AppError('Credenciales incorrectas', 401);
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError('Error interno del servidor', 500);
  }

  const expiresIn = process.env.JWT_EXPIRES_IN ?? '8h';

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    secret,
    { expiresIn } as jwt.SignOptions
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
    },
  };
}

export async function getMe(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError('Recurso no encontrado', 404);
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
  };
}

export async function updateMe(userId: string, data: UpdateMeInput): Promise<PublicUser> {
  const name = data.name?.trim();
  const email = data.email?.trim().toLowerCase();

  if (!name) {
    throw new AppError('El nombre es obligatorio', 400);
  }

  if (!email) {
    throw new AppError('El email es obligatorio', 400);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== userId) {
    throw new AppError('Ya existe un usuario con ese email', 409);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { name, email },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
  };
}

export async function changePassword(userId: string, data: ChangePasswordInput): Promise<void> {
  const currentPassword = data.currentPassword ?? '';
  const newPassword = data.newPassword ?? '';

  if (!currentPassword) {
    throw new AppError('La contraseña actual es obligatoria', 400);
  }

  if (newPassword.length < 8) {
    throw new AppError('La nueva contraseña debe tener al menos 8 caracteres', 400);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('Recurso no encontrado', 404);
  }

  const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!passwordMatch) {
    throw new AppError('La contraseña actual no es correcta', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}
