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
    <footer className="mt-8 border-t border-brand-blue/10 bg-[#0B1F3A] text-slate-300">
      <div className="section-shell py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="inline-flex rounded-xl bg-white px-3 py-2">
              <MyEasyHandLogo variant="gradient" size="md" disableLink />
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              Your local partner for home repairs &amp; cleaning. Book verified professionals
              city by city — cook, plumber, electrician, cleaner, and more.
            </p>
            <div className="mt-5 flex gap-2">
              {[Facebook, Instagram, Twitter, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-slate-300 transition-colors hover:bg-brand-orange hover:text-white"
                  aria-label="Social link"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-bold uppercase tracking-wider text-white">{title}</h4>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition-colors hover:text-brand-orange"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
          <p>
            {CONTACT_EMAIL} · {CONTACT_PHONE}
          </p>
        </div>
      </div>
    </footer>
  );
}
