/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/9.x/initials/png*", // allow all initials svg URLs
      },
    ],
  },
};

export default nextConfig;
