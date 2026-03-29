/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: [
      "@aws-sdk/client-athena",
      "@aws-sdk/client-cloudwatch-logs",
      "@aws-sdk/client-s3",
    ],
  },
};

module.exports = nextConfig;
