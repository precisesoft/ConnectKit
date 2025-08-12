# Component Specification Document

## Overview

This document provides comprehensive specifications for all React components in ConnectKit, organized using the Atomic Design methodology. Each component includes TypeScript interfaces, props specifications, usage examples, testing requirements, and accessibility considerations.

## Atomic Design Component Hierarchy

```
Components/
├── atoms/              # Basic building blocks
├── molecules/          # Simple component combinations  
├── organisms/          # Complex component assemblies
└── templates/          # Page-level layouts
```

## Component Template Structure

Each component follows this standardized structure:

```
ComponentName/
├── ComponentName.tsx           # Main component implementation
├── ComponentName.test.tsx      # Unit tests
├── ComponentName.stories.tsx   # Storybook stories
├── ComponentName.types.ts      # TypeScript interfaces
├── index.ts                   # Barrel export
└── styles.ts                  # Styled components (if needed)
```

---

## Atoms (Basic Building Blocks)

### Button Component

```typescript
// src/components/atoms/Button/Button.types.ts
export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  /** Loading state */
  isLoading?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Icon to display before text */
  startIcon?: React.ReactNode;
  /** Icon to display after text */
  endIcon?: React.ReactNode;
  /** ARIA label for accessibility */
  ariaLabel?: string;
  /** ARIA described by */
  ariaDescribedBy?: string;
  /** Screen reader only text */
  srOnlyText?: string;
}
```

**Implementation:**
```typescript
// src/components/atoms/Button/Button.tsx
import React from 'react';
import { Button as MuiButton, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ButtonProps } from './Button.types';

const StyledButton = styled(MuiButton, {
  shouldForwardProp: (prop) => !['isLoading'].includes(prop as string),
})<ButtonProps>(({ theme, variant, size, isLoading, fullWidth }) => ({
  textTransform: 'none',
  fontWeight: 600,
  borderRadius: 8,
  position: 'relative',
  
  // Size variants
  ...(size === 'small' && {
    padding: '4px 16px',
    fontSize: '0.875rem',
    minHeight: 32,
  }),
  ...(size === 'medium' && {
    padding: '8px 24px',
    fontSize: '1rem',
    minHeight: 40,
  }),
  ...(size === 'large' && {
    padding: '12px 32px',
    fontSize: '1.125rem',
    minHeight: 48,
  }),
  
  // Loading state
  ...(isLoading && {
    color: 'transparent',
    pointerEvents: 'none',
  }),
  
  // Full width
  ...(fullWidth && {
    width: '100%',
  }),
  
  // Variant styles
  ...(variant === 'primary' && {
    background: theme.palette.gradient.primary,
    color: theme.palette.primary.contrastText,
    border: 'none',
    '&:hover': {
      background: theme.palette.primary.dark,
      boxShadow: theme.shadows[4],
    },
  }),
  
  ...(variant === 'danger' && {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.error.dark,
    },
  }),
  
  ...(variant === 'ghost' && {
    backgroundColor: 'transparent',
    color: theme.palette.text.primary,
    border: 'none',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  }),
  
  ...(variant === 'outline' && {
    backgroundColor: 'transparent',
    color: theme.palette.primary.main,
    border: `1px solid ${theme.palette.primary.main}`,
    '&:hover': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
    },
  }),
}));

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  disabled,
  startIcon,
  endIcon,
  ariaLabel,
  ariaDescribedBy,
  srOnlyText,
  ...props
}) => {
  return (
    <StyledButton
      {...props}
      variant={undefined} // Remove MUI variant
      size={undefined}    // Remove MUI size
      disabled={disabled || isLoading}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      isLoading={isLoading}
    >
      {startIcon && !isLoading && startIcon}
      {children}
      {endIcon && !isLoading && endIcon}
      {isLoading && (
        <CircularProgress
          size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'currentColor',
          }}
        />
      )}
      {srOnlyText && (
        <span style={{ position: 'absolute', left: '-10000px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }}>
          {srOnlyText}
        </span>
      )}
    </StyledButton>
  );
};
```

**Usage Examples:**
```typescript
// Basic usage
<Button>Click me</Button>

// With variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="danger">Delete</Button>
<Button variant="ghost">Cancel</Button>
<Button variant="outline">Learn More</Button>

// With loading
<Button isLoading>Submitting...</Button>

// With icons
<Button startIcon={<AddIcon />}>Add Contact</Button>
<Button endIcon={<ArrowForwardIcon />}>Next</Button>

// Accessibility
<Button ariaLabel="Close dialog" srOnlyText="This will close the current dialog">
  <CloseIcon />
</Button>
```

**Test Requirements:**
- [ ] Renders with correct variant styles
- [ ] Shows loading spinner when `isLoading` is true
- [ ] Handles click events properly
- [ ] Disabled state prevents interaction
- [ ] Keyboard navigation works (Enter, Space)
- [ ] ARIA attributes are set correctly
- [ ] Screen reader text is present when provided

---

### Input Component

```typescript
// src/components/atoms/Input/Input.types.ts
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input variant */
  variant?: 'outlined' | 'filled' | 'standard';
  /** Input size */
  size?: 'small' | 'medium' | 'large';
  /** Label text */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Full width input */
  fullWidth?: boolean;
  /** Start adornment */
  startAdornment?: React.ReactNode;
  /** End adornment */
  endAdornment?: React.ReactNode;
  /** Multiline input */
  multiline?: boolean;
  /** Number of rows for multiline */
  rows?: number;
  /** Maximum number of rows for multiline */
  maxRows?: number;
}
```

