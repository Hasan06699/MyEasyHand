# MyEasyHand Web — Customer Website

Production-ready customer-facing service booking website for the MyEasyHand platform.

| Property | Value |
|---|---|
| **Port** | 3030 |
| **Stack** | Next.js 15, TypeScript, Tailwind CSS, React Query, Zustand, Framer Motion |
| **API** | Consumes `myeasyhand-api` REST endpoints |

## Quick Start

```bash
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:3030

Set `NEXT_PUBLIC_API_URL` to your backend (default: `http://localhost:5050/api/v1`).

## Features

- **Home** — Hero banners, search, categories, promotions, featured/popular services, businesses
- **Service Discovery** — Listing with filters, sort, price range, category pages
- **Service Details** — Gallery, pricing, features, FAQs, related services
- **Booking Flow** — Single service booking, multi-service cart, checkout with coupons & GST
- **Customer Dashboard** — Bookings, tracking, QR/OTP verification, customer approval, reviews
- **Auth** — Login, register, forgot password, JWT with refresh tokens
- **Notifications** — Real-time notification inbox with unread count
- **Static Pages** — About, FAQ, Terms, Privacy, Refund, Careers, Blog, Partner, Contact
- **SEO** — Meta tags, Open Graph, JSON-LD, sitemap, robots.txt, breadcrumbs

## Project Structure

```
src/
  app/           # Next.js App Router pages
  components/    # Reusable UI, layout, home, services, booking
  lib/api/       # API integration layer (auth, services, bookings, promotions)
  stores/        # Zustand stores (auth, cart)
  types/         # TypeScript interfaces
  hooks/         # Custom React hooks
```

## Scripts

```bash
npm run dev      # Development server on port 3030
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

## Contact

info@myeasyhand.in | +91 8818907445
