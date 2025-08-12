# UI/UX Design Guidelines

## Overview

This document provides comprehensive UI/UX design guidelines for ConnectKit, including design system specifications, Material-UI customization, user experience patterns, accessibility standards, and responsive design principles.

## Design System Architecture

```
Design System Architecture
┌─────────────────────────────────────────────────────────────────┐
│                        Design Tokens                           │
│  Colors • Typography • Spacing • Shadows • Animations         │
├─────────────────────────────────────────────────────────────────┤
│                    Component Library                           │
│  Atoms • Molecules • Organisms • Templates                    │
├─────────────────────────────────────────────────────────────────┤
│                    Layout System                               │
│  Grid • Breakpoints • Containers • Spacing                    │
├─────────────────────────────────────────────────────────────────┤
│                  Interaction Patterns                         │
│  Navigation • Forms • Feedback • Loading States               │
├─────────────────────────────────────────────────────────────────┤
│                   Accessibility Layer                         │
│  WCAG 2.1 AA • Screen Readers • Keyboard Navigation           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Design Tokens and Foundation

### 1.1 Color Palette

**Primary Colors:**
```typescript
// src/styles/tokens/colors.ts
export const colors = {
  primary: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#1976d2', // Main brand color
    600: '#1565c0',
    700: '#0d47a1',
    800: '#0d47a1',
    900: '#0d47a1',
  },
  secondary: {
    50: '#fce4ec',
    100: '#f8bbd9',
    200: '#f48fb1',
    300: '#f06292',
    400: '#ec407a',
    500: '#dc004e', // Accent color
    600: '#c2185b',
    700: '#ad1457',
    800: '#880e4f',
    900: '#880e4f',
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  semantic: {
    success: {
      light: '#81c784',
      main: '#4caf50',
      dark: '#388e3c',
      contrastText: '#ffffff',
    },
    warning: {
      light: '#ffb74d',
      main: '#ff9800',
      dark: '#f57c00',
      contrastText: '#000000',
    },
    error: {
      light: '#e57373',
      main: '#f44336',
      dark: '#d32f2f',
      contrastText: '#ffffff',
    },
    info: {
      light: '#64b5f6',
      main: '#2196f3',
      dark: '#1976d2',
      contrastText: '#ffffff',
    },
  },
};

// Gradient definitions
export const gradients = {
  primary: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
  secondary: 'linear-gradient(45deg, #dc004e 30%, #f48fb1 90%)',
  success: 'linear-gradient(45deg, #4caf50 30%, #81c784 90%)',
  sunset: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)',
  ocean: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
};
```

**Usage Guidelines:**
- **Primary Blue**: Use for main actions, navigation active states, and brand elements
- **Secondary Pink**: Use for secondary actions and accent highlights
- **Neutral Gray**: Use for text, borders, and backgrounds
- **Semantic Colors**: Use for status indicators, alerts, and feedback

### 1.2 Typography Scale

**Font System:**
```typescript
// src/styles/tokens/typography.ts
export const typography = {
  fontFamily: {
    primary: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    monospace: ['Fira Code', 'Monaco', 'Consolas', 'monospace'],
  },
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
  },
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

// Typography variants
export const textStyles = {
  h1: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  h2: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
  },
  h3: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.snug,
  },
  h4: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.snug,
  },
  h5: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal,
  },
  h6: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal,
  },
  body1: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.relaxed,
  },
  body2: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.relaxed,
  },
  caption: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.normal,
  },
  overline: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.widest,
    textTransform: 'uppercase',
  },
};
```

### 1.3 Spacing System

**Spacing Scale:**
```typescript
// src/styles/tokens/spacing.ts
export const spacing = {
  0: '0px',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
  40: '10rem',    // 160px
  48: '12rem',    // 192px
  56: '14rem',    // 224px
  64: '16rem',    // 256px
};

// Component spacing
export const componentSpacing = {
  button: {
    paddingX: spacing[6],
    paddingY: spacing[3],
    gap: spacing[2],
  },
  card: {
    padding: spacing[6],
    margin: spacing[4],
  },
  form: {
    fieldSpacing: spacing[4],
    sectionSpacing: spacing[8],
  },
  layout: {
    sidebarWidth: '280px',
    headerHeight: '64px',
    containerPadding: spacing[6],
  },
};
```

### 1.4 Shadows and Elevation

**Shadow System:**
```typescript
// src/styles/tokens/shadows.ts
export const shadows = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none',
};

// Elevation mapping
export const elevation = {
  0: shadows.none,
  1: shadows.xs,
  2: shadows.sm,
  4: shadows.base,
  8: shadows.md,
  12: shadows.lg,
  16: shadows.xl,
  24: shadows.xl,
};
```

### 1.5 Border Radius and Borders

**Border System:**
```typescript
// src/styles/tokens/borders.ts
export const borderRadius = {
  none: '0px',
  xs: '0.125rem',   // 2px
  sm: '0.25rem',    // 4px
  base: '0.375rem', // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  '3xl': '2rem',    // 32px
  full: '9999px',
};

export const borderWidth = {
  0: '0px',
  1: '1px',
  2: '2px',
  4: '4px',
  8: '8px',
};

