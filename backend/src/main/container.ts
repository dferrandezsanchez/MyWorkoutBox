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
  UpdateClientUseCase,
} from '../application/clients';
import {
  CreateExerciseUseCase,
  GetExerciseUseCase,
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
  PrismaAuditLogRepository,
  PrismaClientRepository,
  PrismaExerciseRepository,
  PrismaMembershipRepository,
  PrismaPerformanceRepository,
  PrismaTenantRepository,
  PrismaUserRepository,
} from '../infrastructure/repositories/prisma-repositories';
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
      create: new CreateClientUseCase(clients, auditLogs),
      update: new UpdateClientUseCase(clients, auditLogs),
      setStatus: new SetClientStatusUseCase(clients, auditLogs),
      exportData: new ExportClientUseCase(clients, performances, auditLogs),
      anonymize: new AnonymizeClientUseCase(clients, auditLogs),
    },
    exercises: {
      list: new ListExercisesUseCase(exercises),
      get: new GetExerciseUseCase(exercises),
      create: new CreateExerciseUseCase(exercises),
      update: new UpdateExerciseUseCase(exercises),
      setStatus: new SetExerciseStatusUseCase(exercises),
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
  };
}

export type AppContainer = ReturnType<typeof createContainer>;
