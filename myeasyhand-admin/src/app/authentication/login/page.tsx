'use client';

import { Grid, Box, Card, Typography } from '@mui/material';
import AuthLogin from '../auth/AuthLogin';
import AuthLogo from '@/app/(DashboardLayout)/layout/shared/logo/LogoDark';

const LoginPage = () => {
  return (
    <Box
      sx={{
        position: 'relative',
        '&:before': {
          content: '""',
          background: 'radial-gradient(#d2f1df, #d3d7fa, #bad8f4)',
          backgroundSize: '400% 400%',
          animation: 'gradient 15s ease infinite',
          position: 'absolute',
          height: '100%',
          width: '100%',
          opacity: '0.3',
        },
      }}
    >
      <Grid container spacing={0} sx={{ height: '100vh', justifyContent: 'center' }}>
        <Grid
          size={{ xs: 12, sm: 12, lg: 4, xl: 3 }}
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        >
          <Card elevation={9} sx={{ p: 4, zIndex: 1, width: '100%', maxWidth: '500px' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3, gap: 1 }}>
              <AuthLogo />
              <Typography variant="body2" sx={{ color: 'text.secondary', letterSpacing: '0.04em' }}>
                Smart Booking. Trusted Services.
              </Typography>
            </Box>
            <AuthLogin
              title="Admin Sign In"
              subtext={
                <Typography variant="subtitle1" sx={{ textAlign: 'center', color: 'textSecondary', mb: 1 }}>
                  Service Booking Management Panel
                </Typography>
              }
            />
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LoginPage;
