export const COMMUNITY_COLORS = [
  '#818cf8', '#34d399', '#fbbf24', '#fb7185',
  '#60a5fa', '#a78bfa', '#f472b6', '#2dd4bf',
]

export function communityColor(id: number): string {
  return COMMUNITY_COLORS[id % COMMUNITY_COLORS.length]
}

const NAMES: Record<number, string> = {
  247: 'Clemson Academia',
  178: 'Clemson Alumni',
  77:  'Engineering & Startups',
  48:  'Founder Network',
  45:  'Research & Advisory',
  94:  'Intelligence Ops',
}

export const NAMED_COMMUNITY_IDS = Object.keys(NAMES).map(Number)

export function communityName(id: number): string {
  return NAMES[id] ?? `Community #${id}`
}

export function communityShort(id: number): string {
  return NAMES[id] ?? `C${id}`
}
