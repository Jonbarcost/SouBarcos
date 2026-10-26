"use client";

import { useEffect, useRef, useState } from "react";

type Turnstile = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let loader: Promise<Turnstile> | null = null;

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loader ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile")));
    script.onerror = () => {
      loader = null;
      reject(new Error("turnstile"));
    };
    document.head.appendChild(script);
  });
  return loader;
}

/**
 * "Não sou um robô" check. Renders nothing when no site key is configured.
 * The token travels in a hidden field and the widget resets after each submit,
 * because Turnstile tokens are single-use.
 */
export function CaptchaField({ siteKey, name = "captcha_token" }: { siteKey: string; name?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [token, setToken] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!siteKey || !box.current) return;
    let widget: string | null = null;
    let cancelled = false;
    const form = box.current.closest("form");
    const onSubmit = () =>
      setTimeout(() => {
        setToken("");
        if (widget && window.turnstile) window.turnstile.reset(widget);
      }, 0);
    form?.addEventListener("submit", onSubmit);
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !box.current) return;
        widget = turnstile.render(box.current, {
          sitekey: siteKey,
          language: "pt-br",
          theme: "light",
          callback: (value: string) => setToken(value),
          "expired-callback": () => setToken(""),
          "error-callback": () => setToken(""),
        });
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      form?.removeEventListener("submit", onSubmit);
      if (widget && window.turnstile) window.turnstile.remove(widget);
    };
  }, [siteKey]);

  if (!siteKey) return null;
  return (
    <div className="bf-captcha">
      <div ref={box} />
      <input type="hidden" name={name} value={token} />
      {failed && (
        <small role="alert">
          Não foi possível carregar a verificação anti-robô. Desative bloqueadores e recarregue a página.
        </small>
      )}
    </div>
  );
}
