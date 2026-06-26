import express from 'express';
import cors from 'cors';
import type { AppContainer } from '../../main/container';
import { errorHandler } from './error-handler';
import { createAuthRouter } from './routes/auth.routes';
import { createClientsRouter } from './routes/clients.routes';
import { createExercisesRouter } from './routes/exercises.routes';
import { createPerformancesRouter } from './routes/performances.routes';
import { createTrainersRouter } from './routes/trainers.routes';
import { openApiDocument } from './openapi';

const swaggerHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MyWorkoutBox API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        persistAuthorization: true
      });
    </script>
  </body>
</html>`;

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

  app.get('/openapi.json', (_req, res) => {
    res.status(200).json(openApiDocument);
  });

  app.get('/docs', (_req, res) => {
    res.status(200).type('html').send(swaggerHtml);
  });

  app.use('/auth', createAuthRouter(container));
  app.use('/clients', createClientsRouter(container));
  app.use('/exercises', createExercisesRouter(container));
  app.use('/trainers', createTrainersRouter(container));
  app.use('/', createPerformancesRouter(container));

  app.use(errorHandler);

  return app;
}
