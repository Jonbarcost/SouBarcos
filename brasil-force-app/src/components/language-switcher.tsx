"use client";
import { usePathname } from "next/navigation";
import { Globe2 } from "lucide-react";

const languages = [
  { code: "pt-BR", label: "Português", prefix: "" },
  { code: "en", label: "English", prefix: "/en" },
  { code: "es", label: "Español", prefix: "/es" },
];
export function LanguageSwitcher() {
  const pathname = usePathname() || "/";
  const base = pathname.replace(/^\/(en|es)(?=\/|$)/, "") || "/";
  const translated = base === "/fornecedores" || base === "/quero-comprar" || base === "/";
  return (
    <label style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:13}}>
      <Globe2 size={17} aria-hidden="true" />
      <span className="sr-only">Idioma / Language / Idioma</span>
      <select aria-label="Idioma / Language / Idioma" value={pathname.startsWith("/en/") || pathname === "/en" ? "en" : pathname.startsWith("/es/") || pathname === "/es" ? "es" : "pt-BR"} onChange={(e) => {
        const target = languages.find((l) => l.code === e.target.value);
        if (target) window.location.assign(target.prefix + (translated ? base : "/"));
      }} style={{background:"transparent",color:"inherit",border:"1px solid currentColor",borderRadius:8,padding:"6px 5px",maxWidth:130}}>
        {languages.map((language) => <option key={language.code} value={language.code} style={{color:"#17201a"}}>{language.label}</option>)}
      </select>
    </label>
  );
}
