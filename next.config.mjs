/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true
  },
  images: {
    // فعل تحسين الصور؛ إن أردت تعطيله مؤقتًا عيّن unoptimized: true
    unoptimized: false
  },
  eslint: {
    // يفضّل تشغيله عند النشر لتجنب أخطاء غير مرئية
    ignoreDuringBuilds: false
  }
};

export default nextConfig;
