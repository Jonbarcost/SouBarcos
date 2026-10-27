import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Manrope } from "next/font/google";
import { Header, Footer, AssistantDock } from "@/components/shell";
import { CartProvider } from "@/components/cart-provider";
import { SoundLayer } from "@/components/sound-layer";
import "./globals.css";
import "./immersive.css";
import "./experience.css";
import "./tech.css";
import "./cinema.css";
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], display: "swap", variable: "--font-manrope" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono", weight: ["500", "700"] });
export const dynamic = "force-dynamic";
export const viewport: Viewport = { themeColor: "#0f1f19" };
export const metadata: Metadata = {
  title: {
    default: "Brasil Force — Sua missão. Seu equipamento.",
    template: "%s | Brasil Force",
  },
  description:
    "Marketplace brasileiro de equipamentos táticos, outdoor e colecionismo. Plataforma em preparação.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${manrope.variable} ${mono.variable}`}>
      <body>
        <CartProvider>
        <a className="skip" href="#conteudo">
          Pular para o conteúdo
        </a>
        <Header />
        <main id="conteudo">{children}</main>
        <AssistantDock />
        <SoundLayer />
        <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
