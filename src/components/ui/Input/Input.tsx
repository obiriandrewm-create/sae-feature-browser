import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface InputProps extends Omit<React.ComponentPropsWithoutRef<'input'>, 'ref' | 'onAnimationStart'> {
  variant?: 'default' | 'filled';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-surface border border-border focus:border-accent focus:ring-1 focus:ring-accent',
      filled: 'bg-bg-elevated border-none focus:bg-surface-hover',
    } as const;

    return (
      <motion.div
        className={cn('relative w-full', className)}
        whileHover={{ scale: 1.005 }}
      >
        <motion.input
          ref={ref}
          className={cn(
            'w-full px-4 py-2 rounded-lg text-text transition-all duration-150',
            variants[variant],
            'placeholder:text-text-subtle focus:outline-none'
          )}
          whileFocus={{ borderColor: 'var(--color-accent)' }}
          {...(props as Record<string, unknown>)}
        />
      </motion.div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends Omit<React.ComponentPropsWithoutRef<'textarea'>, 'ref' | 'onAnimationStart'> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <motion.textarea
      ref={ref}
      className={cn(
        'w-full px-4 py-2 rounded-lg bg-surface border border-border text-text focus:border-accent focus:ring-1 focus:ring-accent placeholder:text-text-subtle transition-all duration-150',
        className
      )}
      whileFocus={{ borderColor: 'var(--color-accent)' }}
      {...(props as Record<string, unknown>)}
    />
  )
);

Textarea.displayName = 'Textarea';