'use client'
import { useState, useRef, useEffect } from 'react'
import type { PersonNode } from '@/lib/types'

const COMMUNITY_COLORS = [
  '#818cf8', '#34d399', '#fbbf24', '#fb7185',
  '#60a5fa', '#a78bfa', '#f472b6', '#2dd4bf',
]

interface Props {
  nodes: PersonNode[]
  onSelect: (id: string) => void
}

export function SearchBox({ nodes, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = query.length < 1 ? [] : nodes
    .filter(n => n.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8)

  useEffect(() => {
    setOpen(results.length > 0)
    setCursor(0)
  }, [results.length])

  const select = (node: PersonNode) => {
    setQuery('')
    setOpen(false)
    onSelect(node.id)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
    if (e.key === 'Enter' && results[cursor]) select(results[cursor])
    if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur() }
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus-within:border-white/20 transition-colors">
        <svg className="w-3.5 h-3.5 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search people..."
          className="bg-transparent text-xs text-gray-300 placeholder-gray-600 outline-none w-full"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false) }}
            className="text-gray-600 hover:text-gray-400 cursor-pointer text-xs leading-none"
          >✕</button>
        )}
      </div>

      {open && (
        <ul className="absolute left-0 right-0 top-full mt-1 bg-gray-900 border border-white/10 rounded-lg overflow-hidden z-30 shadow-xl">
          {results.map((node, i) => (
            <li key={node.id}>
              <button
                onMouseDown={() => select(node)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors cursor-pointer ${
                  i === cursor ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: COMMUNITY_COLORS[node.community_id % COMMUNITY_COLORS.length] }}
                />
                <span className="text-xs text-gray-200 truncate">{node.name}</span>
                {node.title && (
                  <span className="text-[10px] text-gray-500 truncate ml-auto shrink-0 max-w-20">{node.title}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
