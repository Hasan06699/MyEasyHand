'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { BusinessHour, BusinessType, mediaApi, ownerProfileApi } from '@/lib/api';
import { useOwnerProfile } from '@/hooks/useOwnerProfile';
import CustomTextField from '@/app/(DashboardLayout)/components/forms/theme-elements/CustomTextField';
import CustomFormLabel from '@/app/(DashboardLayout)/components/forms/theme-elements/CustomFormLabel';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const BUSINESS_TYPES: BusinessType[] = [
  'individual', 'proprietorship', 'partnership', 'llp', 'private_limited', 'other',
];

const defaultHours: BusinessHour[] = DAY_NAMES.map((_, dayOfWeek) => ({
  dayOfWeek,
  openTime: '09:00',
  closeTime: '18:00',
  isClosed: dayOfWeek === 0,
}));

export default function BusinessInfoTab() {
  const queryClient = useQueryClient();
  const { data: overview, isLoading } = useOwnerProfile();
  const [section, setSection] = useState(0);
  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState<'logo' | 'banner' | null>(null);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', logo: '', banner: '', businessType: '' as BusinessType | '',
    supportPhone: '', whatsapp: '', about: '', companyOverview: '',
    yearsOfExperience: '' as number | '', holidayNote: '', emergencyServiceAvailable: false,
    publishStatus: 'draft' as string,
    address: { street: '', city: '', state: '', country: '', zip: '' },
    social: { website: '', facebook: '', instagram: '', linkedin: '', youtube: '' },
    businessHours: defaultHours,
  });

  useEffect(() => {
    const b = overview?.business;
    if (!b) return;
    setForm({
      name: b.name,
      email: b.email,
      phone: b.phone ?? '',
      logo: b.logo ?? '',
      banner: b.banner ?? '',
      businessType: b.businessType ?? '',
      supportPhone: b.supportPhone ?? '',
      whatsapp: b.whatsapp ?? '',
      about: b.about ?? '',
      companyOverview: b.companyOverview ?? '',
      yearsOfExperience: b.yearsOfExperience ?? '',
      holidayNote: b.holidayNote ?? '',
      emergencyServiceAvailable: b.emergencyServiceAvailable ?? false,
      publishStatus: b.publishStatus ?? 'draft',
      address: { street: '', city: '', state: '', country: '', zip: '', ...b.address },
      social: { website: '', facebook: '', instagram: '', linkedin: '', youtube: '', ...b.social },
      businessHours: b.businessHours?.length ? b.businessHours : defaultHours,
    });
  }, [overview]);

  const saveMutation = useMutation({
    mutationFn: () => ownerProfileApi.updateBusiness({
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      logo: form.logo || undefined,
      banner: form.banner || undefined,
      businessType: form.businessType || undefined,
      supportPhone: form.supportPhone || undefined,
      whatsapp: form.whatsapp || undefined,
      about: form.about || undefined,
      companyOverview: form.companyOverview || undefined,
      yearsOfExperience: form.yearsOfExperience === '' ? undefined : Number(form.yearsOfExperience),
      holidayNote: form.holidayNote || undefined,
      emergencyServiceAvailable: form.emergencyServiceAvailable,
      publishStatus: form.publishStatus as 'draft' | 'published' | 'active' | 'inactive',
      address: form.address,
      social: form.social,
      businessHours: form.businessHours,
    }),
    onSuccess: () => {
      setSuccess('Business information saved');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['owner-profile-overview'] });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) =>
      setError(err.response?.data?.message ?? 'Failed to save'),
  });

  const uploadImage = async (file: File, field: 'logo' | 'banner') => {
    setUploading(field);
    try {
      const res = await mediaApi.uploadServiceImage(file);
      setForm((f) => ({ ...f, [field]: res.data.data.url }));
    } catch {
      setError(`Failed to upload ${field}`);
    } finally {
      setUploading(null);
    }
  };

  const updateHour = (dayOfWeek: number, patch: Partial<BusinessHour>) => {
    setForm((f) => ({
      ...f,
      businessHours: f.businessHours.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, ...patch } : h)),
    }));
  };

  if (isLoading) return <Typography color="text.secondary">Loading business info...</Typography>;
  if (!overview?.business) return <Alert severity="info">No business linked to your account.</Alert>;

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}

      <Tabs value={section} onChange={(_, v) => setSection(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Details" />
        <Tab label="Contact" />
        <Tab label="Address" />
        <Tab label="Description" />
        <Tab label="Hours" />
        <Tab label="Social" />
      </Tabs>

      {section === 0 && (
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Avatar src={form.logo || undefined} variant="rounded" sx={{ width: 72, height: 72 }}>{form.name[0]}</Avatar>
            <input ref={logoRef} type="file" accept="image/*" hidden onChange={(e) => {
              const f = e.target.files?.[0]; if (f) uploadImage(f, 'logo'); e.target.value = '';
            }} />
            <Button variant="outlined" onClick={() => logoRef.current?.click()} disabled={uploading === 'logo'}>
              {uploading === 'logo' ? 'Uploading...' : 'Upload Logo'}
            </Button>
            <input ref={bannerRef} type="file" accept="image/*" hidden onChange={(e) => {
              const f = e.target.files?.[0]; if (f) uploadImage(f, 'banner'); e.target.value = '';
            }} />
            <Button variant="outlined" onClick={() => bannerRef.current?.click()} disabled={uploading === 'banner'}>
              {uploading === 'banner' ? 'Uploading...' : 'Upload Banner'}
            </Button>
          </Stack>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomFormLabel>Business Name</CustomFormLabel>
              <CustomTextField fullWidth value={form.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomFormLabel>Business Type</CustomFormLabel>
              <TextField select fullWidth size="small" value={form.businessType}
                onChange={(e) => setForm({ ...form, businessType: e.target.value as BusinessType })}>
                <MenuItem value="">Select type</MenuItem>
                {BUSINESS_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>{t.replace('_', ' ')}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomFormLabel>Publish Status</CustomFormLabel>
              <TextField select fullWidth size="small" value={form.publishStatus}
                onChange={(e) => setForm({ ...form, publishStatus: e.target.value })}>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="published">Published</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Stack>
      )}

      {section === 1 && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomFormLabel>Business Mobile</CustomFormLabel>
            <CustomTextField fullWidth value={form.phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, phone: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomFormLabel>Business Email</CustomFormLabel>
            <CustomTextField fullWidth value={form.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, email: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomFormLabel>Customer Support Number</CustomFormLabel>
            <CustomTextField fullWidth value={form.supportPhone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, supportPhone: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomFormLabel>WhatsApp Number</CustomFormLabel>
            <CustomTextField fullWidth value={form.whatsapp}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, whatsapp: e.target.value })} />
          </Grid>
        </Grid>
      )}

      {section === 2 && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <CustomFormLabel>Office Address</CustomFormLabel>
            <CustomTextField fullWidth value={form.address.street}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, address: { ...form.address, street: e.target.value } })} />
          </Grid>
          {(['city', 'state', 'country', 'zip'] as const).map((f) => (
            <Grid key={f} size={{ xs: 12, sm: 6 }}>
              <CustomFormLabel>{f === 'zip' ? 'Postal Code' : f.charAt(0).toUpperCase() + f.slice(1)}</CustomFormLabel>
              <CustomTextField fullWidth value={form.address[f]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, address: { ...form.address, [f]: e.target.value } })} />
            </Grid>
          ))}
        </Grid>
      )}

      {section === 3 && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <CustomFormLabel>About Business</CustomFormLabel>
            <CustomTextField fullWidth multiline rows={3} value={form.about}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, about: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <CustomFormLabel>Company Overview</CustomFormLabel>
            <CustomTextField fullWidth multiline rows={4} value={form.companyOverview}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, companyOverview: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomFormLabel>Years of Experience</CustomFormLabel>
            <CustomTextField fullWidth type="number" value={form.yearsOfExperience}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, yearsOfExperience: e.target.value === '' ? '' : +e.target.value })} />
          </Grid>
        </Grid>
      )}

      {section === 4 && (
        <Stack spacing={2}>
          {form.businessHours.map((hour) => (
            <Grid container spacing={2} key={hour.dayOfWeek} sx={{ alignItems: 'center' }}>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Typography fontWeight={500}>{DAY_NAMES[hour.dayOfWeek]}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <CustomTextField fullWidth type="time" value={hour.openTime ?? ''} disabled={hour.isClosed}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateHour(hour.dayOfWeek, { openTime: e.target.value })}
                  InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <CustomTextField fullWidth type="time" value={hour.closeTime ?? ''} disabled={hour.isClosed}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateHour(hour.dayOfWeek, { closeTime: e.target.value })}
                  InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <FormControlLabel control={<Switch checked={hour.isClosed}
                  onChange={(e) => updateHour(hour.dayOfWeek, { isClosed: e.target.checked })} />}
                  label="Closed" />
              </Grid>
            </Grid>
          ))}
          <CustomFormLabel>Holiday Settings</CustomFormLabel>
          <CustomTextField fullWidth multiline rows={2} value={form.holidayNote}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, holidayNote: e.target.value })} />
          <FormControlLabel control={<Switch checked={form.emergencyServiceAvailable}
            onChange={(e) => setForm({ ...form, emergencyServiceAvailable: e.target.checked })} />}
            label="Emergency Service Availability" />
        </Stack>
      )}

      {section === 5 && (
        <Grid container spacing={2}>
          {(['website', 'facebook', 'instagram', 'linkedin', 'youtube'] as const).map((key) => (
            <Grid key={key} size={{ xs: 12, sm: 6 }}>
              <CustomFormLabel>{key.charAt(0).toUpperCase() + key.slice(1)}</CustomFormLabel>
              <CustomTextField fullWidth value={form.social[key]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, social: { ...form.social, [key]: e.target.value } })} />
            </Grid>
          ))}
        </Grid>
      )}

      <Box>
        <Button variant="contained" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Saving...' : 'Save Business Info'}
        </Button>
      </Box>
    </Stack>
  );
}
