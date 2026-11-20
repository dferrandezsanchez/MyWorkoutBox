import { Prisma } from '@prisma/client';
import prisma from './prisma-client';

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 25;

/** MySQL deadlocks / lock wait timeouts surface as Prisma P2034 ("write conflict or a deadlock"). */
function isRetryable(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) return error.code === 'P2034';
  const message = error instanceof Error ? error.message : '';
  return /deadlock|lock wait timeout/i.test(message);
}

/**
 * Interactive transaction that is retried when MySQL aborts it because of a deadlock. The whole
 * callback runs again, so it must not have side effects outside the transaction client.
 */
export async function runTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await prisma.$transaction(fn);
    } catch (error) {
      if (attempt >= MAX_ATTEMPTS || !isRetryable(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, BASE_DELAY_MS * attempt));
    }
  }
}
