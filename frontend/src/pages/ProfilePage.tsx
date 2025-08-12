import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Button,
  Grid,
  Divider,
  Chip,
} from '@mui/material';
import {
  Edit,
  Settings,
  Email,
  Phone,
  Business,
  LocationOn,
  Schedule,
} from '@mui/icons-material';

import { useAuth } from '@hooks/useAuth';
import LoadingSpinner from '@components/common/LoadingSpinner';

const ProfilePage: React.FC = () => {
  const { user, getUserDisplayName } = useAuth();

  if (!user) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  const handleEditProfile = () => {
    // Navigate to profile edit page
    console.log('Edit profile');
  };

  const handleSettings = () => {
    // Navigate to settings page
    console.log('Open settings');
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Profile
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={handleSettings}
            sx={{ textTransform: 'none' }}
          >
            Settings
          </Button>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={handleEditProfile}
            sx={{ textTransform: 'none' }}
          >
            Edit Profile
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Profile Info */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
              <Avatar
                src={user.avatar}
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: 'primary.main',
                  fontSize: '2.5rem',
                  mr: 3,
                }}
              >
                {user.firstName[0]}{user.lastName[0]}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  {getUserDisplayName()}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Email sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body1" color="text.secondary">
                    {user.email}
                  </Typography>
                  {user.emailVerified && (
                    <Chip
                      label="Verified"
                      color="success"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>

                {user.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Phone sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body1" color="text.secondary">
                      {user.phone}
                    </Typography>
                  </Box>
                )}

                {user.company && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Business sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body1" color="text.secondary">
                      {user.company}
                      {user.jobTitle && ` • ${user.jobTitle}`}
                    </Typography>
                  </Box>
                )}

                {user.location && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationOn sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body1" color="text.secondary">
                      {user.location}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {user.bio && (
              <>
                <Divider sx={{ mb: 3 }} />
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    About
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {user.bio}
                  </Typography>
                </Box>
              </>
            )}
          </Paper>

          {/* Account Information */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Account Information
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Member Since
                </Typography>
                <Typography variant="body1">
                  {new Date(user.createdAt).toLocaleDateString()}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Last Login
                </Typography>
                <Typography variant="body1">
                  {user.lastLogin 
                    ? new Date(user.lastLogin).toLocaleDateString()
                    : 'Never'
                  }
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Account Type
                </Typography>
                <Chip
                  label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  color={user.role === 'admin' ? 'error' : 'primary'}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Two-Factor Authentication
                </Typography>
                <Chip
                  label={user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  color={user.twoFactorEnabled ? 'success' : 'warning'}
                  size="small"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Preferences */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Preferences
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Language
              </Typography>
              <Typography variant="body1">
                {user.language || 'English (US)'}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Timezone
              </Typography>
              <Typography variant="body1">
                {user.timezone || 'UTC'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Notifications
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Chip
                  label="Email Notifications"
                  color={user.emailNotifications ? 'success' : 'default'}
                  size="small"
                  variant={user.emailNotifications ? 'filled' : 'outlined'}
                />
                <Chip
                  label="Marketing Emails"
                  color={user.marketingEmails ? 'success' : 'default'}
                  size="small"
                  variant={user.marketingEmails ? 'filled' : 'outlined'}
                />
              </Box>
            </Box>
          </Paper>

          {/* Security */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Security
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
                onClick={() => console.log('Change password')}
              >
                Change Password
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
                onClick={() => console.log('Two-factor auth')}
              >
                {user.twoFactorEnabled ? 'Manage' : 'Enable'} 2FA
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
                onClick={() => console.log('Active sessions')}
              >
                Active Sessions
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                color="error"
                sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
                onClick={() => console.log('Delete account')}
              >
                Delete Account
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage;