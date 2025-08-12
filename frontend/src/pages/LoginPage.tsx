import React from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';

import LoginForm from '@components/auth/LoginForm';
import ForgotPasswordForm from '@components/auth/ForgotPasswordForm';

const LoginPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchParams] = useSearchParams();
  
  // Determine which form to show based on URL
  const isForgotPassword = searchParams.has('forgot');
  const message = searchParams.get('message');
  const error = searchParams.get('error');

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            px: isMobile ? 2 : 4,
          }}
        >
          {/* Logo/Brand Section */}
          <Paper
            elevation={0}
            sx={{
              backgroundColor: 'transparent',
              textAlign: 'center',
              mb: 4,
            }}
          >
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 700,
                color: 'white',
                mb: 1,
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              ConnectKit
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: 300,
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              }}
            >
              {isForgotPassword 
                ? 'Reset your password'
                : 'Your personal contact manager'
              }
            </Typography>
          </Paper>

          {/* Success/Error Messages */}
          {message && (
            <Alert 
              severity="success" 
              sx={{ mb: 3, width: '100%', maxWidth: 400 }}
            >
              {message}
            </Alert>
          )}
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3, width: '100%', maxWidth: 400 }}
            >
              {error}
            </Alert>
          )}

          {/* Auth Form */}
          {isForgotPassword ? (
            <ForgotPasswordForm />
          ) : (
            <LoginForm />
          )}

          {/* Footer Links */}
          <Box
            sx={{
              mt: 4,
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.8)',
            }}
          >
            <Typography variant="body2" sx={{ mb: 1 }}>
              © 2024 ConnectKit. All rights reserved.
            </Typography>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              <Typography
                variant="caption"
                component="a"
                href="#"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  textDecoration: 'none',
                  '&:hover': {
                    color: 'white',
                    textDecoration: 'underline',
                  },
                }}
              >
                Privacy Policy
              </Typography>
              <Typography
                variant="caption"
                component="a"
                href="#"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  textDecoration: 'none',
                  '&:hover': {
                    color: 'white',
                    textDecoration: 'underline',
                  },
                }}
              >
                Terms of Service
              </Typography>
              <Typography
                variant="caption"
                component="a"
                href="#"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  textDecoration: 'none',
                  '&:hover': {
                    color: 'white',
                    textDecoration: 'underline',
                  },
                }}
              >
                Support
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;