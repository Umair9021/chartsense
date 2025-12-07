/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. This helps Vercel trace files better
  output: 'standalone', 
  
  // 2. Tell Webpack NOT to bundle these packages
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium-min'],
  },
};

export default nextConfig;