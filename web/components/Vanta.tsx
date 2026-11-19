"use client";
import { useEffect, useRef } from "react";

type VantaEffect = { destroy: () => void };
declare global {
  interface Window { THREE?: unknown; VANTA?: { NET: (o: Record<string, unknown>) => VantaEffect } }
}

function load(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src; s.async = true; s.onload = () => resolve(); s.onerror = reject;
    document.head.appendChild(s);
  });
}

// A slow, faint Vanta.js "net" behind the opening screen: many traders, one price.
// Skipped for reduced motion and on small screens, and switched off while the hero is scrolled out of view
// so it never competes with the charts for frames.
export default function Vanta() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches || innerWidth < 700) return;
    let effect: VantaEffect | null = null;
    let cancelled = false;
    let visible = true;
    const dark = matchMedia("(prefers-color-scheme: dark)").matches;
    const start = () => {
      if (cancelled || effect || !visible || !window.VANTA) return;
      effect = window.VANTA.NET({
        el, mouseControls: false, touchControls: false, gyroControls: false,
        color: dark ? 0x2c303a : 0xc9ccd3, backgroundColor: dark ? 0x0f1014 : 0xffffff,
        points: 8, maxDistance: 21, spacing: 19, showDots: true, scale: 1, scaleMobile: 1,
      });
    };
    const stop = () => { effect?.destroy(); effect = null; };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); else stop(); });
    io.observe(el);
    load("https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js")
      .then(() => load("https://cdn.jsdelivr.net/npm/vanta@0.5.24/dist/vanta.net.min.js"))
      .then(start)
      .catch(() => {});
    return () => { cancelled = true; io.disconnect(); stop(); };
  }, []);
  return <div className="vanta" ref={ref} aria-hidden="true" />;
}
