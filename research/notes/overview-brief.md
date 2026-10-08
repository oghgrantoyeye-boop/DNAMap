# Brief: sectioned overviews for populations

Method record for the "richer descriptions" work (2026-10-08). Every agent that drafts overviews follows this brief. The owner reviews historical claims before they are treated as final.

## Why

Population panels carried a one- or two-sentence description and no reading guidance. Readers asked for real information and further reading. The data model now supports `overview` (sections) on each population, and the panel lists the studies behind it.

## What to produce

For each population in your group, an `overview` of 2–5 sections. Allowed headings (each at most once, in this order):

1. **Who they were**: what kind of grouping this is, who is in it, what the sampled individuals are known for (burials, sites, practices) where a source says so.
2. **When and where**: dates and places, with the real range of sampled sites; say plainly where sampling is thin.
3. **Ancestry**: what the cited studies find about their genetic ancestry, with published proportions and uncertainty where they exist, and which models the studies compare.
4. **What came before and after**: ancestry connections to earlier and later populations, in contributed-ancestry language.
5. **What we cannot tell**: the authors' own caveats, model dependence, sampling limits, open disagreements.

Each section: 40–110 words, plain language for an interested adult with no genetics training. Explain a technical term the first time it appears (for example "ancestry component", "admixture"). Define an abbreviation on first use. Short sentences. No filler.

Write only sections you can support. A thinly evidenced population gets two honest sections, not five padded ones.

## Rules (from CLAUDE.md; these are not optional)

1. Every statement in a section must be supported by evidence ids listed on that section. Use existing evidence where it says the thing; add new evidence where it does not (below).
2. New evidence must come from a paper you actually read. Fetch the full text: `PAPER_CACHE=<shared dir> python3 scripts/fetch_paper.py <DOI>` (open-access texts from Europe PMC), then read the passage. Do not rely on memory of what a paper says. If you cannot get the full text, you may use only what is in `research/papers/<note>.md` (already verified), or the abstract, and then `verification` must be `abstract_only`.
3. `location` says where in the paper the claim is supported (section name, figure, table, supplement). `claim` is your own words: paraphrase, never copy sentences. Never reproduce text or figures from any paper or from Reich's book.
4. Confidence per DATA_MODEL.md §6: `high` only if directly shown by sampled ancient genomes in a full-text-verified study with no published contradiction; `medium` for one study, abstract-only checks, model- or proxy-dependent estimates, or inferences from present-day genomes; `low` for hedged or contested claims. An abstract-only claim is never `high`. A population's own `confidence` must not exceed its best evidence (do not change it).
5. Language: no "became/turned into", no "the X people", no invasion/conquest, no purity or race language, no "replaced by" without a proportion. Write "X-related ancestry contributed to Y". Populations are not ethnic groups, nations or languages; do not make language, ethnicity or identity claims. Do not describe movement routes that no source evidences. Do not project present-day countries or identities backward (using a country name as a place label is fine).
6. Show disagreement: if sources disagree, say so and cite both.
7. Show uncertainty: give ranges as published, say "modelled", "estimated", "inferred" where that is what the source did.
8. When in doubt, leave it out. Do not guess a historical or genetic claim. If something looks wrong in the existing curated data (a wrong date, a claim the paper does not support), do not silently fix it: list it in `concerns`.

## Files

Read: `CLAUDE.md`, `DATA_MODEL.md` (§6), `data/curated/populations.json` (your populations), `data/curated/evidence.json`, `data/curated/sources.json`, `data/curated/relationships.json`, `data/curated/admixture_events.json`, `research/populations/<group>.md`, and the matching notes in `research/papers/`.

Write only one file: `data/curated/overviews/<group>.json`. Do not edit any other file.

```json
{
  "group": "<your group key>",
  "evidence": [
    {
      "id": "ev-<source id>-<groupkey><n>",
      "source_id": "<id from sources.json>",
      "claim": "<our words, at least 20 characters>",
      "location": "<section / figure / table>",
      "verification": "full_text",
      "confidence": "high|medium|low",
      "stance": "supports|qualifies|contradicts",
      "note": "<optional>"
    }
  ],
  "populations": {
    "<population id>": {
      "overview": [
        { "heading": "Who they were", "text": "<40-110 words>", "evidence_ids": ["ev-…", "ev-…"] }
      ]
    }
  },
  "concerns": ["<anything in the existing data that looks wrong, with the population id>"]
}
```

New evidence ids: `ev-<source id>-<groupkey><n>` using your group key (given in your task) and a counter, for example `ev-haak2015-st3`. After the source id use only lowercase letters and digits. Never reuse an existing id.

Check your work before finishing: `cd pipeline && uv run python -m curation.merge_overviews --dry-run` (reads only; it reports unknown or duplicate ids). Then re-read every section against the evidence it cites and delete any sentence the evidence does not carry.

## Final message

Report: populations covered, new evidence count, populations deliberately left short and why, papers you could not fetch, and the `concerns` list.
