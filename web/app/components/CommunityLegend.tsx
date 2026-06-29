'use client'
import { useState } from 'react'
import type { PersonNode } from '@/lib/types'
import { NAMED_COMMUNITY_IDS, communityName, communityColor } from '@/lib/communities'

interface Props {
  nodes: PersonNode[]
}

export function CommunityLegend({ nodes }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  const countById = nodes.reduce<Record<number, number>>((acc, n) => {
    acc[n.community_id] = (acc[n.community_id] ?? 0) + 1
    return acc
  }, {})

  const entries = NAMED_COMMUNITY_IDS
    .map(id => ({ id, name: communityName(id), color: communityColor(id), count: countById[id] ?? 0 }))
    .filter(e => e.count > 0)
    .sort((a, b) => b.count - a.count)

  return (
    <div className="absolute bottom-4 left-3 z-10 bg-gray-950/85 border border-white/10 rounded-xl backdrop-blur-sm overflow-hidden">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center justify-between gap-6 w-full px-3 py-2 text-left cursor-pointer hover:bg-white/5 transition-colors"
      >
        <span className="text-[10px] text-gray-500 uppercase tracking-widest">Communities</span>
        <span className="text-[10px] text-gray-600">{collapsed ? '▸' : '▾'}</span>
      </button>

      {!collapsed && (
        <ul className="px-3 pb-3 space-y-2">
          {entries.map(({ id, name, color, count }) => (
            <li key={id} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-xs text-gray-300">{name}</span>
              <span className="text-[10px] text-gray-600 ml-auto">{count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
