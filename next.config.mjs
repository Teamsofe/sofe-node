/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow base64 encoded images (used for logo until /public/logo.png is added)
  images: {
    dangerouslyAllowSVG: true,
    unoptimized: true,
  },
  webpack: (config, { dev }) => {
    if (!dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
