import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Alert,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { Email, Send, ArrowBack, CheckCircle } from '@mui/icons-material';

import { AuthService } from '@services/auth.service';
import { ForgotPasswordRequest } from '@services/types';
import {
  showErrorNotification,
  showSuccessNotification,
} from '../../store/uiStore';

// Validation schema
const forgotPasswordSchema = yup.object().shape({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
});

interface ForgotPasswordFormData extends ForgotPasswordRequest {}

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
  onBack?: () => void;
  showTitle?: boolean;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSuccess,
  onBack,
  showTitle = true,
}) => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string>('');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  // Handle form submission
  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      setSubmitError(null);
      clearErrors();

      await AuthService.forgotPassword(data);

      setSubmittedEmail(data.email);
      setIsSubmitted(true);

      showSuccessNotification(
        'Password reset instructions have been sent to your email.',
        'Email Sent'
      );

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);

      const errorMessage =
        error.message || 'Failed to send reset email. Please try again.';
      setSubmitError(errorMessage);

      // Handle specific error types
      if (error.status === 404) {
        setError('email', {
          message: 'No account found with this email address',
        });
      } else if (error.status === 429) {
        setError('email', {
          message: 'Too many requests. Please try again later.',
        });
      } else if (error.status === 422) {
        // Handle validation errors from server
        if (error.details && Array.isArray(error.details)) {
          error.details.forEach((detail: any) => {
            if (detail.field && detail.message) {
              setError(detail.field as keyof ForgotPasswordFormData, {
                message: detail.message,
              });
            }
          });
        }
      } else {
        showErrorNotification(errorMessage, 'Failed to Send Email');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/login');
    }
  };

  // Handle try again (reset form)
  const handleTryAgain = () => {
    setIsSubmitted(false);
    setSubmittedEmail('');
    setSubmitError(null);
  };

  // Success state
  if (isSubmitted) {
    return (
      <Card
        elevation={3}
        sx={{
          maxWidth: 400,
          width: '100%',
          mx: 'auto',
        }}
      >
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircle
            color='success'
            sx={{
              fontSize: 64,
              mb: 2,
            }}
          />

          <Typography
            variant='h5'
            component='h1'
            gutterBottom
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              mb: 2,
            }}
          >
            Check Your Email
          </Typography>

          <Typography variant='body1' color='text.secondary' sx={{ mb: 3 }}>
            We've sent password reset instructions to:
          </Typography>

          <Typography
            variant='body1'
            sx={{
              fontWeight: 600,
              color: 'primary.main',
              mb: 3,
              wordBreak: 'break-word',
            }}
          >
            {submittedEmail}
          </Typography>

          <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
            Please check your email and follow the instructions to reset your
            password. The link will expire in 1 hour.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant='outlined'
              onClick={handleTryAgain}
              sx={{ textTransform: 'none' }}
            >
              Try Different Email
            </Button>

            <Button
              variant='text'
              onClick={handleBack}
              startIcon={<ArrowBack />}
              sx={{ textTransform: 'none' }}
            >
              Back to Sign In
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Form state
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
              Forgot Password
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
              Enter your email address and we'll send you instructions to reset
              your password.
            </Typography>
          </Box>
        )}

        {/* Error Alert */}
        {submitError && (
          <Alert
            severity='error'
            sx={{ mb: 3 }}
            onClose={() => setSubmitError(null)}
          >
            {submitError}
          </Alert>
        )}

        {/* Forgot Password Form */}
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
                autoFocus
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
                <Send />
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
              ? 'Sending...'
              : 'Send Reset Instructions'}
          </Button>

          {/* Back to Login */}
          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant='text'
              onClick={handleBack}
              startIcon={<ArrowBack />}
              disabled={isLoading || isSubmitting}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Back to Sign In
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ForgotPasswordForm;
