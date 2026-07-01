import { NextResponse } from 'next/server'
import { fetchNodeProfile } from '@/lib/neo4j'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const node = await fetchNodeProfile(id)
    if (!node) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(node)
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
