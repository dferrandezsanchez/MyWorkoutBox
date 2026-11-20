import { Prisma } from '@prisma/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import prisma from './prisma-client';
import { runTransaction } from './transaction';

const deadlock = () => new Prisma.PrismaClientKnownRequestError('Transaction failed due to a write conflict or a deadlock', {
  code: 'P2034',
  clientVersion: 'test',
});

describe('runTransaction', () => {
  afterEach(() => vi.restoreAllMocks());

  it('retries a transaction aborted by a deadlock and returns its result', async () => {
    const spy = vi.spyOn(prisma, '$transaction')
      .mockRejectedValueOnce(deadlock())
      .mockResolvedValueOnce('ok' as never);

    await expect(runTransaction(async () => 'ok')).resolves.toBe('ok');
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('gives up after three deadlocks', async () => {
    const spy = vi.spyOn(prisma, '$transaction').mockRejectedValue(deadlock());

    await expect(runTransaction(async () => 'never')).rejects.toMatchObject({ code: 'P2034' });
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('does not retry other errors, such as business rule rejections', async () => {
    const spy = vi.spyOn(prisma, '$transaction').mockRejectedValue(new Error('El centro necesita al menos un administrador activo'));

    await expect(runTransaction(async () => 'never')).rejects.toThrow('administrador');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('retries lock wait timeouts reported as plain errors', async () => {
    const spy = vi.spyOn(prisma, '$transaction')
      .mockRejectedValueOnce(new Error('Lock wait timeout exceeded; try restarting transaction'))
      .mockResolvedValueOnce(1 as never);

    await expect(runTransaction(async () => 1)).resolves.toBe(1);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
