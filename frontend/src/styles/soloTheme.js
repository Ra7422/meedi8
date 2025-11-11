// Solo Mode Design System
// Calming sage green/mint color palette for individual self-reflection

export const soloTheme = {
  colors: {
    // Primary colors - calming sage green for personal work
    primary: '#7FA886',           // Soft sage green (main brand for Solo)
    primaryLight: '#A8C5AD',      // Light mint (hover states, light accents)
    primaryPale: '#F5F9F6',       // Nearly white sage tint (backgrounds)
    secondary: '#6B9373',         // Deeper sage (secondary actions)
    secondaryDark: '#557A5C',     // Rich forest green (borders, emphasis)

    // Backgrounds
    backgroundPrimary: '#F5F9F6', // Very light sage tint (page background)
    backgroundSecondary: '#FAFCFA', // Slightly warmer white (cards)
    backgroundWhite: '#FFFFFF',   // Pure white (chat bubbles)

    // Message backgrounds
    aiMessageBg: '#F0F4F1',       // Soft sage-gray for AI messages (calm, professional)
    userMessageBg: '#FFFFFF',     // Clean white for user messages
    insightBubble: '#F5F9F6',     // Light sage for key insights display

    // Text colors
    textPrimary: '#557A5C',       // Rich forest green for headings
    textSecondary: '#4A5D4E',     // Deep sage-gray for body text
    textLight: '#7B8F7E',         // Lighter sage for subtle text
    textWhite: '#FFFFFF',         // White for buttons

    // Action button colors (with psychological intent)
    actionTalkTo: {
      from: '#7FA886',            // Sage green gradient
      to: '#A8C5AD',
      text: '#FFFFFF',
      description: 'Encouraging, primary action'
    },
    actionInvite: {
      from: '#7DD3C0',            // Teal gradient (bridge to mediation)
      to: '#A8E6CF',
      text: '#FFFFFF',
      description: 'Bridge to existing Meedi8 feature'
    },
    actionBoundary: {
      bg: '#FFFFFF',              // White with blue border
      border: '#6A7BA2',          // Muted professional blue
      text: '#6A7BA2',
      description: 'Self-protective, empowering'
    },
    actionProfessional: {
      from: '#6A7BA2',            // Muted blue gradient
      to: '#8A9AC2',
      text: '#FFFFFF',
      glow: 'rgba(106, 123, 162, 0.3)',
      description: 'Serious, important - for therapy referral'
    },
    actionCoolDown: {
      bg: '#F0F4F1',              // Soft sage-gray
      text: '#4A5D4E',
      description: 'Calming, patient'
    },

    // Clarity summary colors
    clarityKeyInsight: '#7FA886',      // Primary sage for insights
    claritySuggestion: '#7DD3C0',      // Teal for actionable steps
    clarityBackground: '#F5F9F6',       // Light sage background

    // UI elements
    border: '#C8D7CB',            // Light sage border
    borderStrong: '#A8C5AD',      // Stronger sage for emphasis
    borderAccent: '#7FA886',      // Rich sage for focused states

    // Status colors
    success: '#82C9A0',           // Soft green (celebratory but gentle)
    caution: '#F4A261',           // Warm orange (gentle warning)
    info: '#A8C5D9',              // Soft blue (informational)
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
    sm: '0 1px 2px rgba(127, 168, 134, 0.08)',     // Subtle sage tint
    md: '0 4px 6px rgba(127, 168, 134, 0.12)',
    lg: '0 10px 15px rgba(127, 168, 134, 0.15)',
    professional: '0 0 20px rgba(106, 123, 162, 0.3)', // Special glow for therapy button
  },
};

