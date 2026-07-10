import React, { useContext } from 'react';
import {
  Box, AppBar, Toolbar, styled, Stack, IconButton, Button, Tooltip,
} from '@mui/material';
import PropTypes from 'prop-types';
import Logo from "../shared/logo/Logo";
// components
import Profile from './Profile';
import NotificationBell from '@/components/NotificationBell';

import { DashboardContext } from '@/app/context/DashboardContext';
import { Icon } from '@iconify/react';
import { BRAND } from '../shared/logo/brand';

interface ItemType {
  toggleMobileSidebar: (event: React.MouseEvent<HTMLElement>) => void;
}

const Header = () => {
  const { isMobileSidebar, setIsMobileSidebar } = useContext(DashboardContext);
  const toggleWidth = '256px';

  const AppBarStyled = styled(AppBar)(() => ({
    boxShadow: 'none !important',
    backgroundColor: BRAND.headerBg,
    position: 'fixed',
    top: 0,
    backdropFilter: 'blur(4px)',
    minHeight: '64px',
  }));
  const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
    width: '100%',
    color: theme.palette.warning.contrastText,
    gap: '8px',
  }));

  return (
    <AppBarStyled color="default" >
      <ToolbarStyled>
        {/* ------------------------------------------- */}
        {/* Logo */}
        {/* ------------------------------------------- */}

        <IconButton
          color="inherit"
          aria-label="menu"
          onClick={() => setIsMobileSidebar(!isMobileSidebar)}
          sx={{ display: { lg: 'none' } }}
        >
          <Icon icon="solar:list-bold" height={20} />
        </IconButton>

        <Box
          sx={{
            width: { xs: 'auto', lg: toggleWidth },
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Logo />
        </Box>
        <NotificationBell />

        <Box sx={{ flexGrow: 1 }} />

        <Stack spacing={1} direction="row" sx={{ alignItems: "center" }}>
          <Tooltip title="Visit Website">
            <Button
              component="a"
              href={BRAND.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              startIcon={<Icon icon="solar:globe-linear" width={18} />}
              sx={{
                color: 'inherit',
                textTransform: 'none',
                display: { xs: 'none', sm: 'inline-flex' },
                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
              }}
            >
              Website
            </Button>
          </Tooltip>
          <Tooltip title="Visit Website">
            <IconButton
              component="a"
              href={BRAND.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              color="inherit"
              aria-label="Visit website"
              sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
            >
              <Icon icon="solar:globe-linear" width={20} />
            </IconButton>
          </Tooltip>
          <Profile />
        </Stack>
      </ToolbarStyled>
    </AppBarStyled>
  );
};

Header.propTypes = {
  sx: PropTypes.object,
};

export default Header;