// Component-specific borders
export const componentBorders = {
  card: {
    radius: borderRadius.lg,
    width: borderWidth[1],
  },
  button: {
    radius: borderRadius.md,
    width: borderWidth[1],
  },
  input: {
    radius: borderRadius.md,
    width: borderWidth[1],
  },
  modal: {
    radius: borderRadius.xl,
  },
};
```

---

## 2. Component Design Specifications

### 2.1 Button Design System

**Button Variants:**
```typescript
// Button design specifications
export const buttonDesign = {
  variants: {
    primary: {
      background: colors.primary[500],
      color: '#ffffff',
      border: 'none',
      hover: {
        background: colors.primary[600],
        transform: 'translateY(-1px)',
        boxShadow: shadows.md,
      },
    },
    secondary: {
      background: 'transparent',
      color: colors.primary[500],
      border: `${borderWidth[1]} solid ${colors.primary[500]}`,
      hover: {
        background: colors.primary[50],
        borderColor: colors.primary[600],
      },
    },
    ghost: {
      background: 'transparent',
      color: colors.neutral[700],
      border: 'none',
      hover: {
        background: colors.neutral[100],
      },
    },
    danger: {
      background: colors.semantic.error.main,
      color: colors.semantic.error.contrastText,
      border: 'none',
      hover: {
        background: colors.semantic.error.dark,
      },
    },
  },
  sizes: {
    small: {
      padding: `${spacing[2]} ${spacing[4]}`,
      fontSize: typography.fontSize.sm,
      minHeight: '32px',
    },
    medium: {
      padding: `${spacing[3]} ${spacing[6]}`,
      fontSize: typography.fontSize.base,
      minHeight: '40px',
    },
    large: {
      padding: `${spacing[4]} ${spacing[8]}`,
      fontSize: typography.fontSize.lg,
      minHeight: '48px',
    },
  },
};
```

### 2.2 Form Design Standards

**Form Layout Specifications:**
```typescript
// Form design guidelines
export const formDesign = {
  layout: {
    maxWidth: '600px',
    fieldSpacing: spacing[4],
    sectionSpacing: spacing[8],
    labelSpacing: spacing[2],
  },
  input: {
    height: '48px',
    padding: `${spacing[3]} ${spacing[4]}`,
    borderRadius: borderRadius.md,
    borderWidth: borderWidth[1],
    borderColor: colors.neutral[300],
    focus: {
      borderColor: colors.primary[500],
      boxShadow: `0 0 0 3px ${colors.primary[100]}`,
      outline: 'none',
    },
    error: {
      borderColor: colors.semantic.error.main,
      boxShadow: `0 0 0 3px ${colors.semantic.error.light}20`,
    },
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  helpText: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[600],
    marginTop: spacing[1],
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.semantic.error.main,
    marginTop: spacing[1],
  },
};
```

### 2.3 Card Design System

**Card Component Specifications:**
```typescript
// Card design system
export const cardDesign = {
  base: {
    background: '#ffffff',
    borderRadius: borderRadius.lg,
    boxShadow: shadows.sm,
    border: `${borderWidth[1]} solid ${colors.neutral[200]}`,
    padding: spacing[6],
    transition: 'all 0.2s ease-in-out',
  },
  variants: {
    elevated: {
      boxShadow: shadows.md,
      hover: {
        boxShadow: shadows.lg,
        transform: 'translateY(-2px)',
      },
    },
    outlined: {
      boxShadow: 'none',
      border: `${borderWidth[2]} solid ${colors.neutral[300]}`,
    },
    interactive: {
      cursor: 'pointer',
      hover: {
        boxShadow: shadows.md,
        borderColor: colors.primary[300],
      },
    },
  },
  header: {
    paddingBottom: spacing[4],
    borderBottom: `${borderWidth[1]} solid ${colors.neutral[200]}`,
    marginBottom: spacing[4],
  },
  content: {
    lineHeight: typography.lineHeight.relaxed,
  },
  actions: {
    paddingTop: spacing[4],
    borderTop: `${borderWidth[1]} solid ${colors.neutral[200]}`,
    marginTop: spacing[4],
    display: 'flex',
    justifyContent: 'flex-end',
    gap: spacing[3],
  },
};
```

---

## 3. Layout and Grid System

### 3.1 Responsive Breakpoints

**Breakpoint System:**
```typescript
// src/styles/tokens/breakpoints.ts
export const breakpoints = {
  xs: '0px',
  sm: '600px',
  md: '900px',
  lg: '1200px',
  xl: '1536px',
};

// Media queries
export const mediaQueries = {
  up: {
    sm: `@media (min-width: ${breakpoints.sm})`,
    md: `@media (min-width: ${breakpoints.md})`,
    lg: `@media (min-width: ${breakpoints.lg})`,
    xl: `@media (min-width: ${breakpoints.xl})`,
  },
  down: {
    sm: `@media (max-width: ${parseInt(breakpoints.sm) - 1}px)`,
    md: `@media (max-width: ${parseInt(breakpoints.md) - 1}px)`,
    lg: `@media (max-width: ${parseInt(breakpoints.lg) - 1}px)`,
    xl: `@media (max-width: ${parseInt(breakpoints.xl) - 1}px)`,
  },
  only: {
    xs: `@media (max-width: ${parseInt(breakpoints.sm) - 1}px)`,
    sm: `@media (min-width: ${breakpoints.sm}) and (max-width: ${parseInt(breakpoints.md) - 1}px)`,
    md: `@media (min-width: ${breakpoints.md}) and (max-width: ${parseInt(breakpoints.lg) - 1}px)`,
    lg: `@media (min-width: ${breakpoints.lg}) and (max-width: ${parseInt(breakpoints.xl) - 1}px)`,
    xl: `@media (min-width: ${breakpoints.xl})`,
  },
};

