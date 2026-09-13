/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true }, // Netlify free tier: hindari image optimization server
};
module.exports = nextConfig;
