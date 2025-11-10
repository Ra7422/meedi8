// Clean Air Design System
export const theme = {
  colors: {
    // Backgrounds
    backgroundPrimary: '#EAF7F0',
    backgroundSecondary: '#E4F1EA',
    backgroundWhite: '#FFFFFF',

    // Accent colors
    primary: '#7DD3C0',        // Turquoise
    secondary: '#7C6CB6',      // Purple

    // Text colors
    textPrimary: '#7DD3C0',    // Turquoise for headings
    textSecondary: '#9CA3AF',  // Gray for body
    textDark: '#374151',
    textWhite: '#FFFFFF',

    // Chat bubbles
    aiMessage: '#C8B6FF',      // Light purple
    user1Message: '#2196F3',   // Blue
    user2Message: '#9CA3AF',   // Gray

    // UI elements
    border: '#E5E7EB',
    borderAccent: '#7DD3C0',

    // Status colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
    xxxl: '32px',
  },

  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  },

  fontSize: {
    xs: '12px',
    sm: '13px',
    base: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    xxl: '24px',
    xxxl: '32px',
    display: '48px',
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  },
};

// Common component styles
export const commonStyles = {
  // Primary button (turquoise)
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
    color: theme.colors.textWhite,
    padding: '12px 24px',
    borderRadius: theme.borderRadius.lg,
    border: 'none',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  // Secondary button (purple)
  buttonSecondary: {
    backgroundColor: theme.colors.secondary,
    color: theme.colors.textWhite,
    padding: '12px 24px',
    borderRadius: theme.borderRadius.lg,
    border: 'none',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  // Outline button
  buttonOutline: {
    backgroundColor: 'transparent',
    color: theme.colors.primary,
    padding: '12px 24px',
    borderRadius: theme.borderRadius.lg,
    border: `2px solid ${theme.colors.primary}`,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  // Input field
  input: {
    backgroundColor: theme.colors.backgroundWhite,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.lg,
    padding: '12px 16px',
    fontSize: theme.fontSize.md,
    color: theme.colors.textDark,
    width: '100%',
  },

  // Chat bubble AI
  chatBubbleAI: {
    backgroundColor: theme.colors.aiMessage,
    color: theme.colors.textWhite,
    padding: '12px 16px',
    borderRadius: theme.borderRadius.md,
    maxWidth: '75%',
    whiteSpace: 'pre-wrap',
  },

  // Chat bubble User
  chatBubbleUser: {
    backgroundColor: theme.colors.user1Message,
    color: theme.colors.textWhite,
    padding: '12px 16px',
    borderRadius: theme.borderRadius.md,
    maxWidth: '75%',
    whiteSpace: 'pre-wrap',
  },

  // Page container
  pageContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: theme.colors.backgroundPrimary,
    padding: '20px',
  },

  // Heading (turquoise, large)
  heading: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.semibold,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
};
