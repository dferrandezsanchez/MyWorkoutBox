import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../../index';
import prisma from '../../infrastructure/prisma/prisma-client';
import { PerformanceUnit, Role } from '../../types/domain';
import { addMembership, createIsolatedTenant } from '../../test/tenant';

const runId = Date.now();
const password = 'SessionP1234!';
let token: string;
let clientId: string;
let templateIds: string[];
let programId: string;

const authed = (req: request.Test) => req.set('Authorization', `Bearer ${token}`);

async function completeWithOneSeries(session: { id: string; exercises: Array<{ id: string }> }): Promise<void> {
  await authed(request(app).post(`/training-sessions/${session.id}/exercises/${session.exercises[0].id}/series`))
    .send({ value: 50, unit: PerformanceUnit.kg, weight: 50, repetitions: 8 }).expect(201);
  await authed(request(app).post(`/training-sessions/${session.id}/complete`)).send({}).expect(200);
}

beforeAll(async () => {
  const tenantId = await createIsolatedTenant(`sesp_${runId}`);
  const email = `session-p-admin-${runId}@gym.com`;
  const user = await prisma.user.create({
    data: { name: 'session-p admin', email, passwordHash: await bcrypt.hash(password, 10), role: Role.ADMIN, active: true },
  });
  await addMembership(user.id, tenantId, Role.ADMIN);
  clientId = (await prisma.client.create({
    data: { tenantId, firstName: 'session-p', lastName: `Cliente ${runId}`, birthDate: new Date('1990-01-01T00:00:00.000Z') },
  })).id;

  const templates = await Promise.all(['A', 'B', 'C'].map(async (letter) => {
    const exercise = await prisma.exercise.create({
      data: {
        tenantId,
        name: `session-p ${letter} ${runId}`,
        category: 'Test',
        defaultUnit: PerformanceUnit.kg,
        measurementFields: JSON.stringify([{ key: 'value', label: 'Peso', unit: PerformanceUnit.kg, required: true, primary: true }]),
        variantGroups: '[]',
      },
    });
    return prisma.routineTemplate.create({
      data: { tenantId, name: `session-p ${letter}`, createdById: user.id, exercises: { create: [{ exerciseId: exercise.id, position: 1 }] } },
    });
  }));
  templateIds = templates.map((item) => item.id);

  const login = await request(app).post('/auth/login').send({ email, password }).expect(200);
  token = login.body.token;

  const program = await authed(request(app).post('/routine-programs')).send({ name: 'session-p programa', templateIds }).expect(201);
  programId = program.body.id;
  await authed(request(app).put(`/clients/${clientId}/routine-plan`)).send({ programId, nextPosition: 2 }).expect(200);
});

describe('sessions started from a plan that follows a program', () => {
  it('starts the next routine of the program, advances on completion and restarts when the program shrinks', async () => {
    const options = await authed(request(app).get(`/clients/${clientId}/session-options`)).expect(200);
    expect(options.body.plan).toMatchObject({ programId });
    expect(options.body.nextRoutine).toMatchObject({ position: 2, template: { id: templateIds[1] } });

    const session = await authed(request(app).post('/training-sessions')).send({ clientId, mode: 'plan' }).expect(201);
    expect(session.body).toMatchObject({ routineTemplateId: templateIds[1], routinePlanPosition: 2 });
    await completeWithOneSeries(session.body);

    const next = await authed(request(app).get(`/clients/${clientId}/session-options`)).expect(200);
    expect(next.body.nextRoutine).toMatchObject({ position: 3, template: { id: templateIds[2] } });

    await authed(request(app).put(`/routine-programs/${programId}`)).send({ name: 'session-p programa', templateIds: [templateIds[0], templateIds[1]] }).expect(200);
    const afterEdit = await authed(request(app).get(`/clients/${clientId}/routine-plan`)).expect(200);
    expect(afterEdit.body.nextPosition).toBe(1);
    expect(afterEdit.body.items).toHaveLength(2);
    const restarted = await authed(request(app).get(`/clients/${clientId}/session-options`)).expect(200);
    expect(restarted.body.nextRoutine).toMatchObject({ position: 1, template: { id: templateIds[0] } });

    // Completing the last routine of the (shorter) program cycles back to the first one.
    await authed(request(app).patch(`/clients/${clientId}/routine-plan/next`)).send({ nextPosition: 2 }).expect(200);
    const last = await authed(request(app).post('/training-sessions')).send({ clientId, mode: 'plan' }).expect(201);
    expect(last.body).toMatchObject({ routineTemplateId: templateIds[1], routinePlanPosition: 2 });
    await completeWithOneSeries(last.body);
    const cycled = await authed(request(app).get(`/clients/${clientId}/routine-plan`)).expect(200);
    expect(cycled.body.nextPosition).toBe(1);
  });
});
