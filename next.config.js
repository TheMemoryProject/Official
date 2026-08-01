/**
 * @type {import('next').NextConfig}
 *
 * `basePath` is set only when NEXT_PUBLIC_BASE_PATH is provided, which happens solely in
 * the GitHub Pages job — that site is served from a subpath (/Official) and its assets
 * would otherwise 404. A Node deployment (Vercel or equivalent) serves from the root and
 * must leave this unset.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig = {
  reactStrictMode: true,
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
};

module.exports = nextConfig;