// Responsive design principles
export const responsiveDesign = {
  // Mobile-first approach
  base: 'xs', // Start with mobile design
  
  // Content scaling
  maxWidth: {
    xs: '100%',
    sm: '540px',
    md: '720px',
    lg: '960px',
    xl: '1140px',
  },
  
  // Sidebar behavior
  sidebar: {
    mobile: 'drawer', // Hidden drawer on mobile
    desktop: 'permanent', // Always visible on desktop
  },
  
  // Grid system
  columns: 12,
  gutter: {
    xs: spacing[4],
    sm: spacing[6],
    md: spacing[8],
  },
};
```

### 3.2 Layout Components

**Dashboard Layout Specifications:**
```typescript
// Layout design system
export const layoutDesign = {
  dashboard: {
    header: {
      height: '64px',
      background: '#ffffff',
      boxShadow: shadows.sm,
      borderBottom: `${borderWidth[1]} solid ${colors.neutral[200]}`,
      zIndex: 1100,
    },
    sidebar: {
      width: '280px',
      collapsedWidth: '64px',
      background: '#ffffff',
      boxShadow: shadows.sm,
      borderRight: `${borderWidth[1]} solid ${colors.neutral[200]}`,
      zIndex: 1000,
      transition: 'width 0.3s ease-in-out',
    },
    main: {
      padding: spacing[6],
      background: colors.neutral[50],
      minHeight: 'calc(100vh - 64px)',
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: `0 ${spacing[6]}`,
    },
  },
  auth: {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: gradients.ocean,
    },
    card: {
      width: '100%',
      maxWidth: '400px',
      padding: spacing[8],
      background: '#ffffff',
      borderRadius: borderRadius['2xl'],
      boxShadow: shadows.xl,
    },
  },
};
```

### 3.3 Grid System Implementation

**Grid Utilities:**
```typescript
// Grid system utilities
export const gridSystem = {
  container: {
    width: '100%',
    paddingLeft: spacing[4],
    paddingRight: spacing[4],
    marginLeft: 'auto',
    marginRight: 'auto',
    [mediaQueries.up.sm]: {
      maxWidth: responsiveDesign.maxWidth.sm,
      paddingLeft: spacing[6],
      paddingRight: spacing[6],
    },
    [mediaQueries.up.md]: {
      maxWidth: responsiveDesign.maxWidth.md,
    },
    [mediaQueries.up.lg]: {
      maxWidth: responsiveDesign.maxWidth.lg,
    },
    [mediaQueries.up.xl]: {
      maxWidth: responsiveDesign.maxWidth.xl,
    },
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    marginLeft: `-${spacing[3]}`,
    marginRight: `-${spacing[3]}`,
  },
  col: {
    paddingLeft: spacing[3],
    paddingRight: spacing[3],
    flex: '0 0 auto',
  },
};
```

---

## 4. User Experience Patterns

### 4.1 Navigation Patterns

**Navigation Design:**
```typescript
// Navigation UX patterns
export const navigationPatterns = {
  primaryNavigation: {
    position: 'sidebar', // Primary nav in sidebar
    items: [
      { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
      { label: 'Contacts', icon: 'contacts', path: '/contacts' },
      { label: 'Analytics', icon: 'analytics', path: '/analytics' },
      { label: 'Settings', icon: 'settings', path: '/settings' },
    ],
    activeIndicator: {
      background: colors.primary[50],
      borderRight: `3px solid ${colors.primary[500]}`,
      color: colors.primary[600],
    },
  },
  
  secondaryNavigation: {
    position: 'tabs', // Secondary nav as tabs
    style: 'underlined',
    activeIndicator: {
      borderBottom: `2px solid ${colors.primary[500]}`,
      color: colors.primary[600],
    },
  },
  
  breadcrumbs: {
    separator: '/',
    maxItems: 4,
    showRoot: true,
    collapsedIcon: '...',
    styling: {
      fontSize: typography.fontSize.sm,
      color: colors.neutral[600],
      activeColor: colors.neutral[900],
    },
  },
  
  pagination: {
    showFirstLast: true,
    siblingCount: 1,
    boundaryCount: 1,
    showPreviousNext: true,
    variant: 'outlined',
  },
};
```

### 4.2 Form UX Patterns

**Form User Experience:**
```typescript
// Form UX guidelines
export const formUX = {
  validation: {
    strategy: 'progressive', // Show errors after first interaction
    timing: {
      onBlur: true,      // Validate on field blur
      onChange: false,   // Don't validate on every keystroke initially
      onSubmit: true,    // Validate all fields on submit
    },
    errorPlacement: 'below', // Show errors below fields
    successIndicator: true,  // Show green checkmark for valid fields
  },
  
  fieldGrouping: {
    relatedFields: 'grouped', // Group related fields together
    spacing: spacing[4],
    sections: {
      spacing: spacing[8],
      dividers: true,
      titles: {
        variant: 'h6',
        color: colors.neutral[700],
      },
    },
  },
  
  helpText: {
    placement: 'below',
    toggle: 'icon', // Show help icon that reveals help text
    styling: {
      fontSize: typography.fontSize.xs,
      color: colors.neutral[600],
    },
  },
  
  requiredFields: {
    indicator: 'asterisk', // Show * for required fields
    color: colors.semantic.error.main,
    legend: true, // Show "* Required fields" legend
  },
  
  submitButton: {
    placement: 'right', // Align submit button to the right
    loadingState: true, // Show loading spinner on submit
    disableOnInvalid: true, // Disable if form is invalid
  },
};
```

### 4.3 Loading and Empty States

**Loading State Patterns:**
```typescript
// Loading and empty state designs
export const loadingStates = {
  skeleton: {
    baseColor: colors.neutral[200],
    highlightColor: colors.neutral[100],
    animation: 'pulse',
    borderRadius: borderRadius.sm,
  },
  
  spinner: {
    size: {
      small: '16px',
      medium: '24px',
      large: '32px',
    },
    color: colors.primary[500],
    thickness: 2,
  },
  
  progressBar: {
    height: '4px',
    background: colors.neutral[200],
    foreground: colors.primary[500],
    borderRadius: borderRadius.full,
  },
  
  overlay: {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropBlur: '4px',
    zIndex: 1300,
  },
};

export const emptyStates = {
  illustration: {
    size: '120px',
    color: colors.neutral[400],
    marginBottom: spacing[4],
  },
  
  title: {
    variant: 'h6',
    color: colors.neutral[600],
    marginBottom: spacing[2],
  },
  
  description: {
    variant: 'body2',
    color: colors.neutral[500],
    marginBottom: spacing[6],
    maxWidth: '400px',
  },
  
  action: {
    variant: 'primary',
    size: 'medium',
  },
  
  // Different empty state types
  types: {
    noResults: {
      title: 'No results found',
      description: 'Try adjusting your search criteria or filters',
      action: 'Clear filters',
    },
    noData: {
      title: 'No contacts yet',
      description: 'Get started by adding your first contact',
      action: 'Add contact',
    },
    error: {
      title: 'Something went wrong',
      description: 'We encountered an error while loading your data',
      action: 'Try again',
    },
  },
};
```

---

## 5. Material-UI Customization

### 5.1 Theme Configuration

**Complete Theme Setup:**
```typescript
// src/styles/theme/index.ts
import { createTheme, ThemeOptions } from '@mui/material/styles';
import { colors, gradients } from '../tokens/colors';
import { typography } from '../tokens/typography';
import { shadows } from '../tokens/shadows';
import { borderRadius, componentBorders } from '../tokens/borders';

const baseTheme: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      ...colors.primary,
      main: colors.primary[500],
    },
    secondary: {
      ...colors.secondary,
      main: colors.secondary[500],
    },
    error: colors.semantic.error,
    warning: colors.semantic.warning,
    info: colors.semantic.info,
    success: colors.semantic.success,
    grey: colors.neutral,
    background: {
      default: colors.neutral[50],
      paper: '#ffffff',
    },
    text: {
      primary: colors.neutral[900],
      secondary: colors.neutral[600],
    },
    divider: colors.neutral[300],
  },
  
  typography: {
    fontFamily: typography.fontFamily.primary.join(','),
    h1: textStyles.h1,
    h2: textStyles.h2,
    h3: textStyles.h3,
    h4: textStyles.h4,
    h5: textStyles.h5,
    h6: textStyles.h6,
    body1: textStyles.body1,
    body2: textStyles.body2,
    caption: textStyles.caption,
    overline: textStyles.overline,
  },
  
  shadows: Object.values(shadows) as any,
  
  shape: {
    borderRadius: parseInt(borderRadius.md),
  },
  
  spacing: 8, // Base spacing unit (8px)
};

