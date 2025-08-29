import type {NextConfig} from 'next';

// The following nextConfig is a basic configuration and can be customized.
// For more information, see: https://nextjs.org/docs/app/api-reference/next-config-js
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
};

export default nextConfig;
