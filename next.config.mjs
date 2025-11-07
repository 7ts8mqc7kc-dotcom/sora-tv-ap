// 📁 next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: false },
  eslint: { ignoreDuringBuilds: true }
};
export default nextConfig;
