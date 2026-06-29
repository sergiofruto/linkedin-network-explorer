'use client'
import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { PersonNode, GraphLink } from '@/lib/types'
import { communityShort } from '@/lib/communities'

const COMMUNITY_COLORS = [
  '#818cf8', '#34d399', '#fbbf24', '#fb7185',
  '#60a5fa', '#a78bfa', '#f472b6', '#2dd4bf',
]

const TOP_N = 50           // show only the most connected people
const NODE_SPACING = 22
const BASELINE_Y = 340
const SVG_HEIGHT = 560
const MAX_ARC_HEIGHT = 300

interface Props {
  nodes: PersonNode[]
  links: GraphLink[]
  minWeight?: number
}

export function ArcDiagram({ nodes, links, minWeight = 2 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    // Focus on top N by PageRank (influence), then group by community
    const topNodes = [...nodes]
      .sort((a, b) => b.pagerank - a.pagerank)
      .slice(0, TOP_N)
      .sort((a, b) =>
        a.community_id !== b.community_id
          ? a.community_id - b.community_id
          : b.pagerank - a.pagerank
      )

    const topIds = new Set(topNodes.map(n => n.id))
    const indexById = new Map(topNodes.map((n, i) => [n.id, i]))
    const svgWidth = topNodes.length * NODE_SPACING + 60

    svg.attr('width', svgWidth).attr('height', SVG_HEIGHT)

    const xPos = (i: number) => 30 + i * NODE_SPACING

    const filteredLinks = links.filter(l => {
      if (typeof l.source !== 'string' || typeof l.target !== 'string') return false
      return l.weight >= minWeight && topIds.has(l.source) && topIds.has(l.target)
    })

    const maxWeight = d3.max(filteredLinks, d => d.weight) ?? 1
    const maxPr = d3.max(topNodes, d => d.pagerank) ?? 1

    const tooltip = d3
      .select('body')
      .append('div')
      .style('position', 'absolute')
      .style('background', 'rgba(0,0,0,0.85)')
      .style('color', '#fff')
      .style('padding', '6px 10px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', '0')
      .style('z-index', '9999')

    const g = svg.append('g')

    // Baseline
    g.append('line')
      .attr('x1', 0).attr('y1', BASELINE_Y)
      .attr('x2', svgWidth).attr('y2', BASELINE_Y)
      .attr('stroke', 'rgba(255,255,255,0.08)')
      .attr('stroke-width', 1)

    // Arcs
    const arcPaths = g
      .append('g')
      .selectAll<SVGPathElement, GraphLink>('path')
      .data(filteredLinks)
      .join('path')
      .attr('d', d => {
        const si = indexById.get(d.source)!
        const ti = indexById.get(d.target)!
        const x1 = xPos(Math.min(si, ti))
        const x2 = xPos(Math.max(si, ti))
        const cx = (x1 + x2) / 2
        const h = Math.min((x2 - x1) / 2, MAX_ARC_HEIGHT)
        return `M ${x1} ${BASELINE_Y} C ${cx} ${BASELINE_Y - h} ${cx} ${BASELINE_Y - h} ${x2} ${BASELINE_Y}`
      })
      .attr('fill', 'none')
      .attr('stroke', d =>
        COMMUNITY_COLORS[topNodes[indexById.get(d.source)!].community_id % COMMUNITY_COLORS.length]
      )
      .attr('stroke-width', d => 0.8 + (d.weight / maxWeight) * 2)
      .attr('opacity', 0.45)

    // Community boundary ticks + labels
    let prevCommunity = -1
    topNodes.forEach((node, i) => {
      if (node.community_id !== prevCommunity) {
        prevCommunity = node.community_id
        const x = xPos(i)
        const color = COMMUNITY_COLORS[node.community_id % COMMUNITY_COLORS.length]
        g.append('line')
          .attr('x1', x).attr('y1', BASELINE_Y - 4)
          .attr('x2', x).attr('y2', BASELINE_Y + 8)
          .attr('stroke', color)
          .attr('stroke-width', 1.5)
        g.append('text')
          .attr('x', x + 2).attr('y', BASELINE_Y + 18)
          .attr('fill', color)
          .attr('font-size', '8px')
          .attr('text-anchor', 'start')
          .text(communityShort(node.community_id))
      }
    })

    // Nodes
    const nodeCircles = g
      .append('g')
      .selectAll<SVGCircleElement, PersonNode>('circle')
      .data(topNodes)
      .join('circle')
      .attr('cx', (_, i) => xPos(i))
      .attr('cy', BASELINE_Y)
      .attr('r', d => 4 + (d.pagerank / maxPr) * 6)
      .attr('fill', d => COMMUNITY_COLORS[d.community_id % COMMUNITY_COLORS.length])
      .attr('opacity', 0.9)
      .attr('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        const i = indexById.get(d.id)!
        tooltip.style('opacity', '1')
        tooltip.selectAll('*').remove()
        tooltip.append('div').style('font-weight', 'bold').text(d.name)
        if (d.title) tooltip.append('div').style('color', '#9ca3af').text(d.title)
        tooltip.append('div').text(`PageRank: ${d.pagerank.toFixed(3)}`)
        arcPaths.attr('opacity', l => {
          const si = indexById.get(l.source)
          const ti = indexById.get(l.target)
          return si === i || ti === i ? 0.95 : 0.04
        })
        nodeCircles.attr('opacity', (n: PersonNode) => n.id === d.id ? 1.0 : 0.25)
      })
      .on('mousemove', event => {
        tooltip
          .style('left', `${(event as MouseEvent).pageX + 12}px`)
          .style('top', `${(event as MouseEvent).pageY - 20}px`)
      })
      .on('mouseout', () => {
        tooltip.style('opacity', '0')
        arcPaths.attr('opacity', 0.45)
        nodeCircles.attr('opacity', 0.9)
      })

    // Labels for all top-N nodes, rotated under the baseline
    g.append('g')
      .selectAll<SVGTextElement, PersonNode>('text')
      .data(topNodes)
      .join('text')
      .attr('x', (_, i) => xPos(i))
      .attr('y', BASELINE_Y + 10)
      .attr('fill', d => COMMUNITY_COLORS[d.community_id % COMMUNITY_COLORS.length])
      .attr('font-size', '9px')
      .attr('text-anchor', 'start')
      .attr('transform', (_, i) => {
        const x = xPos(i)
        return `rotate(45, ${x}, ${BASELINE_Y + 10})`
      })
      .text(d => d.name)

    return () => {
      tooltip.style('opacity', '0')
      tooltip.remove()
    }
  }, [nodes, links, minWeight])

  return <svg ref={svgRef} className="block" height={SVG_HEIGHT} />
}
