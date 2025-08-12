import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  useTheme,
} from '@mui/material';
import {
  Home,
  ArrowBack,
  Search,
  ContactPhone,
} from '@mui/icons-material';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoToContacts = () => {
    navigate('/contacts');
  };

  return (
    <Box
      sx={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={1}
          sx={{
            textAlign: 'center',
            py: 8,
            px: 4,
            borderRadius: 3,
          }}
        >
          {/* 404 Illustration */}
          <Typography
            variant="h1"
            component="div"
            sx={{
              fontSize: { xs: '6rem', sm: '8rem', md: '10rem' },
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
            }}
          >
            404
          </Typography>

          {/* Error Message */}
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              mb: 2,
            }}
          >
            Oops! Page not found
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              mb: 4,
              maxWidth: 500,
              mx: 'auto',
              lineHeight: 1.6,
            }}
          >
            The page you're looking for doesn't exist or has been moved. 
            Don't worry, you can find what you're looking for from our homepage or contacts.
          </Typography>

          {/* Action Buttons */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              justifyContent: 'center',
              alignItems: 'center',
              mb: 4,
            }}
          >
            <Button
              variant="contained"
              size="large"
              startIcon={<Home />}
              onClick={handleGoHome}
              sx={{
                minWidth: { xs: '100%', sm: 160 },
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                },
              }}
            >
              Go Home
            </Button>

            <Button
              variant="outlined"
              size="large"
              startIcon={<ContactPhone />}
              onClick={handleGoToContacts}
              sx={{
                minWidth: { xs: '100%', sm: 160 },
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
              }}
            >
              View Contacts
            </Button>

            <Button
              variant="text"
              size="large"
              startIcon={<ArrowBack />}
              onClick={handleGoBack}
              sx={{
                minWidth: { xs: '100%', sm: 160 },
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
              }}
            >
              Go Back
            </Button>
          </Box>

          {/* Additional Help */}
          <Box
            sx={{
              pt: 4,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
            >
              Still can't find what you're looking for?
            </Typography>
            
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: 2,
                mt: 2,
              }}
            >
              <Button
                variant="text"
                size="small"
                startIcon={<Search />}
                onClick={() => {
                  // Focus on search when navigating to contacts
                  navigate('/contacts');
                  // TODO: Focus search input after navigation
                }}
                sx={{ textTransform: 'none' }}
              >
                Search Contacts
              </Button>
              
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  // Handle support contact
                  window.location.href = 'mailto:support@connectkit.com?subject=Page%20Not%20Found%20Help';
                }}
                sx={{ textTransform: 'none' }}
              >
                Contact Support
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default NotFoundPage;