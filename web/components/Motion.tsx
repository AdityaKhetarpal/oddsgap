"use client";
import { useEffect } from "react";

// Lenis for smooth scrolling, skipped when the device asks for less motion.
// The site has one motion moment only: the two price lines drawing themselves on the opening screen.
export default function Motion() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let lenis: { destroy: () => void } | null = null;
    import("lenis").then(({ default: Lenis }) => { lenis = new Lenis({ autoRaf: true }); });
    return () => lenis?.destroy();
  }, []);
  return null;
}
