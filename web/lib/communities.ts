// 11 entries so all 6 named communities land on unique indices:
// 77%11=0  45%11=1  178%11=2  48%11=4  247%11=5  94%11=6
export const COMMUNITY_COLORS = [
  '#f87171', // red      — Engineering & Startups (77)
  '#fb923c', // orange   — Research & Advisory (45)
  '#fbbf24', // amber    — Clemson Alumni (178)
  '#a3e635', // lime
  '#34d399', // emerald  — Founder Network (48)
  '#22d3ee', // cyan     — Clemson Academia (247)
  '#60a5fa', // blue     — Intelligence Ops (94)
  '#818cf8', // indigo
  '#e879f9', // fuchsia
  '#fb7185', // rose
  '#2dd4bf', // teal
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
