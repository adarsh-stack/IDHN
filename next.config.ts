/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true, // <-- THIS IS THE MAGIC LINE
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;