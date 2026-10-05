/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // در Vercel هیچ تنظیم خاصی لازم نیست؛ فقط همین اپ Next.js به‌صورت خودکار دیپلوی می‌شود.
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
