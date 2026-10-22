"use client";

import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** Decorative scene only. Navigation and text never move with the landscape. */
export function HeroLandscape() {
  const scene = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(true);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(true);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReduced(preference.matches);
    const syncVisibility = () => setActiveTab(!document.hidden);
    syncPreference();
    syncVisibility();
    preference.addEventListener("change", syncPreference);
    document.addEventListener("visibilitychange", syncVisibility);
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    if (scene.current) observer.observe(scene.current);
    return () => {
      preference.removeEventListener("change", syncPreference);
      document.removeEventListener("visibilitychange", syncVisibility);
      observer.disconnect();
    };
  }, []);

  const playing = !reduced && !paused && visible && activeTab;
  return (
    <>
      <div
        ref={scene}
        className="bf-living-landscape"
        data-playing={playing}
        aria-hidden="true"
      >
        <Image
          className="bf-landscape-photo"
          src="/images/hero/serra-dawn.webp"
          alt=""
          fill
          sizes="100vw"
          preload
        />
        <div className="bf-sunset-wash" />
        <div className="bf-solar-glow" />
        <div className="bf-cloud-bank bf-cloud-bank-far" />
        <div className="bf-cloud-bank bf-cloud-bank-near" />
        <div className="bf-valley-mist" />
        <div className="bf-nightfall" />
      </div>
      {!reduced && (
        <button
          className="bf-landscape-toggle"
          type="button"
          aria-pressed={paused}
          onClick={() => setPaused((value) => !value)}
          aria-label={
            paused
              ? "Retomar animação da paisagem"
              : "Pausar animação da paisagem"
          }
        >
          {paused ? (
            <Play size={14} aria-hidden="true" />
          ) : (
            <Pause size={14} aria-hidden="true" />
          )}
          <span>{paused ? "Retomar paisagem" : "Pausar paisagem"}</span>
        </button>
      )}
    </>
  );
}
