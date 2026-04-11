/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["*"]
    }
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("ssh2", "cpu-features", "@marsaud/smb2");
    } else {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        ssh2: false,
        "cpu-features": false,
        "@marsaud/smb2": false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
