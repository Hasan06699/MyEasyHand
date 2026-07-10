'use client';

import { styled, Container, Box, useTheme } from '@mui/material';
import Header from '@/app/(DashboardLayout)/layout/header/Header';
import Sidebar from '@/app/(DashboardLayout)/layout/sidebar/Sidebar';
import Footer from './layout/footer/page';
import AuthGuard from '@/components/AuthGuard';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import OneSignalInit from '@/components/OneSignalInit';

const MainWrapper = styled('div')(() => ({}));

const PageWrapper = styled('div')(() => ({
  display: 'flex',
  flexGrow: 1,
  flexDirection: 'column',
  paddingBottom: '25px',
  zIndex: 1,
  backgroundColor: 'transparent',
}));

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();

  return (
    <AuthGuard>
      <MainWrapper className="mainwrapper">
        <OneSignalInit />
        <Header />
        <Sidebar />
        <PageWrapper
          className="page-wrapper"
          sx={{
            [theme.breakpoints.up('lg')]: { ml: '270px' },
            marginTop: '64px',
          }}
        >
          <Container
            sx={{
              paddingTop: '30px',
              maxWidth: '1200px',
              minHeight: 'calc(100vh - 240px)',
            }}
          >
            <Box>
              <SubscriptionGuard>{children}</SubscriptionGuard>
            </Box>
          </Container>
          <Footer />
        </PageWrapper>
      </MainWrapper>
    </AuthGuard>
  );
}
