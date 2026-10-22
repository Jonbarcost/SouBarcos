import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://brasilforce.com.br";
  return ["/", "/catalogo", "/vender", "/fornecedores", "/quero-comprar", "/legado", "/ajuda", "/regras", "/privacidade", "/termos"].map((path) => ({
    url: base + path,
    changeFrequency: "weekly" as const,
    priority: path === "/" ? 1 : 0.7,
  }));
}
