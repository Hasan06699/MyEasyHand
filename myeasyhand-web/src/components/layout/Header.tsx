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
import { CityPicker } from '@/components/location/CityPicker';
import { BRAND } from '@/lib/brand';
import { useAuthStore } from '@/stores/auth.store';
import { useCartStore } from '@/stores/cart.store';
import { notificationApi } from '@/lib/api';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/categories', label: 'Categories' },
  { href: '/businesses', label: 'Partners' },
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
      <header className="sticky top-0 z-50 border-b border-brand-blue/10 bg-white/90 backdrop-blur-xl">
        <div className="section-shell flex h-[4.25rem] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              className="rounded-full p-2 text-slate-700 hover:bg-brand-soft md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <MyEasyHandLogo variant="gradient" size="md" />
          </div>

          <nav className="hidden items-center gap-1 rounded-full bg-brand-soft/80 p-1 lg:flex">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-semibold transition-all',
                    active
                      ? 'bg-white text-brand-blue-dark shadow-sm'
                      : 'text-slate-600 hover:text-brand-blue',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <CityPicker />
            <Link
              href="/cart"
              className="relative rounded-full p-2.5 text-slate-700 hover:bg-brand-soft"
            >
              <ShoppingCart className="h-5 w-5" />
              {mounted && itemCount > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                  style={{ backgroundColor: BRAND.orange }}
                >
                  {itemCount}
                </span>
              )}
            </Link>

            {mounted && isAuthenticated && (
              <Link
                href="/dashboard/notifications"
                className="relative rounded-full p-2.5 text-slate-700 hover:bg-brand-soft"
              >
                <Bell className="h-5 w-5" />
                {unread ? (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
                ) : null}
              </Link>
            )}

            <div className="hidden items-center gap-2 sm:flex">
              {mounted && isAuthenticated && user ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="soft" size="sm">
                      Hi, {user.firstName}
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => logout()}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="accent" size="sm">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-brand-blue/10 bg-white px-4 py-4 lg:hidden">
            <nav className="flex flex-col gap-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-brand-soft"
                >
                  {item.label}
                </Link>
              ))}
              {!mounted || !isAuthenticated ? (
                <div className="mt-2 flex gap-2 border-t border-brand-blue/10 pt-4">
                  <Link href="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link href="/register" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button variant="accent" className="w-full">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              ) : null}
            </nav>
          </div>
        )}
      </header>

      <nav className="fixed bottom-3 left-3 right-3 z-50 rounded-3xl border border-brand-blue/10 bg-white/95 shadow-lift backdrop-blur-xl pb-safe md:hidden">
        <div className="flex items-center justify-around py-2.5">
          {mobileNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1 text-[10px] font-bold',
                  active ? 'text-brand-blue' : 'text-slate-400',
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-2xl transition-colors',
                    active && 'bg-brand-soft text-brand-blue',
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {item.label}
                {item.href === '/cart' && mounted && itemCount > 0 && (
                  <span
                    className="absolute right-1 top-0 flex h-4 w-4 items-center justify-center rounded-full text-[9px] text-white"
                    style={{ backgroundColor: BRAND.orange }}
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
