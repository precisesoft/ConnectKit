import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';

const Footer: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
        mt: 'auto',
        py: { xs: 2, sm: 3 },
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'center', sm: 'flex-start' },
            gap: { xs: 2, sm: 3 },
          }}
        >
          {/* Brand and Description */}
          <Box
            sx={{
              textAlign: { xs: 'center', sm: 'left' },
              maxWidth: { xs: '100%', sm: '300px' },
            }}
          >
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 600,
                color: 'primary.main',
                mb: 1,
              }}
            >
              ConnectKit
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              Modern contact management for professionals. 
              Keep your network organized and accessible.
            </Typography>
          </Box>

          {/* Links Section */}
          {!isMobile && (
            <Box
              sx={{
                display: 'flex',
                gap: 4,
              }}
            >
              {/* Product Links */}
              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.primary"
                  gutterBottom
                  sx={{ fontWeight: 600 }}
                >
                  Product
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Link
                    href="/contacts"
                    color="text.secondary"
                    underline="hover"
                    variant="body2"
                  >
                    Contacts
                  </Link>
                  <Link
                    href="/profile"
                    color="text.secondary"
                    underline="hover"
                    variant="body2"
                  >
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    color="text.secondary"
                    underline="hover"
                    variant="body2"
                  >
                    Settings
                  </Link>
                </Box>
              </Box>

              {/* Support Links */}
              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.primary"
                  gutterBottom
                  sx={{ fontWeight: 600 }}
                >
                  Support
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Link
                    href="#"
                    color="text.secondary"
                    underline="hover"
                    variant="body2"
                    onClick={(e) => {
                      e.preventDefault();
                      // Handle help/documentation
                    }}
                  >
                    Help Center
                  </Link>
                  <Link
                    href="#"
                    color="text.secondary"
                    underline="hover"
                    variant="body2"
                    onClick={(e) => {
                      e.preventDefault();
                      // Handle contact support
                    }}
                  >
                    Contact Support
                  </Link>
                  <Link
                    href="#"
                    color="text.secondary"
                    underline="hover"
                    variant="body2"
                    onClick={(e) => {
                      e.preventDefault();
                      // Handle bug reporting
                    }}
                  >
                    Report Bug
                  </Link>
                </Box>
              </Box>

              {/* Company Links */}
              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.primary"
                  gutterBottom
                  sx={{ fontWeight: 600 }}
                >
                  Company
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Link
                    href="#"
                    color="text.secondary"
                    underline="hover"
                    variant="body2"
                    onClick={(e) => {
                      e.preventDefault();
                      // Handle about page
                    }}
                  >
                    About
                  </Link>
                  <Link
                    href="#"
                    color="text.secondary"
                    underline="hover"
                    variant="body2"
                    onClick={(e) => {
                      e.preventDefault();
                      // Handle privacy policy
                    }}
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    href="#"
                    color="text.secondary"
                    underline="hover"
                    variant="body2"
                    onClick={(e) => {
                      e.preventDefault();
                      // Handle terms of service
                    }}
                  >
                    Terms of Service
                  </Link>
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        {/* Mobile Links */}
        {isMobile && (
          <Box
            sx={{
              mt: 3,
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Link
              href="#"
              color="text.secondary"
              underline="hover"
              variant="body2"
            >
              Help
            </Link>
            <Link
              href="#"
              color="text.secondary"
              underline="hover"
              variant="body2"
            >
              Privacy
            </Link>
            <Link
              href="#"
              color="text.secondary"
              underline="hover"
              variant="body2"
            >
              Terms
            </Link>
            <Link
              href="#"
              color="text.secondary"
              underline="hover"
              variant="body2"
            >
              Support
            </Link>
          </Box>
        )}

        {/* Divider */}
        <Divider sx={{ my: 3 }} />

        {/* Bottom Section */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {/* Copyright */}
          <Typography variant="body2" color="text.secondary">
            © {currentYear} ConnectKit. All rights reserved.
          </Typography>

          {/* Version and Build Info */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
              justifyContent: { xs: 'center', sm: 'flex-end' },
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                px: 1.5,
                py: 0.5,
                backgroundColor: 'action.hover',
                borderRadius: 1,
                fontFamily: 'monospace',
              }}
            >
              v1.0.0
            </Typography>
            {__DEV__ && (
              <Typography
                variant="caption"
                color="warning.main"
                sx={{
                  px: 1.5,
                  py: 0.5,
                  backgroundColor: 'warning.light',
                  color: 'warning.dark',
                  borderRadius: 1,
                  fontWeight: 600,
                }}
              >
                Development
              </Typography>
            )}
          </Box>
        </Box>

        {/* Development Info - Only in dev mode */}
        {__DEV__ && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              backgroundColor: 'info.light',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'info.main',
            }}
          >
            <Typography
              variant="caption"
              color="info.dark"
              sx={{
                display: 'block',
                textAlign: 'center',
                fontWeight: 600,
              }}
            >
              🚀 Development Mode - React {React.version}
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Footer;