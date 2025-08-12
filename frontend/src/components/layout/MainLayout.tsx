import React, { useEffect } from 'react';
import {
  Box,
  useTheme,
  useMediaQuery,
  Backdrop,
} from '@mui/material';

import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useSidebar, useUIStore } from '@store/uiStore';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { open, width, setOpen, setMobile } = useSidebar();
  const { setMobile: setUIStoreMobile } = useUIStore();

  // Update mobile state when screen size changes
  useEffect(() => {
    setMobile(isMobile);
    setUIStoreMobile(isMobile);
  }, [isMobile, setMobile, setUIStoreMobile]);

  // Handle sidebar close on mobile
  const handleSidebarClose = () => {
    if (isMobile) {
      setOpen(false);
    }
  };

  // Handle backdrop click on mobile
  const handleBackdropClick = () => {
    if (isMobile && open) {
      setOpen(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Header */}
      <Header onMenuClick={() => setOpen(!open)} />

      {/* Sidebar */}
      <Sidebar onClose={handleSidebarClose} />

      {/* Backdrop for mobile sidebar */}
      {isMobile && (
        <Backdrop
          open={open}
          onClick={handleBackdropClick}
          sx={{
            zIndex: theme.zIndex.drawer - 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        />
      )}

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          width: {
            xs: '100%',
            md: open ? `calc(100% - ${width}px)` : '100%',
          },
          ml: {
            xs: 0,
            md: open ? `${width}px` : 0,
          },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className="skip-to-main"
          onFocus={(e) => {
            e.target.style.top = '6px';
          }}
          onBlur={(e) => {
            e.target.style.top = '-40px';
          }}
        >
          Skip to main content
        </a>

        {/* Content area with proper spacing from header */}
        <Box
          id="main-content"
          sx={{
            flexGrow: 1,
            mt: 0, // Header is sticky, so no top margin needed
            p: { xs: 1, sm: 2, md: 3 },
            backgroundColor: 'background.default',
            minHeight: 'calc(100vh - 64px)', // Account for header height
          }}
        >
          {children}
        </Box>

        {/* Footer */}
        <Footer />
      </Box>
    </Box>
  );
};

export default MainLayout;