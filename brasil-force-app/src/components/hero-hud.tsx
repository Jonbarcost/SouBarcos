"use client";

import { Crosshair, LocateFixed, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { BRASILIA, distanceKm, dms } from "@/lib/geo";

type Fix = { lat: number; lng: number; km: number };

/**
 * Decorative operations HUD over the hero. Location is strictly opt-in, read
 * once with low accuracy, shown only on this screen and never stored or sent.
 */
export function HeroHud() {
  const [time, setTime] = useState<string | null>(null);
  const [fix, setFix] = useState<Fix | null>(null);
  const [state, setState] = useState<"idle" | "locating" | "denied">("idle");

  useEffect(() => {
    const format = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const tick = () => setTime(format.format(new Date()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const locate = () => {
    if (!("geolocation" in navigator)) return setState("denied");
    setState("locating");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const here = { lat: coords.latitude, lng: coords.longitude };
        setFix({ ...here, km: distanceKm(here, BRASILIA) });
        setState("idle");
      },
      () => setState("denied"),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 600_000 },
    );
  };

  const point = fix ?? BRASILIA;
  return (
    <>
      <div className="bf-hud-frame" aria-hidden="true">
        <span className="bf-hud-corner bf-hud-tl" />
        <span className="bf-hud-corner bf-hud-tr" />
        <span className="bf-hud-corner bf-hud-bl" />
        <span className="bf-hud-corner bf-hud-br" />
        <span className="bf-hud-scan" />
      </div>
      <div className="container bf-hud-bar">
        <span className="bf-hud-cell">
          <i className="bf-hud-led" aria-hidden="true" /> SINAL ATIVO
        </span>
        <span className="bf-hud-cell" aria-live="polite">
          <Crosshair size={13} aria-hidden="true" />
          {dms(point.lat, "N", "S")} · {dms(point.lng, "L", "O")}
          <em>{fix ? `VOCÊ · ${fix.km.toLocaleString("pt-BR")} KM DE BRASÍLIA` : "BRASÍLIA · DF"}</em>
        </span>
        <span className="bf-hud-cell" suppressHydrationWarning>
          BRT {time ?? "--:--:--"}
        </span>
        {!fix && (
          <button type="button" className="bf-hud-locate" onClick={locate} disabled={state === "locating"}>
            {state === "locating" ? (
              <LoaderCircle size={13} className="bf-spin" aria-hidden="true" />
            ) : (
              <LocateFixed size={13} aria-hidden="true" />
            )}
            {state === "denied" ? "Localização indisponível" : state === "locating" ? "Localizando…" : "Ativar minha posição"}
          </button>
        )}
        <span className="bf-hud-cell bf-hud-credit">Paisagem ilustrativa criada para Brasil Force</span>
      </div>
    </>
  );
}
