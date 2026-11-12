import { describe, expect, it, vi } from 'vitest';
import type { DashboardRepository, DashboardSessionRow } from '../../domain/repositories';
import { GetDashboardOverviewUseCase } from './get-dashboard-overview.use-case';

const NOW = new Date('2026-11-11T10:00:00.000Z');
const daysAgo = (days: number, hour = 9) => new Date(Date.UTC(2026, 10, 11 - days, hour));

function session(overrides: Partial<DashboardSessionRow>): DashboardSessionRow {
  return {
    id: 's',
    clientId: 'c1',
    clientName: 'Marta Ruiz',
    trainerId: 't1',
    trainerName: 'Roberto',
    status: 'COMPLETED',
    startedAt: daysAgo(1),
    completedAt: daysAgo(1, 10),
    exerciseCount: 2,
    seriesCount: 6,
    ...overrides,
  };
}

function createUseCase(rows: DashboardSessionRow[], clients = [] as Awaited<ReturnType<DashboardRepository['listActiveClientsWithLastSession']>>) {
  const repository: DashboardRepository = {
    listSessionsSince: vi.fn(async () => rows),
    listActiveClientsWithLastSession: vi.fn(async () => clients),
  };
  return { repository, useCase: new GetDashboardOverviewUseCase(repository, { now: () => NOW }) };
}

describe('GetDashboardOverviewUseCase', () => {
  it('compares the last 28 days with the previous 28', async () => {
    const { repository, useCase } = createUseCase([
      session({ id: 'a', clientId: 'c1', seriesCount: 6 }),
      session({ id: 'b', clientId: 'c2', startedAt: daysAgo(3), completedAt: daysAgo(3, 10), seriesCount: 4 }),
      session({ id: 'c', clientId: 'c1', startedAt: daysAgo(40), completedAt: daysAgo(40, 10), seriesCount: 9 }),
    ]);

    const overview = await useCase.execute('tenant-1');

    expect(repository.listSessionsSince).toHaveBeenCalledWith('tenant-1', new Date('2026-09-17T00:00:00.000Z'));
    expect(overview.period).toEqual({ from: '2026-10-15T00:00:00.000Z', to: '2026-11-12T00:00:00.000Z', days: 28 });
    expect(overview.totals).toEqual({
      completedSessions: 2,
      previousCompletedSessions: 1,
      series: 10,
      previousSeries: 9,
      trainedClients: 2,
      previousTrainedClients: 1,
    });
    expect(overview.daily).toHaveLength(28);
    expect(overview.daily.at(-1)).toEqual({ date: '2026-11-11', sessions: 0, series: 0 });
    expect(overview.daily.find((day) => day.date === '2026-11-10')).toEqual({ date: '2026-11-10', sessions: 1, series: 6 });
  });

  it('lists live sessions, ranks trainers and orders recent sessions', async () => {
    const { useCase } = createUseCase([
      session({ id: 'live', status: 'ACTIVE', completedAt: null, startedAt: daysAgo(0, 9), seriesCount: 2 }),
      session({ id: 'old', trainerId: 't2', trainerName: 'Lucía', startedAt: daysAgo(5), completedAt: daysAgo(5, 10), seriesCount: 12 }),
      session({ id: 'new', startedAt: daysAgo(1), completedAt: daysAgo(1, 10), seriesCount: 3 }),
    ]);

    const overview = await useCase.execute('tenant-1');

    expect(overview.activeSessions).toEqual([
      expect.objectContaining({ id: 'live', clientName: 'Marta Ruiz', trainerName: 'Roberto', seriesCount: 2 }),
    ]);
    expect(overview.trainers).toEqual([
      { id: 't2', name: 'Lucía', sessions: 1, series: 12 },
      { id: 't1', name: 'Roberto', sessions: 1, series: 5 },
    ]);
    expect(overview.recentSessions.map((item) => item.id)).toEqual(['new', 'old']);
  });

  it('flags active clients without a session in the last 14 days', async () => {
    const { useCase } = createUseCase([], [
      { id: 'recent', name: 'Alex Molina', lastSessionAt: daysAgo(3) },
      { id: 'stale', name: 'Marta Ruiz', lastSessionAt: daysAgo(20) },
      { id: 'never', name: 'Javier Santos', lastSessionAt: null },
    ]);

    const overview = await useCase.execute('tenant-1');

    expect(overview.clientsToReactivate).toEqual([
      { id: 'never', name: 'Javier Santos', lastSessionAt: null, daysSince: null },
      { id: 'stale', name: 'Marta Ruiz', lastSessionAt: daysAgo(20).toISOString(), daysSince: 20 },
    ]);
  });
});