const componentOverrides: ThemeOptions['components'] = {
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: typography.fontWeight.medium,
        borderRadius: componentBorders.button.radius,
        padding: '8px 24px',
        minHeight: '40px',
        transition: 'all 0.2s ease-in-out',
      },
      containedPrimary: {
        background: gradients.primary,
        boxShadow: shadows.sm,
        '&:hover': {
          boxShadow: shadows.md,
          transform: 'translateY(-1px)',
        },
      },
      outlinedPrimary: {
        borderWidth: '2px',
        '&:hover': {
          borderWidth: '2px',
          backgroundColor: colors.primary[50],
        },
      },
    },
  },
  
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: componentBorders.input.radius,
          transition: 'all 0.2s ease-in-out',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.primary[300],
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: '2px',
            borderColor: colors.primary[500],
          },
        },
      },
    },
  },
  
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: componentBorders.card.radius,
        boxShadow: shadows.sm,
        border: `${componentBorders.card.width} solid ${colors.neutral[200]}`,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: shadows.md,
          transform: 'translateY(-2px)',
        },
      },
    },
  },
  
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: borderRadius.md,
        fontWeight: typography.fontWeight.medium,
      },
      outlined: {
        borderWidth: '2px',
      },
    },
  },
  
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: '#ffffff',
        color: colors.neutral[900],
        boxShadow: shadows.sm,
        borderBottom: `1px solid ${colors.neutral[200]}`,
      },
    },
  },
  
  MuiDrawer: {
    styleOverrides: {
      paper: {
        backgroundColor: '#ffffff',
        borderRight: `1px solid ${colors.neutral[200]}`,
        boxShadow: 'none',
      },
    },
  },
  
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: borderRadius.md,
        margin: '2px 8px',
        '&.Mui-selected': {
          backgroundColor: colors.primary[50],
          borderLeft: `3px solid ${colors.primary[500]}`,
          '&:hover': {
            backgroundColor: colors.primary[100],
          },
        },
      },
    },
  },
};

