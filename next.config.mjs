/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  basePath: "/crmtesting",
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
