/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/app', destination: '/dashboard' },
      { source: '/app/projects', destination: '/projects' },
      { source: '/app/projects/:projectId', destination: '/projects/:projectId' },
      { source: '/dashboard/projects', destination: '/projects' },
    ];
  },
};

export default nextConfig;
