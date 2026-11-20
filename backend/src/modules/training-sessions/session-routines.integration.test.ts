import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../../index';
import prisma from '../../infrastructure/prisma/prisma-client';
import { PerformanceUnit, Role, Status } from '../../types/domain';
import { addMembership, createIsolatedTenant } from '../../test/tenant';

const runId = Date.now();
const key = `session_c_${runId}`;
const password = 'SessionC1234!';
let token: string;
let clientId: string;
let exerciseIds: string[];
let templateIds: string[];

const authed = (req: request.Test) => req.set('Authorization', `Bearer ${token}`);

beforeAll(async () => {
  const tenantId = await createIsolatedTenant(key);
  const email = `session-c-trainer-${runId}@gym.com`;
  const user = await prisma.user.create({
    data: { name: 'session-c trainer', email, passwordHash: await bcrypt.hash(password, 10), role: Role.TRAINER, active: true },
  });
  await addMembership(user.id, tenantId, Role.TRAINER);
  const client = await prisma.client.create({
    data: { tenantId, firstName: 'session-c', lastName: `Cliente ${runId}`, birthDate: new Date('1990-01-01T00:00:00.000Z') },
  });
  clientId = client.id;

  const exercises = await Promise.all(['Press', 'Sentadilla', 'Remo', 'Retirado'].map((name) => prisma.exercise.create({
    data: {
      tenantId,
      name: `session-c ${name} ${runId}`,
      category: 'Test',
      defaultUnit: PerformanceUnit.kg,
      measurementFields: JSON.stringify([{ key: 'value', label: 'Peso', unit: PerformanceUnit.kg, required: true, primary: true }]),
      variantGroups: '[]',
      status: name === 'Retirado' ? Status.INACTIVE : Status.ACTIVE,
    },
  })));
  exerciseIds = exercises.map((item) => item.id);
  const [press, squat, row, retired] = exerciseIds;

  const templates = await Promise.all([
    { name: 'session-c A', exercises: [press, retired, squat] },
    { name: 'session-c B', exercises: [row] },
  ].map((item) => prisma.routineTemplate.create({
    data: {
      tenantId,
      name: item.name,
      createdById: user.id,
      exercises: { create: item.exercises.map((exerciseId, index) => ({ exerciseId, position: index + 1, targetSets: 3, targetReps: '10' })) },
    },
  })));
  templateIds = templates.map((item) => item.id);
  await prisma.clientRoutinePlan.create({
    data: {
      tenantId,
      clientId,
      name: 'session-c plan',
      createdById: user.id,
      items: { create: templateIds.map((templateId, index) => ({ templateId, position: index + 1 })) },
    },
  });

  const login = await request(app).post('/auth/login').send({ email, password }).expect(200);
  token = login.body.token;
});

describe('sessions started from routines', () => {
  it('suggests routine A, starts from it, prefills from the previous session and advances to B', async () => {
    const options = await authed(request(app).get(`/clients/${clientId}/session-options`)).expect(200);
    expect(options.body.nextRoutine).toMatchObject({ position: 1, template: { id: templateIds[0] } });
    expect(options.body.templates.map((item: { name: string }) => item.name)).toEqual(['session-c A', 'session-c B']);

    const first = await authed(request(app).post('/training-sessions')).send({ clientId, mode: 'plan' }).expect(201);
    expect(first.body).toMatchObject({ routineTemplateId: templateIds[0], routinePlanPosition: 1 });
    expect(first.body.exercises.map((item: { exerciseId: string }) => item.exerciseId)).toEqual([exerciseIds[0], exerciseIds[1]]);
    expect(first.body.exercises[0].previousSeries).toEqual([]);

    const pressItem = first.body.exercises[0].id;
    await authed(request(app).post(`/training-sessions/${first.body.id}/exercises/${pressItem}/series`))
      .send({ value: 60, unit: PerformanceUnit.kg, weight: 60, repetitions: 10 }).expect(201);
    await authed(request(app).post(`/training-sessions/${first.body.id}/complete`)).send({}).expect(200);

    const next = await authed(request(app).get(`/clients/${clientId}/session-options`)).expect(200);
    expect(next.body.nextRoutine).toMatchObject({ position: 2, template: { id: templateIds[1] } });

    // Starting A again by template does not touch the plan and shows what was done last time.
    const second = await authed(request(app).post('/training-sessions')).send({ clientId, mode: 'template', templateId: templateIds[0] }).expect(201);
    expect(second.body.routinePlanId).toBeNull();
    expect(second.body.exercises[0].previousSeries).toEqual([expect.objectContaining({ value: '60', repetitions: 10, seriesNumber: 1 })]);
    expect(second.body.exercises[0].series).toEqual([]);
    const detail = await authed(request(app).get(`/training-sessions/${second.body.id}`)).expect(200);
    expect(detail.body.exercises[0].previousSeries).toHaveLength(1);
    await authed(request(app).delete(`/training-sessions/${second.body.id}`)).expect(204);

    const after = await authed(request(app).get(`/clients/${clientId}/session-options`)).expect(200);
    expect(after.body.nextRoutine.position).toBe(2);
  });

  it('keeps free sessions working and validates modes', async () => {
    const free = await authed(request(app).post('/training-sessions')).send({ clientId }).expect(201);
    expect(free.body.exercises).toEqual([]);
    expect(free.body.routineTemplateId).toBeNull();
    await authed(request(app).delete(`/training-sessions/${free.body.id}`)).expect(204);

    await authed(request(app).post('/training-sessions')).send({ clientId, mode: 'template' }).expect(400);
    await authed(request(app).post('/training-sessions')).send({ clientId, mode: 'template', templateId: 'missing' }).expect(404);
    await authed(request(app).get('/clients/missing-client/session-options')).expect(404);
  });
});
