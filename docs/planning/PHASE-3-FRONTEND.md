# Phase 3: Frontend Development - Implementation Plan

## Overview

This document outlines the comprehensive frontend implementation plan for ConnectKit Phase 3, focusing on building a modern, scalable, and maintainable React 18 application with TypeScript, Material-UI, and comprehensive Test-Driven Development (TDD) practices.

## Architecture Overview

### Modern React 18 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Pages/Views   │  │   Components    │  │    Layouts      │ │
│  │   Route Level   │  │   Atomic Design │  │   Shell/Chrome  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Custom Hooks   │  │  State Stores   │  │     Services    │ │
│  │  Business Logic │  │    Zustand      │  │   API Clients   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  React Query    │  │     Types       │  │   Utilities     │ │
│  │  Server State   │  │   TypeScript    │  │   Helpers       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
frontend/
├── src/
│   ├── components/              # Atomic design components
│   │   ├── atoms/              # Basic building blocks
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.test.tsx
│   │   │   │   ├── Button.stories.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Input/
│   │   │   ├── Loading/
│   │   │   └── index.ts
│   │   ├── molecules/          # Component combinations
│   │   │   ├── ContactCard/
│   │   │   ├── SearchBox/
│   │   │   ├── FormField/
│   │   │   └── index.ts
│   │   ├── organisms/          # Complex components
│   │   │   ├── ContactList/
│   │   │   ├── ContactForm/
│   │   │   ├── Navigation/
│   │   │   └── index.ts
│   │   └── templates/          # Page layouts
│   │       ├── DashboardLayout/
│   │       ├── AuthLayout/
│   │       └── index.ts
│   ├── pages/                  # Route components
│   │   ├── Dashboard/
│   │   ├── Contacts/
│   │   ├── Auth/
│   │   └── Settings/
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useContacts.ts
│   │   ├── useLocalStorage.ts
│   │   └── index.ts
│   ├── stores/                 # Zustand state stores
│   │   ├── authStore.ts
│   │   ├── contactStore.ts
│   │   ├── uiStore.ts
│   │   └── index.ts
│   ├── services/               # API and external services
│   │   ├── api/
│   │   │   ├── auth.api.ts
│   │   │   ├── contacts.api.ts
│   │   │   └── index.ts
│   │   ├── http/
│   │   │   ├── client.ts
│   │   │   ├── interceptors.ts
│   │   │   └── index.ts
│   │   └── workers/
│   │       ├── sw.ts
│   │       └── background-sync.ts
│   ├── types/                  # TypeScript definitions
│   │   ├── api.types.ts
│   │   ├── contact.types.ts
│   │   ├── user.types.ts
│   │   └── index.ts
│   ├── utils/                  # Utility functions
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   ├── constants.ts
│   │   └── index.ts
│   ├── styles/                 # Global styles and theme
│   │   ├── theme.ts
│   │   ├── global.css
│   │   └── variables.css
│   ├── assets/                 # Static assets
│   │   ├── icons/
│   │   ├── images/
│   │   └── fonts/
│   ├── tests/                  # Test utilities and setup
│   │   ├── setup.ts
│   │   ├── mocks/
│   │   │   ├── handlers.ts
│   │   │   ├── server.ts
│   │   │   └── fixtures.ts
│   │   └── utils/
│   │       ├── test-utils.tsx
│   │       └── custom-matchers.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── public/                     # Static public assets
│   ├── manifest.json
│   ├── sw.js
│   └── icons/
├── docs/                       # Component documentation
├── .storybook/                 # Storybook configuration
├── playwright.config.ts        # E2E test configuration
├── vitest.config.ts           # Unit test configuration
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
└── package.json
```

## Core Technologies and Stack

### Frontend Framework
- **React 18.2**: Latest stable with Concurrent Features
- **TypeScript 5.3**: Strict mode for type safety
- **Vite 5.0**: Fast build tool with HMR

### UI Library and Styling
- **Material-UI v5.15**: Component library with theming
- **Emotion**: CSS-in-JS solution
- **Material Icons**: Comprehensive icon set
- **Custom Design System**: Extended MUI theme

### State Management
- **Zustand 4.4**: Lightweight state management
- **React Query v5**: Server state management and caching
- **React Hook Form**: Form state and validation

### Routing and Navigation
- **React Router v6**: Declarative routing
- **Route-based code splitting**: Lazy loading
- **Protected routes**: Authentication guards

### Development and Testing
- **Vitest**: Fast unit testing framework
- **React Testing Library**: Component testing
- **Playwright**: End-to-end testing
- **Storybook**: Component documentation
- **MSW**: API mocking for tests

## Atomic Design Component Architecture

### Atoms (Basic Building Blocks)

```typescript
// src/components/atoms/Button/Button.tsx
import React from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';
import { styled } from '@mui/material/styles';

