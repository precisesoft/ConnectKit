import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Fab,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  Star,
  StarBorder,
  Email,
  Phone,
  Business,
  Person,
} from '@mui/icons-material';

import { useContacts } from '@hooks/useContacts';
import { Contact } from '@/types/contact.types';
import LoadingSpinner from '@components/common/LoadingSpinner';
import ErrorMessage from '@components/common/ErrorMessage';
import SearchBar from '@components/common/SearchBar';

const ContactsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  // Initialize filters from URL params
  const initialFilters = {
    search: searchParams.get('search') || '',
    tags: searchParams.getAll('tags'),
    isFavorite: searchParams.get('filter') === 'favorites' ? true : undefined,
    company: searchParams.get('company') || undefined,
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '12'),
    sortBy: (searchParams.get('sortBy') as any) || 'firstName',
    sortOrder: (searchParams.get('sortOrder') as any) || 'asc',
  };

  const {
    contacts,
    pagination: _pagination,
    totalContacts,
    isLoading,
    hasError,
    toggleFavorite,
    deleteContact,
    updateFilters,
    refetchContacts,
    isTogglingFavorite,
    isDeleting,
  } = useContacts(initialFilters);

  // Handle menu actions
  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    contactId: string
  ) => {
    setMenuAnchor(event.currentTarget);
    setSelectedContact(contactId);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedContact(null);
  };

  const handleEditContact = () => {
    if (selectedContact) {
      navigate(`/contacts/${selectedContact}/edit`);
    }
    handleMenuClose();
  };

  const handleDeleteContact = () => {
    if (selectedContact) {
      deleteContact(selectedContact);
    }
    handleMenuClose();
  };

  const handleToggleFavorite = () => {
    if (selectedContact) {
      toggleFavorite(selectedContact);
    }
    handleMenuClose();
  };

  const handleContactClick = (contactId: string) => {
    navigate(`/contacts/${contactId}`);
  };

  const handleAddContact = () => {
    navigate('/contacts/new');
  };

  const handleSearch = (query: string) => {
    updateFilters({ search: query, page: 1 });
    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    if (query) {
      newParams.set('search', query);
    } else {
      newParams.delete('search');
    }
    newParams.set('page', '1');
    navigate(`?${newParams.toString()}`, { replace: true });
  };

  if (isLoading) {
    return <LoadingSpinner message='Loading contacts...' />;
  }

  if (hasError) {
    return (
      <ErrorMessage
        title='Failed to load contacts'
        message='There was an error loading your contacts. Please try again.'
        onRetry={refetchContacts}
        showHomeButton
      />
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant='h4' component='h1' sx={{ fontWeight: 600 }}>
            Contacts
          </Typography>
          {!isMobile && (
            <Button
              variant='contained'
              startIcon={<Add />}
              onClick={handleAddContact}
              sx={{ textTransform: 'none' }}
            >
              Add Contact
            </Button>
          )}
        </Box>

        {/* Search and Filters */}
        <Box sx={{ mb: 2 }}>
          <SearchBar
            placeholder='Search contacts...'
            onSearch={handleSearch}
            fullWidth
            autoFocus={!!initialFilters.search}
          />
        </Box>

        {/* Results Summary */}
        <Typography variant='body2' color='text.secondary'>
          {totalContacts === 0
            ? 'No contacts found'
            : `Showing ${contacts.length} of ${totalContacts} contact${totalContacts !== 1 ? 's' : ''}`}
        </Typography>
      </Box>

      {/* Contacts Grid */}
      {contacts.length > 0 ? (
        <Grid container spacing={2}>
          {contacts.map((contact: Contact) => {
            const _isMenuOpen = selectedContact === contact.id;

            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={contact.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4],
                    },
                  }}
                >
                  <CardContent
                    sx={{ pb: 2 }}
                    onClick={() => handleContactClick(contact.id)}
                  >
                    {/* Header with menu */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 2,
                      }}
                    >
                      <Avatar
                        src={contact.avatar}
                        sx={{
                          width: 56,
                          height: 56,
                          bgcolor: 'primary.main',
                          fontSize: '1.5rem',
                        }}
                      >
                        {contact.firstName[0]}
                        {contact.lastName[0]}
                      </Avatar>

                      <IconButton
                        size='small'
                        onClick={e => {
                          e.stopPropagation();
                          handleMenuClick(e, contact.id);
                        }}
                        disabled={isTogglingFavorite || isDeleting}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>

                    {/* Contact Info */}
                    <Typography
                      variant='h6'
                      gutterBottom
                      sx={{ fontWeight: 600, fontSize: '1.1rem' }}
                    >
                      {contact.firstName} {contact.lastName}
                    </Typography>

                    {contact.jobTitle && (
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        gutterBottom
                      >
                        {contact.jobTitle}
                      </Typography>
                    )}

                    {contact.company && (
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                      >
                        <Business
                          sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }}
                        />
                        <Typography variant='body2' color='text.secondary'>
                          {contact.company}
                        </Typography>
                      </Box>
                    )}

                    {contact.email && (
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                      >
                        <Email
                          sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }}
                        />
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          sx={{ wordBreak: 'break-word' }}
                        >
                          {contact.email}
                        </Typography>
                      </Box>
                    )}

                    {contact.phone && (
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
                      >
                        <Phone
                          sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }}
                        />
                        <Typography variant='body2' color='text.secondary'>
                          {contact.phone}
                        </Typography>
                      </Box>
                    )}

                    {/* Tags and Favorite */}
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 0.5,
                        alignItems: 'center',
                      }}
                    >
                      {contact.isFavorite && (
                        <Star sx={{ color: 'warning.main', fontSize: 20 }} />
                      )}

                      {contact.tags &&
                        contact.tags
                          .slice(0, 2)
                          .map((tag: string) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size='small'
                              variant='outlined'
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          ))}

                      {contact.tags && contact.tags.length > 2 && (
                        <Chip
                          label={`+${contact.tags.length - 2}`}
                          size='small'
                          variant='outlined'
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        // Empty State
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
          }}
        >
          <Person
            sx={{
              fontSize: 120,
              color: 'text.secondary',
              opacity: 0.3,
              mb: 2,
            }}
          />
          <Typography variant='h5' gutterBottom color='text.secondary'>
            No contacts found
          </Typography>
          <Typography variant='body1' color='text.secondary' sx={{ mb: 3 }}>
            {initialFilters.search
              ? 'Try adjusting your search terms or filters'
              : 'Get started by adding your first contact'}
          </Typography>
          <Button
            variant='contained'
            size='large'
            startIcon={<Add />}
            onClick={handleAddContact}
            sx={{ textTransform: 'none' }}
          >
            Add Your First Contact
          </Button>
        </Box>
      )}

      {/* Floating Action Button (Mobile) */}
      {isMobile && (
        <Fab
          color='primary'
          aria-label='add contact'
          onClick={handleAddContact}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
        >
          <Add />
        </Fab>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleEditContact}>
          <ListItemIcon>
            <Edit fontSize='small' />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleToggleFavorite}>
          <ListItemIcon>
            {selectedContact &&
            contacts.find((c: Contact) => c.id === selectedContact)
              ?.isFavorite ? (
              <StarBorder fontSize='small' />
            ) : (
              <Star fontSize='small' />
            )}
          </ListItemIcon>
          <ListItemText>
            {selectedContact &&
            contacts.find((c: Contact) => c.id === selectedContact)?.isFavorite
              ? 'Remove from Favorites'
              : 'Add to Favorites'}
          </ListItemText>
        </MenuItem>

        <MenuItem onClick={handleDeleteContact} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Delete fontSize='small' color='error' />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ContactsPage;
