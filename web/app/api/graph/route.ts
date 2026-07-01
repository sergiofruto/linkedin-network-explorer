import { NextResponse } from 'next/server'
import { fetchGraph } from '@/lib/neo4j'

export async function GET() {
  try {
    return NextResponse.json(await fetchGraph())
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
