import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { Header, Footer, AssistantDock } from "@/components/shell";
import { ExperienceControls } from "@/components/experience-controls";
import "./globals.css";
import "./immersive.css";
import "./operations-tokens.css";
import "./operations-hero.css";
import "./mission-modules.css";
import "./assistant-terminal.css";
import "./inspiration-gallery.css";
import "./experience-controls.css";
import "./ultra-max.css";
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], display: "swap", variable: "--font-manrope" });
export const dynamic = "force-dynamic";
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
    <html lang="pt-BR" className={`${inter.variable} ${manrope.variable}`}>
      <body>
        <a className="skip" href="#conteudo">
          Pular para o conteúdo
        </a>
        <Header />
        <main id="conteudo">{children}</main>
        <AssistantDock />
        <ExperienceControls />
        <Footer />
      </body>
    </html>
  );
}
