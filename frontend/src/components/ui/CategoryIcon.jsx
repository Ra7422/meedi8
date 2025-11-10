import React from 'react';

/**
 * Category Icon Component
 * Uses exported SVG icons from Figma
 *
 * Available categories: work, family, money, romance, other
 *
 * Usage:
 *   <CategoryIcon category="work" size={48} />
 */
export default function CategoryIcon({ category, size = 48, className = '' }) {
  const iconMap = {
    work: '/assets/icons/work.svg',
    family: '/assets/icons/family.svg',
    money: '/assets/icons/money.svg',
    romance: '/assets/icons/romance.svg',
    other: '/assets/icons/other.svg',
  };

  const iconPath = iconMap[category?.toLowerCase()] || iconMap.other;

  const styles = {
    width: `${size}px`,
    height: 'auto',
    display: 'inline-block',
  };

  return (
    <img
      src={iconPath}
      alt={`${category} icon`}
      style={styles}
      className={`category-icon-${category} ${className}`}
    />
  );
}
