import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: "https://brasilforce.com.br/fornecedores", lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: "https://brasilforce.com.br/quero-comprar", lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];
}
