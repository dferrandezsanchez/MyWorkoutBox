import {
  ChangePasswordUseCase,
  GetCurrentTenantUseCase,
  GetMeUseCase,
  LoginUseCase,
  SelectTenantUseCase,
  UpdateCurrentTenantUseCase,
  UpdateMeUseCase,
} from '../application/auth';
import {
  AnonymizeClientUseCase,
  CreateClientUseCase,
  ExportClientUseCase,
  GetClientUseCase,
  ListClientsUseCase,
  SetClientStatusUseCase,
  UpdateClientGoalUseCase,
  UpdateClientUseCase,
} from '../application/clients';
import { GetDashboardOverviewUseCase } from '../application/dashboard';
import {
  CreateClientMeasurementUseCase,
  DeleteClientMeasurementUseCase,
  ListClientMeasurementsUseCase,
  UpdateClientMeasurementUseCase,
} from '../application/measurements';
import {
  CreateExerciseUseCase,
  GetExerciseUseCase,
  ImportExerciseLibraryUseCase,
  ListExerciseLibraryUseCase,
  ListExercisesUseCase,
  SetExerciseStatusUseCase,
  UpdateExerciseUseCase,
} from '../application/exercises';
import {
  CreatePerformanceUseCase,
  GetCurrentMarksUseCase,
  GetPerformanceHistoryUseCase,
} from '../application/performances';
import {
  CreateTrainerUseCase,
  GetTrainerUseCase,
  ListTrainersUseCase,
  ResetTrainerPasswordUseCase,
  SetTrainerActiveUseCase,
  UpdateTrainerUseCase,
} from '../application/trainers';
import {
  AddSessionExerciseUseCase,
  CompleteTrainingSessionUseCase,
  CreateSessionSeriesUseCase,
  DeleteSessionSeriesUseCase,
  DiscardTrainingSessionUseCase,
  GetActiveTrainingSessionUseCase,
  GetTrainingSessionUseCase,
  ListClientTrainingSessionsUseCase,
  ListTrainerTrainingSessionsUseCase,
  RemoveSessionExerciseUseCase,
  StartTrainingSessionUseCase,
  UpdateSessionSeriesUseCase,
} from '../application/training-sessions';
import {
  PrismaAuditLogRepository,
  PrismaClientRepository,
  PrismaExerciseRepository,
  PrismaMembershipRepository,
  PrismaPerformanceRepository,
  PrismaTenantRepository,
  PrismaTrainingSessionRepository,
  PrismaUserRepository,
} from '../infrastructure/repositories/prisma-repositories';
import {
  PrismaClientRoutinePlanRepository,
  PrismaRoutineTemplateRepository,
} from '../infrastructure/repositories/prisma-routine-repositories';
import { PrismaDashboardRepository } from '../infrastructure/repositories/prisma-dashboard-repository';
import { PrismaMeasurementRepository } from '../infrastructure/repositories/prisma-measurement-repository';
import { BcryptPasswordHasher } from '../infrastructure/security/bcrypt-password-hasher';
import { JwtTokenService } from '../infrastructure/security/jwt-token-service';
import { SystemClock } from '../infrastructure/time/system-clock';

