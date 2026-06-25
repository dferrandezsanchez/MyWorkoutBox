import 'dotenv/config';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { beforeAll, describe, expect, it } from 'vitest';
import prisma from '../../infrastructure/prisma/prisma-client';
import { Role } from '../../types/domain';
import { createContainer } from '../../main/container';
import { ensureTenantMembership, TEST_ORGANIZATION_ID, TEST_TENANT_ID } from '../../test/tenant';

const email = 'auth-test@gym.com';
const password = 'AuthTest1234!';

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
  process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h';

  const user = await prisma.user.upsert({
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
  await ensureTenantMembership(user.id, Role.TRAINER);
});

describe('auth.service login', () => {
  it('returns a JWT with the user role for valid credentials', async () => {
    const response = await createContainer().auth.login.execute(email, password);
    if ('tenantSelectionRequired' in response) {
      throw new Error('Expected direct login for single tenant user');
    }
    const decoded = jwt.verify(response.token, process.env.JWT_SECRET!) as jwt.JwtPayload;

    expect(response.user.email).toBe(email);
    expect(response.user.role).toBe(Role.TRAINER);
    expect(response.user.tenantId).toBe(TEST_TENANT_ID);
    expect(response.user.organizationId).toBe(TEST_ORGANIZATION_ID);
    expect(decoded.role).toBe(Role.TRAINER);
    expect(decoded.tenantId).toBe(TEST_TENANT_ID);
  });

  it('returns the same generic error for wrong password and unknown email', async () => {
    await expect(createContainer().auth.login.execute(email, 'wrong-password')).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
      message: 'Credenciales incorrectas',
    });

    await expect(createContainer().auth.login.execute('missing-auth-test@gym.com', password)).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
      message: 'Credenciales incorrectas',
    });
  });
});
