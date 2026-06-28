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
    RETURN
      p.full_name AS full_name,
      p.current_title AS title,
      p.linkedin_url AS linkedin_url,
      p.current_location AS location,
      p.community_id AS community_id,
      coalesce(p.pagerank, 0.0) AS pagerank,
      coalesce(p.betweenness, 0.0) AS betweenness
  `, { id })

  if (!node) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const top_connections = await runQuery<{ id: string; name: string; weight: number }>(`
    MATCH (p:Person {id: $id})-[k:KNOWS]-(other:Person)
    RETURN other.id AS id, other.full_name AS name, k.weight AS weight
    ORDER BY k.weight DESC LIMIT 5
  `, { id })

  return NextResponse.json({ ...node, top_connections })
}
