/** @type {import('next').NextConfig} */
const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

const nextConfig = {
  async rewrites() {
    return [
      { source: '/app', destination: '/dashboard' },
      { source: '/dashboard/projects', destination: '/projects' },
      { source: '/dashboard/deployments', destination: '/projects/proj_orvea_prod/services/svc_api/deployments' },
      { source: '/dashboard/logs', destination: '/projects/proj_orvea_prod/services/svc_api/logs' },
      { source: '/dashboard/evariables', destination: '/projects/proj_orvea_prod/services/svc_api/settings' },
      { source: '/dashboard/support', destination: '/status' },
      { source: '/api/v1/:path*', destination: `${backendUrl.replace(/\/+$/, '')}/api/v1/:path*` },
      { source: '/app/:path*', destination: '/:path*' },
    ];
  },
};

export default nextConfig;
