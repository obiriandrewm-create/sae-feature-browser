import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ButtonProps extends Omit<React.ComponentPropsWithoutRef<'button'>, 'ref' | 'onAnimationStart'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const variants = {
      primary: 'bg-accent text-accent-strong border-none hover:bg-accent-hover',
      secondary: 'bg-transparent border border-border hover:bg-accent-dim hover:text-accent',
      ghost: 'bg-transparent text-text-muted hover:text-text hover:bg-surface',
      danger: 'bg-transparent border border-danger text-danger hover:bg-danger-dim hover:text-danger',
    } as const;

    const sizes = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    } as const;

    return (
      <motion.button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-full font-medium transition-all duration-150',
          variants[variant],
          sizes[size],
          className
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';