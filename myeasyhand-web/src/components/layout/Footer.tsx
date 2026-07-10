import Link from 'next/link';
import { CONTACT_EMAIL, CONTACT_PHONE, SITE_NAME } from '@/lib/constants';
import { MyEasyHandLogo } from '@/components/brand/MyEasyHandLogo';
import { Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';

const footerLinks = {
  Services: [
    { label: 'Browse Services', href: '/services' },
    { label: 'Categories', href: '/categories' },
    { label: 'Businesses', href: '/businesses' },
    { label: 'Become a Partner', href: '/partner' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
  ],
  Support: [
    { label: 'FAQ', href: '/faq' },
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Refund Policy', href: '/refund-policy' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <MyEasyHandLogo variant="white" size="md" />
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
              India&apos;s trusted multi-vendor service booking platform. Book verified professionals for home
              services, repairs, cleaning, and more.
            </p>
            <div className="mt-4 flex gap-3">
              {[Facebook, Instagram, Twitter, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-400 transition-colors hover:bg-blue-600 hover:text-white"
                  aria-label="Social link"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-white">{title}</h4>
              <ul className="mt-4 space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-slate-400 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 text-sm text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
          <p>
            {CONTACT_EMAIL} · {CONTACT_PHONE}
          </p>
        </div>
      </div>
    </footer>
  );
}
