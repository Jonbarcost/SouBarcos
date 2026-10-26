"use client";

import { useEffect } from "react";

/**
 * Home page motion layer. Reveals sections on scroll, drives the hero parallax
 * and the card spotlight/tilt through CSS variables. Content is fully visible
 * without JavaScript or with reduced motion; nothing here changes behaviour.
 */
export function HomeExperience() {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const header = document.querySelector<HTMLElement>(".header");
    const hero = document.querySelector<HTMLElement>(".bf-hero");
    let pending = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));

    // Reveal anything at or above the fold. Checked on every scroll frame (not
    // only via IntersectionObserver) so fast flings never leave content hidden.
    const revealInView = () => {
      if (!pending.length) return;
      const fold = window.innerHeight * 0.94;
      pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top >= fold) return true;
        el.classList.add("is-visible");
        return false;
      });
    };
    revealInView();
    root.dataset.bfFx = "on";

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        revealInView();
        const y = window.scrollY;
        header?.toggleAttribute("data-scrolled", y > 12);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        root.style.setProperty("--bf-page", max > 0 ? (y / max).toFixed(4) : "0");
        if (hero) {
          const progress = Math.min(1, Math.max(0, y / hero.offsetHeight));
          hero.style.setProperty("--bf-scroll", progress.toFixed(4));
        }
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    let pointerFrame = 0;
    let lastEvent: PointerEvent | null = null;
    let activeCard: HTMLElement | null = null;
    const onPointer = (event: PointerEvent) => {
      lastEvent = event;
      if (pointerFrame) return;
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        const e = lastEvent;
        if (!e) return;
        if (hero) {
          const box = hero.getBoundingClientRect();
          if (e.clientY < box.bottom) {
            hero.style.setProperty("--bf-px", ((e.clientX / box.width) * 2 - 1).toFixed(3));
            hero.style.setProperty("--bf-py", (((e.clientY - box.top) / box.height) * 2 - 1).toFixed(3));
          }
        }
        const card = (e.target as Element | null)?.closest<HTMLElement>("[data-tilt]") ?? null;
        if (activeCard && activeCard !== card) resetCard(activeCard);
        activeCard = card;
        if (!card) return;
        const box = card.getBoundingClientRect();
        const x = (e.clientX - box.left) / box.width;
        const y = (e.clientY - box.top) / box.height;
        card.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
        card.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
        card.style.setProperty("--rx", `${((0.5 - y) * 7).toFixed(2)}deg`);
        card.style.setProperty("--ry", `${((x - 0.5) * 9).toFixed(2)}deg`);
        card.dataset.lit = "true";
      });
    };
    const resetCard = (card: HTMLElement) => {
      card.style.removeProperty("--rx");
      card.style.removeProperty("--ry");
      delete card.dataset.lit;
    };
    const onLeave = () => {
      if (activeCard) resetCard(activeCard);
      activeCard = null;
    };
    if (fine) {
      window.addEventListener("pointermove", onPointer, { passive: true });
      document.addEventListener("pointerleave", onLeave);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
      cancelAnimationFrame(pointerFrame);
      header?.removeAttribute("data-scrolled");
      root.style.removeProperty("--bf-page");
      delete root.dataset.bfFx;
    };
  }, []);

  return <div className="bf-scroll-progress" aria-hidden="true" />;
}
