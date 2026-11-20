"use client";

import { useEffect } from "react";

const TRANSITION_MS = 620;
const WHEEL_GESTURE_GAP_MS = 150;

export function LandingScroll() {
  useEffect(() => {
    const landing = document.querySelector(".lp");
    const nav = landing?.querySelector(".lp-nav");
    if (!landing || !nav) return;

    const root = document.documentElement;
    const screens = Array.from(landing.querySelectorAll(".lp-screen"));
    const smoothDesktop = window.matchMedia("(min-width: 1001px) and (prefers-reduced-motion: no-preference)");
    let lastWheel = -Infinity;
    let handledGesture = false;
    let frame: number | null = null;
    let previousSnap = "";

    const stopTransition = () => {
      if (frame === null) return;
      window.cancelAnimationFrame(frame);
      frame = null;
      root.style.scrollSnapType = previousSnap;
    };

    const moveTo = (start: number, end: number) => {
      const started = performance.now();
      previousSnap = root.style.scrollSnapType;
      root.style.scrollSnapType = "none";

      const animate = (now: number) => {
        const progress = Math.min(1, Math.max(0, (now - started) / TRANSITION_MS));
        const eased = (1 - Math.cos(Math.PI * progress)) / 2;
        window.scrollTo({ top: start + (end - start) * eased, behavior: "instant" });

        if (progress < 1) {
          frame = window.requestAnimationFrame(animate);
        } else {
          stopTransition();
        }
      };

      frame = window.requestAnimationFrame(animate);
    };

    const onWheel = (event: WheelEvent) => {
      if (
        !smoothDesktop.matches || !event.cancelable || event.defaultPrevented ||
        event.ctrlKey || event.shiftKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)
      ) return;

      const now = performance.now();
      const inSameGesture = now - lastWheel < WHEEL_GESTURE_GAP_MS;
      lastWheel = now;
      if (frame !== null || (handledGesture && inSameGesture)) {
        event.preventDefault();
        return;
      }
      handledGesture = false;

      const scrollTop = window.scrollY;
      const navHeight = nav.getBoundingClientRect().height;
      const visibleHeight = root.clientHeight - navHeight;
      const current = screens.findIndex((screen) =>
        Math.abs(screen.getBoundingClientRect().top - navHeight) <= 2
      );
      if (current < 0) return;

      const down = event.deltaY > 0;
      if (down && screens[current].getBoundingClientRect().height > visibleHeight + 2) return;

      const next = screens[current + (down ? 1 : -1)];
      if (!next) return;

      const nextTop = scrollTop + next.getBoundingClientRect().top - navHeight;
      const destination = down ? nextTop : Math.max(nextTop, scrollTop - visibleHeight);
      event.preventDefault();
      handledGesture = true;
      moveTo(scrollTop, destination);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("pointerdown", stopTransition);
    window.addEventListener("keydown", stopTransition);
    smoothDesktop.addEventListener("change", stopTransition);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("pointerdown", stopTransition);
      window.removeEventListener("keydown", stopTransition);
      smoothDesktop.removeEventListener("change", stopTransition);
      stopTransition();
    };
  }, []);

  return null;
}
