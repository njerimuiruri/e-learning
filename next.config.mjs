/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://api.elearning.arin-africa.orgapi/:path*",
      },
      {
        source: "/uploads/:path*",
        destination: "https://api.elearning.arin-africa.orguploads/:path*",
      },
    ];
  },
};

export default nextConfig;
