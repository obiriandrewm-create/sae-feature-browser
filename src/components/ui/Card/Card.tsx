import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface CardProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'ref' | 'onAnimationStart'> {
  variant?: 'default' | 'outlined';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-surface border border-border',
      outlined: 'bg-transparent border-2 border-border',
    } as const;

    return (
      <motion.div
        ref={ref}
        className={cn('rounded-xl p-6 transition-all duration-200', variants[variant], className)}
        whileHover={{ boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3)' }}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

export interface CardHeaderProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'ref' | 'onAnimationStart'> {
  title?: string;
}

export const CardHeader = ({ title, className, children, ...props }: CardHeaderProps) => (
  <div className={cn('mb-4 flex items-center gap-2', className)} {...(props as Record<string, unknown>)}>
    {title && <span className="font-semibold text-text">{title}</span>}
    {children}
  </div>
);

CardHeader.displayName = 'CardHeader';