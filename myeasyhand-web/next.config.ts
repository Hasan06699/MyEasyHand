import type { NextConfig } from 'next';

const apiHost = process.env.NEXT_PUBLIC_API_URL?.replace(/^https?:\/\//, '').replace(/\/api\/v1$/, '') || 'localhost:5050';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'myeasyhand.in' },
      { protocol: 'https', hostname: 'api.myeasyhand.in' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'http', hostname: 'localhost', port: '5050' },
      { protocol: 'https', hostname: apiHost.split(':')[0] },
    ],
  },
};

export default nextConfig;
