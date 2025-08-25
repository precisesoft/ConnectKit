import React, { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Divider,
  FormControlLabel,
  Checkbox,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Login as LoginIcon,
} from '@mui/icons-material';

import { useAuth } from '@hooks/useAuth';
import { LoginRequest } from '@services/types';
import { showErrorNotification } from '@store/uiStore';

// Validation schema
const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  rememberMe: yup.boolean(),
});

type LoginFormData = LoginRequest;

interface LoginFormProps {
  onSuccess?: () => void;
  showTitle?: boolean;
  showRegisterLink?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  showTitle = true,
  showRegisterLink = true,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // Handle form submission
  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoginError(null);
      clearErrors();

      await login(data);

      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect to intended page or home
        const from = (location.state as any)?.from || '/';
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      console.error('Login error:', error);

      const errorMessage = error.message || 'Login failed. Please try again.';
      setLoginError(errorMessage);

      // Handle specific error types
      if (error.status === 401) {
        setError('email', {
          message: 'Invalid email or password',
        });
        setError('password', {
          message: 'Invalid email or password',
        });
      } else if (error.status === 422) {
        // Handle validation errors from server
        if (error.details && Array.isArray(error.details)) {
          error.details.forEach((detail: any) => {
            if (detail.field && detail.message) {
              setError(detail.field as keyof LoginFormData, {
                message: detail.message,
              });
            }
          });
        }
      } else {
        showErrorNotification(errorMessage, 'Login Failed');
      }
    }
  };

  // Toggle password visibility
  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <Card
      elevation={3}
      sx={{
        maxWidth: 400,
        width: '100%',
        mx: 'auto',
      }}
    >
      <CardContent sx={{ p: 4 }}>
        {showTitle && (
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography
              variant='h4'
              component='h1'
              gutterBottom
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                mb: 1,
              }}
            >
              Welcome Back
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
              Sign in to access your contacts
            </Typography>
          </Box>
        )}

        {/* Error Alert */}
        {loginError && (
          <Alert
            severity='error'
            sx={{ mb: 3 }}
            onClose={() => setLoginError(null)}
          >
            {loginError}
          </Alert>
        )}

        {/* Login Form */}
        <Box component='form' onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Email Field */}
          <Controller
            name='email'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label='Email Address'
                type='email'
                autoComplete='email'
                error={!!errors.email}
                helperText={errors.email?.message}
                disabled={isLoading || isSubmitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Email color='action' />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
            )}
          />

          {/* Password Field */}
          <Controller
            name='password'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label='Password'
                type={showPassword ? 'text' : 'password'}
                autoComplete='current-password'
                error={!!errors.password}
                helperText={errors.password?.message}
                disabled={isLoading || isSubmitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Lock color='action' />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        aria-label='toggle password visibility'
                        onClick={handleTogglePassword}
                        edge='end'
                        disabled={isLoading || isSubmitting}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
            )}
          />

          {/* Remember Me & Forgot Password */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Controller
              name='rememberMe'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={field.value}
                      disabled={isLoading || isSubmitting}
                    />
                  }
                  label={<Typography variant='body2'>Remember me</Typography>}
                />
              )}
            />

            <Link
              component='button'
              type='button'
              variant='body2'
              onClick={handleForgotPassword}
              disabled={isLoading || isSubmitting}
              sx={{
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              Forgot password?
            </Link>
          </Box>

          {/* Submit Button */}
          <Button
            type='submit'
            fullWidth
            variant='contained'
            size='large'
            disabled={isLoading || isSubmitting}
            startIcon={
              isLoading || isSubmitting ? (
                <CircularProgress size={20} />
              ) : (
                <LoginIcon />
              )
            }
            sx={{
              mb: 3,
              py: 1.5,
              fontWeight: 600,
              textTransform: 'none',
            }}
          >
            {isLoading || isSubmitting ? 'Signing In...' : 'Sign In'}
          </Button>

          {/* Register Link */}
          {showRegisterLink && (
            <>
              <Divider sx={{ mb: 3 }}>
                <Typography variant='body2' color='text.secondary'>
                  or
                </Typography>
              </Divider>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant='body2' color='text.secondary'>
                  Don&apos;t have an account?{' '}
                  <Link
                    component={RouterLink}
                    to='/register'
                    sx={{
                      fontWeight: 600,
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Create one now
                  </Link>
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
