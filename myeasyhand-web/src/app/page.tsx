import Link from 'next/link';
import { HomePageClient } from '@/components/home/HomePageClient';
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/constants';

export const metadata = {
  title: 'Book Trusted Services Online',
  description: SITE_DESCRIPTION,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://myeasyhand.in',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://myeasyhand.in'}/services?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomePageClient />
    </>
  );
}
