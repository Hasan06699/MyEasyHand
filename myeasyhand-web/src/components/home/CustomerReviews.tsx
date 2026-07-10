'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

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
    <section className="rounded-[2rem] bg-gradient-to-br from-[#E3F2FD] via-white to-[#FFF3E0] px-6 py-14 ring-1 ring-brand-blue/10 md:px-10">
      <div className="text-center">
        <p className="section-kicker justify-center">Reviews</p>
        <h2 className="section-title">Loved by local customers</h2>
        <p className="mt-2 text-slate-600">Real stories from people who booked with MyEasyHand</p>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {reviews.map((review, i) => (
          <motion.div
            key={review.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="relative rounded-[1.5rem] bg-white p-6 shadow-soft"
          >
            <Quote className="absolute right-4 top-4 h-8 w-8 text-brand-blue/15" />
            <div className="flex gap-1">
              {Array.from({ length: review.rating }).map((_, j) => (
                <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">&ldquo;{review.text}&rdquo;</p>
            <div className="mt-5 flex items-center gap-3 border-t border-brand-blue/10 pt-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft font-bold text-brand-blue">
                {review.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-slate-900">{review.name}</p>
                <p className="text-xs text-slate-500">{review.city}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
