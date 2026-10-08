# Blocked or unverifiable items

Nothing blocks V0.1. These items could not be checked from inside the sandbox; none is needed yet.

| item | what is needed | why blocked | impact |
|---|---|---|---|
| Poseidon Community Archive licence | licence terms per package; the archive's API URL | https://www.poseidon-adna.org/ rendered empty for our fetcher (JS site); GitHub API access is outside this session's scope | none for V0.1 (AADR only) |
| p3k14c data licence | licence of the data files on tDAR/GitHub/Zenodo | GitHub API not accessible; tDAR not checked | Phase 5 candidate only |
| XRONOS data terms | per-record licence | xronos.ch timed out (60 s) | Phase 5 candidate only |
| Bergström et al. 2021 (Nature review), several Science papers | full text | not open access in Europe PMC | abstracts used; claims capped at medium |

## 2026-10-08: mapofus.us (reference site for map smoothness)
- Wanted: https://mapofus.us (owner's suggested reference for how a smooth map is built: rendering technology, tile or vector approach, interaction handling).
- Result: the sandbox's egress proxy refused the connection (curl: CONNECT tunnel failed, 502; WebFetch: ENOTFOUND). Not worked around.
- Needed: either the owner allows the host in the environment's network settings, or sends a screen recording or the library names it uses. (An earlier attempt at mapofus.com reached only a domain-parking page; the owner meant .us.)

## 2026-10-08: methods papers for "From bone to genome" not readable in full
Recorded by the parent session for the research subtask (which could not write this file). None were worked around; the page cites open-access alternatives instead.
- Llamas et al. 2017, *STAR* (ancient DNA guidelines), doi:10.1080/20548923.2016.1258824: not in Europe PMC; publisher returned 403.
- Not open access: Gansauge & Meyer 2013 and Gansauge et al. 2020 (single-stranded libraries), Rohland & Hofreiter 2007 and Rohland et al. 2018 (extraction), all *Nature Protocols*; Sirak et al. 2017 (gentler petrous sampling) and Korlević et al. 2015, *BioTechniques*.
- Carpenter et al. 2013 and Moreno-Mayar et al. 2020: PMC returned a bot check; not retried.
- Orlando et al. 2021 and Skoglund et al. 2013 (*JAS*): not found.
- Effect: what EDTA does chemically is not stated (no readable source says it); gentler petrous sampling is cited only through Harney 2021's introduction; the clean-room chapter rests on individual studies' methods sections, not a guidelines paper.
