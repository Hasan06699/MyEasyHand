import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'accent' | 'soft';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-brand-blue text-white shadow-soft hover:bg-brand-blue-dark',
      accent: 'bg-brand-orange text-white shadow-soft hover:bg-brand-orange-dark',
      soft: 'bg-[#E3F2FD] text-brand-blue-dark hover:bg-[#BBDEFB]',
      outline: 'border-2 border-brand-blue/30 bg-white text-brand-blue-dark hover:border-brand-blue hover:bg-[#E3F2FD]',
      ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    };
    const sizes = {
      sm: 'h-9 px-3.5 text-sm rounded-full',
      md: 'h-11 px-5 text-sm rounded-full',
      lg: 'h-12 px-7 text-base rounded-full',
    };
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold transition-all disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
export { Button };
