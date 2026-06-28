import { NextResponse } from 'next/server'
import { runQuery } from '@/lib/neo4j'
import type { PersonNode, GraphLink } from '@/lib/types'

export async function GET() {
  try {
    const nodes = await runQuery<PersonNode>(`
      MATCH (p:Person)
      RETURN
        p.id AS id,
        p.full_name AS name,
        p.current_title AS title,
        p.community_id AS community_id,
        coalesce(p.pagerank, 0.0) AS pagerank,
        coalesce(p.degree, 0.0) AS degree
    `)

    const links = await runQuery<GraphLink>(`
      MATCH (a:Person)-[k:KNOWS]->(b:Person)
      RETURN a.id AS source, b.id AS target, k.weight AS weight
    `)

    return NextResponse.json({ nodes, links })
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
