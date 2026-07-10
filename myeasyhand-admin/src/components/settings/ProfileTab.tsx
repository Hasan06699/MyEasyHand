'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Avatar,
  Box,
  Button,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { authApi, mediaApi, ownerProfileApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import CustomTextField from '@/app/(DashboardLayout)/components/forms/theme-elements/CustomTextField';
import PasswordTextField from '@/components/forms/PasswordTextField';
import CustomFormLabel from '@/app/(DashboardLayout)/components/forms/theme-elements/CustomFormLabel';

function formatDateTime(date?: string) {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN');
}

export default function ProfileTab() {
  const queryClient = useQueryClient();
  const { user, loadUser } = useAuthStore();
  const isBusinessOwner = user?.roleSlugs?.includes('business_owner');
  const [section, setSection] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['owner-profile-overview'],
    queryFn: async () => (await ownerProfileApi.getOverview()).data.data,
    enabled: !!isBusinessOwner,
  });

  const { data: basicProfile, isLoading: basicLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => (await authApi.me()).data.data,
    enabled: !isBusinessOwner,
  });

  const { data: loginActivity } = useQuery({
    queryKey: ['login-activity'],
    queryFn: async () => (await ownerProfileApi.getLoginActivity()).data.data,
    enabled: !!isBusinessOwner && section === 1,
  });

  const [personal, setPersonal] = useState({
    firstName: '', lastName: '', phone: '', avatar: '', displayName: '',
    alternatePhone: '', dateOfBirth: '', gender: '', username: '', email: '',
  });
  const [address, setAddress] = useState({
    country: '', state: '', city: '', area: '', completeAddress: '', postalCode: '',
  });
  const [preferences, setPreferences] = useState({
    language: 'en', timezone: 'Asia/Kolkata',
    emailNotifications: true, smsNotifications: true, pushNotifications: true,
  });
  const [account, setAccount] = useState({ twoFactorEnabled: false });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  useEffect(() => {
    if (overview) {
      setPersonal({
        firstName: overview.user.firstName,
        lastName: overview.user.lastName,
        phone: overview.user.phone ?? '',
        avatar: overview.user.avatar ?? '',
        displayName: overview.profile.displayName ?? '',
        alternatePhone: overview.profile.alternatePhone ?? '',
        dateOfBirth: overview.profile.dateOfBirth?.slice(0, 10) ?? '',
        gender: overview.profile.gender ?? '',
        username: overview.profile.username ?? '',
        email: overview.user.email,
      });
      setAddress({
        country: overview.profile.address?.country ?? '',
        state: overview.profile.address?.state ?? '',
        city: overview.profile.address?.city ?? '',
        area: overview.profile.address?.area ?? '',
        completeAddress: overview.profile.address?.completeAddress ?? '',
        postalCode: overview.profile.address?.postalCode ?? '',
      });
      setPreferences({
        language: overview.profile.preferences?.language ?? 'en',
        timezone: overview.profile.preferences?.timezone ?? 'Asia/Kolkata',
        emailNotifications: overview.profile.preferences?.emailNotifications ?? true,
        smsNotifications: overview.profile.preferences?.smsNotifications ?? true,
        pushNotifications: overview.profile.preferences?.pushNotifications ?? true,
      });
      setAccount({ twoFactorEnabled: overview.profile.twoFactorEnabled });
    } else if (basicProfile) {
      setPersonal({
        firstName: basicProfile.firstName,
        lastName: basicProfile.lastName,
        phone: basicProfile.phone ?? '',
        avatar: basicProfile.avatar ?? '',
        displayName: '', alternatePhone: '', dateOfBirth: '', gender: '', username: '',
        email: basicProfile.email,
      });
    }
  }, [overview, basicProfile]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['owner-profile-overview'] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
  };

  const savePersonal = useMutation({
    mutationFn: () => ownerProfileApi.updatePersonal({
      firstName: personal.firstName, lastName: personal.lastName, phone: personal.phone,
      avatar: personal.avatar || undefined, displayName: personal.displayName,
      alternatePhone: personal.alternatePhone, dateOfBirth: personal.dateOfBirth || undefined,
      gender: personal.gender || undefined, username: personal.username || undefined,
    }),
    onSuccess: async () => { setSuccess('Personal information saved'); setError(''); await loadUser(); invalidate(); },
    onError: (err: Error & { response?: { data?: { message?: string } } }) =>
      setError(err.response?.data?.message ?? 'Failed to save'),
  });

  const saveBasic = useMutation({
    mutationFn: () => authApi.updateMe({
      firstName: personal.firstName, lastName: personal.lastName,
      phone: personal.phone, avatar: personal.avatar || undefined,
    }),
    onSuccess: async () => { setSuccess('Profile saved'); setError(''); await loadUser(); invalidate(); },
    onError: (err: Error & { response?: { data?: { message?: string } } }) =>
      setError(err.response?.data?.message ?? 'Failed to save'),
  });

  const saveAddress = useMutation({
    mutationFn: () => ownerProfileApi.updateAddress(address),
    onSuccess: () => { setSuccess('Address saved'); setError(''); invalidate(); },
    onError: (err: Error & { response?: { data?: { message?: string } } }) =>
      setError(err.response?.data?.message ?? 'Failed to save address'),
  });

  const savePreferences = useMutation({
    mutationFn: () => ownerProfileApi.updatePreferences(preferences),
    onSuccess: () => { setSuccess('Preferences saved'); setError(''); invalidate(); },
    onError: (err: Error & { response?: { data?: { message?: string } } }) =>
      setError(err.response?.data?.message ?? 'Failed to save preferences'),
  });

  const saveAccount = useMutation({
    mutationFn: () => ownerProfileApi.updateAccount(account),
    onSuccess: () => { setSuccess('Account settings saved'); setError(''); invalidate(); },
    onError: (err: Error & { response?: { data?: { message?: string } } }) =>
      setError(err.response?.data?.message ?? 'Failed to save account settings'),
  });

  const changePassword = useMutation({
    mutationFn: () => ownerProfileApi.changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    }),
    onSuccess: () => {
      setSuccess('Password changed successfully');
      setError('');
      setPasswordForm({ currentPassword: '', newPassword: '', confirm: '' });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) =>
      setError(err.response?.data?.message ?? 'Failed to change password'),
  });

  const handleAvatarUpload = async (file: File) => {
    setUploading(true);
    try {
      const res = await mediaApi.uploadServiceImage(file);
      setPersonal((p) => ({ ...p, avatar: res.data.data.url }));
    } catch {
      setError('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const isLoading = isBusinessOwner ? overviewLoading : basicLoading;
  if (isLoading) return <Typography color="text.secondary">Loading profile...</Typography>;

  const personalSection = (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        <Avatar src={personal.avatar || undefined} sx={{ width: 80, height: 80 }}>
          {personal.firstName?.[0]}{personal.lastName?.[0]}
        </Avatar>
        <Box>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleAvatarUpload(file);
            e.target.value = '';
          }} />
          <Button variant="outlined" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Change Photo'}
          </Button>
        </Box>
      </Stack>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <CustomFormLabel>First Name</CustomFormLabel>
          <CustomTextField fullWidth value={personal.firstName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPersonal({ ...personal, firstName: e.target.value })} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <CustomFormLabel>Last Name</CustomFormLabel>
          <CustomTextField fullWidth value={personal.lastName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPersonal({ ...personal, lastName: e.target.value })} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <CustomFormLabel>Display Name</CustomFormLabel>
          <CustomTextField fullWidth value={personal.displayName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPersonal({ ...personal, displayName: e.target.value })} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <CustomFormLabel>Username</CustomFormLabel>
          <CustomTextField fullWidth value={personal.username} disabled={!isBusinessOwner}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPersonal({ ...personal, username: e.target.value })} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <CustomFormLabel>Mobile Number</CustomFormLabel>
          <CustomTextField fullWidth value={personal.phone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPersonal({ ...personal, phone: e.target.value })} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <CustomFormLabel>Alternate Mobile</CustomFormLabel>
          <CustomTextField fullWidth value={personal.alternatePhone} disabled={!isBusinessOwner}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPersonal({ ...personal, alternatePhone: e.target.value })} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <CustomFormLabel>Email Address</CustomFormLabel>
          <CustomTextField fullWidth value={personal.email} disabled />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <CustomFormLabel>Date of Birth</CustomFormLabel>
          <CustomTextField fullWidth type="date" value={personal.dateOfBirth} disabled={!isBusinessOwner}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPersonal({ ...personal, dateOfBirth: e.target.value })}
            InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <CustomFormLabel>Gender</CustomFormLabel>
          <TextField select fullWidth size="small" value={personal.gender} disabled={!isBusinessOwner}
            onChange={(e) => setPersonal({ ...personal, gender: e.target.value })}>
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
            <MenuItem value="other">Other</MenuItem>
            <MenuItem value="prefer_not_to_say">Prefer not to say</MenuItem>
          </TextField>
        </Grid>
      </Grid>
      <Button variant="contained" onClick={() => (isBusinessOwner ? savePersonal : saveBasic).mutate()}
        disabled={(isBusinessOwner ? savePersonal : saveBasic).isPending}>
        Save Personal Information
      </Button>
    </Stack>
  );

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}

      {isBusinessOwner && (
        <Tabs value={section} onChange={(_, v) => setSection(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Personal" />
          <Tab label="Account" />
          <Tab label="Address" />
          <Tab label="Preferences" />
        </Tabs>
      )}

      {(!isBusinessOwner || section === 0) && personalSection}

      {isBusinessOwner && section === 1 && (
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Password Change</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <CustomFormLabel>Current Password</CustomFormLabel>
                <PasswordTextField fullWidth value={passwordForm.currentPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <CustomFormLabel>New Password</CustomFormLabel>
                <PasswordTextField fullWidth value={passwordForm.newPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <CustomFormLabel>Confirm Password</CustomFormLabel>
                <PasswordTextField fullWidth value={passwordForm.confirm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />
              </Grid>
            </Grid>
            <Button sx={{ mt: 1 }} variant="contained" disabled={changePassword.isPending || passwordForm.newPassword !== passwordForm.confirm}
              onClick={() => changePassword.mutate()}>Change Password</Button>
          </Box>
          <Box>
            <FormControlLabel
              control={<Switch checked={account.twoFactorEnabled}
                onChange={(e) => setAccount({ twoFactorEnabled: e.target.checked })} />}
              label="Two-Factor Authentication (2FA)"
            />
            <Button variant="outlined" onClick={() => saveAccount.mutate()} disabled={saveAccount.isPending}>
              Save Account Settings
            </Button>
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Login Activity</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Last login: {formatDateTime(loginActivity?.lastLoginAt ?? overview?.user.lastLoginAt)}
            </Typography>
            {loginActivity?.sessions.slice(0, 5).map((s) => (
              <Typography key={s._id} variant="body2" sx={{ mb: 0.5 }}>
                {formatDateTime(s.createdAt)} — {s.deviceInfo?.userAgent?.slice(0, 60) ?? 'Unknown device'}
                {s.isRevoked ? ' (ended)' : ''}
              </Typography>
            ))}
          </Box>
        </Stack>
      )}

      {isBusinessOwner && section === 2 && (
        <Stack spacing={2}>
          <Grid container spacing={2}>
            {(['country', 'state', 'city', 'area', 'postalCode'] as const).map((field) => (
              <Grid key={field} size={{ xs: 12, sm: 6 }}>
                <CustomFormLabel>{field === 'postalCode' ? 'Postal Code' : field.charAt(0).toUpperCase() + field.slice(1)}</CustomFormLabel>
                <CustomTextField fullWidth value={address[field]}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress({ ...address, [field]: e.target.value })} />
              </Grid>
            ))}
            <Grid size={{ xs: 12 }}>
              <CustomFormLabel>Complete Address</CustomFormLabel>
              <CustomTextField fullWidth multiline rows={3} value={address.completeAddress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress({ ...address, completeAddress: e.target.value })} />
            </Grid>
          </Grid>
          <Button variant="contained" onClick={() => saveAddress.mutate()} disabled={saveAddress.isPending}>
            Save Address
          </Button>
        </Stack>
      )}

      {isBusinessOwner && section === 3 && (
        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomFormLabel>Language</CustomFormLabel>
              <TextField select fullWidth size="small" value={preferences.language}
                onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}>
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="hi">Hindi</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomFormLabel>Time Zone</CustomFormLabel>
              <TextField select fullWidth size="small" value={preferences.timezone}
                onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}>
                <MenuItem value="Asia/Kolkata">Asia/Kolkata (IST)</MenuItem>
                <MenuItem value="UTC">UTC</MenuItem>
              </TextField>
            </Grid>
          </Grid>
          <FormControlLabel control={<Switch checked={preferences.emailNotifications}
            onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })} />}
            label="Email Notifications" />
          <FormControlLabel control={<Switch checked={preferences.smsNotifications}
            onChange={(e) => setPreferences({ ...preferences, smsNotifications: e.target.checked })} />}
            label="SMS Notifications" />
          <FormControlLabel control={<Switch checked={preferences.pushNotifications}
            onChange={(e) => setPreferences({ ...preferences, pushNotifications: e.target.checked })} />}
            label="Push Notifications" />
          <Button variant="contained" onClick={() => savePreferences.mutate()} disabled={savePreferences.isPending}>
            Save Preferences
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
