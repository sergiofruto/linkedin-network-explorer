import Link from 'next/link'
import { communityColor, communityName } from '@/lib/communities'

const TOP_PAGERANK = [
  { name: 'Francis Pedraza',  pagerank: 2.26, betweenness_rank: 7,  community: 48  },
  { name: 'Matt Franchi',     pagerank: 1.61, betweenness_rank: 22, community: 77  },
  { name: 'Scott Downes',     pagerank: 1.57, betweenness_rank: 18, community: 48  },
  { name: 'Elenah Rosopa',    pagerank: 1.56, betweenness_rank: 11, community: 77  },
  { name: 'Brian W.',         pagerank: 1.51, betweenness_rank: 15, community: 48  },
  { name: 'Britton Ware',     pagerank: 1.43, betweenness_rank: 30, community: 48  },
]

const TOP_BETWEENNESS = [
  { name: 'Madison Wilson',   betweenness: 1999, pagerank_rank: 12, community: 247 },
  { name: 'Zach Hughes',      betweenness: 1884, pagerank_rank: 8,  community: 48  },
  { name: 'Adam Tresidder',   betweenness: 1715, pagerank_rank: 20, community: 247 },
  { name: 'Emma T.',          betweenness: 1554, pagerank_rank: 25, community: 45  },
  { name: 'Shelia Cotten',    betweenness: 984,  pagerank_rank: 40, community: 247 },
  { name: 'Alexander Melamed',betweenness: 685,  pagerank_rank: 35, community: 45  },
]

const COMMUNITIES = [
  {
    id: 247,
    size: 61,
    name: 'Clemson Academia',
    description: 'The largest cluster — Clemson University faculty, researchers, and long-tenured alumni. Produces the top betweenness bridges (Madison Wilson, Adam Tresidder, Shelia Cotten), meaning its members connect the most otherwise-disconnected parts of the network.',
  },
  {
    id: 178,
    size: 57,
    name: 'Clemson Alumni',
    description: 'Second Clemson cluster, skewing toward alumni who moved into industry after graduating. Includes Dr. Will Henderson (#10 PageRank). Slightly less internally dense than Community 247 — members spread across more industries post-Clemson.',
  },
  {
    id: 77,
    size: 27,
    name: 'Engineering & Startups',
    description: 'The tightest cluster by internal density. All 10 top-degree nodes live here — these people have overlapped at the most organizations. Social Slooth appears 31× in the experience data, likely the shared employer anchoring this group.',
  },
  {
    id: 48,
    size: 23,
    name: 'Founder Network',
    description: 'Francis Pedraza\'s orbit. Connected through Invisible Technologies, Ascendancy, Visionary Ventures, Lab.rynth, and related companies. The highest average PageRank of any cluster — well-connected to influential nodes across the entire network.',
  },
  {
    id: 45,
    size: 17,
    name: 'Research & Advisory',
    description: 'A structural bridge cluster sitting between the Clemson backbone and the startup communities. Emma T. (betweenness #4) and Alexander Melamed (betweenness #6) both belong here — suggesting this group actively spans different professional worlds.',
  },
  {
    id: 94,
    size: 6,
    name: 'Intelligence Ops',
    description: 'Small but structurally distinct. Members share a background in government, intelligence, or defense-adjacent roles, separating them from the academic and startup clusters that dominate the rest of the network.',
  },
]

function CommunityDot({ id }: { id: number }) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
      style={{ background: communityColor(id) }}
    />
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4 pb-2 border-b border-white/5">
      {children}
    </h2>
  )
}

