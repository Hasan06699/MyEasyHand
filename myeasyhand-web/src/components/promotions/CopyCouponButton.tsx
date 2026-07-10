'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast-provider';
import { cn } from '@/lib/utils';

export function CopyCouponButton({
  code,
  className,
  size = 'lg',
}: {
  code: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success(`Coupon code "${code}" copied`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy code. Please copy manually.');
    }
  };

  return (
    <Button
      type="button"
      size={size}
      onClick={handleCopy}
      className={cn('gap-2 bg-white text-[#1565C0] hover:bg-slate-100', className)}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? 'Copied!' : 'Copy Coupon Code'}
    </Button>
  );
}
