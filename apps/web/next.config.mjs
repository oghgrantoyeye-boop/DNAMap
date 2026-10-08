/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  transpilePackages: ["@dnamap/data-model", "@dnamap/visualization"],
  reactStrictMode: true,
  // Static export: relative asset paths so the site can be served from any sub-path.
  basePath: process.env.NEXT_BASE_PATH || "",
};
export default nextConfig;
