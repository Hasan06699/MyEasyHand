'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useProtectedRoute } from '@/hooks/use-protected-route';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { toast } from '@/components/ui/toast-provider';

export default function ProfilePage() {
  useProtectedRoute();
  const { user, loadUser } = useAuthStore();
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });

  const updateMutation = useMutation({
    mutationFn: () => authApi.updateMe(form),
    onSuccess: () => {
      toast.success('Profile updated');
      loadUser();
    },
    onError: () => toast.error('Failed to update profile'),
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Profile' }]} />
      <h1 className="mt-4 text-2xl font-bold">Profile Settings</h1>

      <Card className="mt-6">
        <CardContent className="space-y-4 pt-6">
          <h2 className="font-semibold">Personal Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">First Name</label>
              <Input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Last Name</label>
              <Input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input value={user?.email || ''} disabled className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Phone</label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1"
            />
          </div>
          <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <h2 className="font-semibold">Addresses</h2>
          <p className="mt-2 text-sm text-slate-500">
            Manage your service addresses during checkout. Saved addresses coming soon.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <h2 className="font-semibold">Change Password</h2>
          <p className="mt-2 text-sm text-slate-500">
            <a href="/forgot-password" className="text-blue-600 hover:underline">
              Reset your password via email
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
