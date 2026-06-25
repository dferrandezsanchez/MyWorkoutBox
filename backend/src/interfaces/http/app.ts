import express from 'express';
import cors from 'cors';
import type { AppContainer } from '../../main/container';
import { errorHandler } from './error-handler';
import { createAuthRouter } from './routes/auth.routes';
import { createClientsRouter } from './routes/clients.routes';
import { createExercisesRouter } from './routes/exercises.routes';
import { createPerformancesRouter } from './routes/performances.routes';
import { createTrainersRouter } from './routes/trainers.routes';

export function createHttpApp(container: AppContainer) {
  const app = express();
  const corsOrigins = process.env.CORS_ORIGIN
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(cors(corsOrigins?.length ? { origin: corsOrigins } : undefined));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static('uploads'));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/auth', createAuthRouter(container));
  app.use('/clients', createClientsRouter(container));
  app.use('/exercises', createExercisesRouter(container));
  app.use('/trainers', createTrainersRouter(container));
  app.use('/', createPerformancesRouter(container));

  app.use(errorHandler);

  return app;
}
