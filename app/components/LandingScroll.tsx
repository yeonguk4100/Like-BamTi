"use client";

import { useEffect } from "react";

export function LandingScroll() {
  useEffect(() => {
    const landing = document.querySelector(".lp");
    const nav = landing?.querySelector(".lp-nav");
    if (!landing || !nav) return;

    const screens = Array.from(landing.querySelectorAll(".lp-screen"));
    const smoothDesktop = window.matchMedia("(min-width: 1001px) and (prefers-reduced-motion: no-preference)");
    let lastWheel = -Infinity;
    let destination: number | null = null;
    let transitionUntil = 0;

    function onWheel(event: WheelEvent) {
      if (
        !smoothDesktop.matches || !event.cancelable || event.defaultPrevented ||
        event.ctrlKey || event.shiftKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)
      ) return;

      const now = performance.now();
      const inSameGesture = now - lastWheel < 150;
      lastWheel = now;
      const scrollTop = window.scrollY;

      if (destination !== null && (inSameGesture || (now < transitionUntil && Math.abs(scrollTop - destination) > 2))) {
        event.preventDefault();
        return;
      }
      destination = null;

      const navHeight = nav!.getBoundingClientRect().height;
      const visibleHeight = document.documentElement.clientHeight - navHeight;
      const current = screens.findIndex((screen) =>
        Math.abs(screen.getBoundingClientRect().top - navHeight) <= 2
      );
      if (current < 0) return;

      const down = event.deltaY > 0;
      if (down && screens[current].getBoundingClientRect().height > visibleHeight + 2) return;

      const next = screens[current + (down ? 1 : -1)];
      if (!next) return;

      const nextTop = scrollTop + next.getBoundingClientRect().top - navHeight;
      destination = down ? nextTop : Math.max(nextTop, scrollTop - visibleHeight);
      transitionUntil = now + 650;
      event.preventDefault();
      window.scrollTo({ top: destination, behavior: "smooth" });
    }

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);

  return null;
}
