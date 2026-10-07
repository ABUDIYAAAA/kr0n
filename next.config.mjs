/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/app', destination: '/dashboard' },
      { source: '/dashboard/projects', destination: '/projects' },
      { source: '/app/:path*', destination: '/:path*' },
    ];
  },
};

export default nextConfig;
