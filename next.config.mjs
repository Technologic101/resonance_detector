/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  swcMinify: true,
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

export default nextConfig