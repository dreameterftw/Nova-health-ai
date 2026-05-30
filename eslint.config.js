const nextConfig = require("eslint-config-next");

module.exports = [
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "coverage/**", ".vercel/**"],
  },
  ...nextConfig,
];
