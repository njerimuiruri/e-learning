/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://api.elearning.arin-africa.org/api/:path*",
      },
      {
        source: "/uploads/:path*",
        destination: "http://api.elearning.arin-africa.org/uploads/:path*",
      },
    ];
  },

  // Prevent browsers from caching stale build assets between deployments.
  // This eliminates the "Failed to find Server Action" error after a redeploy.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
