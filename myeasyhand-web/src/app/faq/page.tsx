import type { Metadata } from 'next';
import { StaticPage } from '@/components/content/StaticPage';

export const metadata: Metadata = { title: 'FAQ' };

const content = `
## How do I book a service?

Search for a service, select your preferred provider, choose a date and time, and confirm your booking. You can book single or multiple services in one checkout.

## Can I book services from multiple businesses?

Yes! MyEasyHand supports multi-vendor checkout. Services are grouped by business and you'll receive separate bookings for each vendor.

## What payment methods are accepted?

We accept online payments (UPI, cards, net banking) and cash on service. Choose your preferred method at checkout.

## How do I track my booking?

Go to My Bookings in your dashboard to see real-time status updates — from pending to employee assignment, visit scheduling, service in progress, and completion.

## Can I cancel a booking?

Yes, you can cancel pending or accepted bookings from your dashboard. Cancellation policies may vary by service provider.

## How do coupons work?

Enter your coupon code at checkout. Valid coupons are applied automatically with discount shown in the price summary.

## How do I verify the service professional?

When a visit is scheduled, you'll receive an OTP and QR code. The professional scans the QR to start the service.

## What if the service provider changes the scope?

If services are modified during the visit, you'll receive an approval request with updated pricing. You can approve or reject the changes.
`;

export default function FAQPage() {
  return <StaticPage title="Frequently Asked Questions" content={content} />;
}
