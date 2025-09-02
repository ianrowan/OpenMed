/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Move this to top level in Next.js 15
  },
  serverExternalPackages: ['sharp', 'onnxruntime'],
}

module.exports = nextConfig
