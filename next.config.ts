import type { NextConfig } from "next";

const BASE_PATH = "/hi"; // served under jhazzh.github.io/hi

const nextConfig: NextConfig = {
  output: "export",          // static HTML/JS for GitHub Pages
  basePath: BASE_PATH,
  trailingSlash: false,      // emit /route.html (no trailing slash on URLs)
  images: { unoptimized: true }, // no image server in a static export
  // Exposed to client code that builds raw asset URLs (basePath isn't
  // auto-applied to <script>/<link> we create by hand).
  env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH },
};

export default nextConfig;
