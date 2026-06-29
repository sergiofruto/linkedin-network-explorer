import { NextResponse } from 'next/server'
import { runQuery } from '@/lib/neo4j'
import type { NodeProfile } from '@/lib/types'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const [node] = await runQuery<Omit<NodeProfile, 'top_connections'>>(`
    MATCH (p:Person {id: $id})
    CALL {
      WITH p
      MATCH (hr:Person) WHERE hr.pagerank > p.pagerank
      RETURN count(hr) + 1 AS pagerank_rank
    }
    CALL {
      WITH p
      MATCH (hb:Person) WHERE hb.betweenness > p.betweenness
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

  if (!node) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const top_connections = await runQuery<{ id: string; name: string; weight: number }>(`
    MATCH (p:Person {id: $id})-[k:KNOWS]-(other:Person)
    RETURN other.id AS id, other.full_name AS name, k.weight AS weight
    ORDER BY k.weight DESC LIMIT 5
  `, { id })

  return NextResponse.json({ ...node, top_connections })
}
