import { forwardRef, type InputHTMLAttributes, type ReactNode, useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import styles from './Input.module.css';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      leftElement,
      rightElement,
      size = 'md',
      fullWidth = false,
      className,
      id: providedId,
      disabled,
      required,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;
    const describedBy = [
      hint && hintId,
      error && errorId,
      ariaDescribedBy,
    ].filter(Boolean).join(' ') || undefined;

    return (
      <div className={cn(styles.wrapper, fullWidth && styles.fullWidth, className)}>
        {label && (
          <label htmlFor={id} className={styles.label}>
            {label}
            {required && <span className={styles.required} aria-hidden="true">*</span>}
          </label>
        )}
        <div className={cn(styles.inputWrapper, error && styles.hasError)}>
          {leftElement && (
            <span className={styles.leftElement} aria-hidden="true">
              {leftElement}
            </span>
          )}
          <motion.input
            ref={ref}
            id={id}
            className={cn(styles.input, styles[size])}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            aria-required={required}
            whileHover={!disabled && !error ? { borderColor: 'var(--color-border-secondary)' } : undefined}
            whileFocus={!disabled ? { boxShadow: '0 0 0 var(--focus-ring-width) var(--focus-ring-color)' } : undefined}
            {...props}
          />
          {rightElement && (
            <span className={styles.rightElement} aria-hidden="true">
              {rightElement}
            </span>
          )}
        </div>
        {error && (
          <motion.p
            id={errorId}
            className={styles.error}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            {error}
          </motion.p>
        )}
        {hint && !error && (
          <p id={hintId} className={styles.hint}>
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  rows?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      hint,
      error,
      size = 'md',
      fullWidth = false,
      rows = 4,
      className,
      id: providedId,
      disabled,
      required,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;
    const describedBy = [
      hint && hintId,
      error && errorId,
      ariaDescribedBy,
    ].filter(Boolean).join(' ') || undefined;

    return (
      <div className={cn(styles.wrapper, fullWidth && styles.fullWidth, className)}>
        {label && (
          <label htmlFor={id} className={styles.label}>
            {label}
            {required && <span className={styles.required} aria-hidden="true">*</span>}
          </label>
        )}
        <div className={cn(styles.textareaWrapper, error && styles.hasError)}>
          <motion.textarea
            ref={ref}
            id={id}
            className={cn(styles.textarea, styles[size])}
            rows={rows}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            aria-required={required}
            whileHover={!disabled && !error ? { borderColor: 'var(--color-border-secondary)' } : undefined}
            whileFocus={!disabled ? { boxShadow: '0 0 0 var(--focus-ring-width) var(--focus-ring-color)' } : undefined}
            {...props}
          />
        </div>
        {error && (
          <motion.p
            id={errorId}
            className={styles.error}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            {error}
          </motion.p>
        )}
        {hint && !error && (
          <p id={hintId} className={styles.hint}>
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ required, children, className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(styles.label, className)}
        {...props}
      >
        {children}
        {required && <span className={styles.required} aria-hidden="true">*</span>}
      </label>
    );
  }
);

Label.displayName = 'Label';