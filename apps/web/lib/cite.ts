// Short in-text citations: "Haak et al. 2015", or "AADR v66.p1" for a dataset.

export function shortCitation(s: { id: string; citation: string; year: number; type?: string; title?: string; version?: string } | undefined, fallback: string): string {
  if (!s) return fallback;
  if (s.type === "dataset") {
    const acronym = s.title?.match(/\(([A-Z]{2,})\)/)?.[1] ?? s.id.toUpperCase();
    return s.version ? `${acronym} ${s.version}` : `${acronym} ${s.year}`;
  }
  const authors = s.citation.split("(")[0].trim().replace(/[.,]\s*$/, "");
  const first = authors.split(",")[0].trim();
  const parts = first.split(/\s+/);
  const surname = parts.length > 1 ? parts.slice(0, -1).join(" ") : first; // drop initials: "de Barros Damgaard P" -> "de Barros Damgaard"
  return `${surname}${authors.includes(",") ? " et al." : ""} ${s.year}`;
}
