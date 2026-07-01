'use client'
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import type { GraphData, NetworkMetrics, PersonNode } from '@/lib/types'
import { ForceGraph, type ForceGraphHandle } from './ForceGraph'
import { ChordDiagram } from './ChordDiagram'
import { ArcDiagram } from './ArcDiagram'
import { MetricsSidebar } from './MetricsSidebar'
import { NodePanel } from './NodePanel'
import { CommunityLegend } from './CommunityLegend'

type ViewMode = 'force' | 'chord' | 'arc'

function DismissableBox({ children }: { children: React.ReactNode }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  return (
    <div className="relative w-60 bg-gray-950/95 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-gray-500 hover:text-white text-xs cursor-pointer transition-colors"
        aria-label="Dismiss"
      >✕</button>
      {children}
    </div>
  )
}

function OverlayStack() {
  return (
    <div className="absolute top-14 left-3 z-20 flex flex-col gap-2">
      <DismissableBox>
        <p className="text-xs font-semibold text-white mb-2">Francis Pedraza&apos;s Network</p>
        <p className="text-xs text-gray-400 leading-relaxed">
          248 LinkedIn connections mapped as a graph. Francis is highlighted because he ranks #1 by PageRank — the most influential connector in this network.
        </p>
      </DismissableBox>
      <DismissableBox>
        <p className="text-xs font-semibold text-white mb-3">How to explore</p>
        <ul className="space-y-1.5 text-xs text-gray-400">
          <li><span className="text-gray-600 mr-1.5">↕</span>Scroll or use +/- to zoom</li>
          <li><span className="text-gray-600 mr-1.5">✥</span>Drag to pan</li>
          <li><span className="text-gray-600 mr-1.5">◎</span>Click a node to see their profile</li>
          <li><span className="text-gray-600 mr-1.5">◈</span>Hover to highlight connections</li>
        </ul>
        <div className="mt-3 pt-3 border-t border-white/5 space-y-1 text-xs text-gray-500">
          <p>Node <span className="text-gray-400">size</span> = influence (PageRank)</p>
          <p>Node <span className="text-gray-400">color</span> = community cluster</p>
        </div>
      </DismissableBox>
    </div>
  )
}

