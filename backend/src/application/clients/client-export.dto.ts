import type { Client, PerformanceRecord, TrainingSessionDetail } from '../../domain/shared/entities';

export interface ClientExportData {
  client: Client;
  performances: PerformanceRecord[];
  trainingSessions: TrainingSessionDetail[];
}
