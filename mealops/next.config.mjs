/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Strip console.log (keep error/warn) in production builds
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },

  // Security headers for every route
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",           value: "DENY" },
          { key: "X-Content-Type-Options",     value: "nosniff" },
          { key: "Referrer-Policy",            value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",         value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-XSS-Protection",           value: "1; mode=block" },
        ],
      },
    ];
  },
};

export default nextConfig;
