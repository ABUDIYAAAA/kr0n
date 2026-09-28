/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/dashboard/projects",
        permanent: false,
      },
      {
        source: "/projects",
        destination: "/dashboard/projects",
        permanent: false,
      },
      {
        source: "/deployments",
        destination: "/dashboard/deployments",
        permanent: false,
      },
      {
        source: "/logs",
        destination: "/dashboard/logs",
        permanent: false,
      },
      {
        source: "/analytics",
        destination: "/dashboard/analytics",
        permanent: false,
      },
      {
        source: "/settings",
        destination: "/dashboard/settings",
        permanent: false,
      },
      {
        source: "/support",
        destination: "/dashboard/support",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
