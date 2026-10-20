"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ExternalLink, MessageCircle, X } from "lucide-react";
import { AssistantChat } from "./assistant-chat";

export function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const containerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    function resize() {
      if (!viewport) return;
      const keyboard = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      containerRef.current?.style.setProperty("--bf-keyboard", `${keyboard}px`);
      containerRef.current?.style.setProperty("--bf-viewport", `${viewport.height}px`);
    }
    resize();
    viewport.addEventListener("resize", resize);
    viewport.addEventListener("scroll", resize);
    return () => { viewport.removeEventListener("resize", resize); viewport.removeEventListener("scroll", resize); };
  }, [pathname]);

  function closeAssistant() {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        requestAnimationFrame(() => triggerRef.current?.focus());
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // The full-page assistant already renders its own chat and input identifiers.
  if (pathname === "/assistente") return null;

  return (
    <aside ref={containerRef} className="bf-floating-assistant" aria-label="Assistente Brasil Force">
      {/* Keep the chat mounted while hidden to preserve conversation history. */}
      <section
        id="bf-floating-chat-window"
        className="bf-floating-window"
        role="dialog"
        aria-modal="false"
        aria-label="Conversa com assistente Brasil Force"
        hidden={!open}
      >
        <header className="bf-floating-header">
          <strong>Assistente Brasil Force</strong>
          <div className="bf-floating-actions">
            <Link href="/assistente" aria-label="Abrir conversa em página completa" title="Abrir página completa">
              <ExternalLink size={17} aria-hidden="true" />
            </Link>
            <button ref={closeRef} type="button" onClick={closeAssistant} aria-label="Fechar assistente">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </header>
        <div className="bf-floating-body">
          <AssistantChat />
        </div>
      </section>
      <button
        ref={triggerRef}
        className="bf-assistant-dock"
        type="button"
        onClick={() => (open ? closeAssistant() : setOpen(true))}
        aria-expanded={open}
        aria-controls="bf-floating-chat-window"
        aria-label={open ? "Fechar assistente Brasil Force" : "Abrir assistente Brasil Force"}
      >
        {open ? <X size={18} aria-hidden="true" /> : <MessageCircle size={18} aria-hidden="true" />}
        <span>{open ? "Fechar IA" : "Fale com a IA"}</span>
      </button>
      <style jsx>{`
        .bf-floating-assistant {
          position: fixed; right: 20px; bottom: calc(20px + var(--bf-keyboard, 0px)); z-index: 100;
          display: flex; flex-direction: column; align-items: flex-end;
          gap: 10px; pointer-events: none;
        }
        .bf-floating-assistant > * { pointer-events: auto; }
        .bf-floating-window {
          box-sizing: border-box; width: min(380px, calc(100vw - 26px));
          height: min(500px, calc(var(--bf-viewport, 100dvh) - 100px));
          display: flex; flex-direction: column; overflow: hidden;
          border-radius: 17px; background: #fffefb; color: #172d22;
          box-shadow: 0 18px 55px #0005; border: 1px solid #d2d9d0;
        }
        .bf-floating-window[hidden] { display: none; }
        .bf-floating-header {
          flex-shrink: 0; display: flex; align-items: center;
          justify-content: space-between; gap: 10px;
          padding: 11px 14px; background: #263d2c; color: #fff;
          font-size: 13px;
        }
        .bf-floating-actions { display: flex; gap: 10px; align-items: center; }
        .bf-floating-actions a, .bf-floating-actions button {
          display: inline-flex; border: 0; border-radius: 6px;
          padding: 10px; min-width: 44px; min-height: 44px; align-items: center; justify-content: center; background: transparent; color: #fff; cursor: pointer;
        }
        .bf-floating-actions a:focus-visible, .bf-floating-actions button:focus-visible {
          outline: 2px solid #f0d195; outline-offset: 2px;
        }
        .bf-floating-body {
          display: flex; flex: 1; min-height: 0; overflow: hidden;
          padding: 11px;
        }
        .bf-floating-body :global(section.panel) {
          display: flex; flex-direction: column; flex: 1; min-height: 0;
          gap: 9px; margin: 0; padding: 0; border: 0;
          background: transparent; box-shadow: none;
        }
        .bf-floating-body :global(section.panel > h2),
        .bf-floating-body :global(section.panel > p:first-of-type) { display: none; }
        .bf-floating-body :global(section.panel > p[role="status"]) {
          margin: 0; font-size: 14px; line-height: 1.45;
        }
        .bf-floating-body :global(section.panel > .listing-toolbar) {
          margin: 0; padding: 0 0 4px; display: flex; flex-wrap: nowrap;
          justify-content: flex-start; gap: 6px; overflow-x: auto; flex-shrink: 0;
        }
        .bf-floating-body :global(.listing-toolbar > button) {
          flex-shrink: 0; padding: 7px 9px; min-height: 44px;
          font-size: 12px; border-radius: 9px;
        }
        .bf-floating-body :global(section.panel > [role="log"]) {
          flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain;
          padding-right: 3px; scrollbar-width: thin;
        }
        .bf-floating-body :global([role="log"] > article.panel) {
          margin: 0 0 9px; padding: 11px;
          border-radius: 11px; background: #f5f7f2;
          overflow-wrap: anywhere;
        }
        .bf-floating-body :global([role="log"] h3) { font-size: 14px; margin: 0 0 3px; }
        .bf-floating-body :global([role="log"] p) {
          font-size: 14px; line-height: 1.5; margin: 0 0 7px;
        }
        .bf-floating-body :global(section.panel > form.search-form) {
          flex-shrink: 0; display: flex; align-items: center; gap: 7px;
          margin: 0; padding-top: 10px; border-top: 1px solid #dce1d8;
        }
        .bf-floating-body :global(form.search-form > label) {
          position: absolute; width: 1px; height: 1px; padding: 0;
          margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0);
          white-space: nowrap; border: 0;
        }
        .bf-floating-body :global(form.search-form > input) {
          min-width: 0; flex: 1; width: auto;
          min-height: 42px; padding: 8px 10px; font-size: 16px;
          border-radius: 9px;
        }
        .bf-floating-body :global(form.search-form > button) {
          flex: 0 0 auto; min-height: 42px; padding: 7px 10px;
          font-size: 11px; line-height: 1.25; border-radius: 9px;
          max-width: 96px;
        }
        .bf-floating-assistant :global(.bf-assistant-dock) {
          position: static; cursor: pointer;
        }
        @media (max-width: 640px) {
          .bf-floating-assistant {
            right: 13px; bottom: calc(max(13px, env(safe-area-inset-bottom)) + var(--bf-keyboard, 0px));
          }
          .bf-floating-window {
            width: min(380px, calc(100vw - 26px));
            height: min(500px, calc(var(--bf-viewport, 100dvh) - 92px));
          }
        }
      `}</style>
    </aside>
  );
}
