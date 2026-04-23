import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Quét Đơn Kho",
    short_name: "Quét Đơn",
    description: "Tra cứu zone và địa chỉ bằng máy quét barcode/PDA.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6f3ea",
    theme_color: "#f6f3ea",
    orientation: "portrait",
    lang: "vi",
  };
}