**Implementation:**
```typescript
// src/components/atoms/Input/Input.tsx
import React, { forwardRef } from 'react';
import { TextField, InputAdornment } from '@mui/material';
import { InputProps } from './Input.types';

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  variant = 'outlined',
  size = 'medium',
  label,
  helperText,
  error = false,
  errorMessage,
  fullWidth = false,
  startAdornment,
  endAdornment,
  multiline = false,
  rows,
  maxRows,
  ...props
}, ref) => {
  const displayHelperText = error ? errorMessage : helperText;

  return (
    <TextField
      {...props}
      ref={ref}
      variant={variant}
      size={size}
      label={label}
      helperText={displayHelperText}
      error={error}
      fullWidth={fullWidth}
      multiline={multiline}
      rows={multiline ? rows : undefined}
      maxRows={multiline ? maxRows : undefined}
      InputProps={{
        ...(startAdornment && {
          startAdornment: <InputAdornment position="start">{startAdornment}</InputAdornment>
        }),
        ...(endAdornment && {
          endAdornment: <InputAdornment position="end">{endAdornment}</InputAdornment>
        }),
        ...props.InputProps,
      }}
    />
  );
});

Input.displayName = 'Input';
```

**Usage Examples:**
```typescript
// Basic input
<Input label="First Name" />

// With validation
<Input 
  label="Email" 
  type="email"
  error={!!errors.email}
  errorMessage={errors.email?.message}
/>

// With adornments
<Input 
  label="Search"
  startAdornment={<SearchIcon />}
  endAdornment={<ClearIcon />}
/>

// Multiline
<Input 
  label="Notes"
  multiline
  rows={4}
  maxRows={8}
/>
```

**Test Requirements:**
- [ ] Renders with correct label and placeholder
- [ ] Shows error state and error message
- [ ] Handles different input types (text, email, password, etc.)
- [ ] Adornments render correctly
- [ ] Multiline functionality works
- [ ] Focus and blur events work
- [ ] Accessibility attributes are correct

---

### Loading Component

```typescript
// src/components/atoms/Loading/Loading.types.ts
export interface LoadingProps {
  /** Loading variant */
  variant?: 'spinner' | 'skeleton' | 'dots' | 'pulse';
  /** Size of the loading indicator */
  size?: 'small' | 'medium' | 'large' | number;
  /** Color of the loading indicator */
  color?: 'primary' | 'secondary' | 'inherit';
  /** Text to display with loading */
  text?: string;
  /** Full screen overlay */
  overlay?: boolean;
  /** Center the loading indicator */
  centered?: boolean;
  /** Skeleton variant specific props */
  skeleton?: {
    variant?: 'text' | 'rectangular' | 'rounded' | 'circular';
    width?: number | string;
    height?: number | string;
    lines?: number;
  };
}
```

**Implementation:**
```typescript
// src/components/atoms/Loading/Loading.tsx
import React from 'react';
import { 
  CircularProgress, 
  LinearProgress, 
  Skeleton, 
  Box, 
  Typography, 
  Backdrop 
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { LoadingProps } from './Loading.types';

const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
`;

const dots = keyframes`
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
`;

const DotsContainer = styled('div')({
  display: 'inline-block',
  position: 'relative',
  width: 64,
  height: 64,
});

const Dot = styled('div')<{ delay: number }>(({ theme, delay }) => ({
  position: 'absolute',
  top: 27,
  width: 10,
  height: 10,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  animation: `${dots} 1.4s infinite ease-in-out both`,
  animationDelay: `${delay}s`,
  '&:nth-of-type(1)': { left: 6 },
  '&:nth-of-type(2)': { left: 26 },
  '&:nth-of-type(3)': { left: 46 },
}));

const PulseBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: `${pulse} 1.5s ease-in-out infinite`,
}));

export const Loading: React.FC<LoadingProps> = ({
  variant = 'spinner',
  size = 'medium',
  color = 'primary',
  text,
  overlay = false,
  centered = false,
  skeleton,
}) => {
  const getSize = () => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'small': return 24;
      case 'large': return 56;
      default: return 40;
    }
  };

  const renderLoading = () => {
    switch (variant) {
      case 'spinner':
        return (
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <CircularProgress size={getSize()} color={color} />
            {text && <Typography variant="body2" color="text.secondary">{text}</Typography>}
          </Box>
        );

      case 'skeleton':
        if (skeleton?.lines && skeleton.lines > 1) {
          return (
            <Box>
              {Array.from({ length: skeleton.lines }).map((_, index) => (
                <Skeleton
                  key={index}
                  variant={skeleton.variant || 'text'}
                  width={skeleton.width}
                  height={skeleton.height}
                  sx={{ mb: index < skeleton.lines! - 1 ? 1 : 0 }}
                />
              ))}
            </Box>
          );
        }
        return (
          <Skeleton
            variant={skeleton?.variant || 'rectangular'}
            width={skeleton?.width || '100%'}
            height={skeleton?.height || 40}
          />
        );

      case 'dots':
        return (
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <DotsContainer>
              <Dot delay={-0.32} />
              <Dot delay={-0.16} />
              <Dot delay={0} />
            </DotsContainer>
            {text && <Typography variant="body2" color="text.secondary">{text}</Typography>}
          </Box>
        );

      case 'pulse':
        return (
          <PulseBox>
            <Typography variant="body1" color="text.secondary">
              {text || 'Loading...'}
            </Typography>
          </PulseBox>
        );

      default:
        return null;
    }
  };

  const content = renderLoading();

  if (overlay) {
    return (
      <Backdrop open sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        {content}
      </Backdrop>
    );
  }

  if (centered) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="200px"
        width="100%"
      >
        {content}
      </Box>
    );
  }

  return content;
};
```

**Usage Examples:**
```typescript
// Basic spinner
<Loading />

// With text
<Loading text="Loading contacts..." />

