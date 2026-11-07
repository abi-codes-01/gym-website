import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  TOKEN_STORAGE_KEY,
  UserRole,
  getAuthenticatedRole,
} from './api/client';

const Home = React.lazy(() => import('./pages/Home'));
const Login = React.lazy(() => import('./pages/Login'));
const MemberDashboard = React.lazy(() => import('./pages/MemberDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRole: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRole,
}) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const role = getAuthenticatedRole();

  if (!token || !role) {
    return <Navigate to="/member-login" replace />;
  }

  if (role !== allowedRole) {
    return (
      <Navigate
        to={role === 'ROLE_ADMIN' ? '/admin-dashboard' : '/member-dashboard'}
        replace
      />
    );
  }

  return children;
};

const RoleRedirect: React.FC = () => {
  const role = getAuthenticatedRole();
  if (!role) {
    return <Navigate to="/member-login" replace />;
  }
  return (
    <Navigate
      to={role === 'ROLE_ADMIN' ? '/admin-dashboard' : '/member-dashboard'}
      replace
    />
  );
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
              Loading...
            </div>
          }
        >
          <Routes>
            {/* Zone 1: Public Marketing Website (No login screen required) */}
            <Route path="/" element={<Home />} />

            {/* Authentication Portal */}
            <Route path="/member-login" element={<Login />} />
            <Route path="/login" element={<Navigate to="/member-login" replace />} />

            {/* Zone 2: Member Portal (ROLE_USER) */}
            <Route
              path="/member-dashboard"
              element={
                <ProtectedRoute allowedRole="ROLE_USER">
                  <MemberDashboard />
                </ProtectedRoute>
              }
            />

            {/* Zone 3: Admin Analytics Console (ROLE_ADMIN) */}
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute allowedRole="ROLE_ADMIN">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRole="ROLE_ADMIN">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Automatic role-aware redirect for /dashboard */}
            <Route path="/dashboard" element={<RoleRedirect />} />

            {/* Fallback to Public Marketing Site */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
