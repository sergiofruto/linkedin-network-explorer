import { NextResponse } from 'next/server'
import { runQuery } from '@/lib/neo4j'
import type { NetworkMetrics } from '@/lib/types'

export async function GET() {
  try {
    const [counts] = await runQuery<{ node_count: number; edge_count: number }>(`
      MATCH (p:Person)
      WITH count(p) AS node_count
      MATCH ()-[k:KNOWS]->()
      RETURN node_count, count(k) AS edge_count
    `)

    const [stats] = await runQuery<{ communities: number; components: number }>(`
      MATCH (p:Person)
      RETURN
        count(DISTINCT p.community_id) AS communities,
        count(DISTINCT p.component_id) AS components
    `)

    const top_pagerank = await runQuery<{ id: string; name: string; pagerank: number }>(`
      MATCH (p:Person)
      RETURN p.id AS id, p.full_name AS name, coalesce(p.pagerank, 0.0) AS pagerank
      ORDER BY pagerank DESC LIMIT 10
    `)

    const top_betweenness = await runQuery<{ id: string; name: string; betweenness: number }>(`
      MATCH (p:Person)
      WITH p.component_id AS cid, count(*) AS size
      ORDER BY size DESC LIMIT 1
      MATCH (p:Person) WHERE p.component_id = cid
      RETURN p.id AS id, p.full_name AS name, coalesce(p.betweenness, 0.0) AS betweenness
      ORDER BY betweenness DESC LIMIT 10
    `)

    const density =
      counts.node_count > 1
        ? (2 * counts.edge_count) / (counts.node_count * (counts.node_count - 1))
        : 0

    const metrics: NetworkMetrics = {
      node_count: counts.node_count,
      edge_count: counts.edge_count,
      density: Math.round(density * 1000) / 1000,
      communities: stats.communities,
      components: stats.components,
      top_pagerank,
      top_betweenness,
    }

    return NextResponse.json(metrics)
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
