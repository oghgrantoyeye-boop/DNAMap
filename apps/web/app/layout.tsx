import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "@fontsource-variable/inter";
import "@fontsource-variable/source-serif-4";
import "./globals.css";
import { ADS_CLIENT } from "@/lib/ads";

export const metadata: Metadata = {
  title: "A Map of Us",
  description: "An interactive map of human population history from ancient DNA, 50,000 BCE – 1500 CE, with the evidence behind every claim.",
  // Lets Google confirm site ownership when applying for AdSense; published only once a publisher id is set.
  ...(/^ca-pub-\d{8,20}$/.test(ADS_CLIENT) ? { other: { "google-adsense-account": ADS_CLIENT } } : {}),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f5f1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
