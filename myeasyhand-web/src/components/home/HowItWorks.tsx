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
    <section className="py-16">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">How MyEasyHand Works</h2>
        <p className="mt-2 text-slate-600">Book trusted services in four simple steps</p>
      </div>
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="relative text-center"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              <step.icon className="h-6 w-6" />
            </div>
            <span className="absolute -top-2 right-1/2 translate-x-8 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
              {i + 1}
            </span>
            <h3 className="mt-4 font-semibold text-slate-900">{step.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
