/** @type {import('next').NextConfig} */
const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

const nextConfig = {
  async rewrites() {
    return [
      { source: '/app', destination: '/dashboard' },
      { source: '/invites/accept', destination: '/invite' },
      { source: '/dashboard/projects', destination: '/projects' },
      { source: '/api/v1/:path*', destination: `${backendUrl.replace(/\/+$/, '')}/api/v1/:path*` },
      { source: '/app/:path*', destination: '/:path*' },
    ];
  },
};

export default nextConfig;
