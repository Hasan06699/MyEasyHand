'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Home,
  Search,
  Calendar,
  User,
  ShoppingCart,
  Bell,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MyEasyHandLogo } from '@/components/brand/MyEasyHandLogo';
import { BRAND } from '@/lib/brand';
import { useAuthStore } from '@/stores/auth.store';
import { useCartStore } from '@/stores/cart.store';
import { notificationApi } from '@/lib/api';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/categories', label: 'Categories' },
  { href: '/businesses', label: 'Businesses' },
];

const mobileNav = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/services', label: 'Search', icon: Search },
  { href: '/cart', label: 'Cart', icon: ShoppingCart },
  { href: '/dashboard/bookings', label: 'Bookings', icon: Calendar },
  { href: '/dashboard', label: 'Account', icon: User },
];

export function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, loadUser } = useAuthStore();
  const itemCount = useCartStore((s) => s.itemCount());
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadUser();
  }, [loadUser]);

  const { data: unread } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: async () => {
      const res = await notificationApi.unreadCount();
      return res.data.data.count;
    },
    enabled: isAuthenticated,
    refetchInterval: 60000,
  });

  return (
    <>
      <header
        className="sticky top-0 z-50 border-b border-white/10 shadow-sm"
        style={{ backgroundColor: BRAND.headerBg }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-4">
            <button
              className="rounded-lg p-2 text-white hover:bg-white/10 md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <MyEasyHandLogo variant="onDark" size="md" />
          </div>

          <nav className="hidden gap-6 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-[#3FAFB0]',
                  pathname === item.href ? 'text-[#3FAFB0]' : 'text-white/85',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/cart" className="relative rounded-lg p-2 text-white hover:bg-white/10">
              <ShoppingCart className="h-5 w-5" />
              {mounted && itemCount > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: BRAND.teal }}
                >
                  {itemCount}
                </span>
              )}
            </Link>

            {mounted && isAuthenticated && (
              <Link
                href="/dashboard/notifications"
                className="relative rounded-lg p-2 text-white hover:bg-white/10"
              >
                <Bell className="h-5 w-5" />
                {unread ? (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-400" />
                ) : null}
              </Link>
            )}

            <div className="hidden items-center gap-2 sm:flex">
              {mounted && isAuthenticated && user ? (
                <>
                  <Link href="/dashboard">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10 hover:text-white"
                    >
                      Hi, {user.firstName}
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/30 text-white hover:bg-white/10"
                    onClick={() => logout()}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10 hover:text-white"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button
                      size="sm"
                      className="text-[#003c40] hover:opacity-90"
                      style={{ backgroundColor: BRAND.teal }}
                    >
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-white/10 px-4 py-4 lg:hidden" style={{ backgroundColor: BRAND.headerBg }}>
            <nav className="flex flex-col gap-2">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-white hover:bg-white/10"
                >
                  {item.label}
                </Link>
              ))}
              {!mounted || !isAuthenticated ? (
                <div className="mt-2 flex gap-2 border-t border-white/10 pt-4">
                  <Link href="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button
                      variant="outline"
                      className="w-full border-white/30 text-white hover:bg-white/10"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link href="/register" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button
                      className="w-full text-[#003c40]"
                      style={{ backgroundColor: BRAND.teal }}
                    >
                      Sign Up
                    </Button>
                  </Link>
                </div>
              ) : null}
            </nav>
          </div>
        )}
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white pb-safe md:hidden">
        <div className="flex items-center justify-around py-2">
          {mobileNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium',
                  active ? 'text-[#3FAFB0]' : 'text-slate-500',
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
                {item.href === '/cart' && mounted && itemCount > 0 && (
                  <span
                    className="absolute ml-4 mt-[-4px] flex h-4 w-4 items-center justify-center rounded-full text-[9px] text-white"
                    style={{ backgroundColor: BRAND.teal }}
                  >
                    {itemCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
