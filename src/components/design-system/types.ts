// Design System Type Definitions
import { ReactNode, HTMLAttributes, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

// Base props that all components can accept
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
  testId?: string;
}

// Spacing variants
export type SpacingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// Color variants
export type ColorVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

// Size variants
export type SizeVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Button Props
export interface ButtonProps extends BaseComponentProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ColorVariant | 'outline' | 'ghost' | 'tip' | 'bounty';
  size?: SizeVariant;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  success?: boolean;
  hapticFeedback?: boolean;
}

// Card Props
export interface CardProps extends BaseComponentProps, HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  clickable?: boolean;
  padding?: SpacingSize;
  variant?: 'default' | 'elevated' | 'performer' | 'bounty';
}

export interface CardHeaderProps extends BaseComponentProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export interface CardContentProps extends BaseComponentProps {
  // Extends base props only
}

export interface CardFooterProps extends BaseComponentProps {
  // Extends base props only
}

// Form Props
export interface InputProps extends BaseComponentProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'filled' | 'outline';
  size?: SizeVariant;
  error?: string;
  helpText?: string;
  label?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export interface SelectProps extends BaseComponentProps {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  label?: string;
  size?: SizeVariant;
}

export interface FormGroupProps extends BaseComponentProps {
  label?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
}

// Modal Props
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
}

export interface ModalHeaderProps extends BaseComponentProps {
  title: string;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export interface ModalContentProps extends BaseComponentProps {
  // Extends base props only
}

export interface ModalFooterProps extends BaseComponentProps {
  // Extends base props only
}

// Badge Props
export interface BadgeProps extends BaseComponentProps {
  variant?: ColorVariant;
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  pulse?: boolean;
}

export interface StatusBadgeProps extends BaseComponentProps {
  status: 'online' | 'offline' | 'busy' | 'away' | 'live';
  showDot?: boolean;
  showText?: boolean;
}

// Avatar Props
export interface AvatarProps extends BaseComponentProps {
  src?: string;
  alt?: string;
  size?: SizeVariant;
  name?: string;
  status?: 'online' | 'offline' | 'busy' | 'away';
  showStatus?: boolean;
  fallbackIcon?: ReactNode;
}

// Layout Props
export interface ContainerProps extends BaseComponentProps, HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: SpacingSize;
  centered?: boolean;
}

export interface GridProps extends BaseComponentProps, HTMLAttributes<HTMLDivElement> {
  columns?: number | 'auto-fit' | 'auto-fill';
  gap?: SpacingSize;
  responsive?: boolean;
  minColumnWidth?: string;
}

export interface FlexProps extends BaseComponentProps, HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  gap?: SpacingSize;
}

// Tabs Props
export interface TabsProps extends BaseComponentProps {
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'pills' | 'underline';
}

export interface TabProps extends BaseComponentProps {
  value: string;
  disabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export interface TabPanelProps extends BaseComponentProps {
  value: string;
}

// Toast Props
export interface ToastProps extends BaseComponentProps {
  variant?: ColorVariant | 'info';
  title?: string;
  description?: string;
  action?: ReactNode;
  duration?: number;
  onClose?: () => void;
}

// Loading Props
export interface LoadingSpinnerProps extends BaseComponentProps {
  size?: SizeVariant;
  color?: string;
}

export interface LoadingSkeletonProps extends BaseComponentProps {
  height?: string | number;
  width?: string | number;
  lines?: number;
  circle?: boolean;
  avatar?: boolean;
}