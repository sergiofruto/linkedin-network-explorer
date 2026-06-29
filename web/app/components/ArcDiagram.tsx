'use client'
import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { PersonNode, GraphLink } from '@/lib/types'

const COMMUNITY_COLORS = [
  '#818cf8', '#34d399', '#fbbf24', '#fb7185',
  '#60a5fa', '#a78bfa', '#f472b6', '#2dd4bf',
]

const NODE_SPACING = 10
const BASELINE_Y = 160
const SVG_HEIGHT = 300
const MAX_ARC_HEIGHT = 120

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

    const sorted = [...nodes].sort((a, b) =>
      a.community_id !== b.community_id
        ? a.community_id - b.community_id
        : b.degree - a.degree
    )

    const indexById = new Map(sorted.map((n, i) => [n.id, i]))
    const svgWidth = sorted.length * NODE_SPACING + 40

    svg.attr('width', svgWidth).attr('height', SVG_HEIGHT)

    const xPos = (i: number) => 20 + i * NODE_SPACING

    const filteredLinks = links.filter(l => {
      if (typeof l.source !== 'string' || typeof l.target !== 'string') return false
      const si = indexById.get(l.source)
      const ti = indexById.get(l.target)
      return l.weight >= minWeight && si !== undefined && ti !== undefined
    })

    const maxWeight = d3.max(filteredLinks, d => d.weight) ?? 1
    const maxPr = d3.max(nodes, d => d.pagerank) ?? 1

    const top30 = new Set(
      [...nodes].sort((a, b) => b.pagerank - a.pagerank).slice(0, 30).map(n => n.id)
    )

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

    g.append('line')
      .attr('x1', 0).attr('y1', BASELINE_Y)
      .attr('x2', svgWidth).attr('y2', BASELINE_Y)
      .attr('stroke', 'rgba(255,255,255,0.1)')
      .attr('stroke-width', 1)

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
        COMMUNITY_COLORS[sorted[indexById.get(d.source)!].community_id % COMMUNITY_COLORS.length]
      )
      .attr('stroke-width', d => 1 + (d.weight / maxWeight) * 2)
      .attr('opacity', 0.5)

    let prevCommunity = -1
    sorted.forEach((node, i) => {
      if (node.community_id !== prevCommunity) {
        prevCommunity = node.community_id
        const x = xPos(i)
        const color = COMMUNITY_COLORS[node.community_id % COMMUNITY_COLORS.length]
        g.append('line')
          .attr('x1', x).attr('y1', BASELINE_Y)
          .attr('x2', x).attr('y2', BASELINE_Y + 6)
          .attr('stroke', color)
          .attr('stroke-width', 1.5)
        g.append('text')
          .attr('x', x + 1).attr('y', BASELINE_Y + 15)
          .attr('fill', color)
          .attr('font-size', '7px')
          .attr('text-anchor', 'start')
          .text(`C${node.community_id}`)
      }
    })

    const nodeCircles = g
      .append('g')
      .selectAll<SVGCircleElement, PersonNode>('circle')
      .data(sorted)
      .join('circle')
      .attr('cx', (_, i) => xPos(i))
      .attr('cy', BASELINE_Y)
      .attr('r', d => 4 + (d.pagerank / maxPr) * 4)
      .attr('fill', d => COMMUNITY_COLORS[d.community_id % COMMUNITY_COLORS.length])
      .attr('opacity', 0.9)
      .attr('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        const i = indexById.get(d.id)!
        tooltip.style('opacity', '1')
        tooltip.selectAll('*').remove()
        tooltip.append('div').style('font-weight', 'bold').text(d.name)
        if (d.title) tooltip.append('div').style('color', '#9ca3af').text(d.title)
        tooltip.append('div').text(`Degree: ${d.degree}`)
        arcPaths.attr('opacity', l => {
          const si = indexById.get(l.source)
          const ti = indexById.get(l.target)
          return si === i || ti === i ? 1.0 : 0.05
        })
        nodeCircles.attr('opacity', (n: PersonNode) => n.id === d.id ? 1.0 : 0.3)
      })
      .on('mousemove', event => {
        tooltip
          .style('left', `${(event as MouseEvent).pageX + 12}px`)
          .style('top', `${(event as MouseEvent).pageY - 20}px`)
      })
      .on('mouseout', () => {
        tooltip.style('opacity', '0')
        arcPaths.attr('opacity', 0.5)
        nodeCircles.attr('opacity', 0.9)
      })

    g.append('g')
      .selectAll<SVGTextElement, PersonNode>('text')
      .data(sorted.filter(n => top30.has(n.id)))
      .join('text')
      .attr('x', d => xPos(indexById.get(d.id)!))
      .attr('y', BASELINE_Y + 8)
      .attr('fill', '#e5e7eb')
      .attr('font-size', '9px')
      .attr('text-anchor', 'start')
      .attr('transform', d => {
        const x = xPos(indexById.get(d.id)!)
        return `rotate(45, ${x}, ${BASELINE_Y + 8})`
      })
      .text(d => d.name)

    return () => {
      tooltip.style('opacity', '0')
      tooltip.remove()
    }
  }, [nodes, links, minWeight])

  return <svg ref={svgRef} className="block" height={SVG_HEIGHT} />
}
