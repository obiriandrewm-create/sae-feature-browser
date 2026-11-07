export type Theme = 'light' | 'dark' | 'high-contrast';

export type ColorScheme = 'light' | 'dark';

export interface DesignTokens {
  colors: ColorTokens;
  spacing: SpacingTokens;
  typography: TypographyTokens;
  borderRadius: BorderRadiusTokens;
  shadows: ShadowTokens;
  transitions: TransitionTokens;
  zIndex: ZIndexTokens;
  breakpoints: BreakpointTokens;
}

export interface ColorTokens {
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  foreground: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  border: {
    primary: string;
    secondary: string;
    focus: string;
    error: string;
  };
  brand: {
    primary: string;
    primaryHover: string;
    primaryActive: string;
    secondary: string;
    secondaryHover: string;
    secondaryActive: string;
  };
  semantic: {
    success: string;
    successHover: string;
    warning: string;
    warningHover: string;
    error: string;
    errorHover: string;
    info: string;
    infoHover: string;
  };
  overlay: {
    backdrop: string;
    modal: string;
    tooltip: string;
  };
}

export interface SpacingTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
}

export interface TypographyTokens {
  fontFamily: {
    sans: string;
    mono: string;
    display: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
  };
}

export interface BorderRadiusTokens {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface ShadowTokens {
  none: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
}

export interface TransitionTokens {
  fast: string;
  normal: string;
  slow: string;
  easing: {
    easeIn: string;
    easeOut: string;
    easeInOut: string;
    spring: string;
  };
}

export interface ZIndexTokens {
  dropdown: number;
  sticky: number;
  modal: number;
  popover: number;
  tooltip: number;
  toast: number;
}

export interface BreakpointTokens {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface ComponentSize {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface ComponentVariant {
  primary: string;
  secondary: string;
  outline: string;
  ghost: string;
  destructive: string;
}

export type ButtonVariant = keyof ComponentVariant;
export type ButtonSize = keyof ComponentSize;
export type InputSize = keyof ComponentSize;
export type BadgeVariant = keyof ComponentVariant;
export type CardVariant = 'default' | 'outlined' | 'elevated' | 'filled';

export interface MotionConfig {
  respectReducedMotion: boolean;
  reducedMotionMultiplier: number;
  defaultDuration: number;
  springConfig: {
    stiffness: number;
    damping: number;
    mass: number;
  };
}

export interface FocusRingTokens {
  width: string;
  offset: string;
  color: string;
}