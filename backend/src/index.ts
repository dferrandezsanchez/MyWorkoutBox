import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import authRouter from './modules/auth/auth.router';
import clientsRouter from './modules/clients/clients.router';
import exercisesRouter from './modules/exercises/exercises.router';
import performancesRouter from './modules/performances/performances.router';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRouter);
app.use('/clients', clientsRouter);
app.use('/exercises', exercisesRouter);
// Performances routes use nested paths (/clients/:clientId/...) so mount at root
app.use('/', performancesRouter);

// Global error handler — must be registered last
app.use(errorHandler);

// Start server only when this file is executed directly.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
