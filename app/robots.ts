import type { MetadataRoute } from "next";

// Bloqueia o site nos buscadores: não deve aparecer no Google.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        disallow: "/",
      },
    ],
  };
}