export const lightTheme = createTheme({
  ...baseTheme,
  components: componentOverrides,
});

export const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    ...baseTheme.palette,
    mode: 'dark',
    background: {
      default: colors.neutral[900],
      paper: colors.neutral[800],
    },
    text: {
      primary: colors.neutral[100],
      secondary: colors.neutral[400],
    },
  },
  components: componentOverrides,
});
```

### 5.2 Custom Theme Extensions

**Theme Augmentation:**
```typescript
// src/styles/theme/augmentation.ts
declare module '@mui/material/styles' {
  interface Theme {
    custom: {
      gradients: typeof gradients;
      layout: {
        headerHeight: string;
        sidebarWidth: string;
        sidebarCollapsedWidth: string;
      };
    };
  }

  interface ThemeOptions {
    custom?: {
      gradients?: typeof gradients;
      layout?: {
        headerHeight?: string;
        sidebarWidth?: string;
        sidebarCollapsedWidth?: string;
      };
    };
  }

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
}

// Add custom properties to theme
const customThemeExtensions = {
  custom: {
    gradients,
    layout: {
      headerHeight: '64px',
      sidebarWidth: '280px',
      sidebarCollapsedWidth: '64px',
    },
  },
  palette: {
    gradient: {
      primary: gradients.primary,
      secondary: gradients.secondary,
    },
  },
};

export { customThemeExtensions };
```

---

## 6. Animation and Micro-interactions

### 6.1 Animation Guidelines

**Animation System:**
```typescript
// src/styles/tokens/animations.ts
export const animations = {
  duration: {
    shortest: 150,
    shorter: 200,
    short: 250,
    standard: 300,
    complex: 375,
    enteringScreen: 225,
    leavingScreen: 195,
  },
  
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  },
  
  keyframes: {
    fadeIn: `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `,
    slideInUp: `
      @keyframes slideInUp {
        from { 
          opacity: 0; 
          transform: translateY(20px); 
        }
        to { 
          opacity: 1; 
          transform: translateY(0); 
        }
      }
    `,
    slideInRight: `
      @keyframes slideInRight {
        from { 
          opacity: 0; 
          transform: translateX(-20px); 
        }
        to { 
          opacity: 1; 
          transform: translateX(0); 
        }
      }
    `,
    bounce: `
      @keyframes bounce {
        0%, 20%, 53%, 80%, 100% {
          animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
          transform: translate3d(0, 0, 0);
        }
        40%, 43% {
          animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
          transform: translate3d(0, -8px, 0);
        }
        70% {
          animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
          transform: translate3d(0, -4px, 0);
        }
        90% {
          transform: translate3d(0, -1px, 0);
        }
      }
    `,
    pulse: `
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
    `,
  },
};

