// Single-page entry for builds that run outside Next.js (e.g. a hosted preview).
// Same components as the Next app; "About the data" opens as an overlay.
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "@/components/App";
import About from "@/app/about/page";
import { setState } from "@/lib/store";
import "@/app/globals.css";

function Root() {
  const [about, setAbout] = useState(false);
  useEffect(() => {
    const sync = () => setAbout(window.location.hash === "#about");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  return (
    <>
      <App />
      {about && (
        <div className="about-overlay" role="dialog" aria-label="About the data">
          <About />
        </div>
      )}
    </>
  );
}

createRoot(document.getElementById("root")!).render(<Root />);
// Canvas text is drawn with web fonts; redraw once they arrive.
document.fonts?.ready.then(() => setState((s) => ({ view: { ...s.view } })));
