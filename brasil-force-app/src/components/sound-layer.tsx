"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { play, setSound, SFX_EVENT, SOUND_STORAGE_KEY, type Sfx } from "@/lib/sound";

/**
 * Floating "experiência sonora" switch plus the site-wide sound hooks:
 * a metallic click on buttons, a whoosh on internal navigation and any
 * effect other components request through the bf:sfx event.
 */
export function SoundLayer() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    let remembered = false;
    try {
      remembered = window.localStorage.getItem(SOUND_STORAGE_KEY) === "on";
    } catch {
      remembered = false;
    }
    // Browsers only start audio after a gesture: re-arm on the first tap.
    const arm = () => {
      if (remembered) void setSound(true);
      window.removeEventListener("pointerdown", arm);
    };
    if (remembered) {
      setOn(true);
      window.addEventListener("pointerdown", arm, { once: true });
    }

    const onPointer = (event: PointerEvent) => {
      const target = (event.target as Element | null)?.closest("a, button, summary, [role='button']");
      if (!target || target.closest(".bf-sound-toggle")) return;
      const href = target instanceof HTMLAnchorElement ? target.getAttribute("href") : null;
      play(href && href.startsWith("/") && !href.startsWith("//") ? "whoosh" : "click");
    };
    const onSfx = (event: Event) => play((event as CustomEvent<Sfx>).detail);
    window.addEventListener("pointerdown", onPointer, { passive: true });
    window.addEventListener(SFX_EVENT, onSfx);
    return () => {
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener(SFX_EVENT, onSfx);
    };
  }, []);

  const toggle = () => {
    const next = !on;
    setOn(next);
    void setSound(next);
  };

  return (
    <button
      type="button"
      className="bf-sound-toggle"
      aria-pressed={on}
      onClick={toggle}
      aria-label={on ? "Desativar experiência sonora" : "Ativar experiência sonora"}
    >
      {on ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />}
      <span className="bf-sound-bars" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="bf-sound-label">{on ? "Som ligado" : "Experiência sonora"}</span>
    </button>
  );
}
