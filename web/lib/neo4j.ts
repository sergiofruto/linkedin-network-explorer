import neo4j from 'neo4j-driver'
import type { PersonNode, GraphLink, NetworkMetrics, NodeProfile } from './types'

const driver = neo4j.driver(
  process.env.NEO4J_URI ?? 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER ?? 'neo4j',
    process.env.NEO4J_PASSWORD ?? 'password'
  ),
  { disableLosslessIntegers: true }
)

async function runQuery<T>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const session = driver.session()
  try {
    const result = await session.run(cypher, params)
    return result.records.map(r => r.toObject() as T)
  } finally {
    await session.close()
  }
}

export async function fetchGraph(): Promise<{ nodes: PersonNode[]; links: GraphLink[] }> {
  const [nodes, links] = await Promise.all([
    runQuery<PersonNode>(`
      MATCH (p:Person)
      RETURN
        p.id AS id,
        p.full_name AS name,
        p.current_title AS title,
        p.community_id AS community_id,
        coalesce(p.pagerank, 0.0) AS pagerank,
        coalesce(p.degree, 0.0) AS degree
    `),
    runQuery<GraphLink>(`
      MATCH (a:Person)-[k:KNOWS]->(b:Person)
      RETURN a.id AS source, b.id AS target, k.weight AS weight
    `),
  ])
  return { nodes, links }
}

export async function fetchMetrics(): Promise<NetworkMetrics> {
  const [
    [counts],
    [stats],
    top_pagerank,
    top_betweenness,
  ] = await Promise.all([
    runQuery<{ node_count: number; edge_count: number }>(`
      MATCH (p:Person)
      WITH count(p) AS node_count
      MATCH ()-[k:KNOWS]->()
      RETURN node_count, count(k) AS edge_count
    `),
    runQuery<{ communities: number; components: number }>(`
      MATCH (p:Person)
      RETURN
        count(DISTINCT p.community_id) AS communities,
        count(DISTINCT p.component_id) AS components
    `),
    runQuery<{ id: string; name: string; pagerank: number }>(`
      MATCH (p:Person)
      RETURN p.id AS id, p.full_name AS name, coalesce(p.pagerank, 0.0) AS pagerank
      ORDER BY pagerank DESC LIMIT 10
    `),
    runQuery<{ id: string; name: string; betweenness: number }>(`
      MATCH (p:Person)
      WITH p.component_id AS cid, count(*) AS size
      ORDER BY size DESC LIMIT 1
      MATCH (p:Person) WHERE p.component_id = cid
      RETURN p.id AS id, p.full_name AS name, coalesce(p.betweenness, 0.0) AS betweenness
      ORDER BY betweenness DESC LIMIT 10
    `),
  ])

  const density =
    counts.node_count > 1
      ? (2 * counts.edge_count) / (counts.node_count * (counts.node_count - 1))
      : 0

  return {
    node_count: counts.node_count,
    edge_count: counts.edge_count,
    density: Math.round(density * 1000) / 1000,
    communities: stats.communities,
    components: stats.components,
    top_pagerank,
    top_betweenness,
  }
}

export async function fetchNodeProfile(id: string): Promise<NodeProfile | null> {
  const [node] = await runQuery<Omit<NodeProfile, 'top_connections'>>(`
    MATCH (p:Person {id: $id})
    CALL {
      WITH p
      MATCH (hr:Person) WHERE hr.pagerank > p.pagerank
      RETURN count(hr) + 1 AS pagerank_rank
    }
    CALL {
      WITH p
      MATCH (hb:Person) WHERE hb.betweenness > p.betweenness AND hb.component_id = p.component_id
      RETURN count(hb) + 1 AS betweenness_rank
    }
    CALL {
      WITH p
      MATCH (c:Person) WHERE c.community_id = p.community_id
      RETURN count(c) AS community_size
    }
    RETURN
      p.full_name AS full_name,
      p.current_title AS title,
      p.current_company AS company,
      p.linkedin_url AS linkedin_url,
      p.current_location AS location,
      p.community_id AS community_id,
      coalesce(p.pagerank, 0.0) AS pagerank,
      coalesce(p.betweenness, 0.0) AS betweenness,
      coalesce(p.degree, 0) AS degree,
      pagerank_rank,
      betweenness_rank,
      community_size
  `, { id })

  if (!node) return null

  const top_connections = await runQuery<{ id: string; name: string; weight: number }>(`
    MATCH (p:Person {id: $id})-[k:KNOWS]-(other:Person)
    RETURN other.id AS id, other.full_name AS name, k.weight AS weight
    ORDER BY k.weight DESC LIMIT 5
  `, { id })

  return { ...node, top_connections }
}

export default driver
