'use client';

import {
  Box,
  Avatar,
  Typography,
  IconButton,
  MenuItem,
  Divider,
  Button,
  styled,
  Menu,
} from '@mui/material';
import { useState } from 'react';
import { IconCaretDownFilled } from '@tabler/icons-react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    borderRadius: 6,
    marginTop: theme.spacing(1),
    minWidth: 200,
    color: theme.palette.mode === 'light' ? 'rgb(55, 65, 81)' : theme.palette.grey[300],
    boxShadow:
      'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
    '& .MuiMenuItem-root': {
      gap: '6px',
      alignItems: 'center',
      padding: '8px 16px',
      '&:hover': {
        backgroundColor:
          theme.palette.mode === 'light'
            ? `${theme.palette.action.hover}`
            : `${theme.palette.background.default}`,
      },
    },
  },
}));

export const SidebarProfile = () => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Account';

  const handleClose = () => setAnchorEl(null);

  const goToProfile = () => {
    handleClose();
    router.push('/profile');
  };

  const handleLogout = async () => {
    handleClose();
    await logout();
    router.push('/authentication/login');
  };

  return (
    <Box
      sx={{
        backgroundImage: `url(/images/backgrounds/sidebar-profile-bg.jpg)`,
        borderRadius: '0 !important',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'top center',
      }}
    >
      <Box sx={{ py: '28px', borderRadius: '0 !important', px: '30px' }}>
        <Box className="profile-img" sx={{ position: 'relative' }}>
          <Avatar
            alt={displayName}
            src={user?.avatar}
            sx={{ height: 50, width: 50 }}
          >
            {user?.firstName?.[0]}
          </Avatar>
        </Box>
      </Box>

      <IconButton
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        size="small"
        aria-label="profile menu"
        sx={{ p: 0, width: '100%' }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: '4px',
            px: 2,
            bgcolor: 'rgba(0,0,0,0.5)',
            borderRadius: '0 !important',
            width: '100%',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: 'white',
              fontSize: '15px',
              fontWeight: '400',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {displayName}
          </Typography>
          <Box sx={{ color: 'white', p: 0 }}>
            <IconCaretDownFilled width={18} />
          </Box>
        </Box>
      </IconButton>

      <StyledMenu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        elevation={0}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{ list: { 'aria-labelledby': 'sidebar-profile-menu' } }}
      >
        <MenuItem onClick={goToProfile} disableRipple>
          <Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center' }}>
            <Icon icon="solar:user-circle-line-duotone" height={22} />
          </Box>
          <Typography sx={{ fontSize: '15px', ml: 1 }}>My Profile</Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={goToProfile} disableRipple>
          <Box sx={{ color: 'warning.main', display: 'flex', alignItems: 'center' }}>
            <Icon icon="solar:settings-line-duotone" height={21} />
          </Box>
          <Typography sx={{ fontSize: '15px', ml: 1 }}>Profile & Settings</Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} disableRipple>
          <Box sx={{ color: 'error.main', display: 'flex', alignItems: 'center' }}>
            <Icon icon="solar:logout-2-line-duotone" height={21} />
          </Box>
          <Typography sx={{ fontSize: '15px', ml: 1 }}>Logout</Typography>
        </MenuItem>
        <Divider />
        <Box sx={{ px: '12px', pb: 1 }}>
          <Button variant="contained" color="primary" fullWidth onClick={goToProfile}>
            View Profile
          </Button>
        </Box>
      </StyledMenu>
    </Box>
  );
};
