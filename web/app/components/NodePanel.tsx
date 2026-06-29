'use client'
import { useEffect, useState } from 'react'
import type { NodeProfile } from '@/lib/types'

interface Props {
  nodeId: string | null
  onClose: () => void
  onNodeSelect: (id: string) => void
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
    <div className="absolute right-4 top-4 bottom-4 w-52 bg-gray-950/90 border border-indigo-500/30 rounded-xl p-4 backdrop-blur-sm overflow-y-auto z-10">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-500 hover:text-white text-sm cursor-pointer"
        aria-label="Close"
      >
        ✕
      </button>

      {loading && <p className="text-xs text-gray-500 mt-6">Loading...</p>}
      {!loading && error && <p className="text-xs text-rose-400 mt-6">Failed to load profile.</p>}

      {!loading && profile && (
        <>
          <p className="text-sm font-semibold text-indigo-400 pr-5 leading-snug">{profile.full_name}</p>
          <p className="text-xs text-gray-500 mt-1 mb-4 leading-snug">{profile.title ?? '—'}</p>
          {profile.location && (
            <p className="text-xs text-gray-600 mb-4">{profile.location}</p>
          )}

          <div className="space-y-2 mb-5">
            {[
              { label: 'PageRank', value: profile.pagerank?.toFixed(4), color: 'text-emerald-400' },
              { label: 'Betweenness', value: profile.betweenness?.toFixed(4), color: 'text-amber-400' },
              { label: 'Community', value: `#${profile.community_id}`, color: 'text-indigo-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-gray-500">{label}</span>
                <span className={color}>{value}</span>
              </div>
            ))}
          </div>

          {profile.top_connections.length > 0 && (
            <>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Top connections</p>
              <ul className="space-y-1 mb-4">
                {profile.top_connections.map(c => (
                  <li key={c.id}>
                    <button
                      onClick={() => onNodeSelect(c.id)}
                      className="text-xs text-gray-300 hover:text-white text-left truncate w-full transition-colors cursor-pointer"
                    >
                      {c.name}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {profile.linkedin_url && (
            <a
              href={`https://${profile.linkedin_url.replace(/^https?:\/\//, '')}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              ↗ LinkedIn
            </a>
          )}
        </>
      )}
    </div>
  )
}
