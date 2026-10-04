// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-1269876ce2c64008b6bf303dfb05aa11.r2.dev",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
