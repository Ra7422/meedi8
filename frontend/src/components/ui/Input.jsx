import React from 'react';

/**
 * Reusable Input Component
 * Based on meedi8 design system
 *
 * Types: text, email, password, textarea
 *
 * Usage:
 *   <Input
 *     label="Email"
 *     type="email"
 *     value={email}
 *     onChange={(e) => setEmail(e.target.value)}
 *     placeholder="Enter your email"
 *   />
 */
export default function Input({
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  disabled = false,
  required = false,
  rows = 4,
  className = '',
  ...props
}) {
  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-sm)',
    width: '100%',
  };

  const labelStyles = {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
  };

  const inputBaseStyles = {
    padding: 'var(--spacing-md)',
    borderRadius: 'var(--radius-sm)',
    border: `1px solid ${error ? 'var(--color-error)' : '#e5e7eb'}`,
    fontSize: '15px',
    color: 'var(--color-text-primary)',
    background: disabled ? 'var(--color-background-subtle)' : 'white',
    transition: 'all 0.2s ease',
    width: '100%',
    fontFamily: 'var(--font-sans)',
  };

  const errorStyles = {
    fontSize: '13px',
    color: 'var(--color-error)',
    marginTop: '-4px',
  };

  const focusStyles = {
    outline: 'none',
    borderColor: 'var(--color-primary)',
    boxShadow: `0 0 0 3px var(--color-primary-light)`,
  };

  return (
    <div style={containerStyles} className={className}>
      {label && (
        <label style={labelStyles}>
          {label}
          {required && <span style={{ color: 'var(--color-error)' }}> *</span>}
        </label>
      )}

      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          rows={rows}
          style={inputBaseStyles}
          onFocus={(e) => Object.assign(e.target.style, focusStyles)}
          onBlur={(e) => {
            Object.assign(e.target.style, inputBaseStyles);
            onBlur && onBlur(e);
          }}
          {...props}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          style={inputBaseStyles}
          onFocus={(e) => Object.assign(e.target.style, focusStyles)}
          onBlur={(e) => {
            Object.assign(e.target.style, inputBaseStyles);
            onBlur && onBlur(e);
          }}
          {...props}
        />
      )}

      {error && <span style={errorStyles}>{error}</span>}
    </div>
  );
}
