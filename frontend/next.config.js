/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['localhost', 'res.cloudinary.com', 'images.unsplash.com'],
  },
  // Allow leaflet CSS to load correctly
  transpilePackages: ['leaflet', 'react-leaflet'],
};

module.exports = nextConfig;

