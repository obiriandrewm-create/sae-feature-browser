import type { DesignTokens, MotionConfig, FocusRingTokens } from '@/types/ui';

export const designTokens: DesignTokens = {
  colors: {
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      inverse: '#0f172a',
    },
    foreground: {
      primary: '#0f172a',
      secondary: '#334155',
      tertiary: '#64748b',
      inverse: '#f8fafc',
    },
    border: {
      primary: '#e2e8f0',
      secondary: '#cbd5e1',
      focus: '#3b82f6',
      error: '#ef4444',
    },
    brand: {
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      primaryActive: '#1d4ed8',
      secondary: '#8b5cf6',
      secondaryHover: '#7c3aed',
      secondaryActive: '#6d28d9',
    },
    semantic: {
      success: '#22c55e',
      successHover: '#16a34a',
      warning: '#f59e0b',
      warningHover: '#d97706',
      error: '#ef4444',
      errorHover: '#dc2626',
      info: '#3b82f6',
      infoHover: '#2563eb',
    },
    overlay: {
      backdrop: 'rgba(15, 23, 42, 0.5)',
      modal: '#ffffff',
      tooltip: '#1e293b',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
    '4xl': '6rem',
  },
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: 'JetBrains Mono, "Fira Code", Consolas, monospace',
      display: 'Cal Sans, Inter, system-ui, sans-serif',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
    letterSpacing: {
      tight: '-0.02em',
      normal: '0',
      wide: '0.02em',
    },
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
  shadows: {
    none: 'none',
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },
  transitions: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  },
  zIndex: {
    dropdown: 100,
    sticky: 200,
    modal: 500,
    popover: 600,
    tooltip: 700,
    toast: 800,
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

export const darkTokens: DesignTokens = {
  ...designTokens,
  colors: {
    background: {
      primary: '#0f172a',
      secondary: '#1e293b',
      tertiary: '#334155',
      inverse: '#f8fafc',
    },
    foreground: {
      primary: '#f8fafc',
      secondary: '#e2e8f0',
      tertiary: '#94a3b8',
      inverse: '#0f172a',
    },
    border: {
      primary: '#334155',
      secondary: '#475569',
      focus: '#60a5fa',
      error: '#f87171',
    },
    brand: {
      primary: '#60a5fa',
      primaryHover: '#3b82f6',
      primaryActive: '#2563eb',
      secondary: '#a78bfa',
      secondaryHover: '#8b5cf6',
      secondaryActive: '#7c3aed',
    },
    semantic: {
      success: '#4ade80',
      successHover: '#22c55e',
      warning: '#fbbf24',
      warningHover: '#f59e0b',
      error: '#f87171',
      errorHover: '#ef4444',
      info: '#60a5fa',
      infoHover: '#3b82f6',
    },
    overlay: {
      backdrop: 'rgba(0, 0, 0, 0.7)',
      modal: '#1e293b',
      tooltip: '#f1f5f9',
    },
  },
};

export const highContrastTokens: DesignTokens = {
  ...designTokens,
  colors: {
    background: {
      primary: '#ffffff',
      secondary: '#f0f0f0',
      tertiary: '#e0e0e0',
      inverse: '#000000',
    },
    foreground: {
      primary: '#000000',
      secondary: '#1a1a1a',
      tertiary: '#333333',
      inverse: '#ffffff',
    },
    border: {
      primary: '#000000',
      secondary: '#333333',
      focus: '#0000ff',
      error: '#cc0000',
    },
    brand: {
      primary: '#0000cc',
      primaryHover: '#000099',
      primaryActive: '#000066',
      secondary: '#6600cc',
      secondaryHover: '#4d0099',
      secondaryActive: '#330066',
    },
    semantic: {
      success: '#006600',
      successHover: '#004d00',
      warning: '#cc6600',
      warningHover: '#994d00',
      error: '#cc0000',
      errorHover: '#990000',
      info: '#0000cc',
      infoHover: '#000099',
    },
    overlay: {
      backdrop: 'rgba(0, 0, 0, 0.8)',
      modal: '#ffffff',
      tooltip: '#000000',
    },
  },
};

export const motionConfig: MotionConfig = {
  respectReducedMotion: true,
  reducedMotionMultiplier: 0.01,
  defaultDuration: 200,
  springConfig: {
    stiffness: 300,
    damping: 30,
    mass: 1,
  },
};

export const focusRingTokens: FocusRingTokens = {
  width: '2px',
  offset: '2px',
  color: 'var(--color-border-focus)',
};

export function getTokensForTheme(theme: 'light' | 'dark' | 'high-contrast'): DesignTokens {
  switch (theme) {
    case 'dark':
      return darkTokens;
    case 'high-contrast':
      return highContrastTokens;
    default:
      return designTokens;
  }
}

export function tokensToCSSVariables(tokens: DesignTokens): string {
  const lines: string[] = [];

  function addVars(obj: unknown, prefix: string): void {
    if (typeof obj !== 'object' || obj === null) return;
    for (const [key, value] of Object.entries(obj)) {
      const cssKey = `${prefix}-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      if (typeof value === 'object' && value !== null) {
        addVars(value, cssKey);
      } else {
        lines.push(`  ${cssKey}: ${value};`);
      }
    }
  }

  addVars(tokens, '--token');
  return lines.join('\n');
}

export const lightCSSVars = tokensToCSSVariables(designTokens);
export const darkCSSVars = tokensToCSSVariables(darkTokens);
export const highContrastCSSVars = tokensToCSSVariables(highContrastTokens);