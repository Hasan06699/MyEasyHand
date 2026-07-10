import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[#E3F2FD] text-brand-blue-dark',
        secondary: 'bg-slate-100 text-slate-700',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-[#FFF3E0] text-brand-orange-dark',
        destructive: 'bg-red-100 text-red-800',
        outline: 'border border-brand-blue/20 text-slate-700',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
