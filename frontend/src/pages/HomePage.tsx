import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  useTheme,
} from '@mui/material';
import {
  People,
  PersonAdd,
  Star,
  TrendingUp,
  ContactPhone,
  Business,
  ImportExport,
  Analytics,
} from '@mui/icons-material';

import { useAuth } from '@hooks/useAuth';
import { useContacts } from '@hooks/useContacts';
import LoadingSpinner from '@components/common/LoadingSpinner';

const HomePage: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { stats, isLoadingStats, contacts } = useContacts({ limit: 5, sortBy: 'updatedAt', sortOrder: 'desc' });

  if (isLoadingStats) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const quickStats = [
    {
      title: 'Total Contacts',
      value: stats?.total || 0,
      icon: <People />,
      color: 'primary.main',
      path: '/contacts',
    },
    {
      title: 'Favorites',
      value: stats?.favorites || 0,
      icon: <Star />,
      color: 'warning.main',
      path: '/contacts?filter=favorites',
    },
    {
      title: 'Companies',
      value: stats?.companies || 0,
      icon: <Business />,
      color: 'info.main',
      path: '/contacts?groupBy=company',
    },
    {
      title: 'Recently Added',
      value: stats?.recentlyAdded || 0,
      icon: <TrendingUp />,
      color: 'success.main',
      path: '/contacts?filter=recent',
    },
  ];

  const quickActions = [
    {
      title: 'Add Contact',
      description: 'Create a new contact',
      icon: <PersonAdd />,
      path: '/contacts/new',
      color: 'primary',
    },
    {
      title: 'Import Contacts',
      description: 'Import from CSV or other sources',
      icon: <ImportExport />,
      path: '/contacts/import',
      color: 'secondary',
    },
    {
      title: 'View Analytics',
      description: 'See contact insights and trends',
      icon: <Analytics />,
      path: '/analytics',
      color: 'info',
    },
  ];

  return (
    <Box>
      {/* Welcome Section */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.firstName}! 👋
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          Here's an overview of your contact management activity.
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {/* Quick Stats */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Quick Stats
          </Typography>
        </Grid>

        {quickStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              component={Button}
              fullWidth
              href={stat.path}
              sx={{
                textAlign: 'left',
                textTransform: 'none',
                color: 'inherit',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  transition: 'transform 0.2s ease-in-out',
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      backgroundColor: stat.color,
                      width: 48,
                      height: 48,
                      mr: 2,
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                      {stat.value.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Quick Actions */}
        <Grid item xs={12} md={8}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            {quickActions.map((action, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  component={Button}
                  fullWidth
                  href={action.path}
                  sx={{
                    textAlign: 'left',
                    textTransform: 'none',
                    color: 'inherit',
                    minHeight: 120,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      transition: 'transform 0.2s ease-in-out',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Avatar
                        sx={{
                          backgroundColor: `${action.color}.light`,
                          color: `${action.color}.main`,
                          mr: 2,
                        }}
                      >
                        {action.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {action.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {action.description}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
            Recent Contacts
          </Typography>
          <Card>
            <CardContent sx={{ p: 0 }}>
              {contacts.length > 0 ? (
                <List>
                  {contacts.slice(0, 5).map((contact, index) => (
                    <React.Fragment key={contact.id}>
                      <ListItem
                        component={Button}
                        href={`/contacts/${contact.id}`}
                        sx={{
                          textAlign: 'left',
                          textTransform: 'none',
                          color: 'inherit',
                          justifyContent: 'flex-start',
                          px: 2,
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            src={contact.avatar}
                            sx={{ bgcolor: 'primary.main' }}
                          >
                            {contact.firstName[0]}{contact.lastName[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${contact.firstName} ${contact.lastName}`}
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              {contact.company && (
                                <Chip
                                  label={contact.company}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                              {contact.isFavorite && (
                                <Star sx={{ color: 'warning.main', fontSize: 16 }} />
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < Math.min(contacts.length, 5) - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <ContactPhone
                    sx={{
                      fontSize: 48,
                      color: 'text.secondary',
                      mb: 1,
                      opacity: 0.5,
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    No contacts yet
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    href="/contacts/new"
                    sx={{ mt: 2 }}
                  >
                    Add Your First Contact
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top Tags */}
        {stats?.topTags && stats.topTags.length > 0 && (
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
              Popular Tags
            </Typography>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {stats.topTags.slice(0, 10).map((tag) => (
                    <Chip
                      key={tag.name}
                      label={`${tag.name} (${tag.count})`}
                      variant="outlined"
                      component={Button}
                      href={`/contacts?tags=${encodeURIComponent(tag.name)}`}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'primary.light',
                          color: 'primary.contrastText',
                        },
                      }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Top Companies */}
        {stats?.topCompanies && stats.topCompanies.length > 0 && (
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
              Top Companies
            </Typography>
            <Card>
              <CardContent>
                <List dense>
                  {stats.topCompanies.slice(0, 5).map((company, index) => (
                    <React.Fragment key={company.name}>
                      <ListItem
                        component={Button}
                        href={`/contacts?company=${encodeURIComponent(company.name)}`}
                        sx={{
                          textAlign: 'left',
                          textTransform: 'none',
                          color: 'inherit',
                          justifyContent: 'space-between',
                          px: 0,
                        }}
                      >
                        <ListItemText
                          primary={company.name}
                          primaryTypographyProps={{ fontSize: '0.9rem' }}
                        />
                        <Chip
                          label={company.count}
                          size="small"
                          sx={{ minWidth: 40 }}
                        />
                      </ListItem>
                      {index < Math.min(stats.topCompanies.length, 5) - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default HomePage;