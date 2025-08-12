import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Fade,
} from '@mui/material';

interface LoadingSpinnerProps {
  /**
   * Size of the spinner
   */
  size?: number;
  /**
   * Optional message to display below the spinner
   */
  message?: string;
  /**
   * Color of the spinner
   */
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'inherit';
  /**
   * Whether to show the component with fade animation
   */
  fade?: boolean;
  /**
   * Additional styling
   */
  sx?: object;
  /**
   * Full screen overlay
   */
  overlay?: boolean;
  /**
   * Minimum height for the container
   */
  minHeight?: string | number;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 40,
  message,
  color = 'primary',
  fade = true,
  sx = {},
  overlay = false,
  minHeight = 'auto',
}) => {
  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight,
        py: 2,
        ...sx,
      }}
    >
      <CircularProgress 
        size={size} 
        color={color}
        sx={{ mb: message ? 2 : 0 }}
      />
      {message && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            textAlign: 'center',
            maxWidth: 300,
            animation: 'pulse 1.5s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': {
                opacity: 1,
              },
              '50%': {
                opacity: 0.7,
              },
            },
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );

  if (overlay) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(2px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {fade ? (
          <Fade in={true} timeout={300}>
            <div>{content}</div>
          </Fade>
        ) : (
          content
        )}
      </Box>
    );
  }

  return fade ? (
    <Fade in={true} timeout={300}>
      <div>{content}</div>
    </Fade>
  ) : (
    content
  );
};

export default LoadingSpinner;