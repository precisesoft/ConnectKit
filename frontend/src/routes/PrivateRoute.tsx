import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';

interface PrivateRouteProps {
  children: React.ReactNode;
  requireEmailVerification?: boolean;
}

/**
 * PrivateRoute component that protects routes requiring authentication
 * Redirects to login page if user is not authenticated
 * Optionally requires email verification
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  children, 
  requireEmailVerification = false 
}) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // User is not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // User is authenticated but email verification is required and not verified
  if (requireEmailVerification && !user.emailVerified) {
    return (
      <Navigate 
        to="/verify-email" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // User is authenticated and meets all requirements
  return <>{children}</>;
};

export default PrivateRoute;