import type { Metadata } from 'next';
import { StaticPage } from '@/components/content/StaticPage';

export const metadata: Metadata = { title: 'Refund Policy' };

const content = `
## Refund Eligibility

Refunds are processed based on the cancellation policy of the service provider and the booking status at the time of cancellation.

## Cancellation Before Service

If you cancel before the service professional is dispatched, you may be eligible for a full refund minus any processing fees.

## Cancellation After Dispatch

Cancellations after the professional is on the way may incur a cancellation fee as determined by the service provider.

## Service Quality Issues

If you're unsatisfied with the service quality, contact our support team within 48 hours. We'll work with the provider to resolve the issue or process a partial/full refund.

## Refund Processing

Approved refunds are processed within 5-7 business days to your original payment method.
`;

export default function RefundPolicyPage() {
  return <StaticPage title="Refund Policy" content={content} />;
}
