import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/upload",
        destination: "/student-verification",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
