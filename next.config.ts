import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "export",
  assetPrefix: process.env.NODE_ENV === "production" ? "./" : undefined,
  basePath: "",
};

export default nextConfig;
