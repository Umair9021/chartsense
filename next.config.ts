/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output reduces file size issues
  output: 'standalone',
  
  // Important: Exclude these from Webpack bundling
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  },
};

export default nextConfig;