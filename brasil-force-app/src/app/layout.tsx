import type { Metadata } from "next";
import { Header, Footer } from "@/components/shell";
import "./globals.css";
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
    <html lang="pt-BR">
      <body>
        <a className="skip" href="#conteudo">
          Pular para o conteúdo
        </a>
        <Header />
        <main id="conteudo">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
