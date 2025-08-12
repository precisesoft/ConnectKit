import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

import PrivateRoute from './PrivateRoute';
import LoadingSpinner from '@components/common/LoadingSpinner';
import MainLayout from '@components/layout/MainLayout';
import { useAuthStore } from '@store/authStore';

// Lazy load pages for better performance
const HomePage = React.lazy(() => import('@pages/HomePage'));
const LoginPage = React.lazy(() => import('@pages/LoginPage'));
const RegisterPage = React.lazy(() => import('@pages/RegisterPage'));
const ContactsPage = React.lazy(() => import('@pages/ContactsPage'));
const ContactDetailPage = React.lazy(() => import('@pages/ContactDetailPage'));
const ProfilePage = React.lazy(() => import('@pages/ProfilePage'));
const NotFoundPage = React.lazy(() => import('@pages/NotFoundPage'));

// Loading fallback component
const PageLoader: React.FC = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="60vh"
  >
    <LoadingSpinner size={60} message="Loading page..." />
  </Box>
);

// Route wrapper for authenticated routes
const AuthenticatedRoutes: React.FC = () => (
  <MainLayout>
    <Routes>
      <Route
        path="/"
        element={
          <Suspense fallback={<PageLoader />}>
            <HomePage />
          </Suspense>
        }
      />
      <Route
        path="/contacts"
        element={
          <Suspense fallback={<PageLoader />}>
            <ContactsPage />
          </Suspense>
        }
      />
      <Route
        path="/contacts/:id"
        element={
          <Suspense fallback={<PageLoader />}>
            <ContactDetailPage />
          </Suspense>
        }
      />
      <Route
        path="/profile"
        element={
          <Suspense fallback={<PageLoader />}>
            <ProfilePage />
          </Suspense>
        }
      />
      {/* Redirect /dashboard to home for backward compatibility */}
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      {/* Catch all other authenticated routes */}
      <Route
        path="*"
        element={
          <Suspense fallback={<PageLoader />}>
            <NotFoundPage />
          </Suspense>
        }
      />
    </Routes>
  </MainLayout>
);

// Public route wrapper for unauthenticated routes
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  // If user is already authenticated, redirect to home
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Main app routes
const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        
        {/* Password reset routes - accessible to both authenticated and unauthenticated users */}
        <Route
          path="/forgot-password"
          element={
            <Suspense fallback={<PageLoader />}>
              <LoginPage />
            </Suspense>
          }
        />
        <Route
          path="/reset-password/:token"
          element={
            <Suspense fallback={<PageLoader />}>
              <LoginPage />
            </Suspense>
          }
        />
        
        {/* Email verification route */}
        <Route
          path="/verify-email"
          element={
            <Suspense fallback={<PageLoader />}>
              <LoginPage />
            </Suspense>
          }
        />
        <Route
          path="/verify-email/:token"
          element={
            <Suspense fallback={<PageLoader />}>
              <LoginPage />
            </Suspense>
          }
        />

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <AuthenticatedRoutes />
            </PrivateRoute>
          }
        />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;