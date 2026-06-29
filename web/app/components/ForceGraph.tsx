'use client'
import { useEffect, useRef, useCallback } from 'react'
import * as d3 from 'd3'
import type { PersonNode, GraphLink } from '@/lib/types'

type SimNode = PersonNode & d3.SimulationNodeDatum
type SimLink = Omit<GraphLink, 'source' | 'target'> & d3.SimulationLinkDatum<SimNode>

const COMMUNITY_COLORS = [
  '#818cf8', '#34d399', '#fbbf24', '#fb7185',
  '#60a5fa', '#a78bfa', '#f472b6', '#2dd4bf',
]

interface Props {
  nodes: PersonNode[]
  links: GraphLink[]
  selectedId: string | null
  onNodeClick: (node: PersonNode) => void
  resetSignal?: number
}

export function ForceGraph({ nodes, links, selectedId, onNodeClick, resetSignal }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const simNodesRef = useRef<SimNode[]>([])
  const nodeSelRef = useRef<d3.Selection<SVGCircleElement, SimNode, SVGGElement, unknown> | null>(null)
  const onClickRef = useRef(onNodeClick)
  const simRunningRef = useRef(true)
  const selectedIdRef = useRef(selectedId)

  useEffect(() => { onClickRef.current = onNodeClick }, [onNodeClick])
  useEffect(() => { selectedIdRef.current = selectedId }, [selectedId])

  const nodeRadius = useCallback((d: SimNode, maxPr: number) =>
    4 + (d.pagerank / (maxPr || 1)) * 14, [])

  // ── Graph initialization — only re-runs when data changes ──────────────────
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return

    const el = svgRef.current
    let sim: d3.Simulation<SimNode, SimLink> | null = null
    let ro: ResizeObserver | null = null

    const init = (width: number, height: number) => {
      if (sim) sim.stop()

      const svg = d3.select(el)
      svg.selectAll('*').remove()

      const simNodes: SimNode[] = nodes.map(n => ({ ...n }))
      simNodesRef.current = simNodes

      const nodeById = new Map(simNodes.map(n => [n.id, n]))
      const simLinks: SimLink[] = links
        .filter(l => nodeById.has(l.source) && nodeById.has(l.target) && l.weight >= 2)
        .map(l => ({ ...l, source: l.source, target: l.target }))

      const maxPr = d3.max(simNodes, d => d.pagerank) ?? 1
      const maxWeight = d3.max(simLinks, d => d.weight) ?? 1

      sim = d3
        .forceSimulation<SimNode>(simNodes)
        .force('link', d3.forceLink<SimNode, SimLink>(simLinks).id(d => d.id).distance(80).strength(0.4))
        .force('charge', d3.forceManyBody<SimNode>().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide<SimNode>().radius(d => nodeRadius(d, maxPr) + 4))

      const g = svg.append('g')

      let userInteracted = false

      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.2, 5])
        .on('zoom', event => {
          g.attr('transform', event.transform)
          if (event.sourceEvent) userInteracted = true
        })

      zoomRef.current = zoom
      svg.call(zoom)

      const link = g
        .append('g')
        .selectAll<SVGLineElement, SimLink>('line')
        .data(simLinks)
        .join('line')
        .attr('stroke', 'rgba(255,255,255,0.08)')
        .attr('stroke-width', d => 0.5 + (d.weight / maxWeight) * 2)

      const node = g
        .append('g')
        .selectAll<SVGCircleElement, SimNode>('circle')
        .data(simNodes)
        .join('circle')
        .attr('r', d => nodeRadius(d, maxPr))
        .attr('fill', d => COMMUNITY_COLORS[d.community_id % COMMUNITY_COLORS.length])
        .attr('opacity', 0.9)
        .attr('stroke', 'none')
        .attr('stroke-width', 2)
        .attr('cursor', 'pointer')
        .on('click', (_event, d) => onClickRef.current(d))
        .call(
          d3.drag<SVGCircleElement, SimNode>()
            .on('start', (event, d) => {
              if (!event.active) sim!.alphaTarget(0.3).restart()
              d.fx = d.x; d.fy = d.y
            })
            .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
            .on('end', (event, d) => {
              if (!event.active) sim!.alphaTarget(0)
              d.fx = null; d.fy = null
            })
        )

      node.append('title').text(d => `${d.name}\n${d.title ?? ''}`)
      nodeSelRef.current = node

      sim.on('tick', () => {
        link
          .attr('x1', d => (d.source as SimNode).x ?? 0)
          .attr('y1', d => (d.source as SimNode).y ?? 0)
          .attr('x2', d => (d.target as SimNode).x ?? 0)
          .attr('y2', d => (d.target as SimNode).y ?? 0)
        node
          .attr('cx', d => d.x ?? 0)
          .attr('cy', d => d.y ?? 0)
      })

      // Pan to the selected node (Francis on initial load) once simulation settles
      sim.on('end', () => {
        simRunningRef.current = false
        if (userInteracted) return
        const targetId = selectedIdRef.current
        const target = targetId
          ? simNodes.find(n => n.id === targetId)
          : simNodes.find(n => n.name === 'Francis Pedraza')
        if (!target || target.x == null || target.y == null) return
        const transform = d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(2.5)
          .translate(-target.x, -target.y)
        d3.select(el).transition().duration(600).call(zoom.transform, transform)
      })
    }

    // Use ResizeObserver so we always get the true rendered dimensions
    // before starting the simulation — avoids centering at (0,0)
    const { width, height } = el.getBoundingClientRect()
    if (width > 0 && height > 0) {
      init(width, height)
    } else {
      ro = new ResizeObserver(entries => {
        const { width: w, height: h } = entries[0].contentRect
        if (w > 0 && h > 0) {
          ro!.disconnect()
          ro = null
          init(w, h)
        }
      })
      ro.observe(el)
    }

    return () => { sim?.stop(); ro?.disconnect() }
  }, [nodes, links, nodeRadius])

  // ── Selection — updates styles and pans to node without redrawing ──────────
  useEffect(() => {
    const node = nodeSelRef.current
    if (!node) return

    node
      .attr('opacity', d => (selectedId === null || selectedId === d.id ? 0.9 : 0.35))
      .attr('stroke', d => (selectedId === d.id ? '#fff' : 'none'))

    if (!selectedId || !svgRef.current || !zoomRef.current || simRunningRef.current) return

    const target = simNodesRef.current.find(n => n.id === selectedId)
    if (!target || target.x == null || target.y == null) return

    const width = svgRef.current.clientWidth || 800
    const height = svgRef.current.clientHeight || 600

    const transform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(2.5)
      .translate(-target.x, -target.y)

    d3.select(svgRef.current)
      .transition()
      .duration(600)
      .call(zoomRef.current.transform, transform)
  }, [selectedId])

  // ── Reset — restore initial zoom when signal fires ─────────────────────────
  useEffect(() => {
    if (!resetSignal || !svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current)
      .transition()
      .duration(500)
      .call(zoomRef.current.transform, d3.zoomIdentity)
  }, [resetSignal])

  return <svg ref={svgRef} className="w-full h-full" />
}
