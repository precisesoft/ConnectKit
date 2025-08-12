import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

import { useAuthStore } from '@store/authStore';
import { useAuth } from '@hooks/useAuth';
import LoadingSpinner from '@components/common/LoadingSpinner';
import AppRoutes from '@routes/index';

const App: React.FC = () => {
  const { initializeAuth, isInitializing } = useAuth();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Initialize authentication state from localStorage/tokens
    initializeAuth();
  }, [initializeAuth]);

  // Show loading spinner during initial auth check
  if (isInitializing) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <LoadingSpinner size={60} message="Loading application..." />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppRoutes />
    </Box>
  );
};

export default App;