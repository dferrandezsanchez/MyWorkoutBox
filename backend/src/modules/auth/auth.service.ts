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
