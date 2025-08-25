import React from 'react';
import {
  Box,
  Alert,
  AlertTitle,
  Button,
  Typography,
  Fade,
  Paper,
} from '@mui/material';
import {
  ErrorOutline,
  Refresh,
  Home,
  ContactSupport,
} from '@mui/icons-material';

interface ErrorMessageProps {
  /**
   * Error message to display
   */
  message: string;
  /**
   * Optional error title
   */
  title?: string;
  /**
   * Error severity level
   */
  severity?: 'error' | 'warning' | 'info';
  /**
   * Retry function to call when retry button is clicked
   */
  onRetry?: () => void;
  /**
   * Whether to show home button
   */
  showHomeButton?: boolean;
  /**
   * Whether to show support button
   */
  showSupportButton?: boolean;
  /**
   * Custom retry button text
   */
  retryText?: string;
  /**
   * Whether to show as full page error
   */
  fullPage?: boolean;
  /**
   * Additional styling
   */
  sx?: object;
  /**
   * Whether to show with fade animation
   */
  fade?: boolean;
  /**
   * Error details (for debugging)
   */
  details?: string;
  /**
   * Whether details are shown by default
   */
  showDetails?: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  title,
  severity = 'error',
  onRetry,
  showHomeButton = false,
  showSupportButton = false,
  retryText = 'Try Again',
  fullPage = false,
  sx = {},
  fade = true,
  details,
  showDetails = false,
}) => {
  const [showErrorDetails, setShowErrorDetails] = React.useState(showDetails);

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleContactSupport = () => {
    // In a real app, this might open a support modal or redirect to support page
    const subject = encodeURIComponent(
      `Error Report: ${title || 'Application Error'}`
    );
    const body = encodeURIComponent(
      `Error Message: ${message}\n\nDetails: ${details || 'No additional details'}\n\nURL: ${window.location.href}\n\nUser Agent: ${navigator.userAgent}`
    );
    window.open(
      `mailto:support@connectkit.com?subject=${subject}&body=${body}`
    );
  };

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: fullPage ? 'center' : 'flex-start',
        minHeight: fullPage ? '50vh' : 'auto',
        p: fullPage ? 3 : 2,
        textAlign: 'center',
        ...sx,
      }}
    >
      {fullPage ? (
        // Full page error display
        <Paper
          elevation={1}
          sx={{
            p: 4,
            maxWidth: 500,
            width: '100%',
            textAlign: 'center',
          }}
        >
          <ErrorOutline
            color={severity}
            sx={{
              fontSize: 64,
              mb: 2,
              opacity: 0.7,
            }}
          />

          <Typography
            variant='h5'
            component='h1'
            gutterBottom
            color='text.primary'
            sx={{ fontWeight: 600 }}
          >
            {title || 'Something went wrong'}
          </Typography>

          <Typography variant='body1' color='text.secondary' sx={{ mb: 3 }}>
            {message}
          </Typography>

          {details && (
            <Box sx={{ mb: 3, textAlign: 'left' }}>
              <Button
                variant='text'
                size='small'
                onClick={() => setShowErrorDetails(!showErrorDetails)}
                sx={{ mb: 1 }}
              >
                {showErrorDetails ? 'Hide' : 'Show'} Details
              </Button>

              {showErrorDetails && (
                <Paper
                  variant='outlined'
                  sx={{
                    p: 2,
                    backgroundColor: 'grey.50',
                    maxHeight: 150,
                    overflow: 'auto',
                  }}
                >
                  <Typography
                    variant='caption'
                    component='pre'
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {details}
                  </Typography>
                </Paper>
              )}
            </Box>
          )}

          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {onRetry && (
              <Button
                variant='contained'
                startIcon={<Refresh />}
                onClick={onRetry}
                sx={{ minWidth: 120 }}
              >
                {retryText}
              </Button>
            )}

            {showHomeButton && (
              <Button
                variant='outlined'
                startIcon={<Home />}
                onClick={handleGoHome}
                sx={{ minWidth: 120 }}
              >
                Go Home
              </Button>
            )}

            {showSupportButton && (
              <Button
                variant='text'
                startIcon={<ContactSupport />}
                onClick={handleContactSupport}
                sx={{ minWidth: 120 }}
              >
                Contact Support
              </Button>
            )}
          </Box>
        </Paper>
      ) : (
        // Inline error display
        <Alert
          severity={severity}
          sx={{
            width: '100%',
            alignItems: 'flex-start',
          }}
          action={
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {onRetry && (
                <Button
                  color='inherit'
                  size='small'
                  startIcon={<Refresh />}
                  onClick={onRetry}
                >
                  {retryText}
                </Button>
              )}

              {showSupportButton && (
                <Button
                  color='inherit'
                  size='small'
                  startIcon={<ContactSupport />}
                  onClick={handleContactSupport}
                >
                  Support
                </Button>
              )}
            </Box>
          }
        >
          {title && <AlertTitle>{title}</AlertTitle>}
          <Typography variant='body2'>{message}</Typography>

          {details && (
            <Box sx={{ mt: 1 }}>
              <Button
                color='inherit'
                size='small'
                variant='text'
                onClick={() => setShowErrorDetails(!showErrorDetails)}
                sx={{ p: 0, minWidth: 'auto', fontSize: '0.75rem' }}
              >
                {showErrorDetails ? 'Hide' : 'Show'} Details
              </Button>

              {showErrorDetails && (
                <Typography
                  variant='caption'
                  component='pre'
                  sx={{
                    display: 'block',
                    mt: 1,
                    p: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.03)',
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    fontSize: '0.7rem',
                    maxHeight: 100,
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {details}
                </Typography>
              )}
            </Box>
          )}
        </Alert>
      )}
    </Box>
  );

  return fade ? (
    <Fade in={true} timeout={300}>
      <div>{content}</div>
    </Fade>
  ) : (
    content
  );
};

export default ErrorMessage;
