# LinkedIn Network Explorer

An interactive graph visualization of a personal LinkedIn network — 248 connections mapped, analyzed, and made explorable.

Built with Next.js, Neo4j Graph Data Science, and D3.js as part of the Ascendancy Challenge.

---

## What it does

- **Force Graph** — interactive network where node size = PageRank influence, color = community cluster
- **Chord & Arc diagrams** — alternative views of community relationships
- **Community detection** — 57 Louvain clusters; 6 named based on member profiles (Clemson Academia, Founder Network, etc.)
- **PageRank + Betweenness Centrality** — surfaces the most influential and structurally critical people
- **Ego network toggle** — filter the graph to any person's direct connections
- **Search** — find anyone by name
- **Shareable links** — `?node=<id>` deep links to any person's profile
- **Key Findings page** — narrative analysis of what the data reveals

---

## Tech stack

| Layer | Tech | Version |
|---|---|---|
| Frontend | Next.js (App Router), React, TypeScript | 16.2, 19.0, 5.x |
| Styling | Tailwind CSS | 4.x |
| Visualization | D3.js (force simulation, chord, arc) | 7.9 |
| Graph DB driver | neo4j-driver (Node.js) | 6.1 |
| Graph DB | Neo4j + Graph Data Science (local) | 5.26 |
| Graph DB (cloud) | Neo4j Aura Free | — |
| Data scripts | Python | 3.11 |
| Deployment | Vercel | — |
| Auth | Next.js Middleware + httpOnly cookie | — |

---

## Local development

### Prerequisites

- Node.js 20+
- Docker (for local Neo4j)
- Python 3.11+ (for data loading scripts)

### 1. Start Neo4j

```bash
docker compose up -d
```

Neo4j runs at `http://localhost:7474` (user: `neo4j`, password: `password`).

### 2. Load and analyze the data

```bash
cd scripts
pip install -r requirements.txt

python load_data.py      # load Person nodes + KNOWS edges from x-connections.json
python analyze.py        # run GDS: PageRank, Betweenness, Louvain, WCC
```

> `x-connections.json` is the enriched LinkedIn export. It's gitignored — you'll need your own data file.

### 3. Run the web app

```bash
cd web
cp .env.local.example .env.local   # then fill in Neo4j credentials
npm install
npm run dev
```

App runs at `http://localhost:3000`.

#### `web/.env.local`

```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
# SITE_PASSWORD=optional  # set to enable password protection
```

---

## Deployment

The app is deployed on Vercel connected to Neo4j Aura Free.

Since Aura Free doesn't include GDS, all computed properties (PageRank, Betweenness, community IDs) are copied from the local instance using the seed script:

```bash
# Set target Aura credentials in .env, then:
python scripts/seed_aura.py
```

Then deploy:

```bash
cd web
vercel --prod
```

Set these env vars in Vercel:

| Variable | Description |
|---|---|
| `NEO4J_URI` | Aura connection URI (`neo4j+s://...`) |
| `NEO4J_USER` | Aura username |
| `NEO4J_PASSWORD` | Aura password |
| `SITE_PASSWORD` | Optional password gate for the deployed app |

---

## Project structure

```
├── docker-compose.yml       # Local Neo4j with GDS plugin
├── FINDINGS.md              # Full analysis write-up
├── scripts/
│   ├── load_data.py         # Loads LinkedIn data into Neo4j
│   ├── analyze.py           # Runs GDS algorithms
│   ├── seed_aura.py         # Copies computed graph to Aura
│   └── explore.py           # Ad-hoc Cypher exploration
└── web/
    ├── app/
    │   ├── page.tsx             # Dashboard (main view)
    │   ├── analysis/page.tsx    # Key Findings narrative page
    │   ├── login/page.tsx       # Password gate
    │   ├── api/graph/           # Graph nodes + edges
    │   ├── api/metrics/         # Network health stats
    │   └── api/node/[id]/       # Individual node profile
    ├── components/
    │   ├── ForceGraph.tsx        # D3 force simulation
    │   ├── Dashboard.tsx         # Layout + state
    │   ├── NodePanel.tsx         # Right sidebar profile
    │   ├── MetricsSidebar.tsx    # Left sidebar stats
    │   ├── CommunityLegend.tsx   # Color key overlay
    │   └── SearchBox.tsx         # Name search
    ├── lib/
    │   ├── communities.ts        # Community colors + names (single source of truth)
    │   ├── neo4j.ts              # DB driver
    │   └── types.ts              # Shared TypeScript types
    └── middleware.ts             # Password protection (Edge)
```

---

## Key findings

See [FINDINGS.md](./FINDINGS.md) for the full analysis, or visit `/analysis` in the deployed app.

### Connectivity
- **248 people**, **7,163 KNOWS edges** derived from shared employers and schools
- **51 connected components** — 195/248 people (79%) belong to one giant component; the remaining 53 are isolated pairs or singletons
- **50% of the network attended Clemson University**, making it the dominant edge-generating institution

### Most influential connectors (PageRank)
| Rank | Name | PageRank |
|---|---|---|
| 1 | Francis Pedraza | 2.26 |
| 2 | Matt Franchi | 1.61 |
| 3 | Scott Downes | 1.57 |
| 4 | Elenah Rosopa | 1.56 |
| 5 | Brian W. | 1.51 |

### Key structural bridges (Betweenness Centrality, main component)
| Rank | Name | Betweenness |
|---|---|---|
| 1 | Madison Wilson | 1,999 |
| 2 | Zach Hughes | 1,884 |
| 3 | Adam Tresidder | 1,715 |
| 4 | Emma T. | 1,554 |
| 5 | Shelia Cotten | 984 |

### Notable insight
**Influence ≠ structural importance.** Francis Pedraza ranks #1 by PageRank but #7 by Betweenness — he is the most connected to other influential people, but Madison Wilson and Zach Hughes are harder to replace for network cohesion. Removing either would disconnect more paths than removing Francis.

### Community structure
Louvain detected **57 communities** (modularity = 0.10). The 6 largest named clusters:

| Community | Size | Character |
|---|---|---|
| Clemson Academia | 61 | Top betweenness bridges live here |
| Clemson Alumni | 57 | Alumni spread across industries post-Clemson |
| Engineering & Startups | 27 | Highest internal density; all top-10 degree nodes |
| Founder Network | 23 | Francis Pedraza's orbit; highest avg PageRank |
| Research & Advisory | 17 | Structural bridge between Clemson and startups |
| Intelligence Ops | 6 | Government/defense-adjacent, structurally isolated |
