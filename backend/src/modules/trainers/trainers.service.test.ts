import { describe, expect, it } from 'vitest';
import bcrypt from 'bcrypt';
import prisma from '../../prisma/client';
import { Role } from '../../types/domain';
import {
  createTrainer,
  getTrainer,
  listTrainers,
  resetTrainerPassword,
  updateTrainer,
} from './trainers.service';

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}@gym.com`;
}

describe('trainers service', () => {
  it('creates and lists trainer users without exposing password hashes', async () => {
    const email = uniqueEmail('trainer-create');
    const trainer = await createTrainer({
      name: 'Trainer Create',
      email,
      password: 'Trainer1234!',
    });

    expect(trainer.email).toBe(email);
    expect(trainer.role).toBe(Role.TRAINER);
    expect(trainer.active).toBe(true);
    expect('passwordHash' in trainer).toBe(false);

    const trainers = await listTrainers();
    expect(trainers.some((item) => item.id === trainer.id)).toBe(true);
  });

  it('updates contact info and active state', async () => {
    const trainer = await createTrainer({
      name: 'Trainer Update',
      email: uniqueEmail('trainer-update'),
      password: 'Trainer1234!',
    });

    const updated = await updateTrainer(trainer.id, {
      name: 'Trainer Updated',
      email: uniqueEmail('trainer-updated'),
      active: false,
    });

    expect(updated.name).toBe('Trainer Updated');
    expect(updated.active).toBe(false);
  });

  it('rejects duplicate emails', async () => {
    const email = uniqueEmail('trainer-duplicate');
    await createTrainer({
      name: 'Trainer Duplicate A',
      email,
      password: 'Trainer1234!',
    });

    await expect(
      createTrainer({
        name: 'Trainer Duplicate B',
        email,
        password: 'Trainer1234!',
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('does not expose admin users through trainer lookups', async () => {
    const admin = await prisma.user.create({
      data: {
        name: 'Trainer Module Admin',
        email: uniqueEmail('trainer-module-admin'),
        passwordHash: await bcrypt.hash('Admin1234!', 10),
        role: Role.ADMIN,
        active: true,
      },
    });

    await expect(getTrainer(admin.id)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('resets trainer password', async () => {
    const trainer = await createTrainer({
      name: 'Trainer Password',
      email: uniqueEmail('trainer-password'),
      password: 'Trainer1234!',
    });

    await resetTrainerPassword(trainer.id, { password: 'NewTrainer1234!' });
    const persisted = await prisma.user.findUniqueOrThrow({ where: { id: trainer.id } });

    await expect(bcrypt.compare('NewTrainer1234!', persisted.passwordHash)).resolves.toBe(true);
  });
});