// Solo mode component styles
export const soloStyles = {
  // Primary button (warm rose)
  buttonPrimary: {
    background: `linear-gradient(135deg, ${soloTheme.colors.primary} 0%, ${soloTheme.colors.primaryLight} 100%)`,
    color: soloTheme.colors.textWhite,
    padding: '12px 24px',
    borderRadius: soloTheme.borderRadius.lg,
    border: 'none',
    fontSize: soloTheme.fontSize.md,
    fontWeight: soloTheme.fontWeight.medium,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: soloTheme.shadows.md,
  },

  // Action button: Talk to person
  buttonActionTalkTo: {
    background: `linear-gradient(135deg, ${soloTheme.colors.actionTalkTo.from} 0%, ${soloTheme.colors.actionTalkTo.to} 100%)`,
    color: soloTheme.colors.actionTalkTo.text,
    padding: '14px 28px',
    borderRadius: soloTheme.borderRadius.xl,
    border: 'none',
    fontSize: soloTheme.fontSize.md,
    fontWeight: soloTheme.fontWeight.semibold,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: soloTheme.shadows.md,
  },

  // Action button: Invite to mediation
  buttonActionInvite: {
    background: `linear-gradient(135deg, ${soloTheme.colors.actionInvite.from} 0%, ${soloTheme.colors.actionInvite.to} 100%)`,
    color: soloTheme.colors.actionInvite.text,
    padding: '14px 28px',
    borderRadius: soloTheme.borderRadius.xl,
    border: 'none',
    fontSize: soloTheme.fontSize.md,
    fontWeight: soloTheme.fontWeight.semibold,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: soloTheme.shadows.md,
  },

  // Action button: Set boundary
  buttonActionBoundary: {
    backgroundColor: soloTheme.colors.actionBoundary.bg,
    color: soloTheme.colors.actionBoundary.text,
    padding: '14px 28px',
    borderRadius: soloTheme.borderRadius.xl,
    border: `2px solid ${soloTheme.colors.actionBoundary.border}`,
    fontSize: soloTheme.fontSize.md,
    fontWeight: soloTheme.fontWeight.semibold,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  // Action button: Professional help (special styling with glow)
  buttonActionProfessional: {
    background: `linear-gradient(135deg, ${soloTheme.colors.actionProfessional.from} 0%, ${soloTheme.colors.actionProfessional.to} 100%)`,
    color: soloTheme.colors.actionProfessional.text,
    padding: '14px 28px',
    borderRadius: soloTheme.borderRadius.xl,
    border: 'none',
    fontSize: soloTheme.fontSize.md,
    fontWeight: soloTheme.fontWeight.semibold,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: soloTheme.shadows.professional,
  },

  // Action button: Take time/cool down
  buttonActionCoolDown: {
    backgroundColor: soloTheme.colors.actionCoolDown.bg,
    color: soloTheme.colors.actionCoolDown.text,
    padding: '14px 28px',
    borderRadius: soloTheme.borderRadius.xl,
    border: `1px solid ${soloTheme.colors.border}`,
    fontSize: soloTheme.fontSize.md,
    fontWeight: soloTheme.fontWeight.medium,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  // Outline button
  buttonOutline: {
    backgroundColor: 'transparent',
    color: soloTheme.colors.primary,
    padding: '12px 24px',
    borderRadius: soloTheme.borderRadius.lg,
    border: `2px solid ${soloTheme.colors.primary}`,
    fontSize: soloTheme.fontSize.md,
    fontWeight: soloTheme.fontWeight.medium,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  // Input field
  input: {
    backgroundColor: soloTheme.colors.backgroundWhite,
    border: `1px solid ${soloTheme.colors.border}`,
    borderRadius: soloTheme.borderRadius.lg,
    padding: '12px 16px',
    fontSize: soloTheme.fontSize.md,
    color: soloTheme.colors.textSecondary,
    width: '100%',
    transition: 'border-color 0.2s ease',
  },

  // Chat bubble AI (warm beige, therapist-adjacent)
  chatBubbleAI: {
    backgroundColor: soloTheme.colors.aiMessageBg,
    color: soloTheme.colors.textSecondary,
    padding: '14px 18px',
    borderRadius: soloTheme.borderRadius.md,
    maxWidth: '75%',
    whiteSpace: 'pre-wrap',
    lineHeight: '1.6',
    boxShadow: soloTheme.shadows.sm,
  },

  // Chat bubble User (clean white)
  chatBubbleUser: {
    backgroundColor: soloTheme.colors.userMessageBg,
    color: soloTheme.colors.textSecondary,
    padding: '14px 18px',
    borderRadius: soloTheme.borderRadius.md,
    maxWidth: '75%',
    whiteSpace: 'pre-wrap',
    lineHeight: '1.6',
    border: `1px solid ${soloTheme.colors.border}`,
  },

  // Clarity summary container
  claritySummary: {
    backgroundColor: soloTheme.colors.clarityBackground,
    border: `2px solid ${soloTheme.colors.primary}`,
    borderRadius: soloTheme.borderRadius.xl,
    padding: '24px',
    marginTop: '20px',
    boxShadow: soloTheme.shadows.lg,
  },

  // Key insight item
  clarityInsightItem: {
    backgroundColor: soloTheme.colors.backgroundWhite,
    border: `1px solid ${soloTheme.colors.clarityKeyInsight}`,
    borderLeft: `4px solid ${soloTheme.colors.clarityKeyInsight}`,
    borderRadius: soloTheme.borderRadius.md,
    padding: '12px 16px',
    marginBottom: '12px',
    color: soloTheme.colors.textSecondary,
    lineHeight: '1.6',
  },

  // Suggested action item
  claritySuggestionItem: {
    backgroundColor: soloTheme.colors.backgroundWhite,
    border: `1px solid ${soloTheme.colors.claritySuggestion}`,
    borderLeft: `4px solid ${soloTheme.colors.claritySuggestion}`,
    borderRadius: soloTheme.borderRadius.md,
    padding: '12px 16px',
    marginBottom: '12px',
    color: soloTheme.colors.textSecondary,
    lineHeight: '1.6',
  },

  // Page container
  pageContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: soloTheme.colors.backgroundPrimary,
    padding: '20px',
  },

  // Heading (rich rose, personal)
  heading: {
    color: soloTheme.colors.textPrimary,
    fontSize: soloTheme.fontSize.xxxl,
    fontWeight: soloTheme.fontWeight.semibold,
    textAlign: 'center',
    marginBottom: soloTheme.spacing.xl,
  },

  // Subheading
  subheading: {
    color: soloTheme.colors.textSecondary,
    fontSize: soloTheme.fontSize.lg,
    fontWeight: soloTheme.fontWeight.medium,
    marginBottom: soloTheme.spacing.md,
  },
};

// Helper function to get action button style by action type
export function getActionButtonStyle(actionType) {
  const styleMap = {
    'talk_to_person': soloStyles.buttonActionTalkTo,
    'invite_to_mediation': soloStyles.buttonActionInvite,
    'set_boundary': soloStyles.buttonActionBoundary,
    'seek_therapy': soloStyles.buttonActionProfessional,
    'seek_professional': soloStyles.buttonActionProfessional,
    'cool_down': soloStyles.buttonActionCoolDown,
    'take_time': soloStyles.buttonActionCoolDown,
    'work_on_self': soloStyles.buttonActionCoolDown,
    'let_go': soloStyles.buttonActionCoolDown,
  };

  return styleMap[actionType] || soloStyles.buttonPrimary;
}
