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
};

export default nextConfig;
