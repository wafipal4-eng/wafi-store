// next.config.ts
import createNextIntlPlugin from 'next-intl/plugin';
import nextPWA from '@ducanh2912/next-pwa';
import { NextConfig } from 'next';

const baseConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.matjari.ps',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'dzjbvfixeezykmzotrdi.supabase.co',
        pathname: '/storage/**',
      },
    ],

    // ✅ Restrict to only the widths your design system actually uses
    // (was 5 sizes → now 3, reduces transformation variants significantly)
    deviceSizes: [640, 1024, 1920],
    imageSizes: [16, 32, 96, 256],

    // ✅ WebP-only: halves transformation count vs. avif+webp combo
    formats: ['image/webp'],

    // ✅ Cache for 31 days — prevents re-transforming unchanged images
    // (was 60 seconds, causing near-constant cache misses)
    minimumCacheTTL: 2678400,
  },
};

const withIntl = createNextIntlPlugin();
const withPwa = nextPWA({
  dest: 'public',
  register: true,
});

export default withPwa(withIntl(baseConfig));
