import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { getAuthUser } from './store/auth';

const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const TrainerPage = React.lazy(() => import('./pages/TrainerPage'));
const TrainerAccountPage = React.lazy(() => import('./pages/TrainerAccountPage'));
const ClientProfilePage = React.lazy(() => import('./pages/ClientProfilePage'));
const ExerciseHistoryPage = React.lazy(() => import('./pages/ExerciseHistoryPage'));
const ClientsAdminPage = React.lazy(() => import('./pages/admin/ClientsAdminPage'));
const ExercisesAdminPage = React.lazy(() => import('./pages/admin/ExercisesAdminPage'));
const ClientEditPage = React.lazy(() => import('./pages/admin/ClientEditPage'));
const TrainersAdminPage = React.lazy(() => import('./pages/admin/TrainersAdminPage'));

const LoadingFallback = (
  <div className="flex min-h-screen items-center justify-center">
    <div className="text-text-secondary">Cargando...</div>
  </div>
);

function RoleRedirect() {
  const user = getAuthUser();
  return <Navigate to={user?.role === 'ADMIN' ? '/admin' : '/trainer'} replace />;
}

export default function App() {
  return (
    <Suspense fallback={LoadingFallback}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes — any authenticated user */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<RoleRedirect />} />
          <Route path="/trainer" element={<TrainerPage />} />
          <Route path="/trainer/account" element={<TrainerAccountPage />} />
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
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
