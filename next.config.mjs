/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  basePath: "/crmtesting",
  swcMinify: true,
  eslint: {
    // Skip ESLint during Docker build to cut build time by 2-3 minutes
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip type checking during Docker build (verified locally before push)
    ignoreBuildErrors: true,
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
