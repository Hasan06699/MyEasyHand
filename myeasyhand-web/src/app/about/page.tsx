import type { Metadata } from 'next';
import { StaticPage } from '@/components/content/StaticPage';

export const metadata: Metadata = { title: 'About Us' };

const content = `
## Our Mission

MyEasyHand is India's trusted multi-vendor service booking platform, connecting customers with verified service professionals for home services, repairs, cleaning, and more.

## What We Do

We make it easy to discover, compare, and book services from multiple trusted businesses — all in one place. From scheduling to payment to real-time tracking, MyEasyHand handles the entire journey.

## Why Choose MyEasyHand

- **Verified Providers** — Every business on our platform is vetted for quality and reliability
- **Transparent Pricing** — No hidden charges; see prices upfront before booking
- **Real-time Tracking** — Track your service from booking to completion
- **Secure Payments** — Pay online or choose cash on service
- **Customer Support** — Dedicated support team to help you every step of the way

## Our Values

Quality, transparency, and customer satisfaction drive everything we do. We believe everyone deserves access to reliable, affordable home services.
`;

export default function AboutPage() {
  return <StaticPage title="About MyEasyHand" content={content} />;
}
