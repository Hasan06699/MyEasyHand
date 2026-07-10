import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Blog' };

const posts = [
  { slug: 'home-cleaning-tips', title: '10 Home Cleaning Tips for a Healthier Home', date: '2026-06-01' },
  { slug: 'choose-right-ac-service', title: 'How to Choose the Right AC Service Provider', date: '2026-05-15' },
  { slug: 'benefits-of-professional-plumbing', title: 'Benefits of Professional Plumbing Services', date: '2026-05-01' },
];

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">MyEasyHand Blog</h1>
      <p className="mt-2 text-slate-600">Tips, guides, and insights for home services</p>
      <div className="mt-8 space-y-6">
        {posts.map((post) => (
          <article key={post.slug} className="rounded-xl border bg-white p-6">
            <time className="text-sm text-slate-500">{post.date}</time>
            <h2 className="mt-1 text-xl font-semibold hover:text-blue-600">
              <Link href={`/blog/${post.slug}`}>{post.title}</Link>
            </h2>
          </article>
        ))}
      </div>
    </div>
  );
}
