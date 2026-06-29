import type { NetworkMetrics } from '@/lib/types'

interface Props {
  metrics: NetworkMetrics
  onNodeSelect: (id: string) => void
}

const statCards = (m: NetworkMetrics) => [
  { label: 'People', value: m.node_count, color: 'text-indigo-400', bg: 'bg-indigo-500/10', sub: 'LinkedIn connections' },
  { label: 'Communities', value: m.communities, color: 'text-emerald-400', bg: 'bg-emerald-500/10', sub: 'Louvain clusters' },
  { label: 'Density', value: m.density.toFixed(3), color: 'text-amber-400', bg: 'bg-amber-500/10', sub: 'of possible links' },
  { label: 'Components', value: m.components, color: 'text-rose-400', bg: 'bg-rose-500/10', sub: 'disconnected groups' },
]

export function MetricsSidebar({ metrics, onNodeSelect }: Props) {
  return (
    <aside className="w-56 shrink-0 bg-gray-950 border-r border-white/5 p-4 flex flex-col gap-6 overflow-y-auto">
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Network Health</p>
        <div className="grid grid-cols-2 gap-2">
          {statCards(metrics).map(({ label, value, color, bg, sub }) => (
            <div key={label} className={`${bg} rounded-lg p-2`}>
              <p className={`text-base font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-[10px] text-gray-600 mt-0.5 leading-tight">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Top Connectors</p>
        <ul className="space-y-2">
          {metrics.top_pagerank.slice(0, 6).map(p => (
            <li key={p.id}>
              <button
                onClick={() => onNodeSelect(p.id)}
                className="text-sm text-indigo-400 hover:text-indigo-300 text-left truncate w-full transition-colors cursor-pointer"
              >
                ● {p.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Key Bridges</p>
        <ul className="space-y-2">
          {metrics.top_betweenness.slice(0, 6).map(p => (
            <li key={p.id}>
              <button
                onClick={() => onNodeSelect(p.id)}
                className="text-sm text-amber-400 hover:text-amber-300 text-left truncate w-full transition-colors cursor-pointer"
              >
                ◆ {p.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
