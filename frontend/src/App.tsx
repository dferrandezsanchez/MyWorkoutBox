import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const ClientProfilePage = React.lazy(() => import('./pages/ClientProfilePage'));
const ExerciseHistoryPage = React.lazy(() => import('./pages/ExerciseHistoryPage'));
const ClientsAdminPage = React.lazy(() => import('./pages/admin/ClientsAdminPage'));
const ExercisesAdminPage = React.lazy(() => import('./pages/admin/ExercisesAdminPage'));
const ClientEditPage = React.lazy(() => import('./pages/admin/ClientEditPage'));

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
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes — any authenticated user */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/clients/:id" element={<ClientProfilePage />} />
          <Route
            path="/clients/:id/exercises/:exerciseId"
            element={<ExerciseHistoryPage />}
          />
        </Route>

        {/* Protected routes — ADMIN only */}
        <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
          <Route path="/admin/clients" element={<ClientsAdminPage />} />
          <Route path="/admin/clients/:id" element={<ClientEditPage />} />
          <Route path="/admin/exercises" element={<ExercisesAdminPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
