const NAMES: Record<number, string> = {
  247: 'Clemson Academia',
  178: 'Clemson Alumni',
  77:  'Engineering & Startups',
  48:  'Founder Network',
  45:  'Research & Advisory',
  94:  'Intelligence Ops',
}

export function communityName(id: number): string {
  return NAMES[id] ?? `Community #${id}`
}

export function communityShort(id: number): string {
  return NAMES[id] ?? `C${id}`
}
