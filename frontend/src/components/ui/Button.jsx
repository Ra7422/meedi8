import React from 'react';

/**
 * Reusable Button Component
 * Based on meedi8 design system
 *
 * Variants:
 * - primary: Main call-to-action (mint/teal)
 * - secondary: Secondary actions (purple)
 * - ghost: Minimal style for less emphasis
 *
 * Usage:
 *   <Button variant="primary" onClick={handleClick}>
 *     Click Me
 *   </Button>
 */
export default function Button({
  children,
  variant = 'primary',
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  const baseStyles = {
    padding: 'var(--spacing-md) var(--spacing-xl)',
    borderRadius: 'var(--radius-md)',
    fontSize: '16px',
    fontWeight: '600',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--spacing-sm)',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.6 : 1,
    boxShadow: 'var(--shadow-sm)',
  };

  const variants = {
    primary: {
      ...baseStyles,
      background: 'var(--color-primary)',
      color: 'white',
    },
    secondary: {
      ...baseStyles,
      background: 'var(--color-accent)',
      color: 'white',
    },
    ghost: {
      ...baseStyles,
      background: 'transparent',
      color: 'var(--color-text-primary)',
      boxShadow: 'none',
      border: '1px solid var(--color-text-secondary)',
    },
  };

  const hoverStyles = !disabled ? {
    ':hover': {
      transform: 'translateY(-1px)',
      boxShadow: 'var(--shadow-md)',
      filter: 'brightness(1.05)',
    },
    ':active': {
      transform: 'translateY(0)',
      boxShadow: 'var(--shadow-sm)',
    },
  } : {};

  return (
    <button
      type={type}
      onClick={!disabled ? onClick : undefined}
      style={{ ...variants[variant], ...hoverStyles }}
      disabled={disabled}
      className={`btn-${variant} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
