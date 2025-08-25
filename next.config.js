const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

module.exports = (phase) => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;
  return {
    // Use standard .next directory for both dev and production
    distDir: ".next",
    webpack: (config, { dev, isServer }) => {
      if (dev) config.cache = { type: "memory", maxGenerations: 1 };
      if (!isServer) {
        config.resolve = config.resolve || {};
        config.resolve.fallback = {
          ...(config.resolve.fallback || {}),
          fs: false, path: false, crypto: false, net: false, tls: false,
          http: false, https: false, stream: false, zlib: false
        };
        config.resolve.alias = { ...(config.resolve.alias || {}), undici: false };
      }
      return config;
    }
  };
};