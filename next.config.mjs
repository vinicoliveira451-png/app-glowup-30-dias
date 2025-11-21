/** @type {import('next').NextConfig} */
const nextConfig = {
  // Desabilitar turbopack para evitar erros de runtime
  experimental: {
    turbo: undefined,
  },
  // Configurações de imagem
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Desabilitar strict mode para evitar double renders
  reactStrictMode: false,
};

export default nextConfig;
