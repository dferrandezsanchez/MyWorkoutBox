import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@features/auth/components/ProtectedRoute';

const LoginPage = React.lazy(() => import('@app/pages/LoginPage'));
const LandingPage = React.lazy(() => import('@app/pages/LandingPage'));
const DashboardPage = React.lazy(() => import('@app/pages/DashboardPage'));
const TrainerPage = React.lazy(() => import('@app/pages/TrainerPage'));
const AccountPage = React.lazy(() => import('@app/pages/TrainerAccountPage'));
const ClientProfilePage = React.lazy(() => import('@app/pages/ClientProfilePage'));
const ExerciseHistoryPage = React.lazy(() => import('@app/pages/ExerciseHistoryPage'));
const ClientsAdminPage = React.lazy(() => import('@app/pages/ClientsAdminPage'));
const ExercisesAdminPage = React.lazy(() => import('@app/pages/ExercisesAdminPage'));
const ClientEditPage = React.lazy(() => import('@app/pages/ClientEditPage'));
const TrainersAdminPage = React.lazy(() => import('@app/pages/TrainersAdminPage'));
const TenantSettingsPage = React.lazy(() => import('@app/pages/TenantSettingsPage'));
const TrainingSessionPage = React.lazy(() => import('@app/pages/TrainingSessionPage'));
const NewTrainingSessionPage = React.lazy(() => import('@app/pages/NewTrainingSessionPage'));

const LoadingFallback = (
  <div className="flex min-h-screen items-center justify-center">
    <div className="text-text-secondary">Cargando...</div>
  </div>
);

export default function App() {
  return (
    <Suspense fallback={LoadingFallback}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes — any authenticated user */}
        <Route element={<ProtectedRoute />}>
          <Route path="/trainer" element={<TrainerPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/trainer/account" element={<Navigate to="/account?mode=trainer" replace />} />
          <Route path="/trainer/sessions/:id" element={<TrainingSessionPage />} />
          <Route path="/trainer/sessions/new" element={<NewTrainingSessionPage />} />
          <Route path="/clients/:id" element={<ClientProfilePage />} />
          <Route
            path="/clients/:id/exercises/:exerciseId"
            element={<ExerciseHistoryPage />}
          />
        </Route>

        {/* Protected routes — ADMIN only */}
        <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
          <Route path="/admin" element={<DashboardPage />} />
          <Route path="/admin/clients" element={<ClientsAdminPage />} />
          <Route path="/admin/clients/:id" element={<ClientEditPage />} />
          <Route path="/admin/exercises" element={<ExercisesAdminPage />} />
          <Route path="/admin/trainers" element={<TrainersAdminPage />} />
          <Route path="/admin/settings" element={<TenantSettingsPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
