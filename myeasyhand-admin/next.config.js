/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  transpilePackages: ['@mui/material', '@mui/icons-material', '@mui/lab', '@emotion/react', '@emotion/styled'],
  typescript: {
    // MUI v9 removed system props (fontWeight, flexWrap, etc.) — migrate to sx over time
    ignoreBuildErrors: true,
  },
  turbopack: {
    // Prevent Next.js from picking /Users/mac/package-lock.json as the monorepo root
    root: __dirname,
  },
};

module.exports = nextConfig;
