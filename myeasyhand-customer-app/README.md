# MyEasyHand Customer App — myeasyhand-customer-app

Customer mobile application for the MyEasyHand Service Booking Platform.

| Property | Value |
|---|---|
| **Platforms** | iOS, Android |
| **Stack** | React Native 0.86, Expo SDK 57, Expo Router, TypeScript, Redux Toolkit, React Query, OneSignal |
| **Theme** | Foodrush-inspired (orange accent `#FB8500`, light/dark modes) |

## Quick Start

```bash
cp .env.example .env
npm install
npx expo start
```

Set `EXPO_PUBLIC_API_URL` to your backend (default: `http://localhost:5050/api/v1`).

Requires **Node.js 22.13+** for Expo SDK 57.

## Deep Links

Custom scheme: `myeasyhand://service/ID`, `myeasyhand://category/slug`, `myeasyhand://promotion/ID`, `myeasyhand://booking/ID`

Universal links (production): `https://myeasyhand.in/service/ID` — requires `.well-known` files on the website.

## Features

- **Home** — Banners, search, categories, featured/popular services, promotion rows
- **Service Discovery** — Search and browse services by category
- **Service Details** — Gallery, pricing, features, add to cart
- **Cart & Checkout** — Multi-service booking, coupons, scheduling
- **Bookings** — List, tracking, OTP verification, customer approval, reviews
- **Auth** — Login, register, OTP verification, forgot password
- **Profile** — Edit profile, notifications, dark mode toggle
- **Push Notifications** — OneSignal integration (configure `EXPO_PUBLIC_ONESIGNAL_APP_ID`)

## Project Structure

```
src/
  app/           # Expo Router screens
  components/    # UI, home, services, booking components
  constants/     # Status labels, contact info
  lib/           # Utils, category helpers
  providers/     # Redux, React Query, theme
  services/api/  # REST API client
  store/         # Redux slices (auth, cart)
  theme/         # Foodrush color tokens
  types/         # Shared TypeScript types
```

## Branch Strategy

```
feature/expo-sdk57-full-app  →  development  →  staging  →  main
```

Current full-app branch: `feature/expo-sdk57-full-app` (Expo SDK 57 / React Native 0.86).

## Contact

info@myeasyhand.in | +91 8818907445
