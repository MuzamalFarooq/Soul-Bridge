/** @type {import('next').NextConfig} */
const backendUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';

let backendHostname = 'localhost';
try {
  backendHostname = new URL(backendUrl).hostname;
} catch {
  // Keep localhost fallback.
}

const nextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: backendHostname,
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: backendHostname,
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
