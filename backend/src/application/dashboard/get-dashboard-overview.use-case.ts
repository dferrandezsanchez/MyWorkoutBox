import type { DashboardRepository, DashboardSessionRow } from '../../domain/repositories';
import { TrainingSessionStatus } from '../../domain/shared/enums';
import type { Clock } from '../ports';
import type { DashboardOverview } from './dashboard-dtos';

export const DASHBOARD_PERIOD_DAYS = 28;
export const DASHBOARD_INACTIVE_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_LIMIT = 6;
const REACTIVATE_LIMIT = 5;

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isCompleted(row: DashboardSessionRow): row is DashboardSessionRow & { completedAt: Date } {
  return row.status === TrainingSessionStatus.COMPLETED && row.completedAt !== null;
}

function summarize(rows: DashboardSessionRow[], from: Date, to: Date) {
  const inRange = (date: Date) => date >= from && date < to;
  const completed = rows.filter(isCompleted).filter((row) => inRange(row.completedAt));
  return {
    completed,
    series: rows.filter((row) => inRange(row.startedAt)).reduce((total, row) => total + row.seriesCount, 0),
    clients: new Set(completed.map((row) => row.clientId)).size,
  };
}

/**
 * Center activity for the admin dashboard: the last 28 days compared with the
 * previous 28, live sessions, trainer ranking and clients that stopped training.
 */
export class GetDashboardOverviewUseCase {
  constructor(
    private readonly dashboard: DashboardRepository,
    private readonly clock: Clock,
  ) {}

  async execute(tenantId: string): Promise<DashboardOverview> {
    const now = this.clock.now();
    const end = new Date(startOfUtcDay(now).getTime() + DAY_MS);
    const start = new Date(end.getTime() - DASHBOARD_PERIOD_DAYS * DAY_MS);
    const previousStart = new Date(start.getTime() - DASHBOARD_PERIOD_DAYS * DAY_MS);

    const [rows, clients] = await Promise.all([
      this.dashboard.listSessionsSince(tenantId, previousStart),
      this.dashboard.listActiveClientsWithLastSession(tenantId),
    ]);

    const current = summarize(rows, start, end);
    const previous = summarize(rows, previousStart, start);

    const daily = Array.from({ length: DASHBOARD_PERIOD_DAYS }, (_, index) => {
      const date = dayKey(new Date(start.getTime() + index * DAY_MS));
      return { date, sessions: 0, series: 0 };
    });
    const dailyByKey = new Map(daily.map((day) => [day.date, day]));
    for (const row of current.completed) dailyByKey.get(dayKey(row.completedAt))!.sessions += 1;
    for (const row of rows) {
      const day = dailyByKey.get(dayKey(row.startedAt));
      if (day) day.series += row.seriesCount;
    }

    const trainers = new Map<string, { id: string; name: string; sessions: number; series: number }>();
    for (const row of rows.filter((r) => r.startedAt >= start && r.startedAt < end)) {
      const entry = trainers.get(row.trainerId) ?? { id: row.trainerId, name: row.trainerName, sessions: 0, series: 0 };
      if (isCompleted(row)) entry.sessions += 1;
      entry.series += row.seriesCount;
      trainers.set(row.trainerId, entry);
    }

    const inactiveThreshold = now.getTime() - DASHBOARD_INACTIVE_DAYS * DAY_MS;
    const clientsToReactivate = clients
      .filter((client) => !client.lastSessionAt || client.lastSessionAt.getTime() < inactiveThreshold)
      .sort((a, b) => (a.lastSessionAt?.getTime() ?? 0) - (b.lastSessionAt?.getTime() ?? 0))
      .slice(0, REACTIVATE_LIMIT)
      .map((client) => ({
        id: client.id,
        name: client.name,
        lastSessionAt: client.lastSessionAt?.toISOString() ?? null,
        daysSince: client.lastSessionAt ? Math.floor((now.getTime() - client.lastSessionAt.getTime()) / DAY_MS) : null,
      }));

    return {
      period: { from: start.toISOString(), to: end.toISOString(), days: DASHBOARD_PERIOD_DAYS },
      totals: {
        completedSessions: current.completed.length,
        previousCompletedSessions: previous.completed.length,
        series: current.series,
        previousSeries: previous.series,
        trainedClients: current.clients,
        previousTrainedClients: previous.clients,
      },
      daily,
      activeSessions: rows
        .filter((row) => row.status === TrainingSessionStatus.ACTIVE)
        .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
        .map((row) => ({
          id: row.id,
          clientId: row.clientId,
          clientName: row.clientName,
          trainerName: row.trainerName,
          startedAt: row.startedAt.toISOString(),
          seriesCount: row.seriesCount,
        })),
      trainers: [...trainers.values()].sort((a, b) => b.series - a.series || b.sessions - a.sessions),
      recentSessions: rows
        .filter(isCompleted)
        .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
        .slice(0, RECENT_LIMIT)
        .map((row) => ({
          id: row.id,
          clientId: row.clientId,
          clientName: row.clientName,
          trainerName: row.trainerName,
          completedAt: row.completedAt.toISOString(),
          exerciseCount: row.exerciseCount,
          seriesCount: row.seriesCount,
        })),
      clientsToReactivate,
    };
  }
}
