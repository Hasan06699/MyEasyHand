'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
import { ownerProfileApi, planApi, subscriptionApi, mediaApi } from '@/lib/api';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { useOwnerProfile } from '@/hooks/useOwnerProfile';
import CustomTextField from '@/app/(DashboardLayout)/components/forms/theme-elements/CustomTextField';
import CustomFormLabel from '@/app/(DashboardLayout)/components/forms/theme-elements/CustomFormLabel';

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PaymentTab() {
  const queryClient = useQueryClient();
  const { data: overview } = useOwnerProfile();
  const { hasActiveSubscription, subscription, pendingRequest } = useSubscriptionAccess();
  const [section, setSection] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const qrRef = useRef<HTMLInputElement>(null);
  const [uploadingQr, setUploadingQr] = useState(false);

  const [payment, setPayment] = useState({
    bankAccount: {
      accountHolderName: '', bankName: '', accountNumber: '', ifscCode: '', branchName: '',
      accountType: '' as 'savings' | 'current' | '',
    },
    upi: { upiId: '', qrCodeUrl: '' },
    payout: { automaticSettlement: true, manualWithdrawal: false, settlementFrequency: 'weekly' as 'daily' | 'weekly' | 'monthly' },
    tax: { gstNumber: '', panNumber: '', taxCertificateUrl: '' },
  });

  useEffect(() => {
    const p = overview?.payment;
    if (!p) return;
    setPayment({
      bankAccount: {
        accountHolderName: p.bankAccount?.accountHolderName ?? '',
        bankName: p.bankAccount?.bankName ?? '',
        accountNumber: p.bankAccount?.accountNumber ?? '',
        ifscCode: p.bankAccount?.ifscCode ?? '',
        branchName: p.bankAccount?.branchName ?? '',
        accountType: p.bankAccount?.accountType ?? '',
      },
      upi: { upiId: p.upi?.upiId ?? '', qrCodeUrl: p.upi?.qrCodeUrl ?? '' },
      payout: {
        automaticSettlement: p.payout?.automaticSettlement ?? true,
        manualWithdrawal: p.payout?.manualWithdrawal ?? false,
        settlementFrequency: p.payout?.settlementFrequency ?? 'weekly',
      },
      tax: {
        gstNumber: p.tax?.gstNumber ?? '',
        panNumber: p.tax?.panNumber ?? '',
        taxCertificateUrl: p.tax?.taxCertificateUrl ?? '',
      },
    });
  }, [overview]);

  const { data: earnings } = useQuery({
    queryKey: ['owner-earnings'],
    queryFn: async () => (await ownerProfileApi.getEarnings()).data.data,
    enabled: section === 4,
  });

  const { data: mySubscription } = useQuery({
    queryKey: ['subscription-me'],
    queryFn: async () => (await subscriptionApi.getMy()).data.data,
    enabled: section === 5,
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['plans-public'],
    queryFn: async () => (await planApi.listPublic()).data.data,
    enabled: section === 5,
  });

  const saveMutation = useMutation({
    mutationFn: () => ownerProfileApi.updatePayment({
      bankAccount: {
        ...payment.bankAccount,
        accountType: payment.bankAccount.accountType || undefined,
      },
      upi: payment.upi,
      payout: payment.payout,
      tax: payment.tax,
    }),
    onSuccess: () => {
      setSuccess('Payment information saved');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['owner-profile-overview'] });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) =>
      setError(err.response?.data?.message ?? 'Failed to save payment info'),
  });

  const activeSub = subscription ?? mySubscription;
  const bankStatus = overview?.payment.bankVerificationStatus ?? 'pending';

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}

      <Tabs value={section} onChange={(_, v) => setSection(v)} sx={{ borderBottom: 1, borderColor: 'divider' }} variant="scrollable">
        <Tab label="Bank Account" />
        <Tab label="UPI" />
        <Tab label="Payout" />
        <Tab label="Tax Info" />
        <Tab label="Earnings" />
        <Tab label="Subscription" />
      </Tabs>

      {section === 0 && (
        <Stack spacing={2}>
          <Chip label={`Bank verification: ${bankStatus}`} size="small"
            color={bankStatus === 'approved' ? 'success' : bankStatus === 'rejected' ? 'error' : 'warning'} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomFormLabel>Account Holder Name</CustomFormLabel>
              <CustomTextField fullWidth value={payment.bankAccount.accountHolderName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPayment({ ...payment, bankAccount: { ...payment.bankAccount, accountHolderName: e.target.value } })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomFormLabel>Bank Name</CustomFormLabel>
              <CustomTextField fullWidth value={payment.bankAccount.bankName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPayment({ ...payment, bankAccount: { ...payment.bankAccount, bankName: e.target.value } })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomFormLabel>Account Number</CustomFormLabel>
              <CustomTextField fullWidth value={payment.bankAccount.accountNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPayment({ ...payment, bankAccount: { ...payment.bankAccount, accountNumber: e.target.value } })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomFormLabel>IFSC Code</CustomFormLabel>
              <CustomTextField fullWidth value={payment.bankAccount.ifscCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPayment({ ...payment, bankAccount: { ...payment.bankAccount, ifscCode: e.target.value } })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomFormLabel>Branch Name</CustomFormLabel>
              <CustomTextField fullWidth value={payment.bankAccount.branchName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPayment({ ...payment, bankAccount: { ...payment.bankAccount, branchName: e.target.value } })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomFormLabel>Account Type</CustomFormLabel>
              <TextField select fullWidth size="small" value={payment.bankAccount.accountType}
                onChange={(e) => setPayment({ ...payment, bankAccount: { ...payment.bankAccount, accountType: e.target.value as 'savings' | 'current' } })}>
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="savings">Savings</MenuItem>
                <MenuItem value="current">Current</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Stack>
      )}

      {section === 1 && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomFormLabel>UPI ID</CustomFormLabel>
            <CustomTextField fullWidth value={payment.upi.upiId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPayment({ ...payment, upi: { ...payment.upi, upiId: e.target.value } })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomFormLabel>QR Code</CustomFormLabel>
            <input ref={qrRef} type="file" accept="image/*" hidden onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploadingQr(true);
              try {
                const res = await mediaApi.uploadServiceImage(file);
                setPayment({ ...payment, upi: { ...payment.upi, qrCodeUrl: res.data.data.url } });
              } finally { setUploadingQr(false); e.target.value = ''; }
            }} />
            <Button variant="outlined" onClick={() => qrRef.current?.click()} disabled={uploadingQr}>
              {uploadingQr ? 'Uploading...' : payment.upi.qrCodeUrl ? 'Change QR Code' : 'Upload QR Code'}
            </Button>
          </Grid>
        </Grid>
      )}

      {section === 2 && (
        <Stack spacing={2}>
          <FormControlLabel control={<Switch checked={payment.payout.automaticSettlement}
            onChange={(e) => setPayment({ ...payment, payout: { ...payment.payout, automaticSettlement: e.target.checked } })} />}
            label="Automatic Settlement" />
          <FormControlLabel control={<Switch checked={payment.payout.manualWithdrawal}
            onChange={(e) => setPayment({ ...payment, payout: { ...payment.payout, manualWithdrawal: e.target.checked } })} />}
            label="Manual Withdrawal" />
          <CustomFormLabel>Settlement Frequency</CustomFormLabel>
          <TextField select fullWidth size="small" sx={{ maxWidth: 280 }} value={payment.payout.settlementFrequency}
            onChange={(e) => setPayment({ ...payment, payout: { ...payment.payout, settlementFrequency: e.target.value as 'daily' | 'weekly' | 'monthly' } })}>
            <MenuItem value="daily">Daily</MenuItem>
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
          </TextField>
        </Stack>
      )}

      {section === 3 && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomFormLabel>GST Number</CustomFormLabel>
            <CustomTextField fullWidth value={payment.tax.gstNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPayment({ ...payment, tax: { ...payment.tax, gstNumber: e.target.value } })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomFormLabel>PAN Number</CustomFormLabel>
            <CustomTextField fullWidth value={payment.tax.panNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPayment({ ...payment, tax: { ...payment.tax, panNumber: e.target.value } })} />
          </Grid>
        </Grid>
      )}

      {section === 4 && earnings && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Card variant="outlined"><CardContent>
              <Typography variant="body2" color="text.secondary">Total Earnings</Typography>
              <Typography variant="h6" fontWeight={700}>{formatPrice(earnings.totalEarnings)}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Card variant="outlined"><CardContent>
              <Typography variant="body2" color="text.secondary">Pending Payments</Typography>
              <Typography variant="h6" fontWeight={700}>{formatPrice(earnings.pendingPayments)}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Card variant="outlined"><CardContent>
              <Typography variant="body2" color="text.secondary">Withdrawable Balance</Typography>
              <Typography variant="h6" fontWeight={700}>{formatPrice(earnings.withdrawableBalance)}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Card variant="outlined"><CardContent>
              <Typography variant="body2" color="text.secondary">Pending Bookings</Typography>
              <Typography variant="h6" fontWeight={700}>{earnings.pendingBookingsCount}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Settlement History</Typography>
            {earnings.settlementHistory.length === 0 ? (
              <Typography color="text.secondary">No settlements yet</Typography>
            ) : earnings.settlementHistory.map((s) => (
              <Typography key={s._id} variant="body2" sx={{ mb: 0.5 }}>
                {s.bookingNumber} — {formatPrice(s.paidAmount ?? 0)} — {formatDate(s.updatedAt)}
              </Typography>
            ))}
          </Grid>
        </Grid>
      )}

      {section === 5 && (
        <Stack spacing={2}>
          {activeSub ? (
            <Card variant="outlined"><CardContent>
              <Typography variant="h6" fontWeight={600}>{activeSub.planId.name}</Typography>
              <Typography>{formatPrice(activeSub.planId.price)} / {activeSub.planId.billingCycle}</Typography>
              <Typography variant="body2" color="text.secondary">Expires: {formatDate(activeSub.expiresAt)}</Typography>
            </CardContent></Card>
          ) : (
            <Alert severity="warning">No active subscription plan</Alert>
          )}
          {pendingRequest && <Alert severity="info">Pending plan request: {pendingRequest.planId.name}</Alert>}
          {!hasActiveSubscription && plans.length > 0 && (
            <Typography variant="body2" color="text.secondary">{plans.length} plans available</Typography>
          )}
          <Button component={Link} href="/subscriptions" variant="contained">
            {hasActiveSubscription ? 'Manage Subscription' : 'Choose a Plan'}
          </Button>
        </Stack>
      )}

      {section < 4 && (
        <Box>
          <Button variant="contained" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : 'Save Payment Information'}
          </Button>
        </Box>
      )}
    </Stack>
  );
}
