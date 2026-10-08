# Writing style for population pages

Adopted 2026-10-08 after the owner judged the first population texts "poor". This guide applies to every population `description`, `overview` section and `caveats` entry, and to anything else a reader sees as prose. The scientific rules in `CLAUDE.md` and the evidence rules in `overview-brief.md` still apply in full. This guide is about how the text reads.

## The baseline

The owner named David Reich's *Who We Are and How We Got Here* as the register to aim for. **We take the register, never the text.** Do not quote, closely paraphrase or borrow distinctive phrasing from the book or from any paper. What we take from it:

- **It tells you why a population matters before it tells you anything else.** A reader learns early what puzzle the population solves, or what it changed.
- **It explains how the evidence works, in plain terms.** "Neandertal DNA comes in stretches that get shorter every generation, so their length is a clock" is worth more than a list of dates.
- **Numbers carry a point.** A figure appears because it changes the picture, and it is translated: "about a fifth more", "roughly one-fiftieth of the genome".
- **Sentences are complete and connected.** One idea leads to the next ("so", "but", "which means"). There are no fragments, and facts are not just stacked side by side.
- **Confidence is precise.** The text is firm where the evidence is firm. The hedge sits exactly where the doubt is: one clause, said once, naming who disagrees and on what.
- **It is concrete.** Name the site, the burial and the individual. "A man who lived at Ust'-Ishim in western Siberia" beats "an early modern human".
- **Terms are defined once, in passing,** the first time they appear. After that they are used without fuss.

## How a population page is built

The panel shows these parts in order:

1. badges and a one-line category explanation (generated; leave them alone);
2. the dates and region;
3. the **description**;
4. the **overview** sections;
5. admixture models with proportion bars;
6. connections to other populations;
7. **caveats**;
8. further reading.

Each part has its own job, and **no fact appears twice on the page.**

| Part | Job | Length |
|---|---|---|
| `description` | The hook. What this population is, and why a reader should care, in one or two sentences. Do not open with "A modelled population" or "This is" (the badges already say inferred or sampled). | 20–45 words |
| Who they were | What kind of grouping this is (sampled individuals, a cluster, a ghost population, an archaeological culture's burials), and what is distinctive about the people or the evidence. | 50–110 words |
| When and where | Dates and places that matter, and how they were established. Say plainly where sampling is thin. | 50–110 words |
| Ancestry | What their DNA shows and how researchers can tell. Give the headline proportion, not every model: the panel lists every model below. | 50–110 words |
| What came before and after | The thread through time: which earlier ancestry they carried, and where their ancestry turns up later. | 50–110 words |
| What we cannot tell | The real open questions: who disagrees and why, and what would settle it. It must not repeat dates or numbers given above. | 40–100 words |
| `caveats` | Short notes about how the page displays the data (display window, membership rule, sampling bias). They are not the science's open questions; those belong in the section above. | one sentence each |

Sections are optional. Merge or drop one rather than pad or repeat. Two strong sections beat five thin ones.

## Rules of thumb

- **Open each section with its point,** not with a definition or a date.
- **One number per idea.** If three studies give three estimates, give the range they span and say what drives the difference. The admixture block below shows each model's figures.
- **Dates:**
  - Write ranges old to young: "between about 50,500 and 43,500 years ago", or "3300–2600 BCE".
  - Use an en dash (–) between numbers, never a hyphen.
  - For the Ice Age and earlier (older than about 12,000 years), say "years ago" as the studies do.
  - For later periods use BCE/CE, as the timeline does.
  - Never convert a published figure from one system to the other in prose, and never mix the two in one sentence.
- **Codes and labels:** a Y-chromosome or mitochondrial lineage code (R-M269) or a model label (Central_Steppe_MLBA) appears only if the sentence says what it shows. Otherwise leave it out.
- **Plain words first:** "mixing" or "interbreeding" before "admixture"; "a population no one has sampled, known from its descendants' DNA" before "ghost population". Then use the term.
- **People and sites:** name the people and sites the evidence names. Prefer "individuals buried at X" or "people associated with Y" to bare labels. Never write "the X people" (validator rule).
- **No notes to ourselves in prose:** "display window", "panel", "proxy" or "stands in as a model" only appear when they explain something the reader needs, and then in plain words.
- **No filler:** "It is important to note", "Interestingly", "plays a key role", "rich history". If a sentence would still be true of any population, cut it.
- **Present tense for findings** ("the study finds"). **Past tense for what happened** ("they buried their dead under mounds").

## The evidence line

Every sentence must be carried by evidence the section cites. The writer works from the population's dossier (`cd pipeline && uv run python -m curation.prose_dossier <id>`).

- Rewriting is not researching. Do not add a fact that no cited evidence states, however well known it is. Definitions of general terms (what a kurgan or a genome is) and simple arithmetic on cited figures are fine.
- Evidence already in `evidence.json`, such as a statement used by one of the population's relationships, may be cited. The apply script adds it to the population's `evidence_ids`.
- Something that would make the story better but is not in the evidence goes in the draft's `wanted` list, not into the text.

## Example: the user's own example

**Before** (description, then the first section):

> A modelled population: the common ancestors of nearly all present-day people whose ancestry lies largely outside Africa, who received Neandertal gene flow before dispersing. No individual from it has been sampled and its location is unknown.
>
> **Who they were.** This is a modelled population, not a sampled one: the shared ancestors of nearly all present-day people whose ancestry lies largely outside Africa. They received Neandertal gene flow before dispersing. No individual from it has been sampled and its location is unknown. The dates on the timeline show the window of the shared gene flow, not how long the population lived.

What goes wrong:

- the description and the section say the same thing;
- the reader never learns how anyone knows this;
- jargon ("gene flow") is left unexplained;
- a display note sits in the middle of the science.

**After:** `data/curated/prose/` holds the rewrite and `research/notes/prose-drafts/` keeps it once it is applied. It opens:

> The population that met and interbred with Neandertals, and whose descendants include nearly everyone alive today with ancestry from outside Africa. No one from it has been sampled; it is reconstructed from the DNA its descendants still carry.

## Process

1. Draft per region group into `data/curated/prose/<group>.json`, in the format documented in `pipeline/curation/apply_prose.py`.
2. A second reader checks every sentence against the evidence it cites and returns a list of unsupported or distorted sentences. The writer fixes them.
3. `cd pipeline && uv run python -m curation.apply_prose` checks and applies the drafts, then archives them. Run `python -m build` afterwards.
4. The owner reviews the result for taste and historical claims.
