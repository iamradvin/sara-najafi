import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SaraNajafi | آموزش تخصصی زیبایی مو",
    short_name: "SaraNajafi",
    description:
      "آموزش تخصصی رنگ مو، رنگ و مش، لایت، بالیاژ، آمبره، کراتین و احیای مو.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#200910",
    theme_color: "#200910",
    lang: "fa",
    dir: "rtl",
    categories: ["education", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
