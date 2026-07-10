import type { Metadata } from 'next';
import { StaticPage } from '@/components/content/StaticPage';

export const metadata: Metadata = { title: 'Privacy Policy' };

const content = `
## Information We Collect

We collect personal information you provide during registration and booking, including name, email, phone number, and service addresses.

## How We Use Your Information

Your information is used to process bookings, communicate about your services, improve our platform, and send relevant promotions (with your consent).

## Data Security

We implement industry-standard security measures to protect your personal data. Payment information is processed through secure payment gateways.

## Third-Party Sharing

We share necessary booking information with service providers to fulfill your requests. We do not sell your personal data to third parties.

## Your Rights

You can access, update, or delete your personal information through your account settings or by contacting our support team.
`;

export default function PrivacyPage() {
  return <StaticPage title="Privacy Policy" content={content} />;
}
