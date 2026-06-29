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

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4 |
| Visualization | D3.js v7 (force simulation, chord, arc) |
| Graph DB | Neo4j + Graph Data Science (local), Neo4j Aura Free (production) |
| Deployment | Vercel |
| Auth | Next.js Middleware + httpOnly cookie |

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

See [FINDINGS.md](./FINDINGS.md) for the full analysis, or visit `/analysis` in the app.

Short version: 79% of the network belongs to one giant component, 50% attended Clemson University, and **influence ≠ structural importance** — the most influential person (Francis Pedraza, #1 PageRank) is not the most critical bridge (Madison Wilson, #1 Betweenness).
