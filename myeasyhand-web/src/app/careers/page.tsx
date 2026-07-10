import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CONTACT_EMAIL } from '@/lib/constants';

export const metadata: Metadata = { title: 'Careers' };

export default function CareersPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Careers at MyEasyHand</h1>
      <p className="mt-4 text-slate-600">
        Join us in revolutionizing how India books home services. We&apos;re building a team of passionate
        individuals who care about quality, innovation, and customer experience.
      </p>
      <div className="mt-8 space-y-4">
        {['Software Engineer', 'Product Manager', 'Customer Success', 'Marketing'].map((role) => (
          <div key={role} className="rounded-xl border bg-white p-6">
            <h3 className="font-semibold">{role}</h3>
            <p className="mt-1 text-sm text-slate-500">Remote / India</p>
            <a href={`mailto:${CONTACT_EMAIL}?subject=Application: ${role}`}>
              <Button variant="outline" size="sm" className="mt-3">
                Apply Now
              </Button>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
