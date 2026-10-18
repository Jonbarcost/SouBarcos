"use client";
import { useState } from "react";
import { MessageCircle, X, ExternalLink } from "lucide-react";
import Link from "next/link";
import { AssistantChat } from "./assistant-chat";

export function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  return (
    <aside className="bf-floating-assistant" aria-label="Assistente Brasil Force">
      {open && (
        <section className="bf-floating-window" role="dialog" aria-modal="false" aria-label="Conversa com assistente Brasil Force">
          <header className="bf-floating-header">
            <strong>Assistente Brasil Force</strong>
            <div className="bf-floating-actions">
              <Link href="/assistente" aria-label="Abrir assistente em página completa" title="Abrir página completa"><ExternalLink size={17} /></Link>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar assistente"><X size={20} /></button>
            </div>
          </header>
          <div className="bf-floating-body"><AssistantChat /></div>
        </section>
      )}
      <button className="bf-assistant-dock" type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "Fechar assistente Brasil Force" : "Abrir assistente Brasil Force"}>
        {open ? <X size={18} aria-hidden="true" /> : <MessageCircle size={18} aria-hidden="true" />}
        <span>{open ? "Fechar IA" : "Fale com a IA"}</span>
      </button>
      <style jsx>{`
        .bf-floating-assistant { position: fixed; right: 23px; bottom: 23px; z-index: 100; display: flex; flex-direction: column; align-items: flex-end; gap: 12px; pointer-events: none; }
        .bf-floating-assistant > * { pointer-events: auto; }
        .bf-floating-window { width: min(360px, calc(100vw - 26px)); height: min(480px, calc(100dvh - 105px)); display: flex; flex-direction: column; overflow: hidden; border-radius: 16px; background: #fff; color: #1b2b21; box-shadow: 0 18px 55px #0005; border: 1px solid #d2d9d0; }
        .bf-floating-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 15px; background: #263d2c; color: #fff; }
        .bf-floating-actions { display: flex; gap: 12px; align-items: center; }
        .bf-floating-actions a, .bf-floating-actions button { display: inline-flex; border: 0; padding: 5px; background: transparent; color: #fff; cursor: pointer; }
        .bf-floating-body { flex: 1; min-height: 0; overflow-y: auto; padding: 12px; }
        .bf-floating-body :global(.panel) { padding: 10px; }
        .bf-floating-body :global(.search-form) { display: flex; flex-direction: column; gap: 8px; }
        .bf-floating-assistant :global(.bf-assistant-dock) { position: static; cursor: pointer; }
        @media(max-width:640px) { .bf-floating-assistant { right: 13px; bottom: max(13px, env(safe-area-inset-bottom)); } .bf-floating-window { height: min(480px, calc(100dvh - 95px)); } }
      `}</style>
    </aside>
  );
}
