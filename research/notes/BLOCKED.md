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
