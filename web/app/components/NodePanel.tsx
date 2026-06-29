'use client'
import { useEffect, useState } from 'react'
import type { NodeProfile } from '@/lib/types'
import { communityName } from '@/lib/communities'

interface Props {
  nodeId: string | null
  onClose: () => void
  onNodeSelect: (id: string) => void
}

function RoleBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border ${color}`}>
      {label}
    </span>
  )
}

function MetricRow({
  label, value, sub, color,
}: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>
      </div>
      <p className={`text-sm font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  )
}

export function NodePanel({ nodeId, onClose, onNodeSelect }: Props) {
  const [profile, setProfile] = useState<NodeProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!nodeId) { setProfile(null); setError(false); return }
    setLoading(true)
    setError(false)
    fetch(`/api/node/${encodeURIComponent(nodeId)}`)
      .then(r => r.json())
      .then(data => { setProfile(data); setLoading(false) })
      .catch(() => { setLoading(false); setError(true) })
  }, [nodeId])

  if (!nodeId) return null

  return (
    <div className="absolute right-4 top-4 bottom-4 w-64 bg-gray-950/90 border border-indigo-500/30 rounded-xl p-5 backdrop-blur-sm overflow-y-auto z-10">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-white text-sm cursor-pointer transition-colors"
        aria-label="Close"
      >✕</button>

      {loading && <p className="text-xs text-gray-500 mt-6">Loading...</p>}
      {!loading && error && <p className="text-xs text-rose-400 mt-6">Failed to load profile.</p>}

      {!loading && profile && (
        <>
          {/* Header */}
          <p className="text-sm font-semibold text-indigo-400 pr-6 leading-snug">{profile.full_name}</p>
          <p className="text-xs text-gray-500 mt-1 leading-snug">{profile.title ?? '—'}</p>
          {profile.location && (
            <p className="text-[11px] text-gray-600 mt-1">{profile.location}</p>
          )}

          {/* Role badges */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {profile.pagerank_rank <= 10 && (
              <RoleBadge label="Top Connector" color="text-indigo-400 border-indigo-500/40" />
            )}
            {profile.betweenness_rank <= 10 && (
              <RoleBadge label="Key Bridge" color="text-amber-400 border-amber-500/40" />
            )}
            {profile.pagerank_rank > 10 && profile.betweenness_rank > 10 && (
              <RoleBadge label={communityName(profile.community_id)} color="text-gray-400 border-white/15" />
            )}
          </div>

          {/* Metrics */}
          <div className="mt-4 space-y-3">
            <MetricRow
              label="Influence (PageRank)"
              value={profile.pagerank.toFixed(4)}
              sub={`#${profile.pagerank_rank} of 248 people`}
              color="text-emerald-400"
            />
            <MetricRow
              label="Bridging (Betweenness)"
              value={profile.betweenness.toFixed(1)}
              sub={`#${profile.betweenness_rank} in main component`}
              color="text-amber-400"
            />
            <MetricRow
              label="Direct connections"
              value={String(profile.degree)}
              sub={`${communityName(profile.community_id)} (${profile.community_size} people)`}
              color="text-indigo-300"
            />
          </div>

          {/* Top connections */}
          {profile.top_connections.length > 0 && (
            <div className="mt-5">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Strongest ties</p>
              <ul className="space-y-1.5">
                {profile.top_connections.map(c => (
                  <li key={c.id} className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => onNodeSelect(c.id)}
                      className="text-xs text-gray-300 hover:text-white text-left truncate transition-colors cursor-pointer"
                    >
                      {c.name}
                    </button>
                    <span className="text-[10px] text-gray-600 shrink-0">×{c.weight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* LinkedIn */}
          {profile.linkedin_url && (
            <a
              href={`https://${profile.linkedin_url.replace(/^https?:\/\//, '')}`}
              target="_blank"
              rel="noreferrer"
              className="mt-5 flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              <span>↗</span> LinkedIn profile
            </a>
          )}
        </>
      )}
    </div>
  )
}
