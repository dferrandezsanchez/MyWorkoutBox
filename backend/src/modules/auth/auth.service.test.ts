import 'dotenv/config';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { beforeAll, describe, expect, it } from 'vitest';
import prisma from '../../prisma/client';
import { Role } from '../../types/domain';
import { login } from './auth.service';

const email = 'auth-test@gym.com';
const password = 'AuthTest1234!';

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
  process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h';

  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: await bcrypt.hash(password, 10),
      active: true,
      role: Role.TRAINER,
    },
    create: {
      name: 'Auth Test',
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: Role.TRAINER,
      active: true,
    },
  });
});

describe('auth.service login', () => {
  it('returns a JWT with the user role for valid credentials', async () => {
    const response = await login(email, password);
    const decoded = jwt.verify(response.token, process.env.JWT_SECRET!) as jwt.JwtPayload;

    expect(response.user.email).toBe(email);
    expect(response.user.role).toBe(Role.TRAINER);
    expect(decoded.role).toBe(Role.TRAINER);
  });

  it('returns the same generic error for wrong password and unknown email', async () => {
    await expect(login(email, 'wrong-password')).rejects.toMatchObject({
      statusCode: 401,
      message: 'Credenciales incorrectas',
    });

    await expect(login('missing-auth-test@gym.com', password)).rejects.toMatchObject({
      statusCode: 401,
      message: 'Credenciales incorrectas',
    });
  });
});
