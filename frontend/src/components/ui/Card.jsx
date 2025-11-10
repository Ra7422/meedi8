import React from 'react';

/**
 * Reusable Card Component
 * Based on meedi8 design system
 *
 * Provides consistent card styling across the app
 *
 * Usage:
 *   <Card>
 *     <h2>Title</h2>
 *     <p>Content...</p>
 *   </Card>
 */
export default function Card({
  children,
  padding = 'normal',
  shadow = 'md',
  hover = false,
  className = '',
  style = {},
  ...props
}) {
  const paddingSizes = {
    none: '0',
    small: 'var(--spacing-md)',
    normal: 'var(--spacing-xl)',
    large: 'var(--spacing-2xl)',
  };

  const shadowSizes = {
    none: 'none',
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
  };

  const baseStyles = {
    background: 'white',
    borderRadius: 'var(--radius-lg)',
    padding: paddingSizes[padding],
    boxShadow: shadowSizes[shadow],
    transition: 'all 0.2s ease',
    ...style,
  };

  const hoverStyles = hover ? {
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: 'var(--shadow-lg)',
    },
  } : {};

  return (
    <div
      style={{ ...baseStyles, ...hoverStyles }}
      className={`card ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
