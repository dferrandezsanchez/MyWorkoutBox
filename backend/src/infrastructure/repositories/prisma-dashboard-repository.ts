import type { DashboardClientRow, DashboardRepository, DashboardSessionRow } from '../../domain/repositories';
import { Status, TrainingSessionStatus } from '../../domain/shared/enums';
import prisma from '../prisma/prisma-client';

export class PrismaDashboardRepository implements DashboardRepository {
  async listSessionsSince(tenantId: string, since: Date): Promise<DashboardSessionRow[]> {
    const sessions = await prisma.trainingSession.findMany({
      where: {
        tenantId,
        OR: [{ startedAt: { gte: since } }, { status: TrainingSessionStatus.ACTIVE }],
      },
      select: {
        id: true,
        clientId: true,
        trainerId: true,
        status: true,
        startedAt: true,
        completedAt: true,
        client: { select: { firstName: true, lastName: true } },
        trainer: { select: { name: true } },
        exercises: { select: { _count: { select: { series: true } } } },
      },
    });

    return sessions.map((session) => ({
      id: session.id,
      clientId: session.clientId,
      clientName: `${session.client.firstName} ${session.client.lastName}`.trim(),
      trainerId: session.trainerId,
      trainerName: session.trainer.name,
      status: session.status,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      exerciseCount: session.exercises.length,
      seriesCount: session.exercises.reduce((total, exercise) => total + exercise._count.series, 0),
    }));
  }

  async listActiveClientsWithLastSession(tenantId: string): Promise<DashboardClientRow[]> {
    const [clients, lastSessions] = await Promise.all([
      prisma.client.findMany({
        where: { tenantId, status: Status.ACTIVE },
        select: { id: true, firstName: true, lastName: true },
      }),
      prisma.trainingSession.groupBy({
        by: ['clientId'],
        where: { tenantId },
        _max: { startedAt: true },
      }),
    ]);
    const lastByClient = new Map(lastSessions.map((row) => [row.clientId, row._max.startedAt]));

    return clients.map((client) => ({
      id: client.id,
      name: `${client.firstName} ${client.lastName}`.trim(),
      lastSessionAt: lastByClient.get(client.id) ?? null,
    }));
  }
}
