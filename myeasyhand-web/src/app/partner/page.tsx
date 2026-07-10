import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CONTACT_EMAIL } from '@/lib/constants';

export const metadata: Metadata = { title: 'Become a Service Partner' };

export default function PartnerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Become a Service Partner</h1>
      <p className="mt-4 text-lg text-slate-600">
        Grow your business with MyEasyHand. Join thousands of service professionals reaching customers across India.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {[
          { title: 'Reach More Customers', desc: 'Get discovered by customers searching for your services' },
          { title: 'Easy Booking Management', desc: 'Manage bookings, employees, and schedules from one dashboard' },
          { title: 'Secure Payments', desc: 'Receive payments directly with transparent settlement' },
          { title: 'Marketing Support', desc: 'Promotions, coupons, and featured listings to boost visibility' },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border bg-white p-6">
            <h3 className="font-semibold text-blue-600">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl gradient-primary p-8 text-center text-white">
        <h2 className="text-2xl font-bold">Ready to Get Started?</h2>
        <p className="mt-2 text-blue-100">Contact us to register your business on MyEasyHand</p>
        <a href={`mailto:${CONTACT_EMAIL}?subject=Partner Registration`}>
          <Button size="lg" className="mt-6 bg-white text-blue-700 hover:bg-blue-50">
            Register Your Business
          </Button>
        </a>
      </div>
    </div>
  );
}