export interface ButtonProps extends Omit<MuiButtonProps, 'color'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  fullWidth?: boolean;
}

const StyledButton = styled(MuiButton, {
  shouldForwardProp: (prop) => !['isLoading'].includes(prop as string),
})<ButtonProps>(({ theme, variant, isLoading }) => ({
  // Custom styling based on variant
  ...(variant === 'primary' && {
    backgroundColor: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  }),
  ...(variant === 'danger' && {
    backgroundColor: theme.palette.error.main,
    '&:hover': {
      backgroundColor: theme.palette.error.dark,
    },
  }),
  ...(isLoading && {
    opacity: 0.7,
    pointerEvents: 'none',
  }),
}));

export const Button: React.FC<ButtonProps> = ({
  children,
  isLoading,
  disabled,
  ...props
}) => {
  return (
    <StyledButton
      {...props}
      disabled={disabled || isLoading}
      isLoading={isLoading}
    >
      {isLoading ? 'Loading...' : children}
    </StyledButton>
  );
};
```

### Molecules (Component Combinations)

```typescript
// src/components/molecules/ContactCard/ContactCard.tsx
import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Avatar,
  Chip,
  Box,
} from '@mui/material';
import { Button } from '../../atoms/Button';
import { Contact } from '../../../types/contact.types';

interface ContactCardProps {
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: string) => void;
  onView: (contact: Contact) => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  onEdit,
  onDelete,
  onView,
}) => {
  const fullName = `${contact.firstName} ${contact.lastName}`;
  const initials = `${contact.firstName[0]}${contact.lastName[0]}`;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          boxShadow: (theme) => theme.shadows[8],
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
            {initials}
          </Avatar>
          <Box>
            <Typography variant="h6" component="h3">
              {fullName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {contact.title} at {contact.company}
            </Typography>
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {contact.email[0]}
        </Typography>
        
        <Box mt={2}>
          {contact.tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              variant="outlined"
              sx={{ mr: 0.5, mb: 0.5 }}
            />
          ))}
        </Box>
      </CardContent>
      
      <CardActions>
        <Button size="small" onClick={() => onView(contact)}>
          View
        </Button>
        <Button size="small" onClick={() => onEdit(contact)}>
          Edit
        </Button>
        <Button
          size="small"
          variant="danger"
          onClick={() => onDelete(contact.id)}
        >
          Delete
        </Button>
      </CardActions>
    </Card>
  );
};
```

### Organisms (Complex Components)

```typescript
// src/components/organisms/ContactList/ContactList.tsx
import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  TextField,
  InputAdornment,
  Pagination,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { ContactCard } from '../../molecules/ContactCard';
import { Loading } from '../../atoms/Loading';
import { useContacts } from '../../../hooks/useContacts';
import { Contact } from '../../../types/contact.types';

interface ContactListProps {
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (contactId: string) => void;
  onViewContact: (contact: Contact) => void;
}