// Different variants
<Loading variant="skeleton" skeleton={{ lines: 3 }} />
<Loading variant="dots" />
<Loading variant="pulse" text="Please wait..." />

// Overlay loading
<Loading overlay text="Saving..." />

// Skeleton for specific content
<Loading 
  variant="skeleton" 
  skeleton={{
    variant: 'rectangular',
    width: 300,
    height: 200
  }} 
/>
```

**Test Requirements:**
- [ ] Renders correct variant
- [ ] Shows text when provided
- [ ] Overlay mode works
- [ ] Skeleton renders with correct dimensions
- [ ] Accessibility attributes for loading state

---

### Avatar Component

```typescript
// src/components/atoms/Avatar/Avatar.types.ts
export interface AvatarProps {
  /** Avatar size */
  size?: 'small' | 'medium' | 'large' | number;
  /** Source URL for avatar image */
  src?: string;
  /** Alt text for avatar image */
  alt?: string;
  /** Fallback text (initials) */
  children?: React.ReactNode;
  /** Avatar variant */
  variant?: 'circular' | 'rounded' | 'square';
  /** Background color when no image */
  color?: 'primary' | 'secondary' | 'default';
  /** Click handler */
  onClick?: () => void;
  /** Show online status indicator */
  showStatus?: boolean;
  /** Online status */
  status?: 'online' | 'offline' | 'away' | 'busy';
}
```

**Implementation:**
```typescript
// src/components/atoms/Avatar/Avatar.tsx
import React from 'react';
import { Avatar as MuiAvatar, Badge } from '@mui/material';
import { styled } from '@mui/material/styles';
import { AvatarProps } from './Avatar.types';

const StatusBadge = styled(Badge)<{ status: string }>(({ theme, status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'online': return theme.palette.success.main;
      case 'away': return theme.palette.warning.main;
      case 'busy': return theme.palette.error.main;
      default: return theme.palette.grey[400];
    }
  };

  return {
    '& .MuiBadge-badge': {
      backgroundColor: getStatusColor(),
      color: getStatusColor(),
      boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
      '&::after': {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        animation: status === 'online' ? 'ripple 1.2s infinite ease-in-out' : 'none',
        border: '1px solid currentColor',
        content: '""',
      },
    },
    '@keyframes ripple': {
      '0%': {
        transform: 'scale(.8)',
        opacity: 1,
      },
      '100%': {
        transform: 'scale(2.4)',
        opacity: 0,
      },
    },
  };
});

const StyledAvatar = styled(MuiAvatar)<AvatarProps>(({ theme, size, color, onClick }) => {
  const getSize = () => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'small': return 32;
      case 'large': return 64;
      default: return 40;
    }
  };

  const avatarSize = getSize();

  return {
    width: avatarSize,
    height: avatarSize,
    fontSize: avatarSize * 0.4,
    cursor: onClick ? 'pointer' : 'default',
    transition: theme.transitions.create(['transform', 'box-shadow']),
    
    ...(onClick && {
      '&:hover': {
        transform: 'scale(1.05)',
        boxShadow: theme.shadows[4],
      },
    }),
    
    ...(color === 'primary' && {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
    }),
    
    ...(color === 'secondary' && {
      backgroundColor: theme.palette.secondary.main,
      color: theme.palette.secondary.contrastText,
    }),
  };
});

export const Avatar: React.FC<AvatarProps> = ({
  size = 'medium',
  src,
  alt,
  children,
  variant = 'circular',
  color = 'default',
  onClick,
  showStatus = false,
  status = 'offline',
}) => {
  const avatar = (
    <StyledAvatar
      src={src}
      alt={alt}
      variant={variant}
      size={size}
      color={color}
      onClick={onClick}
    >
      {children}
    </StyledAvatar>
  );

  if (showStatus) {
    return (
      <StatusBadge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        variant="dot"
        status={status}
      >
        {avatar}
      </StatusBadge>
    );
  }

  return avatar;
};
```

**Usage Examples:**
```typescript
// Basic avatar with initials
<Avatar>JD</Avatar>

// With image
<Avatar src="/path/to/image.jpg" alt="John Doe" />

// Different sizes
<Avatar size="small">JS</Avatar>
<Avatar size="large">JD</Avatar>
<Avatar size={80}>Custom</Avatar>

// With status
<Avatar showStatus status="online">JD</Avatar>

// Clickable
<Avatar onClick={() => console.log('Avatar clicked')}>
  JD
</Avatar>

// Different variants
<Avatar variant="rounded">JD</Avatar>
<Avatar variant="square">JD</Avatar>
```

**Test Requirements:**
- [ ] Renders initials when no image provided
- [ ] Displays image when src provided
- [ ] Shows correct size for different size props
- [ ] Status indicator appears when showStatus is true
- [ ] Click events work when onClick provided
- [ ] Accessibility attributes are correct

---

## Molecules (Component Combinations)

### SearchBox Component

```typescript
// src/components/molecules/SearchBox/SearchBox.types.ts
export interface SearchBoxProps {
  /** Placeholder text */
  placeholder?: string;
  /** Search value */
  value?: string;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Search handler */
  onSearch?: (value: string) => void;
  /** Clear handler */
  onClear?: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Show search suggestions */
  showSuggestions?: boolean;
  /** Search suggestions */
  suggestions?: string[];
  /** Debounce delay in milliseconds */
  debounceDelay?: number;
  /** Auto focus */
  autoFocus?: boolean;
}
```

**Implementation:**
```typescript
// src/components/molecules/SearchBox/SearchBox.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Box, 
  InputAdornment, 
  IconButton, 
  Popper, 
  Paper, 
  List, 
  ListItem, 
  ListItemText,
  ClickAwayListener
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import { Input } from '../../atoms/Input/Input';
import { Loading } from '../../atoms/Loading/Loading';
import { useDebounce } from '../../../hooks/useDebounce';
import { SearchBoxProps } from './SearchBox.types';

