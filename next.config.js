/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Erweiterte Konfiguration für Webpack, um Probleme mit Leaflet zu beheben
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
  // Optimierte Bilder für Leaflet
  images: {
    domains: ['tile.openstreetmap.org'],
  },
}

module.exports = nextConfig
