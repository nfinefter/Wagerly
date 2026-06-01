import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-foreground placeholder:text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
