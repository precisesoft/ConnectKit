import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Chip,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Home,
  People,
  Person,
  Settings,
  Star,
  ContactPhone,
  Business,
  Label,
  ImportExport,
  ChevronLeft,
} from '@mui/icons-material';

import { useSidebar } from '@store/uiStore';
import { useContacts } from '@hooks/useContacts';

interface SidebarProps {
  onClose?: () => void;
}

interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string | number;
  divider?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();

  const { open, width, setOpen } = useSidebar();
  const { stats } = useContacts();

  // Handle navigation
  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile && onClose) {
      onClose();
    }
  };

  // Handle sidebar close
  const handleClose = () => {
    if (isMobile) {
      setOpen(false);
      if (onClose) onClose();
    }
  };

  // Check if current path matches navigation item
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') {
      return true;
    }
    return path !== '/' && location.pathname.startsWith(path);
  };

  // Navigation items configuration
  const navigationItems: NavigationItem[] = [
    {
      id: 'home',
      label: 'Dashboard',
      path: '/',
      icon: <Home />,
    },
    {
      id: 'contacts',
      label: 'All Contacts',
      path: '/contacts',
      icon: <People />,
      badge: stats?.total || 0,
    },
    {
      id: 'favorites',
      label: 'Favorites',
      path: '/contacts?filter=favorites',
      icon: <Star />,
      badge: stats?.favorites || 0,
    },
    {
      id: 'recent',
      label: 'Recently Added',
      path: '/contacts?filter=recent',
      icon: <ContactPhone />,
      badge: stats?.recentlyAdded || 0,
      divider: true,
    },
    {
      id: 'companies',
      label: 'Companies',
      path: '/contacts?groupBy=company',
      icon: <Business />,
      badge: stats?.companies || 0,
    },
    {
      id: 'tags',
      label: 'Tags',
      path: '/contacts?view=tags',
      icon: <Label />,
      divider: true,
    },
    {
      id: 'profile',
      label: 'Profile',
      path: '/profile',
      icon: <Person />,
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/settings',
      icon: <Settings />,
    },
  ];

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Sidebar Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 64,
        }}
      >
        <Typography
          variant='h6'
          component='div'
          sx={{
            fontWeight: 600,
            color: 'primary.main',
            letterSpacing: 0.5,
          }}
        >
          Navigation
        </Typography>
        {!isMobile && (
          <Tooltip title='Collapse sidebar'>
            <IconButton
              size='small'
              onClick={() => setOpen(false)}
              sx={{ ml: 1 }}
            >
              <ChevronLeft />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Divider />

      {/* Navigation List */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List sx={{ px: 1, py: 1 }}>
          {navigationItems.map(item => (
            <React.Fragment key={item.id}>
              <ListItemButton
                selected={isActive(item.path)}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  mx: 0.5,
                  my: 0.25,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive(item.path) ? 'inherit' : 'action.active',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive(item.path) ? 600 : 500,
                  }}
                />
                {item.badge !== undefined && Number(item.badge) > 0 && (
                  <Chip
                    label={item.badge}
                    size='small'
                    sx={{
                      height: 20,
                      fontSize: '0.75rem',
                      backgroundColor: isActive(item.path)
                        ? 'rgba(255, 255, 255, 0.2)'
                        : 'action.selected',
                      color: isActive(item.path) ? 'inherit' : 'text.secondary',
                      '& .MuiChip-label': {
                        px: 1,
                      },
                    }}
                  />
                )}
              </ListItemButton>
              {item.divider && <Divider sx={{ my: 1, mx: 2 }} />}
            </React.Fragment>
          ))}
        </List>
      </Box>

      {/* Quick Actions */}
      <Box sx={{ p: 2 }}>
        <Typography
          variant='caption'
          sx={{
            color: 'text.secondary',
            textTransform: 'uppercase',
            fontWeight: 600,
            letterSpacing: 1,
            mb: 1,
            display: 'block',
          }}
        >
          Quick Actions
        </Typography>
        <List dense>
          <ListItemButton
            onClick={() => handleNavigation('/contacts/new')}
            sx={{
              borderRadius: 2,
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
              mb: 1,
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
              <Person />
            </ListItemIcon>
            <ListItemText
              primary='Add Contact'
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            />
          </ListItemButton>
          <ListItemButton
            onClick={() => handleNavigation('/contacts/import')}
            sx={{
              borderRadius: 2,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <ImportExport />
            </ListItemIcon>
            <ListItemText
              primary='Import/Export'
              primaryTypographyProps={{
                fontSize: '0.875rem',
              }}
            />
          </ListItemButton>
        </List>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Typography
          variant='caption'
          sx={{
            color: 'text.secondary',
            display: 'block',
            mb: 0.5,
          }}
        >
          ConnectKit v1.0.0
        </Typography>
        <Typography
          variant='caption'
          sx={{
            color: 'text.secondary',
          }}
        >
          {stats?.total || 0} contacts
        </Typography>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant='temporary'
        open={open}
        onClose={handleClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280,
            borderRight: 'none',
          },
        }}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant='persistent'
      anchor='left'
      open={open}
      sx={{
        width: open ? width : 0,
        flexShrink: 0,
        transition: theme.transitions.create(['width'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        '& .MuiDrawer-paper': {
          width: width,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          position: 'relative',
          transition: theme.transitions.create(['width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        },
      }}
    >
      {sidebarContent}
    </Drawer>
  );
};

export default Sidebar;