export function Dashboard() {
  const [graph, setGraph] = useState<GraphData>({ nodes: [], links: [] })
  const [metrics, setMetrics] = useState<NetworkMetrics | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('force')
  const [resetSignal, setResetSignal] = useState(0)
  const [minWeight, setMinWeight] = useState<1 | 2>(2)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [egoMode, setEgoMode] = useState(false)
  const forceGraphRef = useRef<ForceGraphHandle>(null)
  // Capture ?node= before the selectedId effect can delete it from the URL
  const initialNodeId = useRef(
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('node')
      : null
  )

  // Exit ego mode when selection clears
  useEffect(() => { if (!selectedId) setEgoMode(false) }, [selectedId])

  const displayGraph = useMemo(() => {
    if (!egoMode || !selectedId) return graph
    const neighborIds = new Set<string>([selectedId])
    graph.links.forEach(l => {
      if (l.source === selectedId) neighborIds.add(l.target)
      if (l.target === selectedId) neighborIds.add(l.source)
    })
    return {
      nodes: graph.nodes.filter(n => neighborIds.has(n.id)),
      links: graph.links.filter(l => neighborIds.has(l.source as string) && neighborIds.has(l.target as string)),
    }
  }, [egoMode, selectedId, graph])

  const handleReset = useCallback(() => {
    setSelectedId(null)
    setEgoMode(false)
    setResetSignal(s => s + 1)
  }, [])

  useEffect(() => {
    fetch('/api/graph')
      .then(r => r.json())
      .then((data: GraphData) => {
        setGraph(data)
        const nodeFromUrl = initialNodeId.current
        if (nodeFromUrl && data.nodes.find(n => n.id === nodeFromUrl)) {
          setSelectedId(nodeFromUrl)
        } else {
          const francis = data.nodes.find(n => n.name === 'Francis Pedraza')
          if (francis) setSelectedId(francis.id)
        }
      })
    fetch('/api/metrics').then(r => r.json()).then(setMetrics)
  }, [])

  useEffect(() => {
    const url = new URL(window.location.href)
    if (selectedId) url.searchParams.set('node', selectedId)
    else url.searchParams.delete('node')
    window.history.replaceState({}, '', url.toString())
  }, [selectedId])

  const handleNodeClick = useCallback((node: PersonNode) => {
    setSelectedId(prev => prev === node.id ? null : node.id)
  }, [])

  const handleNodeSelect = useCallback((id: string) => {
    setSelectedId(id)
  }, [])

  if (!metrics) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500 text-sm">
        Loading network data...
      </div>
    )
  }

  const infoText = {
    force: ' · scroll to zoom · drag to pan',
    chord: ' · hover to highlight',
    arc: ' · top 50 by influence · scroll to explore · hover to highlight',
  }[viewMode]

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Mobile gate ─────────────────────────────────────────────────────── */}
      <div className="md:hidden flex flex-col min-h-screen w-full bg-gray-950 px-6 py-10 overflow-y-auto">
        <div className="max-w-sm mx-auto w-full space-y-8">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Network Explorer</p>
            <h1 className="text-xl font-semibold text-white mb-3">Francis Pedraza&apos;s Network</h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              248 LinkedIn connections mapped as an interactive graph — communities detected,
              influence ranked, bridges identified.
            </p>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
            <span className="text-amber-400 text-lg leading-none mt-0.5">⎙</span>
            <div>
              <p className="text-sm font-medium text-amber-300">Open on desktop for the full graph</p>
              <p className="text-xs text-gray-500 mt-0.5">The interactive network requires a larger screen to explore.</p>
            </div>
          </div>

          <a
            href="/analysis"
            className="flex items-center justify-between w-full bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 hover:text-white transition-colors"
          >
            <span>Read key findings</span>
            <span className="text-gray-600">→</span>
          </a>

          <div className="grid grid-cols-2 gap-3">
            {[
              { v: metrics.node_count,            l: 'People',      s: 'LinkedIn connections', c: 'text-indigo-400', bg: 'bg-indigo-500/10' },
              { v: metrics.communities,            l: 'Communities', s: 'Louvain clusters',     c: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { v: metrics.density.toFixed(3),     l: 'Density',     s: 'of possible links',   c: 'text-amber-400',  bg: 'bg-amber-500/10'  },
              { v: metrics.components,             l: 'Components',  s: 'disconnected groups', c: 'text-rose-400',   bg: 'bg-rose-500/10'   },
            ].map(s => (
              <div key={s.l} className={`${s.bg} rounded-xl p-3`}>
                <p className={`text-xl font-bold ${s.c}`}>{s.v}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.l}</p>
                <p className="text-[10px] text-gray-600 mt-0.5 leading-tight">{s.s}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Top Connectors</p>
            <ul className="space-y-2">
              {metrics.top_pagerank.slice(0, 6).map((p, i) => (
                <li key={p.id} className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="text-gray-600 w-4 text-right">{i + 1}</span>
                  <span className="text-indigo-400">●</span>
                  {p.name}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Key Bridges</p>
            <ul className="space-y-2">
              {metrics.top_betweenness.slice(0, 6).map((p, i) => (
                <li key={p.id} className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="text-gray-600 w-4 text-right">{i + 1}</span>
                  <span className="text-amber-400">◆</span>
                  {p.name}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* ── Desktop layout ───────────────────────────────────────────────────── */}
      <div className="hidden md:flex flex-1 overflow-hidden">
      <MetricsSidebar metrics={metrics} nodes={graph.nodes} onNodeSelect={handleNodeSelect} />

      <main className={`flex-1 relative ${viewMode === 'arc' ? 'overflow-x-auto overflow-y-hidden' : 'overflow-hidden'}`}>
        <div className="sticky left-0 top-3 z-10 flex items-center gap-3 pl-3 mb-0">
          <div className="flex rounded-full border border-white/10 overflow-hidden text-xs">
            {(['force', 'chord', 'arc'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 transition-colors capitalize cursor-pointer ${
                  viewMode === mode
                    ? 'bg-white text-gray-900 font-medium'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {mode === 'force' ? 'Force Graph' : mode === 'chord' ? 'Chord' : 'Arc'}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-600">
            {egoMode && selectedId
              ? `${displayGraph.nodes.length} people · ${displayGraph.links.length} connections · ego network`
              : `${graph.nodes.length} people · ${graph.links.filter(l => l.weight >= minWeight).length} connections${infoText}`
            }
          </span>
          {viewMode === 'force' && selectedId && (
            <button
              onClick={() => setEgoMode(e => !e)}
              className={`text-xs border rounded-full px-3 py-1 cursor-pointer transition-colors ${
                egoMode
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                  : 'border-white/10 text-gray-500 hover:text-gray-300'
              }`}
            >
              Ego network
            </button>
          )}
          {viewMode === 'force' && (
            <div className="flex items-center gap-1 border border-white/10 rounded-full overflow-hidden">
              <button
                onClick={() => forceGraphRef.current?.zoomBy(1 / 1.3)}
                className="px-2 py-1 text-gray-400 hover:text-white transition-colors cursor-pointer text-sm leading-none"
                aria-label="Zoom out"
              >−</button>
              <span className="text-xs text-gray-500 w-9 text-center tabular-nums select-none">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => forceGraphRef.current?.zoomBy(1.3)}
                className="px-2 py-1 text-gray-400 hover:text-white transition-colors cursor-pointer text-sm leading-none"
                aria-label="Zoom in"
              >+</button>
            </div>
          )}
          {viewMode === 'force' && (
            <button
              onClick={handleReset}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors border border-white/10 rounded-full px-3 py-1 cursor-pointer"
            >
              Reset view
            </button>
          )}
          {(viewMode === 'chord' || viewMode === 'arc') && (
            <div className="flex rounded-full border border-white/10 overflow-hidden text-xs">
              <button
                onClick={() => setMinWeight(2)}
                className={`px-3 py-1 transition-colors cursor-pointer ${minWeight === 2 ? 'bg-white text-gray-900 font-medium' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Strong ties
              </button>
              <button
                onClick={() => setMinWeight(1)}
                className={`px-3 py-1 transition-colors cursor-pointer ${minWeight === 1 ? 'bg-white text-gray-900 font-medium' : 'text-gray-400 hover:text-gray-200'}`}
              >
                All ties
              </button>
            </div>
          )}
        </div>

        {viewMode === 'force' && (
          <>
            <ForceGraph
              ref={forceGraphRef}
              nodes={displayGraph.nodes}
              links={displayGraph.links}
              selectedId={selectedId}
              onNodeClick={handleNodeClick}
              onZoomChange={setZoomLevel}
              resetSignal={resetSignal}
            />
            <OverlayStack />
            <CommunityLegend nodes={graph.nodes} />
          </>
        )}
        {viewMode === 'chord' && (
          <ChordDiagram
            nodes={graph.nodes}
            links={graph.links}
            minWeight={minWeight}
          />
        )}
        {viewMode === 'arc' && (
          <div className="pt-10">
            <ArcDiagram
              nodes={graph.nodes}
              links={graph.links}
              minWeight={minWeight}
            />
          </div>
        )}

        {viewMode === 'force' && (
          <NodePanel
            nodeId={selectedId}
            onClose={() => setSelectedId(null)}
            onNodeSelect={handleNodeSelect}
          />
        )}
      </main>
      </div>
    </div>
  )
}