export const SearchBox: React.FC<SearchBoxProps> = ({
  placeholder = 'Search...',
  value = '',
  onChange,
  onSearch,
  onClear,
  isLoading = false,
  disabled = false,
  fullWidth = true,
  showSuggestions = false,
  suggestions = [],
  debounceDelay = 300,
  autoFocus = false,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  const debouncedValue = useDebounce(localValue, debounceDelay);

  // Trigger search when debounced value changes
  useEffect(() => {
    if (debouncedValue !== value) {
      onSearch?.(debouncedValue);
    }
  }, [debouncedValue, onSearch, value]);

  // Sync external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setLocalValue(newValue);
    onChange?.(newValue);
    
    if (showSuggestions && newValue) {
      setShowSuggestionsList(true);
    } else {
      setShowSuggestionsList(false);
    }
  }, [onChange, showSuggestions]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    setShowSuggestionsList(false);
    onChange?.('');
    onClear?.();
    inputRef.current?.focus();
  }, [onChange, onClear]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onSearch?.(localValue);
      setShowSuggestionsList(false);
    } else if (event.key === 'Escape') {
      setShowSuggestionsList(false);
      inputRef.current?.blur();
    }
  }, [localValue, onSearch]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setLocalValue(suggestion);
    onChange?.(suggestion);
    onSearch?.(suggestion);
    setShowSuggestionsList(false);
    inputRef.current?.focus();
  }, [onChange, onSearch]);

  const handleClickAway = useCallback(() => {
    setShowSuggestionsList(false);
  }, []);

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(localValue.toLowerCase())
  );

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box ref={anchorRef} position="relative">
        <Input
          ref={inputRef}
          fullWidth={fullWidth}
          placeholder={placeholder}
          value={localValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoFocus={autoFocus}
          startAdornment={
            <SearchIcon color={disabled ? 'disabled' : 'action'} />
          }
          endAdornment={
            <>
              {isLoading && (
                <Loading variant="spinner" size="small" />
              )}
              {localValue && !isLoading && (
                <IconButton
                  size="small"
                  onClick={handleClear}
                  disabled={disabled}
                  aria-label="Clear search"
                >
                  <ClearIcon />
                </IconButton>
              )}
            </>
          }
        />
        
        {showSuggestions && showSuggestionsList && filteredSuggestions.length > 0 && (
          <Popper
            open={true}
            anchorEl={anchorRef.current}
            placement="bottom-start"
            style={{ zIndex: 1300, width: anchorRef.current?.clientWidth }}
          >
            <Paper elevation={4}>
              <List dense>
                {filteredSuggestions.map((suggestion, index) => (
                  <ListItem
                    key={`${suggestion}-${index}`}
                    button
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <ListItemText primary={suggestion} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Popper>
        )}
      </Box>
    </ClickAwayListener>
  );
};
```

**Usage Examples:**
```typescript
// Basic search
<SearchBox 
  placeholder="Search contacts..."
  onSearch={(value) => console.log('Searching:', value)}
/>

// With suggestions
<SearchBox 
  placeholder="Search..."
  showSuggestions
  suggestions={['John Doe', 'Jane Smith', 'Bob Johnson']}
  onSearch={handleSearch}
/>

// Controlled
<SearchBox 
  value={searchTerm}
  onChange={setSearchTerm}
  onSearch={performSearch}
  isLoading={isSearching}
/>
```

**Test Requirements:**
- [ ] Triggers search on Enter key
- [ ] Debounces input changes
- [ ] Shows and hides suggestions
- [ ] Clear button works
- [ ] Loading state displays correctly
- [ ] Keyboard navigation works
- [ ] Click away closes suggestions

---

### ContactCard Component

```typescript
// src/components/molecules/ContactCard/ContactCard.types.ts
import { Contact } from '../../../types/contact.types';

export interface ContactCardProps {
  /** Contact data */
  contact: Contact;
  /** Edit handler */
  onEdit: (contact: Contact) => void;
  /** Delete handler */
  onDelete: (contactId: string) => void;
  /** View handler */
  onView: (contact: Contact) => void;
  /** Compact display mode */
  compact?: boolean;
  /** Show actions */
  showActions?: boolean;
  /** Selected state */
  selected?: boolean;
  /** Selection handler */
  onSelect?: (contactId: string, selected: boolean) => void;
}
```

**Implementation:**
```typescript
// src/components/molecules/ContactCard/ContactCard.tsx
import React, { memo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Checkbox,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { Button } from '../../atoms/Button/Button';
import { ContactCardProps } from './ContactCard.types';

export const ContactCard = memo<ContactCardProps>(({
  contact,
  onEdit,
  onDelete,
  onView,
  compact = false,
  showActions = true,
  selected = false,
  onSelect,
}) => {
  const fullName = `${contact.firstName} ${contact.lastName}`;
  const initials = `${contact.firstName[0]}${contact.lastName[0]}`;
  const primaryEmail = contact.email[0];
  const primaryPhone = contact.phone[0];

  const handleEdit = useCallback(() => {
    onEdit(contact);
  }, [contact, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete(contact.id);
  }, [contact.id, onDelete]);

  const handleView = useCallback(() => {
    onView(contact);
  }, [contact, onView]);

  const handleSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    onSelect?.(contact.id, event.target.checked);
  }, [contact.id, onSelect]);

  const handleCardClick = useCallback((event: React.MouseEvent) => {
    // Don't trigger if clicking on actions or checkbox
    if (
      event.target instanceof Element && (
        event.target.closest('.MuiCardActions-root') ||
        event.target.closest('.MuiCheckbox-root')
      )
    ) {
      return;
    }
    onView(contact);
  }, [contact, onView]);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        border: selected ? 2 : 1,
        borderColor: selected ? 'primary.main' : 'grey.300',
        '&:hover': {
          boxShadow: 8,
          transform: 'translateY(-2px)',
        },
      }}
      onClick={handleCardClick}
      data-testid="contact-card"
    >
      {onSelect && (
        <Box position="absolute" top={8} left={8} zIndex={1}>
          <Checkbox
            checked={selected}
            onChange={handleSelect}
            size="small"
            onClick={(e) => e.stopPropagation()}
          />
        </Box>
      )}

      <CardContent sx={{ flexGrow: 1, pt: onSelect ? 5 : 2 }}>
        <Box display="flex" alignItems="flex-start" gap={2}>
          <Avatar size={compact ? 'small' : 'medium'}>
            {initials}
          </Avatar>
          
          <Box flexGrow={1} minWidth={0}>
            <Typography 
              variant={compact ? 'subtitle1' : 'h6'} 
              component="h3"
              noWrap
              data-testid="contact-name"
            >
              {fullName}
            </Typography>
            
            {contact.title && contact.company && (
              <Typography 
                variant="body2" 
                color="text.secondary" 
                noWrap
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                <BusinessIcon fontSize="small" />
                {contact.title} at {contact.company}
              </Typography>
            )}
          </Box>
        </Box>

        {!compact && (
          <Box mt={2} space={1}>
            {primaryEmail && (
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <EmailIcon fontSize="small" color="action" />
                <Typography variant="body2" noWrap>
                  {primaryEmail}
                </Typography>
              </Box>
            )}
            
            {primaryPhone && (
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <PhoneIcon fontSize="small" color="action" />
                <Typography variant="body2" noWrap>
                  {primaryPhone}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {contact.tags.length > 0 && (
          <Box mt={2} display="flex" flexWrap="wrap" gap={0.5}>
            {contact.tags.slice(0, compact ? 2 : 4).map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
            ))}
            {contact.tags.length > (compact ? 2 : 4) && (
              <Chip
                label={`+${contact.tags.length - (compact ? 2 : 4)}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
            )}
          </Box>
        )}
      </CardContent>

      {showActions && (
        <CardActions sx={{ justifyContent: 'flex-end', gap: 1 }}>
          <Tooltip title="View contact">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleView();
              }}
              data-testid="view-button"
            >
              <ViewIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Edit contact">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
              data-testid="edit-button"
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Delete contact">
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              data-testid="delete-button"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </CardActions>
      )}
    </Card>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.contact.id === nextProps.contact.id &&
    prevProps.contact.updatedAt === nextProps.contact.updatedAt &&
    prevProps.selected === nextProps.selected &&
    prevProps.compact === nextProps.compact &&
    prevProps.showActions === nextProps.showActions
  );
});

ContactCard.displayName = 'ContactCard';
```

**Usage Examples:**
```typescript
// Basic usage
<ContactCard
  contact={contact}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onView={handleView}
/>

// Compact mode
<ContactCard
  contact={contact}
  compact
  onEdit={handleEdit}
  onDelete={handleDelete}
  onView={handleView}
/>

// With selection
<ContactCard
  contact={contact}
  selected={selectedContacts.includes(contact.id)}
  onSelect={handleSelect}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onView={handleView}
/>
```

**Test Requirements:**
- [ ] Renders contact information correctly
- [ ] Action buttons trigger correct handlers
- [ ] Selection checkbox works when provided
- [ ] Compact mode displays correctly
- [ ] Hover effects work
- [ ] Click on card triggers view handler
- [ ] Memoization works correctly

---

### FormField Component

```typescript
// src/components/molecules/FormField/FormField.types.ts
export interface FormFieldProps {
  /** Field name */
  name: string;
  /** Field label */
  label?: string;
  /** Field type */
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number' | 'textarea' | 'select';
  /** Placeholder text */
  placeholder?: string;
  /** Required field */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Helper text */
  helperText?: string;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Field value */
  value?: string;
  /** Change handler */
  onChange?: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** Blur handler */
  onBlur?: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** Options for select type */
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
  /** Multiline for textarea */
  multiline?: boolean;
  /** Rows for textarea */
  rows?: number;
  /** Start adornment */
  startAdornment?: React.ReactNode;
  /** End adornment */
  endAdornment?: React.ReactNode;
  /** Full width */
  fullWidth?: boolean;
}
```

**Implementation:**
```typescript
// src/components/molecules/FormField/FormField.tsx
import React, { forwardRef } from 'react';
import { 
  FormControl, 
  FormLabel, 
  FormHelperText, 
  Select, 
  MenuItem,
  InputLabel
} from '@mui/material';
import { Input } from '../../atoms/Input/Input';
import { FormFieldProps } from './FormField.types';

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(({
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  helperText,
  error = false,
  errorMessage,
  value,
  onChange,
  onBlur,
  options,
  multiline = false,
  rows,
  startAdornment,
  endAdornment,
  fullWidth = true,
}, ref) => {
  const displayHelperText = error ? errorMessage : helperText;
  const inputType = type === 'textarea' ? 'text' : type;

  if (type === 'select' && options) {
    return (
      <FormControl fullWidth={fullWidth} error={error} disabled={disabled}>
        {label && (
          <InputLabel required={required} id={`${name}-label`}>
            {label}
          </InputLabel>
        )}
        <Select
          labelId={`${name}-label`}
          name={name}
          value={value || ''}
          onChange={onChange}
          onBlur={onBlur}
          label={label}
        >
          {options.map((option) => (
            <MenuItem 
              key={option.value} 
              value={option.value} 
              disabled={option.disabled}
            >
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {displayHelperText && (
          <FormHelperText>{displayHelperText}</FormHelperText>
        )}
      </FormControl>
    );
  }

  return (
    <FormControl fullWidth={fullWidth} error={error}>
      <Input
        ref={ref}
        name={name}
        type={inputType}
        label={label}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        error={error}
        helperText={displayHelperText}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        multiline={type === 'textarea' || multiline}
        rows={type === 'textarea' ? rows : undefined}
        startAdornment={startAdornment}
        endAdornment={endAdornment}
        fullWidth={fullWidth}
      />
    </FormControl>
  );
});

FormField.displayName = 'FormField';
```

**Usage Examples:**
```typescript
// Basic text field
<FormField 
  name="firstName"
  label="First Name"
  required
/>

// Email field with validation
<FormField 
  name="email"
  type="email"
  label="Email Address"
  error={!!errors.email}
  errorMessage={errors.email?.message}
/>

// Select field
<FormField 
  name="category"
  type="select"
  label="Category"
  options={[
    { value: 'client', label: 'Client' },
    { value: 'vendor', label: 'Vendor' },
    { value: 'partner', label: 'Partner' }
  ]}
/>

// Textarea
<FormField 
  name="notes"
  type="textarea"
  label="Notes"
  rows={4}
  placeholder="Additional notes..."
/>
```

**Test Requirements:**
- [ ] Renders correct input type
- [ ] Shows validation errors
- [ ] Select options render correctly
- [ ] Required field validation works
- [ ] Disabled state works
- [ ] Helper text displays correctly

---

## Organisms (Complex Components)

### ContactList Component

```typescript
// src/components/organisms/ContactList/ContactList.types.ts
export interface ContactListProps {
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: string | null;
  /** Search term */
  searchTerm?: string;
  /** Search change handler */
  onSearchChange?: (term: string) => void;
  /** Page number */
  page?: number;
  /** Page change handler */
  onPageChange?: (page: number) => void;
  /** Items per page */
  pageSize?: number;
  /** Total number of items */
  totalItems?: number;
  /** View mode */
  viewMode?: 'grid' | 'list';
  /** View mode change handler */
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  /** Show selection controls */
  showSelection?: boolean;
  /** Selected contact IDs */
  selectedContacts?: string[];
  /** Selection change handler */
  onSelectionChange?: (selectedIds: string[]) => void;
  /** Contact action handlers */
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (contactId: string) => void;
  onViewContact: (contact: Contact) => void;
  /** Bulk action handlers */
  onBulkDelete?: (contactIds: string[]) => void;
  onBulkExport?: (contactIds: string[]) => void;
}
```

**Implementation:**
```typescript
// src/components/organisms/ContactList/ContactList.tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Grid,
  List,
  ListItem,
  Typography,
  Paper,
  Toolbar,
  IconButton,
  Tooltip,
  Checkbox,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  GetApp as ExportIcon,
} from '@mui/icons-material';
import { SearchBox } from '../../molecules/SearchBox/SearchBox';
import { ContactCard } from '../../molecules/ContactCard/ContactCard';
import { Loading } from '../../atoms/Loading/Loading';
import { Button } from '../../atoms/Button/Button';
import { Pagination } from '../Pagination/Pagination';
import { useContacts } from '../../../hooks/useContacts';
import { ContactListProps } from './ContactList.types';

export const ContactList: React.FC<ContactListProps> = ({
  isLoading = false,
  error = null,
  searchTerm = '',
  onSearchChange,
  page = 1,
  onPageChange,
  pageSize = 12,
  totalItems = 0,
  viewMode = 'grid',
  onViewModeChange,
  showSelection = false,
  selectedContacts = [],
  onSelectionChange,
  onEditContact,
  onDeleteContact,
  onViewContact,
  onBulkDelete,
  onBulkExport,
}) => {
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState<null | HTMLElement>(null);
  
  const { data: contactsData } = useContacts({
    search: searchTerm,
    page,
    limit: pageSize,
  });

  const contacts = contactsData?.contacts || [];
  const totalPages = contactsData?.totalPages || 0;

  const handleSearchChange = useCallback((value: string) => {
    onSearchChange?.(value);
  }, [onSearchChange]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      const allIds = contacts.map(contact => contact.id);
      onSelectionChange?.(allIds);
    } else {
      onSelectionChange?.([]);
    }
  }, [contacts, onSelectionChange]);

  const handleSelectContact = useCallback((contactId: string, selected: boolean) => {
    if (selected) {
      onSelectionChange?.([...selectedContacts, contactId]);
    } else {
      onSelectionChange?.(selectedContacts.filter(id => id !== contactId));
    }
  }, [selectedContacts, onSelectionChange]);

  const handleBulkMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setBulkMenuAnchor(event.currentTarget);
  }, []);

  const handleBulkMenuClose = useCallback(() => {
    setBulkMenuAnchor(null);
  }, []);

  const handleBulkDelete = useCallback(() => {
    onBulkDelete?.(selectedContacts);
    handleBulkMenuClose();
  }, [selectedContacts, onBulkDelete, handleBulkMenuClose]);

  const handleBulkExport = useCallback(() => {
    onBulkExport?.(selectedContacts);
    handleBulkMenuClose();
  }, [selectedContacts, onBulkExport, handleBulkMenuClose]);

  const isAllSelected = useMemo(() => {
    return contacts.length > 0 && selectedContacts.length === contacts.length;
  }, [contacts.length, selectedContacts.length]);

  const isIndeterminate = useMemo(() => {
    return selectedContacts.length > 0 && selectedContacts.length < contacts.length;
  }, [selectedContacts.length, contacts.length]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Loading text="Loading contacts..." />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Error loading contacts
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Search and Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Box flexGrow={1}>
            <SearchBox
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={handleSearchChange}
              onSearch={handleSearchChange}
            />
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            {showSelection && selectedContacts.length > 0 && (
              <>
                <Typography variant="body2" color="text.secondary">
                  {selectedContacts.length} selected
                </Typography>
                <IconButton onClick={handleBulkMenuOpen} size="small">
                  <MoreIcon />
                </IconButton>
                <Menu
                  anchorEl={bulkMenuAnchor}
                  open={Boolean(bulkMenuAnchor)}
                  onClose={handleBulkMenuClose}
                >
                  <MenuItem onClick={handleBulkExport}>
                    <ExportIcon sx={{ mr: 1 }} />
                    Export Selected
                  </MenuItem>
                  <MenuItem onClick={handleBulkDelete} sx={{ color: 'error.main' }}>
                    <DeleteIcon sx={{ mr: 1 }} />
                    Delete Selected
                  </MenuItem>
                </Menu>
              </>
            )}
            
            <Tooltip title={viewMode === 'grid' ? 'List view' : 'Grid view'}>
              <IconButton
                onClick={() => onViewModeChange?.(viewMode === 'grid' ? 'list' : 'grid')}
                size="small"
              >
                {viewMode === 'grid' ? <ListViewIcon /> : <GridViewIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {showSelection && (
          <Box mt={2}>
            <Checkbox
              checked={isAllSelected}
              indeterminate={isIndeterminate}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
            <Typography variant="body2" component="span" sx={{ ml: 1 }}>
              Select All
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Contact List */}
      {contacts.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center' }} data-testid="empty-state">
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchTerm ? 'No contacts found' : 'No contacts yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {searchTerm 
              ? 'Try adjusting your search criteria'
              : 'Start by adding your first contact'
            }
          </Typography>
          {!searchTerm && (
            <Button variant="primary" onClick={() => onViewContact({} as Contact)}>
              Add First Contact
            </Button>
          )}
        </Paper>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <Grid container spacing={3}>
              {contacts.map((contact) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={contact.id}>
                  <ContactCard
                    contact={contact}
                    onEdit={onEditContact}
                    onDelete={onDeleteContact}
                    onView={onViewContact}
                    selected={selectedContacts.includes(contact.id)}
                    onSelect={showSelection ? handleSelectContact : undefined}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper>
              <List>
                {contacts.map((contact, index) => (
                  <React.Fragment key={contact.id}>
                    <ListItem sx={{ p: 2 }}>
                      <ContactCard
                        contact={contact}
                        onEdit={onEditContact}
                        onDelete={onDeleteContact}
                        onView={onViewContact}
                        compact
                        selected={selectedContacts.includes(contact.id)}
                        onSelect={showSelection ? handleSelectContact : undefined}
                      />
                    </ListItem>
                    {index < contacts.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage) => onPageChange?.(newPage)}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};
```

**Usage Examples:**
```typescript
// Basic usage
<ContactList
  onEditContact={handleEditContact}
  onDeleteContact={handleDeleteContact}
  onViewContact={handleViewContact}
/>

// With search and pagination
<ContactList
  searchTerm={searchTerm}
  onSearchChange={setSearchTerm}
  page={currentPage}
  onPageChange={setCurrentPage}
  onEditContact={handleEditContact}
  onDeleteContact={handleDeleteContact}
  onViewContact={handleViewContact}
/>

// With selection and bulk actions
<ContactList
  showSelection
  selectedContacts={selectedContacts}
  onSelectionChange={setSelectedContacts}
  onBulkDelete={handleBulkDelete}
  onBulkExport={handleBulkExport}
  onEditContact={handleEditContact}
  onDeleteContact={handleDeleteContact}
  onViewContact={handleViewContact}
/>
```

**Test Requirements:**
- [ ] Renders loading state
- [ ] Shows error messages
- [ ] Displays empty state
- [ ] Search functionality works
- [ ] Pagination works
- [ ] View mode switching works
- [ ] Selection functionality works
- [ ] Bulk actions work
- [ ] Contact actions trigger correctly

---

### ContactForm Component

```typescript
// src/components/organisms/ContactForm/ContactForm.types.ts
export interface ContactFormProps {
  /** Contact to edit (undefined for create mode) */
  contact?: Contact;
  /** Form submission handler */
  onSubmit: (data: ContactCreateData) => void;
  /** Cancel handler */
  onCancel: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Form mode */
  mode?: 'create' | 'edit';
  /** Show advanced fields */
  showAdvanced?: boolean;
  /** Available tags for autocomplete */
  availableTags?: string[];
  /** Available companies for autocomplete */
  availableCompanies?: string[];
}
```

**Implementation** (partial - already shown in previous document):
```typescript
// This component is already fully specified in the FRONTEND-TDD-PLAN.md
// Refer to the ContactForm implementation there for complete details
```

**Test Requirements:**
- [ ] Validates required fields
- [ ] Shows/hides advanced fields
- [ ] Tag autocomplete works
- [ ] Company autocomplete works
- [ ] Submits correct data format
- [ ] Cancel functionality works
- [ ] Loading state disables form

---

## Templates (Page Layouts)

### DashboardLayout Template

```typescript
// src/components/templates/DashboardLayout/DashboardLayout.types.ts
export interface DashboardLayoutProps {
  /** Page content */
  children: React.ReactNode;
  /** Page title */
  title?: string;
  /** Show back button */
  showBackButton?: boolean;
  /** Back button handler */
  onBackClick?: () => void;
  /** Page actions */
  actions?: React.ReactNode;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: string | null;
  /** Sidebar collapsed state */
  sidebarCollapsed?: boolean;
  /** Sidebar toggle handler */
  onSidebarToggle?: () => void;
}
```

**Implementation:**
```typescript
// src/components/templates/DashboardLayout/DashboardLayout.tsx
import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Breadcrumbs,
  Link,
  IconButton,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
  Dashboard as DashboardIcon,
  Contacts as ContactsIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import { Loading } from '../../atoms/Loading/Loading';
import { DashboardLayoutProps } from './DashboardLayout.types';

const drawerWidth = 280;
const collapsedDrawerWidth = 64;

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  showBackButton = false,
  onBackClick,
  actions,
  isLoading = false,
  error = null,
  sidebarCollapsed = false,
  onSidebarToggle,
}) => {
  const location = useLocation();

  const navigationItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { label: 'Contacts', icon: <ContactsIcon />, path: '/contacts' },
    { label: 'Profile', icon: <PersonIcon />, path: '/profile' },
    { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter(x => x);
    return pathnames.map((name, index) => {
      const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
      const isLast = index === pathnames.length - 1;
      const displayName = name.charAt(0).toUpperCase() + name.slice(1);

      return isLast ? (
        <Typography color="text.primary" key={routeTo}>
          {displayName}
        </Typography>
      ) : (
        <Link component={RouterLink} to={routeTo} key={routeTo}>
          {displayName}
        </Link>
      );
    });
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          ml: sidebarCollapsed ? `${collapsedDrawerWidth}px` : `${drawerWidth}px`,
          width: sidebarCollapsed 
            ? `calc(100% - ${collapsedDrawerWidth}px)` 
            : `calc(100% - ${drawerWidth}px)`,
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onSidebarToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          {showBackButton && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={onBackClick}
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}

          <Box flexGrow={1}>
            {title && (
              <Typography variant="h6" component="h1">
                {title}
              </Typography>
            )}
          </Box>

          {actions && (
            <Box display="flex" alignItems="center" gap={1}>
              {actions}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={true}
        sx={{
          width: sidebarCollapsed ? collapsedDrawerWidth : drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: sidebarCollapsed ? collapsedDrawerWidth : drawerWidth,
            boxSizing: 'border-box',
            transition: (theme) => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
      >
        <Toolbar /> {/* Spacer for app bar */}
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItem
                  key={item.path}
                  component={RouterLink}
                  to={item.path}
                  sx={{
                    color: 'inherit',
                    textDecoration: 'none',
                    backgroundColor: isActive ? 'action.selected' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: sidebarCollapsed ? 'auto' : 56,
                      justifyContent: 'center',
                      color: isActive ? 'primary.main' : 'text.primary',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!sidebarCollapsed && (
                    <ListItemText
                      primary={item.label}
                      sx={{
                        color: isActive ? 'primary.main' : 'text.primary',
                      }}
                    />
                  )}
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          ml: sidebarCollapsed ? `${collapsedDrawerWidth}px` : `${drawerWidth}px`,
          width: sidebarCollapsed 
            ? `calc(100% - ${collapsedDrawerWidth}px)` 
            : `calc(100% - ${drawerWidth}px)`,
        }}
      >
        <Toolbar /> {/* Spacer for app bar */}

        {/* Breadcrumbs */}
        <Box mb={2}>
          <Breadcrumbs aria-label="breadcrumb">
            <Link component={RouterLink} to="/">
              Home
            </Link>
            {getBreadcrumbs()}
          </Breadcrumbs>
        </Box>

        {/* Page Content */}
        {isLoading ? (
          <Loading centered text="Loading..." />
        ) : error ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="error" gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {error}
            </Typography>
          </Paper>
        ) : (
          <Container maxWidth={false}>
            {children}
          </Container>
        )}
      </Box>
    </Box>
  );
};
```

**Usage Examples:**
```typescript
// Basic layout
<DashboardLayout title="Contacts">
  <ContactList />
</DashboardLayout>

// With actions
<DashboardLayout 
  title="Add Contact"
  showBackButton
  onBackClick={() => navigate('/contacts')}
  actions={
    <Button onClick={handleSave}>
      Save Contact
    </Button>
  }
>
  <ContactForm />
</DashboardLayout>

// With loading state
<DashboardLayout 
  title="Dashboard"
  isLoading={isLoadingData}
>
  <DashboardContent />
</DashboardLayout>
```

**Test Requirements:**
- [ ] Renders with correct title
- [ ] Navigation items work
- [ ] Breadcrumbs generate correctly
- [ ] Sidebar toggle works
- [ ] Back button appears when specified
- [ ] Actions render correctly
- [ ] Loading state displays
- [ ] Error state displays

---

## Component Development Standards

### File Structure Convention
```
ComponentName/
├── ComponentName.tsx           # Main implementation
├── ComponentName.types.ts      # TypeScript interfaces
├── ComponentName.test.tsx      # Unit tests
├── ComponentName.stories.tsx   # Storybook stories
├── ComponentName.styles.ts     # Styled components (optional)
├── index.ts                   # Barrel export
└── README.md                  # Component documentation
```

### TypeScript Standards
- All props interfaces exported
- Strict typing with no `any` types
- Generic types where appropriate
- Comprehensive JSDoc comments
- Forward refs for form components

### Testing Standards
- Minimum 85% code coverage per component
- Test all user interactions
- Test all prop variations
- Test error states
- Test accessibility features
- Visual regression tests for complex components

### Accessibility Standards
- WCAG 2.1 AA compliance
- Proper ARIA attributes
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance
- Focus management

### Performance Standards
- React.memo for expensive components
- useCallback for event handlers
- useMemo for expensive calculations
- Lazy loading for large components
- Code splitting for routes

This comprehensive component specification provides the foundation for building a consistent, maintainable, and high-quality React application for ConnectKit.