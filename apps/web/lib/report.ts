// Links that let readers challenge a claim. They open a prefilled GitHub issue
// form (.github/ISSUE_TEMPLATE/claim-correction.yml); field ids must match it.

export const REPO_URL = process.env.NEXT_PUBLIC_REPO_URL || "https://github.com/oghgrantoyeye-boop/DNAMap";

/** Link to a file or folder in the repository's default branch. */
export function repoLink(path: string): string {
  return `${REPO_URL}/tree/HEAD/${path}`;
}

export function reportUrl(opts: { id: string; text?: string; context?: string }): string {
  const q = new URLSearchParams({
    template: "claim-correction.yml",
    title: `[claim] ${opts.id}`,
    claim_id: opts.id,
  });
  if (opts.text) q.set("claim_text", opts.text.slice(0, 1200));
  if (opts.context) q.set("context", opts.context);
  return `${REPO_URL}/issues/new?${q.toString()}`;
}
