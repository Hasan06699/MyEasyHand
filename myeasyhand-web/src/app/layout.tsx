import type { Metadata } from 'next';
import { QueryProvider } from '@/providers/QueryProvider';
import { CartSyncInit } from '@/components/cart/CartSyncInit';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ToastProvider } from '@/components/ui/toast-provider';
import OneSignalInit from '@/components/notifications/OneSignalInit';
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/constants';
import './globals.css';

export const metadata: Metadata = {
  title: { default: `${SITE_NAME} — Book Services Online`, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  icons: {
    icon: [{ url: '/icon.png', sizes: '32x32', type: 'image/png' }],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    type: 'website',
    siteName: SITE_NAME,
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: SITE_NAME }],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen pb-16 md:pb-0" suppressHydrationWarning>
        <QueryProvider>
          <CartSyncInit />
          <OneSignalInit />
          <Header />
          <main className="min-h-[calc(100vh-8rem)]">{children}</main>
          <Footer />
          <ToastProvider />
        </QueryProvider>
      </body>
    </html>
  );
}
