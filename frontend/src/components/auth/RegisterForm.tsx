import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  PersonAdd,
} from '@mui/icons-material';

import { useAuth } from '@hooks/useAuth';
import { RegisterRequest } from '@services/types';
import { showErrorNotification, showSuccessNotification } from '@store/uiStore';

// Password strength checker
const checkPasswordStrength = (
  password: string
): {
  score: number;
  feedback: string[];
  color: 'error' | 'warning' | 'info' | 'success';
} => {
  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('At least 8 characters');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One uppercase letter');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One lowercase letter');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('One number');
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One special character');
  }

  let color: 'error' | 'warning' | 'info' | 'success';
  if (score < 2) color = 'error';
  else if (score < 3) color = 'warning';
  else if (score < 4) color = 'info';
  else color = 'success';

  return { score, feedback, color };
};

// Validation schema
const registerSchema = yup.object().shape({
  firstName: yup
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .required('First name is required'),
  lastName: yup
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .required('Last name is required'),
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

interface RegisterFormData extends RegisterRequest {}

interface RegisterFormProps {
  onSuccess?: () => void;
  showTitle?: boolean;
  showLoginLink?: boolean;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  showTitle = true,
  showLoginLink = true,
}) => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string[];
    color: 'error' | 'warning' | 'info' | 'success';
  }>({ score: 0, feedback: [], color: 'error' });

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    watch,
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Watch password for strength checking
  const password = watch('password');

  React.useEffect(() => {
    if (password) {
      setPasswordStrength(checkPasswordStrength(password));
    } else {
      setPasswordStrength({ score: 0, feedback: [], color: 'error' });
    }
  }, [password]);

  // Handle form submission
  const onSubmit = async (data: RegisterFormData) => {
    try {
      setRegisterError(null);
      clearErrors();

      await register(data);

      showSuccessNotification(
        'Account created successfully! Please check your email to verify your account.',
        'Registration Successful'
      );

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/login', {
          state: {
            message:
              'Registration successful! Please check your email to verify your account.',
          },
        });
      }
    } catch (error: any) {
      console.error('Registration error:', error);

      const errorMessage =
        error.message || 'Registration failed. Please try again.';
      setRegisterError(errorMessage);

      // Handle specific error types
      if (error.status === 409) {
        // Email already exists
        setError('email', {
          message: 'This email is already registered',
        });
      } else if (error.status === 422) {
        // Handle validation errors from server
        if (error.details && Array.isArray(error.details)) {
          error.details.forEach((detail: any) => {
            if (detail.field && detail.message) {
              setError(detail.field as keyof RegisterFormData, {
                message: detail.message,
              });
            }
          });
        }
      } else {
        showErrorNotification(errorMessage, 'Registration Failed');
      }
    }
  };

  // Toggle password visibility
  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <Card
      elevation={3}
      sx={{
        maxWidth: 480,
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
              Create Account
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
              Join ConnectKit to manage your contacts
            </Typography>
          </Box>
        )}

        {/* Error Alert */}
        {registerError && (
          <Alert
            severity='error'
            sx={{ mb: 3 }}
            onClose={() => setRegisterError(null)}
          >
            {registerError}
          </Alert>
        )}

        {/* Registration Form */}
        <Box component='form' onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Name Fields */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Controller
              name='firstName'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='First Name'
                  autoComplete='given-name'
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                  disabled={isLoading || isSubmitting}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Person color='action' />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            <Controller
              name='lastName'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Last Name'
                  autoComplete='family-name'
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                  disabled={isLoading || isSubmitting}
                />
              )}
            />
          </Box>

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
              <>
                <TextField
                  {...field}
                  fullWidth
                  label='Password'
                  type={showPassword ? 'text' : 'password'}
                  autoComplete='new-password'
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
                />

                {/* Password Strength Indicator */}
                {password && (
                  <Box sx={{ mt: 1, mb: 1 }}>
                    <LinearProgress
                      variant='determinate'
                      value={(passwordStrength.score / 5) * 100}
                      color={passwordStrength.color}
                      sx={{ mb: 1 }}
                    />
                    {passwordStrength.feedback.length > 0 && (
                      <Typography variant='caption' color='text.secondary'>
                        Password needs: {passwordStrength.feedback.join(', ')}
                      </Typography>
                    )}
                  </Box>
                )}
              </>
            )}
          />

          {/* Confirm Password Field */}
          <Controller
            name='confirmPassword'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label='Confirm Password'
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete='new-password'
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
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
                        onClick={handleToggleConfirmPassword}
                        edge='end'
                        disabled={isLoading || isSubmitting}
                      >
                        {showConfirmPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />
            )}
          />

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
                <PersonAdd />
              )
            }
            sx={{
              mb: 3,
              py: 1.5,
              fontWeight: 600,
              textTransform: 'none',
            }}
          >
            {isLoading || isSubmitting
              ? 'Creating Account...'
              : 'Create Account'}
          </Button>

          {/* Login Link */}
          {showLoginLink && (
            <>
              <Divider sx={{ mb: 3 }}>
                <Typography variant='body2' color='text.secondary'>
                  or
                </Typography>
              </Divider>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant='body2' color='text.secondary'>
                  Already have an account?{' '}
                  <Link
                    component={RouterLink}
                    to='/login'
                    sx={{
                      fontWeight: 600,
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Sign in here
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

export default RegisterForm;