// Animation utilities
export const animationUtils = {
  transition: (properties: string[], duration = animations.duration.standard) => ({
    transition: properties
      .map(prop => `${prop} ${duration}ms ${animations.easing.easeInOut}`)
      .join(', '),
  }),
  
  hover: (scale = 1.05, duration = animations.duration.shorter) => ({
    transition: `transform ${duration}ms ${animations.easing.easeOut}`,
    '&:hover': {
      transform: `scale(${scale})`,
    },
  }),
  
  fadeIn: (duration = animations.duration.standard) => ({
    animation: `fadeIn ${duration}ms ${animations.easing.easeOut} forwards`,
  }),
  
  slideInUp: (duration = animations.duration.standard, delay = 0) => ({
    animation: `slideInUp ${duration}ms ${animations.easing.easeOut} ${delay}ms forwards`,
    opacity: 0,
  }),
};
```

### 6.2 Micro-interaction Patterns

**Interactive Elements:**
```typescript
// Micro-interaction specifications
export const microInteractions = {
  buttons: {
    hover: {
      transform: 'translateY(-2px)',
      boxShadow: shadows.md,
      transition: `all ${animations.duration.shorter}ms ${animations.easing.easeOut}`,
    },
    active: {
      transform: 'translateY(0)',
      transition: `all ${animations.duration.shortest}ms ${animations.easing.easeIn}`,
    },
    loading: {
      opacity: 0.7,
      cursor: 'not-allowed',
      animation: `pulse ${animations.duration.complex}ms ${animations.easing.easeInOut} infinite`,
    },
  },
  
  cards: {
    hover: {
      transform: 'translateY(-4px)',
      boxShadow: shadows.lg,
      transition: `all ${animations.duration.short}ms ${animations.easing.easeOut}`,
    },
    selected: {
      borderColor: colors.primary[500],
      boxShadow: `0 0 0 2px ${colors.primary[200]}`,
    },
  },
  
  inputs: {
    focus: {
      borderColor: colors.primary[500],
      boxShadow: `0 0 0 3px ${colors.primary[100]}`,
      transition: `all ${animations.duration.shorter}ms ${animations.easing.easeOut}`,
    },
    error: {
      borderColor: colors.semantic.error.main,
      boxShadow: `0 0 0 3px ${colors.semantic.error.light}20`,
      animation: `bounce ${animations.duration.complex}ms ${animations.easing.easeOut}`,
    },
  },
  
  navigation: {
    activeIndicator: {
      transform: 'scaleX(1)',
      transition: `transform ${animations.duration.short}ms ${animations.easing.easeOut}`,
    },
    inactiveIndicator: {
      transform: 'scaleX(0)',
    },
  },
  
  notifications: {
    enter: {
      animation: `slideInRight ${animations.duration.standard}ms ${animations.easing.easeOut}`,
    },
    exit: {
      animation: `slideInRight ${animations.duration.standard}ms ${animations.easing.easeIn} reverse`,
    },
  },
};
```

---

## 7. Accessibility Design Guidelines

### 7.1 Color and Contrast

**Accessibility Color Standards:**
```typescript
// Accessibility color specifications
export const accessibilityColors = {
  contrast: {
    minimum: 4.5, // WCAG AA standard for normal text
    enhanced: 7,   // WCAG AAA standard for normal text
    large: 3,      // WCAG AA standard for large text (18pt+)
  },
  
  colorBlindness: {
    // Ensure these color combinations work for color-blind users
    safeColors: {
      success: colors.semantic.success.main, // Green
      warning: colors.semantic.warning.main, // Orange (not red/green)
      error: colors.semantic.error.main,     // Red with high contrast
      info: colors.semantic.info.main,       // Blue
    },
    // Don't rely solely on color - use icons, patterns, or text
    indicators: {
      success: { icon: 'check-circle', pattern: 'solid' },
      warning: { icon: 'warning', pattern: 'diagonal' },
      error: { icon: 'error', pattern: 'dotted' },
      info: { icon: 'info', pattern: 'horizontal' },
    },
  },
  
  focusIndicators: {
    outline: `2px solid ${colors.primary[500]}`,
    outlineOffset: '2px',
    boxShadow: `0 0 0 3px ${colors.primary[200]}`,
  },
};
```

### 7.2 Typography Accessibility

**Accessible Typography:**
```typescript
// Typography accessibility guidelines
export const accessibleTypography = {
  readability: {
    lineHeight: {
      minimum: 1.4,   // WCAG minimum
      optimal: 1.6,   // Better readability
    },
    letterSpacing: {
      minimum: 0,
      optimal: '0.02em',
    },
    wordSpacing: {
      minimum: '0.16em',
    },
  },
  
  sizing: {
    minimum: '14px',  // Minimum readable size
    body: '16px',     // Standard body text
    large: '18px',    // Large text threshold
  },
  
  hierarchy: {
    // Proper heading hierarchy (don't skip levels)
    h1: { fontSize: '2.5rem', usage: 'Page title (one per page)' },
    h2: { fontSize: '2rem', usage: 'Major section headers' },
    h3: { fontSize: '1.5rem', usage: 'Subsection headers' },
    h4: { fontSize: '1.25rem', usage: 'Minor headers' },
    h5: { fontSize: '1.125rem', usage: 'Rare usage' },
    h6: { fontSize: '1rem', usage: 'Avoid if possible' },
  },
  
  emphasis: {
    // Don't use color alone for emphasis
    methods: ['bold', 'italic', 'underline', 'icons'],
    avoid: ['color-only', 'size-only'],
  },
};
```

### 7.3 Interactive Element Guidelines

**Accessible Interactions:**
```typescript
// Accessibility interaction guidelines
export const accessibleInteractions = {
  targetSize: {
    minimum: '44px',  // WCAG minimum touch target
    recommended: '48px',
  },
  
  spacing: {
    betweenTargets: '8px', // Minimum spacing between interactive elements
  },
  
  keyboardNavigation: {
    focusOrder: 'logical', // Tab order should follow visual order
    skipLinks: true,      // Provide skip to main content
    focusTrapping: true,  // Trap focus in modals
    escapeKey: true,      // ESC key closes dialogs
  },
  
  ariaLabels: {
    required: [
      'buttons without visible text',
      'form inputs',
      'navigation landmarks',
      'interactive images',
    ],
    descriptive: true, // Labels should be descriptive, not generic
    contextual: true,  // Include context when needed
  },
  
  feedback: {
    screenReader: true,    // Provide screen reader announcements
    visual: true,          // Provide visual feedback
    timing: {
      minimum: '3000ms',   // Minimum time for reading feedback
    },
  },
};
```

---

## 8. Mobile-First Responsive Design

### 8.1 Mobile Design Principles

**Mobile-First Approach:**
```typescript
// Mobile-first design guidelines
export const mobileDesign = {
  principles: {
    contentFirst: 'Design for content, not container',
    touchFriendly: 'Design for finger navigation',
    performance: 'Optimize for slower connections',
    offline: 'Consider offline functionality',
  },
  
  touchTargets: {
    minimum: '44px',
    recommended: '48px',
    spacing: '8px',
  },
  
  gestures: {
    primary: 'tap',
    secondary: ['swipe', 'pinch', 'scroll'],
    avoid: ['hover', 'double-click', 'right-click'],
  },
  
  content: {
    hierarchy: 'Clear visual hierarchy',
    scanning: 'Design for quick scanning',
    chunking: 'Break content into digestible chunks',
  },
  
  navigation: {
    pattern: 'hamburger', // Mobile navigation pattern
    levels: 'maximum 3', // Limit navigation depth
    breadcrumbs: 'essential only',
  },
};
```

### 8.2 Responsive Component Patterns

**Component Responsiveness:**
```typescript
// Responsive component behavior
export const responsiveComponents = {
  contactCard: {
    mobile: {
      layout: 'stacked',
      actions: 'menu',
      image: 'small',
    },
    tablet: {
      layout: 'horizontal',
      actions: 'buttons',
      image: 'medium',
    },
    desktop: {
      layout: 'card',
      actions: 'buttons',
      image: 'large',
    },
  },
  
  contactList: {
    mobile: {
      view: 'list',
      itemsPerPage: 10,
      pagination: 'load-more',
    },
    tablet: {
      view: 'grid',
      columns: 2,
      itemsPerPage: 20,
      pagination: 'numbered',
    },
    desktop: {
      view: 'grid',
      columns: 4,
      itemsPerPage: 24,
      pagination: 'numbered',
    },
  },
  
  forms: {
    mobile: {
      layout: 'single-column',
      labels: 'above',
      buttons: 'full-width',
    },
    tablet: {
      layout: 'two-column',
      labels: 'above',
      buttons: 'right-aligned',
    },
    desktop: {
      layout: 'two-column',
      labels: 'left-aligned',
      buttons: 'right-aligned',
    },
  },
  
  navigation: {
    mobile: {
      type: 'drawer',
      trigger: 'hamburger',
      overlay: true,
    },
    tablet: {
      type: 'drawer',
      trigger: 'hamburger',
      overlay: true,
    },
    desktop: {
      type: 'sidebar',
      position: 'permanent',
      collapsible: true,
    },
  },
};
```

### 8.3 Performance Optimization

**Responsive Performance:**
```typescript
// Performance optimization for responsive design
export const performanceOptimization = {
  images: {
    responsive: true,
    lazyLoading: true,
    formats: ['webp', 'avif', 'jpg'],
    sizes: {
      mobile: '100vw',
      tablet: '50vw',
      desktop: '25vw',
    },
  },
  
  fonts: {
    loading: 'swap',
    preload: ['primary'],
    fallback: 'system-ui',
  },
  
  javascript: {
    codeSplitting: true,
    lazyRoutes: true,
    bundleSize: {
      target: '< 1MB',
      mobile: '< 500KB',
    },
  },
  
  css: {
    critical: 'inline',
    nonCritical: 'async',
    purging: true,
  },
};
```

---

## 9. Design System Documentation

### 9.1 Component Usage Guidelines

**Documentation Template:**
```typescript
// Component documentation template
export interface ComponentDocumentation {
  name: string;
  description: string;
  when: string; // When to use
  whenNot: string; // When not to use
  variants: Array<{
    name: string;
    description: string;
    usage: string;
  }>;
  accessibility: {
    requirements: string[];
    considerations: string[];
  };
  examples: Array<{
    title: string;
    description: string;
    code: string;
  }>;
}

