'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const reviews = [
  {
    name: 'Priya Sharma',
    city: 'Mumbai',
    rating: 5,
    text: 'Excellent deep cleaning service! The team was professional and thorough. Will definitely book again.',
  },
  {
    name: 'Rahul Verma',
    city: 'Delhi',
    rating: 5,
    text: 'Quick AC repair booking. Transparent pricing and on-time arrival. MyEasyHand made it hassle-free.',
  },
  {
    name: 'Anita Patel',
    city: 'Ahmedabad',
    rating: 4,
    text: 'Love the easy booking process. Multiple services from different providers in one checkout.',
  },
];

export function CustomerReviews() {
  return (
    <section className="rounded-2xl bg-slate-100 px-6 py-16">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">What Our Customers Say</h2>
        <p className="mt-2 text-slate-600">Trusted by thousands of happy customers</p>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {reviews.map((review, i) => (
          <motion.div
            key={review.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl border bg-white p-6 shadow-sm"
          >
            <div className="flex gap-1">
              {Array.from({ length: review.rating }).map((_, j) => (
                <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">&ldquo;{review.text}&rdquo;</p>
            <div className="mt-4 border-t pt-4">
              <p className="font-semibold text-slate-900">{review.name}</p>
              <p className="text-xs text-slate-500">{review.city}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
