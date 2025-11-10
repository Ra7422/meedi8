import React from 'react';

/**
 * meedi8 Logo Component
 * Uses exported logo from Figma
 *
 * Usage:
 *   <Logo size="large" />
 *   <Logo size={120} />
 */
export default function Logo({ size = 'medium', className = '' }) {
  const sizes = {
    small: 80,
    medium: 120,
    large: 160,
    xlarge: 200,
  };

  const logoSize = typeof size === 'number' ? size : sizes[size];

  const styles = {
    width: `${logoSize}px`,
    height: 'auto',
    display: 'inline-block',
  };

  return (
    <img
      src="/assets/logo/meedi8-logo.png"
      alt="meedi8 logo"
      style={styles}
      className={`logo ${className}`}
    />
  );
}