export const ContactList: React.FC<ContactListProps> = ({
  onEditContact,
  onDeleteContact,
  onViewContact,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const limit = 12;

  const {
    data: contactsData,
    isLoading,
    error,
  } = useContacts({
    search: searchTerm,
    page,
    limit,
  });

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <Typography variant="h6" color="error">
        Error loading contacts: {error.message}
      </Typography>
    );
  }

  const { contacts, totalPages } = contactsData || {
    contacts: [],
    totalPages: 0,
  };

  return (
    <Box>
      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {contacts.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            {searchTerm ? 'No contacts found' : 'No contacts yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {!searchTerm && 'Start by adding your first contact'}
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {contacts.map((contact) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={contact.id}>
                <ContactCard
                  contact={contact}
                  onEdit={onEditContact}
                  onDelete={onDeleteContact}
                  onView={onViewContact}
                />
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};
```

## State Management Architecture

### Zustand Store Structure

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User } from '../types/user.types';
import { authApi } from '../services/api/auth.api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Actions
        login: async (email: string, password: string) => {
          set({ isLoading: true, error: null });
          try {
            const response = await authApi.login({ email, password });
            set({
              user: response.user,
              token: response.token,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            set({
              error: error.message,
              isLoading: false,
              isAuthenticated: false,
            });
            throw error;
          }
        },

        logout: () => {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
          });
        },

        register: async (userData) => {
          set({ isLoading: true, error: null });
          try {
            const response = await authApi.register(userData);
            set({
              user: response.user,
              token: response.token,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            set({
              error: error.message,
              isLoading: false,
            });
            throw error;
          }
        },

        refreshToken: async () => {
          const { token } = get();
          if (!token) return;

          try {
            const response = await authApi.refreshToken(token);
            set({
              token: response.token,
              user: response.user,
            });
          } catch (error) {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              error: 'Session expired',
            });
          }
        },

        clearError: () => set({ error: null }),
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          token: state.token,
          user: state.user,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);
```

### React Query Integration

```typescript
// src/hooks/useContacts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsApi } from '../services/api/contacts.api';
import { Contact, ContactCreateData } from '../types/contact.types';

export const useContacts = (params?: {
  search?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['contacts', params],
    queryFn: () => contactsApi.getContacts(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useContact = (id: string) => {
  return useQuery({
    queryKey: ['contacts', id],
    queryFn: () => contactsApi.getContact(id),
    enabled: !!id,
  });
};

export const useCreateContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ContactCreateData) => contactsApi.createContact(data),
    onSuccess: () => {
      // Invalidate contacts list
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
};

export const useUpdateContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Contact> }) =>
      contactsApi.updateContact(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate both the specific contact and the contacts list
      queryClient.invalidateQueries({ queryKey: ['contacts', id] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
};

export const useDeleteContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contactsApi.deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
};
```

## React Hook Form Integration

```typescript
// src/components/organisms/ContactForm/ContactForm.tsx
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  TextField,
  Grid,
  Typography,
  Chip,
  Autocomplete,
} from '@mui/material';
import { Button } from '../../atoms/Button';
import { Contact, ContactCreateData } from '../../../types/contact.types';

const contactSchema = yup.object().shape({
  firstName: yup
    .string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters'),
  lastName: yup
    .string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters'),
  email: yup
    .array()
    .of(yup.string().email('Invalid email format'))
    .min(1, 'At least one email is required'),
  phone: yup.array().of(yup.string()),
  company: yup.string(),
  title: yup.string(),
  tags: yup.array().of(yup.string()),
});

interface ContactFormProps {
  contact?: Contact;
  onSubmit: (data: ContactCreateData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  contact,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
  } = useForm<ContactCreateData>({
    resolver: yupResolver(contactSchema),
    defaultValues: contact || {
      firstName: '',
      lastName: '',
      email: [''],
      phone: [''],
      company: '',
      title: '',
      tags: [],
    },
    mode: 'onChange',
  });

  const handleFormSubmit = (data: ContactCreateData) => {
    // Filter out empty emails and phones
    const cleanedData = {
      ...data,
      email: data.email.filter((email) => email.trim() !== ''),
      phone: data.phone.filter((phone) => phone.trim() !== ''),
    };
    onSubmit(cleanedData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
      <Typography variant="h5" gutterBottom>
        {contact ? 'Edit Contact' : 'Add New Contact'}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <Controller
            name="firstName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="First Name"
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
                required
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="lastName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Last Name"
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
                required
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="email.0"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Primary Email"
                type="email"
                error={!!errors.email?.[0]}
                helperText={errors.email?.[0]?.message}
                required
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="phone.0"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Primary Phone"
                type="tel"
                error={!!errors.phone?.[0]}
                helperText={errors.phone?.[0]?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="company"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Company"
                error={!!errors.company}
                helperText={errors.company?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Job Title"
                error={!!errors.title}
                helperText={errors.title?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="tags"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={value || []}
                onChange={(_, newValue) => onChange(newValue)}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                      key={index}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tags"
                    placeholder="Add tags..."
                    helperText="Press enter to add tags"
                  />
                )}
              />
            )}
          />
        </Grid>
      </Grid>

      <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={!isValid || !isDirty}
          isLoading={isLoading}
        >
          {contact ? 'Update Contact' : 'Create Contact'}
        </Button>
      </Box>
    </Box>
  );
};
```

## Material-UI Theming and Customization

```typescript
// src/styles/theme.ts
import { createTheme, ThemeOptions } from '@mui/material/styles';
import { Components } from '@mui/material/styles/components';

declare module '@mui/material/styles' {
  interface Palette {
    gradient: {
      primary: string;
      secondary: string;
    };
  }

  interface PaletteOptions {
    gradient?: {
      primary?: string;
      secondary?: string;
    };
  }

  interface Theme {
    custom: {
      layout: {
        headerHeight: number;
        sidebarWidth: number;
        sidebarCollapsedWidth: number;
      };
    };
  }

  interface ThemeOptions {
    custom?: {
      layout?: {
        headerHeight?: number;
        sidebarWidth?: number;
        sidebarCollapsedWidth?: number;
      };
    };
  }
}

const baseThemeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
      contrastText: '#ffffff',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
    },
    info: {
      main: '#0288d1',
      light: '#03dac6',
      dark: '#01579b',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    gradient: {
      primary: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
      secondary: 'linear-gradient(45deg, #dc004e 30%, #ff5983 90%)',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.57,
    },
  },
  shape: {
    borderRadius: 8,
  },
  custom: {
    layout: {
      headerHeight: 64,
      sidebarWidth: 280,
      sidebarCollapsedWidth: 64,
    },
  },
};

const components: Components = {
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 600,
        borderRadius: 8,
        padding: '8px 24px',
      },
      sizeSmall: {
        padding: '4px 16px',
        fontSize: '0.875rem',
      },
      sizeLarge: {
        padding: '12px 32px',
        fontSize: '1rem',
      },
    },
  },
  MuiTextField: {
    defaultProps: {
      variant: 'outlined',
    },
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        '&:hover': {
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        fontWeight: 500,
      },
    },
  },
};

export const lightTheme = createTheme({
  ...baseThemeOptions,
  components,
});

export const darkTheme = createTheme({
  ...baseThemeOptions,
  palette: {
    ...baseThemeOptions.palette,
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
  components,
});
```

## Performance Optimization Techniques

### Code Splitting and Lazy Loading

```typescript
// src/App.tsx
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ErrorBoundary } from 'react-error-boundary';
import { lightTheme } from './styles/theme';
import { Loading } from './components/atoms/Loading';
import { ErrorFallback } from './components/atoms/ErrorFallback';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Lazy load pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Contacts = React.lazy(() => import('./pages/Contacts'));
const Login = React.lazy(() => import('./pages/Auth/Login'));
const Register = React.lazy(() => import('./pages/Auth/Register'));
const Settings = React.lazy(() => import('./pages/Settings'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={lightTheme}>
          <CssBaseline />
          <Router>
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/contacts"
                  element={
                    <ProtectedRoute>
                      <Contacts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Suspense>
          </Router>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
```

### Memoization and Optimization

```typescript
// src/components/molecules/ContactCard/ContactCard.tsx (optimized version)
import React, { memo } from 'react';
import { Contact } from '../../../types/contact.types';

interface ContactCardProps {
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: string) => void;
  onView: (contact: Contact) => void;
}

export const ContactCard = memo<ContactCardProps>(
  ({ contact, onEdit, onDelete, onView }) => {
    const handleEdit = React.useCallback(() => {
      onEdit(contact);
    }, [contact, onEdit]);

    const handleDelete = React.useCallback(() => {
      onDelete(contact.id);
    }, [contact.id, onDelete]);

    const handleView = React.useCallback(() => {
      onView(contact);
    }, [contact, onView]);

    // Component implementation...
  },
  (prevProps, nextProps) => {
    return (
      prevProps.contact.id === nextProps.contact.id &&
      prevProps.contact.updatedAt === nextProps.contact.updatedAt
    );
  }
);
```

## Accessibility Standards (WCAG 2.1 AA)

### Accessibility Implementation

```typescript
// src/components/atoms/Button/Button.tsx (with accessibility)
import React from 'react';
import { Button as MuiButton } from '@mui/material';
import { visuallyHidden } from '@mui/utils';

export interface ButtonProps extends MuiButtonProps {
  ariaLabel?: string;
  ariaDescribedBy?: string;
  srOnlyText?: string; // Screen reader only text
}

export const Button: React.FC<ButtonProps> = ({
  children,
  ariaLabel,
  ariaDescribedBy,
  srOnlyText,
  ...props
}) => {
  return (
    <MuiButton
      {...props}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
    >
      {children}
      {srOnlyText && <span style={visuallyHidden}>{srOnlyText}</span>}
    </MuiButton>
  );
};
```

## PWA Implementation Strategy

### Service Worker Setup

```typescript
// src/services/workers/sw.ts
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope;

// Precache all assets
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Cache API responses
registerRoute(
  ({ request }) => request.destination === 'document',
  new NetworkFirst({
    cacheName: 'pages',
    plugins: [
      {
        cacheKeyWillBeUsed: async ({ request }) => `${request.url}?version=1`,
      },
    ],
  })
);

// Cache API calls
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3,
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          return response.status === 200 ? response : null;
        },
      },
    ],
  })
);

// Cache static assets
registerRoute(
  ({ request }) =>
    request.destination === 'image' ||
    request.destination === 'script' ||
    request.destination === 'style',
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          return response.status === 200 ? response : null;
        },
      },
    ],
  })
);

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'contact-sync') {
    event.waitUntil(syncOfflineActions());
  }
});

async function syncOfflineActions() {
  // Handle offline contact operations
  const offlineActions = await getOfflineActions();
  for (const action of offlineActions) {
    try {
      await executeAction(action);
      await removeOfflineAction(action.id);
    } catch (error) {
      console.error('Failed to sync action:', error);
    }
  }
}
```

### Manifest Configuration

```json
// public/manifest.json
{
  "name": "ConnectKit",
  "short_name": "ConnectKit",
  "description": "Enterprise Contact Management Platform",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1976d2",
  "background_color": "#ffffff",
  "orientation": "portrait-primary",
  "categories": ["productivity", "business"],
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/desktop.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    },
    {
      "src": "/screenshots/mobile.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ]
}
```

## Error Boundary Implementation

```typescript
// src/components/atoms/ErrorBoundary/ErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { logger } from '../../../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    logger.error('ErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="400px"
          p={3}
        >
          <Alert severity="error" sx={{ mb: 3, width: '100%', maxWidth: 600 }}>
            <Typography variant="h6" gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {this.state.error?.message || 'An unexpected error occurred'}
            </Typography>
          </Alert>

          <Box display="flex" gap={2}>
            <Button variant="contained" onClick={this.handleReset}>
              Try Again
            </Button>
            <Button variant="outlined" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}
```

## Build Configuration

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'ConnectKit',
        short_name: 'ConnectKit',
        description: 'Enterprise Contact Management Platform',
        theme_color: '#1976d2',
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.connectkit\.com\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/services': resolve(__dirname, './src/services'),
      '@/stores': resolve(__dirname, './src/stores'),
      '@/types': resolve(__dirname, './src/types'),
      '@/utils': resolve(__dirname, './src/utils'),
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@mui/material', '@mui/icons-material', '@emotion/react'],
          state: ['zustand', '@tanstack/react-query'],
          forms: ['react-hook-form', '@hookform/resolvers', 'yup'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3000,
  },
});
```

## Development Scripts

```json
// package.json scripts section
{
  "scripts": {
    "dev": "vite --mode development",
    "build": "tsc && vite build",
    "build:staging": "tsc && vite build --mode staging",
    "build:production": "tsc && vite build --mode production",
    "preview": "vite preview",
    "test": "vitest",
    "test:unit": "vitest run --coverage",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:watch": "vitest watch",
    "test:ui": "vitest --ui",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,json,css}\"",
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",
    "analyze": "vite-bundle-visualizer",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "chromatic": "chromatic --project-token=<project-token>",
    "prepare": "husky install"
  }
}
```

## Implementation Timeline

### Phase 3.1: Foundation Setup (Week 1-2)
- Project structure setup with atomic design pattern
- Base components (atoms) implementation
- Theme configuration and design system
- Development tooling setup (ESLint, Prettier, Husky)
- Basic routing and layout structure

### Phase 3.2: Authentication & Navigation (Week 3-4)
- Authentication pages and forms
- Protected route implementation
- Navigation components and sidebar
- User state management with Zustand
- Login/logout functionality with JWT

### Phase 3.3: Contact Management Core (Week 5-7)
- Contact list and card components
- Contact form with validation
- Search and filtering functionality
- CRUD operations with React Query
- Error handling and loading states

### Phase 3.4: Advanced Features (Week 8-10)
- Dashboard with analytics
- Advanced search and filters
- Bulk operations (import/export)
- Settings and profile management
- Notification system

### Phase 3.5: Performance & PWA (Week 11-12)
- Performance optimization and lazy loading
- PWA implementation with service worker
- Offline functionality and background sync
- Bundle analysis and optimization
- Accessibility improvements

### Phase 3.6: Testing & Polish (Week 13-14)
- Comprehensive test coverage (unit, integration, E2E)
- Visual regression testing
- Performance testing and optimization
- Documentation completion
- Final bug fixes and polish

## Quality Assurance

### Code Quality Standards
- **TypeScript**: Strict mode enabled with comprehensive type coverage
- **ESLint**: Enforced code standards with React and accessibility rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality gates

### Performance Benchmarks
- **Initial Load**: < 3 seconds (3G connection)
- **Largest Contentful Paint**: < 2.5 seconds
- **First Input Delay**: < 100ms
- **Cumulative Layout Shift**: < 0.1
- **Bundle Size**: < 1MB gzipped

### Browser Support
- **Modern Browsers**: Chrome 90+, Firefox 90+, Safari 14+, Edge 90+
- **Mobile**: iOS 14+, Android 10+
- **Progressive Enhancement**: Graceful degradation for older browsers

This comprehensive frontend implementation plan provides a solid foundation for building ConnectKit's modern, scalable, and maintainable React application with a strong focus on performance, accessibility, and user experience.