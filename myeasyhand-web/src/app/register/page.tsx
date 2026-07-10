'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/toast-provider';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
});

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading, error, clearError, setSession } = useAuthStore();
  const [otpStep] = useState(false);
  const [userId] = useState('');
  const [otp, setOtp] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    clearError();
    try {
      await registerUser(data);
      toast.success('Account created! Please sign in.');
      router.push('/login');
    } catch {
      // handled in store
    }
  };

  const verifyOtp = async () => {
    try {
      const { data } = await authApi.verifyOtp(userId, otp);
      setSession(data.data.user, data.data.accessToken, data.data.refreshToken);
      toast.success('Verified!');
      router.push('/dashboard');
    } catch {
      toast.error('Invalid OTP');
    }
  };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-6 flex justify-center">
        <Image
          src="/images/logo-standard.svg"
          alt="MyEasyHand"
          width={200}
          height={48}
          className="h-12 w-auto"
          priority
        />
      </div>
      <h1 className="text-2xl font-bold">Create your account</h1>
      <p className="mt-1 text-slate-600">Join MyEasyHand to book trusted services</p>

      <Card className="mt-8">
        <CardContent className="pt-6">
          {!otpStep ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">First Name</label>
                  <Input {...register('firstName')} className="mt-1" />
                  {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name</label>
                  <Input {...register('lastName')} className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input {...register('email')} type="email" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Phone (optional)</label>
                <Input {...register('phone')} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Password</label>
                <PasswordInput {...register('password')} className="mt-1" />
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Account'}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">Enter the OTP sent to your email/phone</p>
              <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit OTP" maxLength={6} />
              <Button className="w-full" onClick={verifyOtp}>
                Verify OTP
              </Button>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
