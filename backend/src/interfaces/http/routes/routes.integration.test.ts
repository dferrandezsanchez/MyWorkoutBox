import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createHttpApp } from '../app';
import { Role, Status } from '../../../domain/shared/enums';
import type { AppContainer } from '../../../main/container';

const tenantPayload = {
  sub: 'user-1',
  tenantId: 'tenant-1',
  organizationId: 'org-1',
  role: Role.ADMIN,
};

function useCase(result: unknown = { id: 'result-1' }) {
  return { execute: vi.fn(async () => result) };
}

function createFakeContainer(): AppContainer {
  return {
    tokenService: {
      signTenantToken: vi.fn(() => 'token'),
      signSelectionToken: vi.fn(() => 'selection-token'),
      verify: vi.fn(() => tenantPayload),
    },
    auth: {
      login: useCase({ token: 'token' }),
      selectTenant: useCase({ token: 'token' }),
      getMe: useCase({ id: 'user-1' }),
      updateMe: useCase({ id: 'user-1', name: 'Updated' }),
      changePassword: useCase(undefined),
      getCurrentTenant: useCase({ id: 'tenant-1' }),
      updateCurrentTenant: useCase({ id: 'tenant-1', name: 'Updated' }),
    },
    clients: {
      list: useCase([]),
      get: useCase({ id: 'client-1' }),
      create: useCase({ id: 'client-1' }),
      update: useCase({ id: 'client-1', firstName: 'Updated' }),
      setStatus: useCase({ id: 'client-1', status: Status.INACTIVE }),
      exportData: useCase({ client: { id: 'client-1' } }),
      anonymize: useCase({ id: 'client-1', anonymizedAt: new Date().toISOString() }),
    },
    exercises: {
      list: useCase([]),
      get: useCase({ id: 'exercise-1' }),
      create: useCase({ id: 'exercise-1' }),
      update: useCase({ id: 'exercise-1', name: 'Updated' }),
      setStatus: useCase({ id: 'exercise-1', status: Status.INACTIVE }),
    },
    performances: {
      create: useCase({ id: 'performance-1' }),
      getCurrentMarks: useCase([]),
      getHistory: useCase([]),
    },
    trainers: {
      list: useCase([]),
      get: useCase({ id: 'trainer-1' }),
      create: useCase({ id: 'trainer-1' }),
      update: useCase({ id: 'trainer-1', name: 'Updated' }),
      setActive: useCase({ id: 'trainer-1', active: false }),
      resetPassword: useCase(undefined),
    },
  } as unknown as AppContainer;
}

const auth = { Authorization: 'Bearer valid-token' };

describe('HTTP routes', () => {
  it('adapts auth routes to use cases', async () => {
    const app = createHttpApp(createFakeContainer());

    await request(app).post('/auth/login').send({ email: 'admin@gym.com', password: 'secret' }).expect(200);
    await request(app).post('/auth/select-tenant').send({ selectionToken: 'token', tenantId: 'tenant-1' }).expect(200);
    await request(app).post('/auth/logout').set(auth).expect(200, { message: 'Sesión cerrada correctamente' });
    await request(app).get('/auth/me').set(auth).expect(200);
    await request(app).put('/auth/me').set(auth).send({ name: 'Updated' }).expect(200);
    await request(app).get('/auth/tenant').set(auth).expect(200);
    await request(app).put('/auth/tenant').set(auth).send({ name: 'Updated' }).expect(200);
    await request(app).put('/auth/me/password').set(auth).send({ currentPassword: 'a', newPassword: 'b' }).expect(200, {
      message: 'Contraseña actualizada correctamente',
    });
  });

  it('adapts client routes to use cases', async () => {
    const container = createFakeContainer();
    const app = createHttpApp(container);

    await request(app).get('/clients?q=demo&includeInactive=true').set(auth).expect(200);
    await request(app).post('/clients').set(auth).send({ firstName: 'Demo' }).expect(201);
    await request(app).get('/clients/client-1').set(auth).expect(200);
    await request(app).put('/clients/client-1').set(auth).send({ firstName: 'Updated' }).expect(200);
    await request(app).patch('/clients/client-1/status').set(auth).send({ status: Status.INACTIVE }).expect(200);
    await request(app).get('/clients/client-1/export').set(auth).expect(200);
    await request(app).post('/clients/client-1/anonymize').set(auth).expect(200);
    await request(app).post('/clients/client-1/photo').set(auth).expect(404);
    await request(app).delete('/clients/client-1/photo').set(auth).expect(404);

    expect(container.clients.list.execute).toHaveBeenCalledWith('tenant-1', 'demo', true);
  });

  it('adapts exercise, trainer and performance routes to use cases', async () => {
    const app = createHttpApp(createFakeContainer());

    await request(app).get('/exercises?includeInactive=true').set(auth).expect(200);
    await request(app).post('/exercises').set(auth).send({ name: 'Exercise' }).expect(201);
    await request(app).get('/exercises/exercise-1').set(auth).expect(200);
    await request(app).put('/exercises/exercise-1').set(auth).send({ name: 'Updated' }).expect(200);
    await request(app).patch('/exercises/exercise-1/status').set(auth).send({ status: Status.INACTIVE }).expect(200);

    await request(app).get('/trainers?includeInactive=false').set(auth).expect(200);
    await request(app).post('/trainers').set(auth).send({ name: 'Trainer' }).expect(201);
    await request(app).get('/trainers/trainer-1').set(auth).expect(200);
    await request(app).put('/trainers/trainer-1').set(auth).send({ name: 'Updated' }).expect(200);
    await request(app).patch('/trainers/trainer-1/status').set(auth).send({ active: false }).expect(200);
    await request(app).put('/trainers/trainer-1/password').set(auth).send({ password: 'Trainer1234!' }).expect(200, {
      message: 'Contraseña actualizada correctamente',
    });

    await request(app).get('/clients/client-1/current-performances').set(auth).expect(200);
    await request(app).get('/clients/client-1/exercises/exercise-1/performances').set(auth).expect(200);
    await request(app).post('/clients/client-1/exercises/exercise-1/performances').set(auth).send({ value: 100 }).expect(201);
  });
});
