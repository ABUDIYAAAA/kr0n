/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/app', destination: '/dashboard' },
      { source: '/dashboard/projects', destination: '/projects' },
      { source: '/dashboard/deployments', destination: '/projects/proj_orvea_prod/services/svc_api/deployments' },
      { source: '/dashboard/logs', destination: '/projects/proj_orvea_prod/services/svc_api/logs' },
      { source: '/dashboard/evariables', destination: '/projects/proj_orvea_prod/services/svc_api/settings' },
      { source: '/dashboard/support', destination: '/status' },
      { source: '/app/:path*', destination: '/:path*' },
    ];
  },
};

export default nextConfig;
