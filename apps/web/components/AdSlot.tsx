"use client";

import { useEffect, useRef } from "react";
import { ADS_CLIENT, ADS_SLOT, adsEnabled } from "@/lib/ads";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

let scriptRequested = false;

/** Load Google's ad script once, after the page has finished loading and the browser is idle. */
function loadScript(): void {
  if (scriptRequested || typeof document === "undefined") return;
  scriptRequested = true;
  const add = () => {
    const s = document.createElement("script");
    s.async = true;
    s.crossOrigin = "anonymous";
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS_CLIENT}`;
    document.head.appendChild(s);
  };
  const later = () => ("requestIdleCallback" in window ? window.requestIdleCallback(add, { timeout: 3000 }) : setTimeout(add, 1500));
  if (document.readyState === "complete") later();
  else window.addEventListener("load", later, { once: true });
}

/**
 * One responsive ad unit, clearly labelled. Renders nothing unless ads are configured.
 * Space is reserved so the page does not jump when the ad arrives. Consent for visitors in
 * the EEA, UK and Switzerland is handled by Google's consent message, set up in the AdSense account.
 */
export default function AdSlot({ className = "" }: { className?: string }) {
  const pushed = useRef(false);
  useEffect(() => {
    if (!adsEnabled || pushed.current) return;
    pushed.current = true;
    loadScript();
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // an ad failing must never break the page
    }
  }, []);
  if (!adsEnabled) return null;
  return (
    <aside className={`ad-slot ${className}`} aria-label="Advertisement">
      <p className="ad-label">Advertisement</p>
      <ins className="adsbygoogle" style={{ display: "block" }} data-ad-client={ADS_CLIENT} data-ad-slot={ADS_SLOT} data-ad-format="auto" data-full-width-responsive="true" />
    </aside>
  );
}
