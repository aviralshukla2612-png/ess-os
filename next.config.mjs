/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: "standalone",
  basePath: "/crmtesting",
  swcMinify: true,
  compress: false, // Skip build-time compression, reverse proxy handles gzip
  productionBrowserSourceMaps: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        'node_modules/@swc/**',
        'node_modules/@esbuild/**',
        'node_modules/terser/**',
      ],
    },
  },
  async rewrites() {
    const chatbotUrl = process.env.CHATBOT_URL || "http://187.127.158.24:3300";
    return [
      {
        source: "/api/bots/:path*",
        destination: `${chatbotUrl}/api/bots/:path*`,
      },
      {
        source: "/api/public/chat/:path*",
        destination: `${chatbotUrl}/api/public/chat/:path*`,
      },
    ];
  },
};

export default nextConfig;
