import { NextResponse } from 'next/server'
import { fetchMetrics } from '@/lib/neo4j'

export async function GET() {
  try {
    return NextResponse.json(await fetchMetrics())
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
