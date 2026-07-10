'use client';

import { baselightTheme } from '@/utils/theme/DefaultColors';
import { ThemeProvider } from '@/lib/mui-styles';
import CssBaseline from '@mui/material/CssBaseline';
import { DashboardContextProvider } from './context/DashboardContext';
import { QueryProvider } from '@/providers/QueryProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" />
        <title>MyEasyHand Admin — Service Booking Platform</title>
      </head>
      <body suppressHydrationWarning>
        <QueryProvider>
          <ThemeProvider theme={baselightTheme}>
            <DashboardContextProvider>
              <CssBaseline />
              {children}
            </DashboardContextProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
