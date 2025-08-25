import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Avatar,
  Chip,
  Grid,
  IconButton,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  Star,
  StarBorder,
  Email,
  Phone,
  Business,
  LocationOn,
  Language,
  Notes,
} from '@mui/icons-material';

import LoadingSpinner from '@components/common/LoadingSpinner';

const ContactDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // This is a placeholder implementation
  // In a real application, you would fetch the contact data using the ID
  const contact = {
    id: id || '',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    company: 'Acme Corporation',
    jobTitle: 'Software Engineer',
    address: {
      street: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'USA',
    },
    website: 'https://johndoe.dev',
    notes:
      'Great developer with excellent problem-solving skills. Interested in React and TypeScript.',
    tags: ['Developer', 'React', 'TypeScript', 'Remote'],
    isFavorite: true,
    avatar: undefined,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-20T14:45:00Z',
  };

  const handleBack = () => {
    navigate('/contacts');
  };

  const handleEdit = () => {
    navigate(`/contacts/${id}/edit`);
  };

  const handleDelete = () => {
    // Show confirmation dialog and delete contact
    if (window.confirm('Are you sure you want to delete this contact?')) {
      // Delete contact logic here
      navigate('/contacts');
    }
  };

  const handleToggleFavorite = () => {
    // Toggle favorite logic here
    console.log('Toggle favorite');
  };

  if (!contact) {
    return <LoadingSpinner message='Loading contact...' />;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography
          variant='h4'
          component='h1'
          sx={{ flexGrow: 1, fontWeight: 600 }}
        >
          Contact Details
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={handleToggleFavorite}
            color={contact.isFavorite ? 'warning' : 'default'}
          >
            {contact.isFavorite ? <Star /> : <StarBorder />}
          </IconButton>
          <Button
            variant='outlined'
            startIcon={<Edit />}
            onClick={handleEdit}
            sx={{ textTransform: 'none' }}
          >
            Edit
          </Button>
          <Button
            variant='outlined'
            color='error'
            startIcon={<Delete />}
            onClick={handleDelete}
            sx={{ textTransform: 'none' }}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Contact Info */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
              <Avatar
                src={contact.avatar}
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'primary.main',
                  fontSize: '2rem',
                  mr: 3,
                }}
              >
                {contact.firstName[0]}
                {contact.lastName[0]}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant='h5' gutterBottom sx={{ fontWeight: 600 }}>
                  {contact.firstName} {contact.lastName}
                </Typography>
                {contact.jobTitle && (
                  <Typography variant='h6' color='text.secondary' gutterBottom>
                    {contact.jobTitle}
                  </Typography>
                )}
                {contact.company && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Business
                      sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }}
                    />
                    <Typography variant='body1' color='text.secondary'>
                      {contact.company}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Contact Information */}
            <Grid container spacing={2}>
              {contact.email && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Email
                      sx={{ fontSize: 20, mr: 2, color: 'primary.main' }}
                    />
                    <Box>
                      <Typography variant='body2' color='text.secondary'>
                        Email
                      </Typography>
                      <Typography variant='body1'>{contact.email}</Typography>
                    </Box>
                  </Box>
                </Grid>
              )}

              {contact.phone && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Phone
                      sx={{ fontSize: 20, mr: 2, color: 'primary.main' }}
                    />
                    <Box>
                      <Typography variant='body2' color='text.secondary'>
                        Phone
                      </Typography>
                      <Typography variant='body1'>{contact.phone}</Typography>
                    </Box>
                  </Box>
                </Grid>
              )}

              {contact.website && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Language
                      sx={{ fontSize: 20, mr: 2, color: 'primary.main' }}
                    />
                    <Box>
                      <Typography variant='body2' color='text.secondary'>
                        Website
                      </Typography>
                      <Typography
                        variant='body1'
                        component='a'
                        href={contact.website}
                        target='_blank'
                        rel='noopener noreferrer'
                        sx={{
                          color: 'primary.main',
                          textDecoration: 'none',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        {contact.website}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}

              {contact.address && (
                <Grid item xs={12}>
                  <Box
                    sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}
                  >
                    <LocationOn
                      sx={{
                        fontSize: 20,
                        mr: 2,
                        color: 'primary.main',
                        mt: 0.5,
                      }}
                    />
                    <Box>
                      <Typography variant='body2' color='text.secondary'>
                        Address
                      </Typography>
                      <Typography variant='body1'>
                        {contact.address.street}
                        {contact.address.street && <br />}
                        {contact.address.city}, {contact.address.state}{' '}
                        {contact.address.zipCode}
                        {contact.address.country &&
                          contact.address.country !== 'USA' && (
                            <>
                              <br />
                              {contact.address.country}
                            </>
                          )}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>

            {/* Tags */}
            {contact.tags && contact.tags.length > 0 && (
              <>
                <Divider sx={{ my: 3 }} />
                <Box>
                  <Typography
                    variant='h6'
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    Tags
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {contact.tags.map(tag => (
                      <Chip key={tag} label={tag} variant='outlined' />
                    ))}
                  </Box>
                </Box>
              </>
            )}

            {/* Notes */}
            {contact.notes && (
              <>
                <Divider sx={{ my: 3 }} />
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Notes
                      sx={{ fontSize: 20, mr: 1, color: 'primary.main' }}
                    />
                    <Typography variant='h6' sx={{ fontWeight: 600 }}>
                      Notes
                    </Typography>
                  </Box>
                  <Typography variant='body1' sx={{ whiteSpace: 'pre-wrap' }}>
                    {contact.notes}
                  </Typography>
                </Box>
              </>
            )}
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant='h6' gutterBottom sx={{ fontWeight: 600 }}>
              Contact Info
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant='body2' color='text.secondary' gutterBottom>
                Created
              </Typography>
              <Typography variant='body1'>
                {new Date(contact.createdAt).toLocaleDateString()}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant='body2' color='text.secondary' gutterBottom>
                Last Updated
              </Typography>
              <Typography variant='body1'>
                {new Date(contact.updatedAt).toLocaleDateString()}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant='body2' color='text.secondary' gutterBottom>
                Status
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {contact.isFavorite && (
                  <Chip
                    icon={<Star />}
                    label='Favorite'
                    color='warning'
                    size='small'
                    sx={{ mr: 1 }}
                  />
                )}
                <Chip label='Active' color='success' size='small' />
              </Box>
            </Box>

            {/* Quick Actions */}
            <Typography
              variant='h6'
              gutterBottom
              sx={{ fontWeight: 600, mt: 3 }}
            >
              Quick Actions
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {contact.email && (
                <Button
                  fullWidth
                  variant='outlined'
                  startIcon={<Email />}
                  href={`mailto:${contact.email}`}
                  sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
                >
                  Send Email
                </Button>
              )}

              {contact.phone && (
                <Button
                  fullWidth
                  variant='outlined'
                  startIcon={<Phone />}
                  href={`tel:${contact.phone}`}
                  sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
                >
                  Call
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ContactDetailPage;