export default function AnalysisPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-300">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur border-b border-white/5 px-6 py-3 flex items-center gap-4">
        <Link
          href="/"
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1.5"
        >
          ← Back to graph
        </Link>
        <span className="text-white/10">|</span>
        <span className="text-xs text-gray-600">Network Analysis</span>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10 sm:space-y-14">

        {/* Hero */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Key Findings</p>
          <h1 className="text-2xl font-semibold text-white mb-3">
            248 LinkedIn connections, mapped and measured
          </h1>
          <p className="text-gray-400 leading-relaxed">
            248 LinkedIn connections, modeled as a graph. Two people share an edge if they have a
            past employer or school in common — the edge weight is how many organizations they{"'"}ve
            both been part of. One shared org is a weak tie. Two or more means real overlap.
          </p>
          <p className="text-gray-400 leading-relaxed mt-3">
            A few things stand out once you measure it: the most influential person in the network
            is not its most critical bridge. Two Clemson clusters account for nearly half the nodes.
            And a 17-person community produces more structural connectors than communities three
            times its size.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { value: '248', label: 'People', sub: 'LinkedIn connections', color: 'text-indigo-400', bg: 'bg-indigo-500/8' },
            { value: '7,163', label: 'Edges', sub: 'shared-org links', color: 'text-emerald-400', bg: 'bg-emerald-500/8' },
            { value: '79%', label: 'Connected', sub: '195 in main cluster', color: 'text-amber-400', bg: 'bg-amber-500/8' },
            { value: '57', label: 'Communities', sub: 'Louvain clusters', color: 'text-violet-400', bg: 'bg-violet-500/8' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-gray-300 mt-0.5">{s.label}</p>
              <p className="text-[11px] text-gray-600 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* The data */}
        <div>
          <SectionHeader>The data</SectionHeader>
          <div className="space-y-3 text-sm text-gray-400 leading-relaxed">
            <p>
              The input is a JSON file — 248 records, one per person. Each record has a name,
              current title, current company, location, and full work and education history:
              every employer, every school, with titles and dates. No explicit connections —
              just raw career data.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 mb-1">
              {[
                { v: '248', l: 'people' },
                { v: '1,069', l: 'unique companies' },
                { v: '293', l: 'unique schools' },
                { v: '51', l: 'components' },
              ].map(s => (
                <div key={s.l} className="bg-white/3 rounded-lg p-3 text-center">
                  <p className="text-lg font-semibold text-gray-200">{s.v}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
            <p>
              The single most important structural fact:{' '}
              <strong className="text-gray-300">50% of the network attended Clemson University</strong>.
              This one institution generates the majority of edges and explains why the two largest
              communities are both Clemson-anchored.
            </p>
          </div>
        </div>

        {/* Processing pipeline */}
        <div>
          <SectionHeader>Processing pipeline</SectionHeader>
          <div className="space-y-5 text-sm text-gray-400 leading-relaxed">
            <div>
              <p className="text-gray-300 font-medium mb-1.5">1 — Ingestion</p>
              <p>
                The JSON was loaded into Neo4j as a property graph — Person nodes, Company nodes,
                School nodes, with <code className="text-gray-300 text-xs bg-white/5 px-1 py-0.5 rounded">WORKED_AT</code> and{' '}
                <code className="text-gray-300 text-xs bg-white/5 px-1 py-0.5 rounded">STUDIED_AT</code> relationships
                carrying dates and titles. The raw structure is preserved without losing any of the
                original data.
              </p>
            </div>
            <div>
              <p className="text-gray-300 font-medium mb-1.5">2 — Edge derivation</p>
              <p>
                There are no explicit connections in the dataset. A Cypher query finds pairs of
                people who share an organization and creates a{' '}
                <code className="text-gray-300 text-xs bg-white/5 px-1 py-0.5 rounded">KNOWS</code> edge between them,
                weighted by how many organizations they have in common. One shared org is a weak
                tie. Two or more means real overlap. That produced{' '}
                <strong className="text-gray-300">7,163 edges</strong>.
              </p>
              <p className="mt-2">
                The weight threshold matters. At weight ≥ 1, Clemson dominates everything — most
                connections mean nothing more than both attending the same 30,000-student university.
                Filtering to weight ≥ 2 surfaces relationships where people actually overlapped at
                multiple points in their careers.
              </p>
            </div>
            <div>
              <p className="text-gray-300 font-medium mb-1.5">3 — Analysis</p>
              <p>
                Four Graph Data Science algorithms in Neo4j: Weakly Connected Components to find
                isolated clusters, PageRank for influence, Betweenness Centrality for structural
                importance, and Louvain for community detection. Those computed values get written
                back as node properties and drive everything in the visualization.
              </p>
            </div>
          </div>
        </div>

        {/* Connectivity */}
        <div>
          <SectionHeader>How connected is this network?</SectionHeader>
          <p className="text-sm text-gray-400 leading-relaxed mb-5">
            Moderately connected with a strong core, but fragmented at the edges. 195 of 248 people
            (79%) are all reachable from each other — you can trace a path between any two of them
            through shared employers or schools. The remaining 53 are isolated: pairs or singletons
            with no connection to that main cluster.
          </p>

          {/* Insight callout */}
          <div className="bg-amber-500/8 border border-amber-500/15 rounded-xl p-4 mb-6 text-sm">
            <p className="text-amber-300 font-medium mb-1">Influence ≠ Structural importance</p>
            <p className="text-gray-400 leading-relaxed">
              Francis Pedraza ranks <strong className="text-gray-300">#1 by PageRank</strong> — the
              most influential node in the network. But he ranks only{' '}
              <strong className="text-gray-300">#7 by Betweenness Centrality</strong>. This means he
              is the most <em>connected to other influential people</em>, but Madison Wilson and Zach
              Hughes are harder to replace for keeping the network together. Removing either of them
              would disconnect more paths than removing Francis.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* PageRank table */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Top Connectors — PageRank</p>
              <div className="space-y-2">
                {TOP_PAGERANK.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3 text-sm">
                    <span className="text-gray-600 w-4 text-right shrink-0">{i + 1}</span>
                    <CommunityDot id={p.community} />
                    <span className="text-gray-300 flex-1 truncate">{p.name}</span>
                    <span className="text-indigo-400 font-mono text-xs">{p.pagerank.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Betweenness table */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Key Bridges — Betweenness</p>
              <div className="space-y-2">
                {TOP_BETWEENNESS.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3 text-sm">
                    <span className="text-gray-600 w-4 text-right shrink-0">{i + 1}</span>
                    <CommunityDot id={p.community} />
                    <span className="text-gray-300 flex-1 truncate">{p.name}</span>
                    <span className="text-amber-400 font-mono text-xs">{p.betweenness.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Communities */}
        <div>
          <SectionHeader>Community structure</SectionHeader>
          <p className="text-sm text-gray-400 leading-relaxed mb-6">
            Louvain community detection found 57 clusters (modularity = 0.10). The six largest and
            most structurally interesting are named below. The remaining 51 communities are pairs or
            singletons — isolated groups with no shared-org path to the main network.
          </p>
          <div className="space-y-4">
            {COMMUNITIES.map(c => (
              <div key={c.id} className="bg-white/3 rounded-xl p-4">
                <div className="flex items-center gap-2.5 mb-2">
                  <CommunityDot id={c.id} />
                  <span className="text-sm font-medium text-gray-200">{communityName(c.id)}</span>
                  <span className="text-xs text-gray-600 ml-auto">{c.size} people</span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{c.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Limitations */}
        <div>
          <SectionHeader>Assumptions &amp; limitations</SectionHeader>
          <div className="space-y-3 text-sm text-gray-400 leading-relaxed">
            <p>
              <strong className="text-gray-300">Connections are inferred, not observed.</strong> Two
              people sharing an employer does not mean they worked together or have ever met. The
              graph models potential overlap, not verified relationships.
            </p>
            <p>
              <strong className="text-gray-300">Clemson dominates the edge distribution.</strong> With
              127 people sharing one institution, Clemson generates the majority of weight-1 edges and
              inflates connectivity metrics. The structure you see is partly a reflection of this
              concentration, not purely organic relationship density.
            </p>
            <p>
              <strong className="text-gray-300">Data completeness is partial.</strong> 73% of people
              have first/last name fields; 16 have no education data; 2 have no experience data.
              These gaps affect edge coverage at the margins and may cause some people to appear less
              connected than they actually are.
            </p>
            <p>
              <strong className="text-gray-300">Louvain is non-deterministic.</strong> Community IDs
              may shift between runs — community membership and sizes are stable, but the numeric
              identifiers are arbitrary. The named communities were labeled by analyzing the most
              common job titles and institutions within each cluster.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-600">
          <span>Analyzed with Neo4j Graph Data Science · Louvain · PageRank · Betweenness</span>
          <Link href="/" className="hover:text-gray-400 transition-colors">
            ← Back to graph
          </Link>
        </div>

      </div>
    </div>
  )
}
