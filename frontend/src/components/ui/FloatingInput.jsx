import React, { useState } from 'react';
import { useTheme } from '../../theme/ThemeContext';

export const FloatingInput = ({
  label,
  type = 'text',
  value,
  onChange,
  required = false,
  icon: Icon,
  style = {},
  ...rest
}) => {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const hasValue = value !== undefined && value !== null && value !== '';

  return (
    <div style={{ position: 'relative', marginBottom: 20, width: '100%', ...style }}>
      {Icon && (
        <Icon
          size={18}
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: focused ? theme.colors.accent : theme.colors.textSecondary,
            transition: 'color 0.2s',
            zIndex: 2,
          }}
        />
      )}
      <input
        type={type}
        value={value ?? ''}
        onChange={onChange}
        required={required}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          padding: Icon ? '18px 12px 6px 40px' : '18px 12px 6px 12px',
          borderRadius: 8,
          border: `1px solid ${focused ? theme.colors.accent : theme.colors.border}`,
          background: theme.colors.inputBg || '#16161f',
          color: theme.colors.text || '#ffffff',
          fontSize: 14,
          fontFamily: 'inherit',
          outline: 'none',
          transition: 'all 0.2s ease',
          boxSizing: 'border-box',
          boxShadow: focused ? `0 0 0 2px ${theme.colors.accent}15` : 'none',
        }}
        {...rest}
      />
      <label
        style={{
          position: 'absolute',
          left: Icon ? 40 : 12,
          top: focused || hasValue ? 6 : '50%',
          transform: focused || hasValue ? 'none' : 'translateY(-50%)',
          fontSize: focused || hasValue ? 10 : 13,
          fontWeight: focused || hasValue ? 600 : 400,
          color: focused ? theme.colors.accent : theme.colors.textSecondary,
          transition: 'all 0.2s ease',
          pointerEvents: 'none',
          letterSpacing: focused || hasValue ? '0.05em' : 'normal',
          textTransform: focused || hasValue ? 'uppercase' : 'none',
          zIndex: 3,
        }}
      >
        {label}{required && ' *'}
      </label>
    </div>
  );
};

export const FloatingSelect = ({
  label,
  value,
  onChange,
  children,
  required = false,
  style = {},
  ...rest
}) => {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const hasValue = value !== undefined && value !== null && value !== '';

  return (
    <div style={{ position: 'relative', marginBottom: 20, width: '100%', zIndex: 10, ...style }}>
      <select
        value={value ?? ''}
        onChange={onChange}
        required={required}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          padding: '18px 12px 6px 12px',
          borderRadius: 8,
          border: `1px solid ${focused ? theme.colors.accent : theme.colors.border}`,
          background: theme.colors.inputBg || '#16161f',
          color: theme.colors.text || '#ffffff',
          fontSize: 14,
          fontFamily: 'inherit',
          outline: 'none',
          appearance: 'none',
          cursor: 'pointer',
          boxSizing: 'border-box',
          boxShadow: focused ? `0 0 0 2px ${theme.colors.accent}15` : 'none',
          zIndex: 11,
        }}
        {...rest}
      >
        {children}
      </select>
      {/* Down arrow icon */}
      <span style={{
        position: 'absolute',
        right: 12,
        top: '50%',
        transform: 'translateY(-50%)',
        color: theme.colors.textSecondary,
        pointerEvents: 'none',
        fontSize: 12,
        zIndex: 12
      }}>▼</span>
      <label
        style={{
          position: 'absolute',
          left: 12,
          top: focused || hasValue ? 6 : '50%',
          transform: focused || hasValue ? 'none' : 'translateY(-50%)',
          fontSize: focused || hasValue ? 10 : 13,
          fontWeight: focused || hasValue ? 600 : 400,
          color: focused ? theme.colors.accent : theme.colors.textSecondary,
          transition: 'all 0.2s ease',
          pointerEvents: 'none',
          letterSpacing: focused || hasValue ? '0.05em' : 'normal',
          textTransform: focused || hasValue ? 'uppercase' : 'none',
          zIndex: 13,
        }}
      >
        {label}{required && ' *'}
      </label>
    </div>
  );
};

export const FloatingTextarea = ({
  label,
  value,
  onChange,
  rows = 3,
  required = false,
  style = {},
  ...rest
}) => {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const hasValue = value !== undefined && value !== null && value !== '';

  return (
    <div style={{ position: 'relative', marginBottom: 20, width: '100%', ...style }}>
      <textarea
        value={value ?? ''}
        onChange={onChange}
        rows={rows}
        required={required}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          padding: '18px 12px 8px 12px',
          borderRadius: 8,
          border: `1px solid ${focused ? theme.colors.accent : theme.colors.border}`,
          background: theme.colors.inputBg || '#16161f',
          color: theme.colors.text || '#ffffff',
          fontSize: 14,
          fontFamily: 'inherit',
          outline: 'none',
          resize: 'vertical',
          minHeight: 80,
          boxSizing: 'border-box',
          boxShadow: focused ? `0 0 0 2px ${theme.colors.accent}15` : 'none',
        }}
        {...rest}
      />
      <label
        style={{
          position: 'absolute',
          left: 12,
          top: focused || hasValue ? 6 : 14,
          fontSize: focused || hasValue ? 10 : 13,
          fontWeight: focused || hasValue ? 600 : 400,
          color: focused ? theme.colors.accent : theme.colors.textSecondary,
          transition: 'all 0.2s ease',
          pointerEvents: 'none',
          letterSpacing: focused || hasValue ? '0.05em' : 'normal',
          textTransform: focused || hasValue ? 'uppercase' : 'none',
          zIndex: 3,
        }}
      >
        {label}{required && ' *'}
      </label>
    </div>
  );
};

export default FloatingInput;