export function createContainer() {
  const users = new PrismaUserRepository();
  const memberships = new PrismaMembershipRepository();
  const tenants = new PrismaTenantRepository();
  const clients = new PrismaClientRepository();
  const exercises = new PrismaExerciseRepository();
  const performances = new PrismaPerformanceRepository();
  const auditLogs = new PrismaAuditLogRepository();
  const trainingSessions = new PrismaTrainingSessionRepository();
  const dashboard = new PrismaDashboardRepository();
  const routineTemplates = new PrismaRoutineTemplateRepository();
  const routinePlans = new PrismaClientRoutinePlanRepository();
  const measurements = new PrismaMeasurementRepository();

  const passwordHasher = new BcryptPasswordHasher();
  const tokenService = new JwtTokenService(process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN ?? '8h');
  const clock = new SystemClock();

  return {
    tokenService,
    auth: {
      login: new LoginUseCase(users, memberships, passwordHasher, tokenService),
      selectTenant: new SelectTenantUseCase(users, memberships, tokenService),
      getMe: new GetMeUseCase(users, memberships),
      updateMe: new UpdateMeUseCase(users, memberships),
      changePassword: new ChangePasswordUseCase(users, passwordHasher),
      getCurrentTenant: new GetCurrentTenantUseCase(tenants),
      updateCurrentTenant: new UpdateCurrentTenantUseCase(tenants),
    },
    clients: {
      list: new ListClientsUseCase(clients),
      get: new GetClientUseCase(clients),
      create: new CreateClientUseCase(clients, auditLogs, measurements, tenants, clock),
      update: new UpdateClientUseCase(clients, auditLogs),
      setStatus: new SetClientStatusUseCase(clients, auditLogs),
      exportData: new ExportClientUseCase(clients, performances, trainingSessions, auditLogs, measurements),
      anonymize: new AnonymizeClientUseCase(clients, auditLogs, measurements),
      updateGoal: new UpdateClientGoalUseCase(clients, auditLogs),
    },
    exercises: {
      list: new ListExercisesUseCase(exercises),
      get: new GetExerciseUseCase(exercises),
      create: new CreateExerciseUseCase(exercises),
      update: new UpdateExerciseUseCase(exercises),
      setStatus: new SetExerciseStatusUseCase(exercises),
      listLibrary: new ListExerciseLibraryUseCase(exercises),
      importLibrary: new ImportExerciseLibraryUseCase(exercises),
    },
    performances: {
      create: new CreatePerformanceUseCase(clients, exercises, performances, auditLogs, clock),
      getCurrentMarks: new GetCurrentMarksUseCase(clients, exercises, performances),
      getHistory: new GetPerformanceHistoryUseCase(clients, exercises, performances),
    },
    trainers: {
      list: new ListTrainersUseCase(memberships),
      get: new GetTrainerUseCase(memberships),
      create: new CreateTrainerUseCase(users, memberships, passwordHasher),
      update: new UpdateTrainerUseCase(users, memberships),
      setActive: new SetTrainerActiveUseCase(memberships),
      resetPassword: new ResetTrainerPasswordUseCase(users, memberships, passwordHasher),
    },
    measurements: {
      list: new ListClientMeasurementsUseCase(measurements, clients, tenants),
      create: new CreateClientMeasurementUseCase(measurements, clients, tenants, auditLogs, clock),
      update: new UpdateClientMeasurementUseCase(measurements, clients, tenants, auditLogs, clock),
      delete: new DeleteClientMeasurementUseCase(measurements, clients, tenants, auditLogs),
    },
    dashboard: {
      overview: new GetDashboardOverviewUseCase(dashboard, clock),
    },
    trainingSessions: {
      start: new StartTrainingSessionUseCase(trainingSessions, clients, auditLogs, clock),
      getActive: new GetActiveTrainingSessionUseCase(trainingSessions),
      get: new GetTrainingSessionUseCase(trainingSessions),
      listByClient: new ListClientTrainingSessionsUseCase(trainingSessions, clients),
      listByTrainer: new ListTrainerTrainingSessionsUseCase(trainingSessions),
      addExercise: new AddSessionExerciseUseCase(trainingSessions, exercises),
      removeExercise: new RemoveSessionExerciseUseCase(trainingSessions),
      createSeries: new CreateSessionSeriesUseCase(trainingSessions, performances, auditLogs, clock),
      updateSeries: new UpdateSessionSeriesUseCase(trainingSessions, performances, auditLogs, clock),
      deleteSeries: new DeleteSessionSeriesUseCase(trainingSessions, performances, auditLogs),
      complete: new CompleteTrainingSessionUseCase(trainingSessions, auditLogs, clock),
      discard: new DiscardTrainingSessionUseCase(trainingSessions, auditLogs),
    },
  };
}

export type AppContainer = ReturnType<typeof createContainer>;
