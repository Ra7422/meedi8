import React from 'react';

/**
 * Illustration Component
 * Uses exported character illustrations from Figma
 *
 * Available illustrations:
 * - sitting: Person sitting (lifesavers-sitting.svg)
 * - floor: Person sitting on floor (stuck-at-home-sitting-on-floor.svg)
 * - waiting: Two people waiting (waiting-other-person-to-join.svg)
 *
 * Usage:
 *   <Illustration name="sitting" size={200} />
 */
export default function Illustration({ name, size = 150, className = '' }) {
  const illustrationMap = {
    sitting: '/assets/illustrations/lifesavers-sitting.svg',
    floor: '/assets/illustrations/stuck-at-home-sitting-on-floor.svg',
    waiting: '/assets/illustrations/waiting-other-person-to-join.svg',
  };

  const illustrationPath = illustrationMap[name] || illustrationMap.sitting;

  const styles = {
    width: `${size}px`,
    height: 'auto',
    display: 'inline-block',
  };

  return (
    <img
      src={illustrationPath}
      alt={`${name} illustration`}
      style={styles}
      className={`illustration-${name} ${className}`}
    />
  );
}
