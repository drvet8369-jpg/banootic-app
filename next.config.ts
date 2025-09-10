import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    // This allows the Next.js dev server to accept requests from our cloud-based
    // development environment.
    allowedDevOrigins: ["*.cloudworkstations.dev"],
  }
};

export default nextConfig;
