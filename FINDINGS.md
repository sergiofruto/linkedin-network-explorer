# Network Analysis Findings

Personal LinkedIn network of ~248 connections, analyzed using Neo4j + Graph Data Science.

---

## The Data

The dataset comes from a LinkedIn connection enrichment tool. Each record contains a person's work history, education, and LinkedIn metadata. Connections between people are **implicit** — two people are linked if they share a past employer or school, weighted by how many organizations they have in common.

- **248 people** · **1,069 unique companies** · **293 unique schools**
- **7,163 KNOWS edges** derived from shared organizations
- **50% of the network attended Clemson University** — the dominant structural fact of this dataset

---

## Question 1: How well-connected is this network?

### Short answer: moderately connected with a strong core, but fragmented at the edges.

**Connected components (WCC):**
- **51 components** — the network is not fully connected
- **195/248 people (79%) belong to one giant component** — there is a dominant core
- The remaining 53 people are in pairs or singletons with no path to the main group

**Density:**
- Raw density counting all shared-org pairs: **~0.27** — misleadingly high, driven by Clemson alumni overlap
- Density at weight ≥ 2 (meaningful ties, 2+ shared orgs): **0.74%** — sparse but coherent

**Degree (weighted connections per person):**
- Top node: Elenah Rosopa with degree 146
- The top 10 most connected people all belong to the same community (community 77)

**Key connectors by PageRank** (most influential nodes, accounting for who they're connected to):

| Name | PageRank | Community |
|---|---|---|
| Francis Pedraza | 2.26 | 48 |
| Matt Franchi | 1.61 | 77 |
| Scott Downes | 1.57 | 48 |
| Elenah Rosopa | 1.56 | 77 |
| Brian W. | 1.51 | 48 |

**Key bridges by Betweenness Centrality** (nodes whose removal would most disconnect the network):

| Name | Betweenness | Community |
|---|---|---|
| Madison Wilson | 1999 | 247 |
| Zach Hughes | 1884 | 48 |
| Adam Tresidder | 1715 | 247 |
| Emma T. | 1554 | 45 |
| Shelia Cotten | 984 | 247 |

> **Notable:** Francis Pedraza ranks #1 by PageRank but #7 by Betweenness. He is the most *influential* node but not the most critical structural bridge — Madison Wilson and Zach Hughes are harder to replace for network cohesion.

---

## Question 2: What communities does this network consist of?

### Short answer: 57 communities dominated by two large Clemson-anchored clusters and one startup cluster.

**Louvain community detection:** 57 communities, modularity = 0.10

| Community | Size | Character |
|---|---|---|
| 247 | 61 | Large Clemson cluster — produces the top betweenness bridges |
| 178 | 57 | Large Clemson cluster — includes Dr. Will Henderson (#10 PageRank) |
| 77 | 27 | Dense startup/tech cluster — top 10 by degree all live here |
| 48 | 23 | Startup cluster — Francis Pedraza and his co-founder network |
| 45 | 17 | Mid-size cluster — produces key bridges (Emma T., Alexander Melamed) |
| 94 | 6 | Small cluster |
| 172 | 4 | Small cluster |
| 39 others | 1–2 | Pairs and singletons |

### Community profiles

**Communities 247 & 178 — The Clemson Backbone**
The two largest communities are both Clemson University alumni networks. With 125/248 people having attended Clemson, the university acts as the main edge-generating engine. These communities are large but relatively loosely connected internally (moderate degree scores), which explains why they produce the top betweenness nodes — their members bridge to many different sub-groups.

**Community 77 — The Dense Insider Group**
27 people, but all 10 top-degree nodes live here. This is a tight cluster of people who have overlapped at multiple organizations — likely a Clemson research lab or student group combined with a shared company (Social Slooth appears 31 times in the experience data). High internal connectivity, moderate external bridges.

**Community 48 — The Founder Network**
Francis Pedraza's cluster. 23 people connected through his orbit of companies: Invisible Technologies, Ascendancy, Visionary Ventures, Lab.rynth, and others. The highest PageRank cluster — well-connected to influential nodes outside itself.

**Community 45 — The Bridge Cluster**
17 people who sit structurally between the main groups. Emma T. (BC=1554) and Alexander Melamed (BC=685) suggest this cluster serves as a connector between the Clemson backbone and the startup communities.

---

## Assumptions and Limitations

- **Connections are implicit.** We infer relationships from shared employers and schools — two people may have never actually met even if they both worked at Clemson University for overlapping periods.

- **Clemson dominates.** With 127 people sharing one institution, Clemson generates the majority of weight-1 edges and inflates connectivity metrics. The weight ≥ 2 filter mitigates this but doesn't eliminate it.

- **Data completeness.** 73% of people have first/last name fields; 16 have no education data; 2 have no experience data. These gaps affect edge coverage at the margins.

- **Louvain is non-deterministic.** Community IDs may shift between runs; community sizes and membership are stable, but the numeric IDs are arbitrary.

- **This is a personal network, not a professional graph.** The owner's own connections shape everything — communities reflect their social context (Clemson alumni, startup founders), not an objective industry map.

---

## Suggested Next Steps

- **Label communities** by inspecting the most common current employer/industry within each cluster
- **Temporal analysis** — experience `start_date`/`end_date` data exists and could reveal how the network evolved over time
- **Enrich isolated nodes** — 53 people in satellite components could be re-connected with additional data sources
- **Ego network analysis** — drill into Francis Pedraza's immediate neighborhood to map the founder cluster in detail
