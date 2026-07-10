import type { Metadata } from 'next';
import { StaticPage } from '@/components/content/StaticPage';

export const metadata: Metadata = { title: 'Terms & Conditions' };

const content = `
## Acceptance of Terms

By accessing and using MyEasyHand, you agree to be bound by these Terms and Conditions.

## Service Bookings

All bookings are subject to availability and confirmation by the service provider. MyEasyHand acts as a platform connecting customers with service businesses.

## Payments

Payment terms are displayed at checkout. Online payments are processed securely. Cash payments are collected by the service provider upon completion.

## Cancellations

Cancellation policies vary by service provider. Please review the specific terms before booking.

## User Responsibilities

You agree to provide accurate information, treat service professionals respectfully, and use the platform in compliance with applicable laws.

## Limitation of Liability

MyEasyHand is not liable for the quality of services provided by third-party businesses. Disputes should be resolved through our support channels.
`;

export default function TermsPage() {
  return <StaticPage title="Terms & Conditions" content={content} />;
}
