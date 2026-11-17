import type { Client, ClientMeasurement, PerformanceRecord, TrainingSessionDetail } from '../../domain/shared/entities';

export interface ClientExportData {
  client: Client;
  performances: PerformanceRecord[];
  trainingSessions: TrainingSessionDetail[];
  measurements: ClientMeasurement[];
}
