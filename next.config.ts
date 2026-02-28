import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    // Cache dynamic route RSC payloads in the client-side router cache for 30s.
    // Without this, force-dynamic routes (including /garments) re-fetch on every
    // soft navigation, even back/forward within the same session.
    // The 30MB normalizedCatalog payload is expensive to re-fetch; 30s covers
    // typical in-session navigation patterns (browse → job → back to catalog).
    staleTimes: {
      dynamic: 30,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.ssactivewear.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.ssactivewear.com',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
