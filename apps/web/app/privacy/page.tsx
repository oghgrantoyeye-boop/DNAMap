import Link from "next/link";
import { adsEnabled } from "@/lib/ads";
import { REPO_URL } from "@/lib/report";

export const metadata = { title: "Privacy · A Map of Us" };

export default function Privacy() {
  return (
    <main className="about">
      <p className="small">
        <Link href="/">← Back to the map</Link>
      </p>
      <h1>Privacy</h1>
      <p className="small muted">Last updated 8 October 2026.</p>

      <h2>What this site does not do</h2>
      <p>There are no accounts, no sign-in, no forms that collect your details, and the site sets no cookies of its own. Nothing you type in the search box leaves your browser.</p>

      <h2>Visit counts</h2>
      <p>
        We count visits with Vercel Web Analytics. It does not use cookies and does not follow you from site to site. It records the page you view, the website that sent you, your country, and your browser, operating system and device type. We also record which populations, map styles and links are opened, by their names in our data (for example &ldquo;Yamnaya&rdquo; or &ldquo;Lantern&rdquo;). We do not see your name, your address or your exact location.
      </p>

      {adsEnabled && (
        <>
          <h2>Advertising</h2>
          <p>
            Some pages show advertisements served by Google. Google and its advertising partners may use cookies and similar identifiers to show and measure ads, and to personalise them where you agree. Visitors in the European Economic Area, the United Kingdom and Switzerland are asked for consent before such identifiers are used, and can change their choice at any time through the message Google shows on the page.
          </p>
          <p>
            You can manage personalised advertising at <a href="https://adssettings.google.com">adssettings.google.com</a>. How Google uses data from sites that use its services is explained at <a href="https://policies.google.com/technologies/partner-sites">policies.google.com/technologies/partner-sites</a>. Ads are labelled, never appear on the map itself, and have no influence on what the site says about the science.
          </p>
        </>
      )}

      <h2>Links to other sites</h2>
      <p>Citations link to the publishers of scientific papers and to free full-text copies. The &ldquo;Report a problem&rdquo; links open a form on GitHub, where reports are public and subject to GitHub&rsquo;s own privacy policy. We do not control those sites.</p>

      <h2>Questions</h2>
      <p>
        Open an issue on the project&rsquo;s <a href={REPO_URL}>public repository</a>, or use any &ldquo;Report a problem&rdquo; link.
      </p>
    </main>
  );
}
