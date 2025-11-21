/** @type {import('next').NextConfig} */
const nextConfig = {
  // Forçar renderização dinâmica para evitar erros de build com Supabase
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Configuração de imagens
  images: {
    domains: ['images.unsplash.com', 'qrgotmersdmdidjrzxvw.supabase.co'],
  },
};

module.exports = nextConfig;
