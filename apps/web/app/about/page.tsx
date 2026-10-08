import Link from "next/link";
import manifest from "../../public/data/manifest.json";

export const metadata = { title: "About the data · A Map of Us" };

export default function About() {
  const c = manifest.counts as Record<string, number>;
  return (
    <main className="about">
      <p className="small">
        <Link href="/">← Back to the map</Link>
      </p>
      <h1>About the data</h1>
      <p>
        This site reconstructs parts of human population history from the genomes of people who lived between about 50,000 BCE and 1500 CE. It is a reconstruction from the evidence available, not a census. Every population, relationship and number shown links to the published study it comes from, and to where in that study it is stated.
      </p>

      <h2>What the dots are</h2>
      <p>
        Each dot is one ancient individual whose genome has been published and compiled in the Allen Ancient DNA Resource (AADR), release {manifest.aadr_release} ({manifest.aadr_release_date}). {c.samples.toLocaleString("en-US")} individuals fall in this site&rsquo;s time window. A dot is an observation: someone who lived at roughly that place at roughly that time. Its brightness shows how well the selected moment falls inside its dating range, so individuals with broad date ranges appear faint.
      </p>
      <p>
        Locations are usually the site, not the grave. Many individuals share one coordinate and are spread out slightly on the map so they can be seen. Where the AADR record&rsquo;s text date and numeric date disagree, we keep both readings and show the combined range (and say so on the record). A few clear typos are corrected in a public overrides file, each with a reason.
      </p>

      <h2>Why the map is uneven</h2>
      <p>
        Ancient DNA survives better in cold and dry places, and research has concentrated on Europe. Most of the world is sampled thinly, and some regions and periods not at all. An empty area on the map almost always means &ldquo;no genomes sampled yet&rdquo;, not &ldquo;no people&rdquo;. The strip above the timeline shows how many samples exist for each moment within the area you are looking at. The map uses an equal-area projection so that the density of dots is not exaggerated near the poles.
      </p>

      <h2>What a &ldquo;population&rdquo; means here</h2>
      <p>
        A population on this site is a grouping we curated from published studies. It is not an ethnic group, a nation or a race. Each one says what kind of grouping it is: a genetic cluster (individuals with a shared ancestry profile), an archaeological grouping (people buried with the same material culture, who may differ genetically), a region-and-period grouping, a historical period, or an archaic human group. Some populations are inferred only: modelled ancestral groups that no sampled individual belongs to. These have no field on the map and carry an &ldquo;inferred, not sampled&rdquo; badge.
      </p>
      <p>
        Group labels in the source data (for example <span className="mono">Russia_Samara_EBA_Yamnaya</span>) combine present-day countries, sites, periods and cultures. We keep them verbatim on each record but never use them as names, because present-day countries and later identities should not be projected into the past.
      </p>

      <h2>How to read relationships</h2>
      <ul>
        <li>Solid lines mean strong evidence, dashed lines moderate evidence, and faint dotted lines a proposed or contested link (hidden unless you ask for them).</li>
        <li>An arrow means the cited studies support the direction. A double line means shared ancestry without a direction.</li>
        <li>Lines connect populations. They do not trace routes, because the routes people took are rarely known.</li>
        <li>Ancestry proportions are model estimates, labelled &ldquo;modelled as&rdquo;. Where studies offer different models, all are shown and can be switched.</li>
      </ul>

      <h2>What this site does not show</h2>
      <p>
        Language spread, migration routes, social causes such as conquest, and links to present-day ethnic or national groups. These go beyond what the genetic evidence shows directly, and many are contested.
      </p>

      <h2>Sources and credits</h2>
      <ul className="small">
        <li>
          Ancient individuals: Mallick S, Reich D. The Allen Ancient DNA Resource (AADR), Harvard Dataverse,{" "}
          <a href="https://doi.org/10.7910/DVN/FFIDCW">doi:10.7910/DVN/FFIDCW</a>, release {manifest.aadr_release}; and Mallick S, Micco A, Mah M, et al. (2024) <em>Sci Data</em> 11:182. CC0. Each record links to the original publication of its data.
        </li>
        <li>Base map: Made with Natural Earth (public domain). Coastlines are present-day; Pleistocene sea levels were lower.</li>
        <li>
          {c.evidence} evidence statements from {c.sources - 2} publications, written in our own words. The full list, with verification level, is in the project&rsquo;s SOURCES.md.
        </li>
        <li>
          Privacy: visits are counted with Vercel Web Analytics, which sets no cookies and does not follow you across sites. It records the page, the referring site, and your country, browser and device type, plus which populations, map styles and links are opened. We never see who you are.
        </li>
        <li>Built {manifest.built} from commit {manifest.git_commit}.</li>
      </ul>
    </main>
  );
}
