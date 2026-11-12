export interface DashboardOverview {
  period: { from: string; to: string; days: number };
  totals: {
    completedSessions: number;
    previousCompletedSessions: number;
    series: number;
    previousSeries: number;
    trainedClients: number;
    previousTrainedClients: number;
  };
  daily: Array<{ date: string; sessions: number; series: number }>;
  activeSessions: Array<{
    id: string;
    clientId: string;
    clientName: string;
    trainerName: string;
    startedAt: string;
    seriesCount: number;
  }>;
  trainers: Array<{ id: string; name: string; sessions: number; series: number }>;
  recentSessions: Array<{
    id: string;
    clientId: string;
    clientName: string;
    trainerName: string;
    completedAt: string;
    exerciseCount: number;
    seriesCount: number;
  }>;
  clientsToReactivate: Array<{ id: string; name: string; lastSessionAt: string | null; daysSince: number | null }>;
}
