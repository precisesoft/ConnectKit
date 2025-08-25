import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Box,
  useTheme,
  useMediaQuery,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Settings,
  ExitToApp,
  Notifications,
  Search,
  Person,
} from '@mui/icons-material';

import { useAuthStore } from '@store/authStore';
import { useSidebar, useNotifications } from '@store/uiStore';
import { useAuth } from '@hooks/useAuth';
import SearchBar from '@components/common/SearchBar';

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { user } = useAuthStore();
  const { toggle: toggleSidebar } = useSidebar();
  const { notifications } = useNotifications();
  const { logout } = useAuth();

  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [notificationMenuAnchor, setNotificationMenuAnchor] =
    useState<null | HTMLElement>(null);

  // Handle user menu
  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  // Handle notification menu
  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationMenuAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationMenuAnchor(null);
  };

  // Handle logout
  const handleLogout = async () => {
    handleUserMenuClose();
    await logout();
  };

  // Navigate to profile
  const handleProfile = () => {
    handleUserMenuClose();
    window.location.href = '/profile';
  };

  // Navigate to settings
  const handleSettings = () => {
    handleUserMenuClose();
    // TODO: Navigate to settings page when implemented
  };

  // Get user display name and avatar
  const userDisplayName = user ? `${user.firstName} ${user.lastName}` : 'User';

  const userInitials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'U';

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <AppBar
      position='sticky'
      elevation={1}
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: 'primary.main',
        backgroundImage: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
      }}
    >
      <Toolbar sx={{ px: { xs: 1, sm: 3 } }}>
        {/* Menu button for mobile/tablet */}
        {isMobile && (
          <IconButton
            edge='start'
            color='inherit'
            aria-label='open drawer'
            onClick={onMenuClick || toggleSidebar}
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Logo and title */}
        <Typography
          variant='h6'
          noWrap
          component='div'
          sx={{
            flexGrow: { xs: 1, sm: 0 },
            mr: { xs: 0, sm: 4 },
            fontWeight: 600,
            letterSpacing: 0.5,
          }}
        >
          ConnectKit
        </Typography>

        {/* Search bar - hidden on mobile */}
        {!isMobile && (
          <Box sx={{ flexGrow: 1, maxWidth: 400, mx: 2 }}>
            <SearchBar
              placeholder='Search contacts...'
              size='small'
              fullWidth
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
                '& .MuiInputBase-input': {
                  color: 'white',
                  '&::placeholder': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    opacity: 1,
                  },
                },
                '& .MuiInputBase-root': {
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  },
                },
                '& .MuiSvgIcon-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
              }}
            />
          </Box>
        )}

        {/* Spacer for mobile */}
        <Box sx={{ flexGrow: 1, display: { xs: 'block', sm: 'none' } }} />

        {/* Search icon for mobile */}
        {isMobile && (
          <Tooltip title='Search'>
            <IconButton color='inherit' size='small'>
              <Search />
            </IconButton>
          </Tooltip>
        )}

        {/* Notifications */}
        <Tooltip title='Notifications'>
          <IconButton
            color='inherit'
            onClick={handleNotificationClick}
            sx={{ mx: 0.5 }}
          >
            <Badge badgeContent={unreadNotifications} color='error'>
              <Notifications />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* User menu */}
        <Tooltip title='Account'>
          <IconButton
            edge='end'
            color='inherit'
            onClick={handleUserMenuClick}
            sx={{ ml: 1 }}
          >
            <Avatar
              alt={userDisplayName}
              src={user?.avatar}
              sx={{
                width: 32,
                height: 32,
                backgroundColor: 'secondary.main',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              {userInitials}
            </Avatar>
          </IconButton>
        </Tooltip>
      </Toolbar>

      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
      >
        <MenuItem disabled>
          <ListItemText
            primary={userDisplayName}
            secondary={user?.email}
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
            secondaryTypographyProps={{
              fontSize: '0.75rem',
            }}
          />
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleProfile}>
          <ListItemIcon>
            <Person fontSize='small' />
          </ListItemIcon>
          <ListItemText primary='Profile' />
        </MenuItem>
        <MenuItem onClick={handleSettings}>
          <ListItemIcon>
            <Settings fontSize='small' />
          </ListItemIcon>
          <ListItemText primary='Settings' />
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <ExitToApp fontSize='small' />
          </ListItemIcon>
          <ListItemText primary='Sign Out' />
        </MenuItem>
      </Menu>

      {/* Notification Menu */}
      <Menu
        anchorEl={notificationMenuAnchor}
        open={Boolean(notificationMenuAnchor)}
        onClose={handleNotificationClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            maxWidth: 360,
            maxHeight: 400,
            overflow: 'auto',
          },
        }}
      >
        {notifications.length === 0 ? (
          <MenuItem disabled>
            <ListItemText
              primary='No notifications'
              primaryTypographyProps={{
                fontSize: '0.875rem',
                textAlign: 'center',
              }}
            />
          </MenuItem>
        ) : (
          notifications.slice(0, 5).map(notification => (
            <MenuItem key={notification.id} onClick={handleNotificationClose}>
              <ListItemText
                primary={notification.title || notification.message}
                secondary={
                  notification.title ? notification.message : undefined
                }
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: notification.read ? 400 : 600,
                }}
                secondaryTypographyProps={{
                  fontSize: '0.75rem',
                }}
              />
            </MenuItem>
          ))
        )}
        {notifications.length > 5 && (
          <MenuItem onClick={handleNotificationClose}>
            <ListItemText
              primary={`+${notifications.length - 5} more notifications`}
              primaryTypographyProps={{
                fontSize: '0.75rem',
                textAlign: 'center',
                fontStyle: 'italic',
              }}
            />
          </MenuItem>
        )}
      </Menu>
    </AppBar>
  );
};

export default Header;
