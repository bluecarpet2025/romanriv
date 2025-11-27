// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rafasxvknustulbepryv.supabase.co",
        // Allow ANY bucket under /storage/v1/object/public/
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
