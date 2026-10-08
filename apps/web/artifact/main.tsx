// Single-page entry for builds that run outside Next.js (e.g. a hosted preview).
// Same components as the Next app; "About the data" and "Methodology" open as overlays.
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "@/components/App";
import About from "@/app/about/page";
import Methodology from "@/components/Methodology";
import Privacy from "@/app/privacy/page";
import { setState } from "@/lib/store";
import "@/app/globals.css";

function Root() {
  const [page, setPage] = useState<"map" | "about" | "methodology" | "privacy">("map");
  useEffect(() => {
    const sync = () => {
      const h = window.location.hash;
      setPage(h === "#about" ? "about" : h === "#privacy" ? "privacy" : h === "#methodology" || h.startsWith("#m-") || h.startsWith("#ev-") ? "methodology" : "map");
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  return (
    <>
      <App />
      {page !== "map" && (
        <div className="about-overlay" role="dialog" aria-label={page === "about" ? "About the data" : page === "privacy" ? "Privacy" : "Methodology"}>
          {page === "about" ? <About /> : page === "privacy" ? <Privacy /> : <Methodology />}
        </div>
      )}
    </>
  );
}

createRoot(document.getElementById("root")!).render(<Root />);
// Canvas text is drawn with web fonts; redraw once they arrive.
document.fonts?.ready.then(() => setState((s) => ({ view: { ...s.view } })));
