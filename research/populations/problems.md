## Problems with this population list

Kept by hand; read before trusting any row above.

### Naming inconsistencies
- **One ancestry, several names.** WHG ≡ Oberkassel cluster (Posth 2023), which overlaps with the later part of the Villabruna cluster (Fu 2016). EHG ≡ Sidelkino cluster. ANE is named after Mal'ta but also includes Afontova Gora. We use the most widely used label and list the others as aliases with who uses them.
- **Labels mix kinds of names.** AADR Group IDs combine modern country, site, archaeological period and culture (`Russia_Samara_EBA_Yamnaya`). Cultural tokens are sometimes absent: Iberian Beaker-associated individuals are labelled `Spain_C`, so Beaker association cannot be recovered from labels.
- **Labels can carry anachronisms.** `Belize_11700BP_Archaic_Maya` names a much later identity. We never surface such labels as population names; they stay as raw data on the sample card.
- **Numbered and outlier suffixes** (`-1`, `BA1-1`, `-oSteppe`, `-oEastAsia`, `-Dup`) are curation markers, not populations. The default membership rule excludes outliers and duplicates. One population (`iberia-chalcolithic-steppe-related`) deliberately uses an outlier label because the outliers are the point.

### Overlapping or nested definitions
- **Clines are not clusters.** The Volga, Dnipro and CLV clines (Lazaridis 2025) are gradients. Our populations take sites near one end (Berezhnovka for CLV, Khvalynsk/Ekaterinovka for Volga), so members are genetically heterogeneous.
- **Region-and-period groupings.** `geographic_population` entries (Iberian Bronze Age, southern British LBA–IA, Central Andes, West Liao River, Iron Age Taiwan, Early Holocene Central and South America, post-Lapita Vanuatu) are not genetic clusters. They are shown with a distinct category badge, and their ancestry composition is given only where a model exists.
- **Inferred-only populations** (shared non-African ancestors, Basal Eurasian, AASI, ASI, ANI, the founding population of Native Americans, ancestors of Australo-Papuans, the Bismarck-related source) have no sampled members. Their time ranges are display windows, not lifespans, and they are never drawn as map fields.
- **Single individuals as populations** (Ust'-Ishim, Oase 1, Tianyuan, Anzick-1, Mota, the Rakhigarhi IVC genome) stand in for unsampled groups. They are always badged *sparse* and described as individuals.

### Culture-vs-genetics conflation risks
- 26 populations are `archaeological_population` (defined by burial context: Yamnaya, Corded Ware, Bell Beaker, LBK, Jōmon, …). Their names use "-associated" to avoid implying that a pot style is a people. Where genetics and culture diverge, the list says so: Gravettian → two clusters; Beaker → different ancestry in Iberia vs central Europe vs Britain; Pastoral Neolithic traditions → no genetic difference.
- **Language labels** appear only as associations ("associated with the spread of Bantu languages"). Our population is defined genetically, never by language.
- **Historical-polity groupings** (Xiongnu-period, Mongol-period, medieval Swahili coast) are date-and-place groupings. They do not imply a single ethnic identity.

### Regions and periods with too few samples
- Before 15,000 BCE: about 150 individuals worldwide in AADR v66.p1. Most populations in this range have 1–11 members.
- **South Asia:** one IVC-context genome. The 11 Indus Periphery outliers are not separately labelled in AADR v66.p1 (membership incomplete).
- **Sub-Saharan Africa:** fewer than 300 ancient individuals in total, very unevenly spread (Kenya/Tanzania, Malawi, South Africa, Cameroon).
- **Australia and New Guinea:** only a handful of late (<1,500 years) individuals. No curated population yet.
- **The Americas before 8,000 years ago:** about 30 individuals.
- **Southeast Asia before 4,000 years ago:** 2 Hòabìnhian-associated individuals.
- **Europe after 8,000 years ago is heavily oversampled** relative to everywhere else. The map's density layer must make this visible.

### Contested or model-dependent claims carried in the list
See `data/curated/disagreements.json`: Neandertal admixture date and proportion, Yamnaya formation (5 published models), Iranian-related ancestry in South Asia, Goyet Gravettian assignment, timing of entry into the Americas, "Population Y", Levant-related ancestry in eastern Africa, and the tempo of Papuan-related arrival in Vanuatu.

### Not included (deliberately or not yet)
- **Polynesian settlement sequence** (Ioannidis 2021): evidence is from present-day genomes; deferred to Phase 9 (modern populations).
- **Present-day populations** of any kind: Phase 9.
- **Medieval and historical Europe** (Avars, Vikings, Anglo-Saxons, …): abundant in AADR but outside the scope of the checked literature so far. These individuals appear on the map unassigned.
- **CLV-cline sites beyond Berezhnovka; the Indus Periphery individuals:** need individual-ID lists from the papers' supplements.
- **Usatove-associated individuals** (Nikitin 2025) and **Steppe Maikop** (Wang 2019): checked claims exist, but their membership needs care. Proposed for V0.2.
