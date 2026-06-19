import path from "node:path";
import type { NextConfig } from "next";

const remotePatterns: NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> = [
  {
    protocol: "https",
    hostname: "promptpay.io",
  },
];

if (process.env.R2_PUBLIC_BASE_URL) {
  try {
    const url = new URL(process.env.R2_PUBLIC_BASE_URL);
    remotePatterns.push({
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
    });
  } catch {
    /* ignore invalid URL */
  }
}

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // ให้ Next ไม่ bundle libs ฝั่ง server เหล่านี้ (อ่านไฟล์ font/asset ภายในตอน runtime)
  serverExternalPackages: ["pdfkit", "exceljs"],
  images: {
    remotePatterns,
  },
};

export default nextConfig;