// Example documentation
export const buttonDocumentation: ComponentDocumentation = {
  name: 'Button',
  description: 'Interactive element for user actions',
  when: 'Use buttons for actions that users can take',
  whenNot: 'Don\'t use buttons for navigation (use links instead)',
  variants: [
    {
      name: 'Primary',
      description: 'For the most important action on a page',
      usage: 'Only one primary button per page section',
    },
    {
      name: 'Secondary',
      description: 'For secondary actions',
      usage: 'Can have multiple secondary buttons',
    },
    {
      name: 'Ghost',
      description: 'For tertiary actions',
      usage: 'Use when you need a subtle action button',
    },
  ],
  accessibility: {
    requirements: [
      'Must have accessible name (text or aria-label)',
      'Must be keyboard navigable',
      'Must have focus indicator',
    ],
    considerations: [
      'Use descriptive text, avoid "click here"',
      'Ensure adequate color contrast',
      'Provide loading states for async actions',
    ],
  },
  examples: [
    {
      title: 'Basic Usage',
      description: 'Standard button with text',
      code: '<Button variant="primary">Save Contact</Button>',
    },
    {
      title: 'With Icon',
      description: 'Button with leading icon',
      code: '<Button variant="primary" startIcon={<AddIcon />}>Add Contact</Button>',
    },
  ],
};
```

### 9.2 Design Tokens Reference

**Token Documentation:**
```typescript
// Design token documentation
export const designTokensDocumentation = {
  colors: {
    primary: {
      description: 'Main brand color used for primary actions and brand elements',
      usage: ['Primary buttons', 'Links', 'Active states', 'Brand elements'],
      doNot: ['Backgrounds', 'Text (except links)', 'Borders (except focus)'],
      accessibility: 'Meets WCAG AA contrast ratio when used with white text',
    },
    neutral: {
      description: 'Grayscale colors for text, borders, and backgrounds',
      usage: ['Text', 'Borders', 'Backgrounds', 'Dividers'],
      scale: 'From 50 (lightest) to 900 (darkest)',
    },
  },
  
  typography: {
    scale: 'Modular scale based on 16px base',
    usage: {
      h1: 'Page titles only (one per page)',
      h2: 'Major section headers',
      h3: 'Subsection headers',
      body1: 'Primary body text',
      body2: 'Secondary body text',
      caption: 'Small text, labels, metadata',
    },
  },
  
  spacing: {
    system: 'Base-8 spacing system (multiples of 8px)',
    usage: {
      1: 'Tiny spacing (4px)',
      2: 'Small spacing (8px)',
      3: 'Medium spacing (12px)',
      4: 'Default spacing (16px)',
      6: 'Large spacing (24px)',
      8: 'Extra large spacing (32px)',
    },
  },
};
```

---

## 10. Quality Assurance and Testing

### 10.1 Visual Testing

**Visual Regression Testing:**
```typescript
// Visual testing guidelines
export const visualTesting = {
  breakpoints: [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'wide', width: 1920, height: 1080 },
  ],
  
  states: [
    'default',
    'hover',
    'focus',
    'active',
    'disabled',
    'loading',
    'error',
  ],
  
  components: [
    'Button',
    'Input',
    'Card',
    'Modal',
    'Form',
    'Navigation',
  ],
  
  pages: [
    'Dashboard',
    'Contacts',
    'Login',
    'Settings',
  ],
};
```

### 10.2 Accessibility Testing

**A11y Testing Checklist:**
```typescript
// Accessibility testing requirements
export const accessibilityTesting = {
  automated: [
    'axe-core integration',
    'Lighthouse audits',
    'WAVE browser extension',
  ],
  
  manual: [
    'Keyboard navigation',
    'Screen reader testing',
    'Color contrast verification',
    'Focus management',
    'ARIA attributes',
  ],
  
  tools: [
    'NVDA (Windows)',
    'JAWS (Windows)',
    'VoiceOver (Mac)',
    'TalkBack (Android)',
    'Dragon (Voice control)',
  ],
  
  checklist: [
    'All interactive elements are keyboard accessible',
    'Focus indicators are visible',
    'Images have alt text',
    'Forms have proper labels',
    'Headings create logical hierarchy',
    'Color is not the only way to convey information',
    'Text meets contrast requirements',
    'Error messages are clear and helpful',
  ],
};
```

### 10.3 Performance Guidelines

**Performance Standards:**
```typescript
// Performance requirements
export const performanceStandards = {
  metrics: {
    FCP: '< 1.8s',  // First Contentful Paint
    LCP: '< 2.5s',  // Largest Contentful Paint
    FID: '< 100ms', // First Input Delay
    CLS: '< 0.1',   // Cumulative Layout Shift
    TTI: '< 3.8s',  // Time to Interactive
  },
  
  bundleSize: {
    initial: '< 1MB',
    route: '< 500KB',
    component: '< 100KB',
  },
  
  optimization: [
    'Code splitting by route',
    'Lazy loading for below-fold content',
    'Image optimization and WebP format',
    'Font loading optimization',
    'Tree shaking for unused code',
    'Compression (Gzip/Brotli)',
  ],
};
```

---

## Implementation Checklist

### Design System Setup
- [ ] Install and configure Material-UI
- [ ] Create design token files
- [ ] Set up theme configuration
- [ ] Implement custom theme extensions
- [ ] Create animation utilities
- [ ] Set up responsive breakpoints

### Component Development
- [ ] Build atomic components (Button, Input, Avatar, etc.)
- [ ] Create molecular components (ContactCard, SearchBox, etc.)
- [ ] Develop organism components (ContactList, ContactForm, etc.)
- [ ] Build template components (DashboardLayout, AuthLayout, etc.)
- [ ] Implement responsive behavior
- [ ] Add accessibility features

### User Experience
- [ ] Implement loading states
- [ ] Create empty states
- [ ] Add error states and error boundaries
- [ ] Implement form validation UX
- [ ] Create navigation patterns
- [ ] Add micro-interactions

### Accessibility
- [ ] Ensure WCAG 2.1 AA compliance
- [ ] Add proper ARIA attributes
- [ ] Implement keyboard navigation
- [ ] Test with screen readers
- [ ] Verify color contrast
- [ ] Add focus management

### Responsive Design
- [ ] Implement mobile-first approach
- [ ] Test across all breakpoints
- [ ] Optimize for touch interactions
- [ ] Ensure content hierarchy works on mobile
- [ ] Test performance on mobile devices

### Quality Assurance
- [ ] Set up visual regression testing
- [ ] Implement accessibility testing
- [ ] Performance testing and optimization
- [ ] Cross-browser testing
- [ ] User testing and feedback collection

This comprehensive UI/UX guideline ensures ConnectKit delivers an exceptional user experience across all devices and user abilities, while maintaining consistency and accessibility standards.