/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "40mb",
    },
    outputFileTracingIncludes: {
      "/**": [
        "./node_modules/.prisma/**/*",
        "./node_modules/@prisma/client/**/*",
      ],
    },
    serverComponentsExternalPackages: [
      "pdf-parse",
      "tesseract.js",
      "mammoth",
      "adm-zip",
      "tar",
    ],
  },
};

export default nextConfig;
