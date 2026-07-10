'use client';

import { motion } from 'framer-motion';
import { Search, Calendar, CheckCircle, Star } from 'lucide-react';

const steps = [
  { icon: Search, title: 'Search & Discover', desc: 'Find services by category, location, or business.' },
  { icon: Calendar, title: 'Schedule', desc: 'Pick a convenient date and time for your service.' },
  { icon: CheckCircle, title: 'Get It Done', desc: 'Verified professionals arrive and complete the job.' },
  { icon: Star, title: 'Rate & Review', desc: 'Share your experience to help others choose better.' },
];

export function HowItWorks() {
  return (
    <section className="rounded-[2rem] bg-white p-8 shadow-soft ring-1 ring-brand-blue/10 md:p-12">
      <div className="text-center">
        <p className="section-kicker justify-center">Simple flow</p>
        <h2 className="section-title">How MyEasyHand works</h2>
        <p className="mt-2 text-slate-600">Book trusted local help in four steps</p>
      </div>
      <div className="relative mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="pointer-events-none absolute left-[12%] right-[12%] top-7 hidden h-0.5 bg-gradient-to-r from-brand-blue via-brand-orange to-brand-blue lg:block" />
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="relative text-center"
          >
            <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E3F2FD] to-[#FFF3E0] text-brand-blue shadow-md ring-4 ring-white">
              <step.icon className="h-6 w-6" />
              <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-orange text-xs font-bold text-white">
                {i + 1}
              </span>
            </div>
            <h3 className="mt-5 font-bold text-slate-900">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
