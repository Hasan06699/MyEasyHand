'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Box, Menu, Avatar, Typography, Button, IconButton, Divider } from '@mui/material';
import { useAuthStore } from '@/stores/auth.store';

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLogout = async () => {
    await logout();
    router.push('/authentication/login');
  };

  const menuItems = [
    { href: '/profile', title: 'My Profile' },
    { href: '/', title: 'Dashboard' },
  ];

  return (
    <Box>
      <IconButton
        size="large"
        color="inherit"
        aria-controls="profile-menu"
        aria-haspopup="true"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          ...(anchorEl && { color: 'primary.main' }),
        }}
      >
        <Avatar
          src={user?.avatar}
          alt={user?.firstName}
          sx={{ width: 35, height: 35 }}
        >
          {user?.firstName?.[0]}
        </Avatar>
      </IconButton>

      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        sx={{ '& .MuiMenu-paper': { width: '240px', p: 0 } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={600} noWrap>
            {user ? `${user.firstName} ${user.lastName}` : 'Account'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {user?.email}
          </Typography>
        </Box>
        <Divider />
        {menuItems.map((item) => (
          <Box key={item.title} sx={{ px: 2, py: '10px', '&:hover': { backgroundColor: 'primary.light' } }}>
            <Link href={item.href} onClick={() => setAnchorEl(null)}>
              <Typography variant="subtitle2" color="textPrimary" fontWeight={500}>
                {item.title}
              </Typography>
            </Link>
          </Box>
        ))}
        <Box sx={{ px: 2, py: '10px' }}>
          <Button variant="outlined" color="primary" fullWidth onClick={handleLogout}>
            Logout
          </Button>
        </Box>
      </Menu>
    </Box>
  );
}
