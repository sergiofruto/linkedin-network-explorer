'use client'
import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { PersonNode, GraphLink } from '@/lib/types'

const COMMUNITY_COLORS = [
  '#818cf8', '#34d399', '#fbbf24', '#fb7185',
  '#60a5fa', '#a78bfa', '#f472b6', '#2dd4bf',
]

interface Props {
  nodes: PersonNode[]
  links: GraphLink[]
  minWeight?: number
}

export function ChordDiagram({ nodes, links, minWeight = 2 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = svgRef.current.clientWidth || 800
    const height = svgRef.current.clientHeight || 600
    const size = Math.min(width, height)
    const outerRadius = size / 2 - 80
    const innerRadius = outerRadius - 20

    // Sort nodes by community so community members sit adjacent on the arc
    const sorted = [...nodes].sort((a, b) => a.community_id - b.community_id)
    const indexById = new Map(sorted.map((n, i) => [n.id, i]))
    const n = sorted.length

    // Build symmetric N×N matrix
    const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))
    links
      .filter(l => l.weight >= minWeight)
      .forEach(l => {
        const i = indexById.get(l.source)
        const j = indexById.get(l.target)
        if (i !== undefined && j !== undefined) {
          matrix[i][j] += l.weight
          matrix[j][i] += l.weight
        }
      })

    const chordLayout = d3.chord().padAngle(0.01).sortSubgroups(d3.descending)
    const chords = chordLayout(matrix)

    const arcGen = d3.arc<d3.ChordGroup>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)

    const ribbonGen = d3.ribbon<d3.Chord, d3.ChordSubgroup>().radius(innerRadius)

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`)

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

    const ribbonPaths = g
      .append('g')
      .selectAll<SVGPathElement, d3.Chord>('path')
      .data(chords)
      .join('path')
      .attr('d', d => ribbonGen(d) ?? '')
      .attr('fill', d => COMMUNITY_COLORS[sorted[d.source.index].community_id % COMMUNITY_COLORS.length])
      .attr('stroke', 'none')
      .attr('opacity', 0.35)

    const group = g
      .append('g')
      .selectAll<SVGGElement, d3.ChordGroup>('g')
      .data(chords.groups)
      .join('g')

    const groupPaths = group
      .append('path')
      .attr('d', d => arcGen(d) ?? '')
      .attr('fill', d => COMMUNITY_COLORS[sorted[d.index].community_id % COMMUNITY_COLORS.length])
      .attr('opacity', 0.85)
      .attr('cursor', 'pointer')
      .on('mouseover', (_event, d) => {
        const node = sorted[d.index]
        tooltip.style('opacity', '1').html('')
        tooltip.append('div').text(node.name)
        tooltip.append('div').text(`Degree: ${node.degree}`)
        ribbonPaths.attr('opacity', c =>
          c.source.index === d.index || c.target.index === d.index ? 0.85 : 0.04
        )
        groupPaths.attr('opacity', gd => (gd.index === d.index ? 1 : 0.25))
      })
      .on('mousemove', event => {
        tooltip
          .style('left', `${(event as MouseEvent).pageX + 12}px`)
          .style('top', `${(event as MouseEvent).pageY - 20}px`)
      })
      .on('mouseout', () => {
        tooltip.style('opacity', '0')
        ribbonPaths.attr('opacity', 0.35)
        groupPaths.attr('opacity', 0.85)
      })

    const top25 = new Set(
      [...nodes].sort((a, b) => b.pagerank - a.pagerank).slice(0, 25).map(n => n.id)
    )

    group
      .append('text')
      .attr('dy', '0.35em')
      .attr('transform', d => {
        const angle = (d.startAngle + d.endAngle) / 2
        const rotate = (angle * 180) / Math.PI - 90
        const flip = angle > Math.PI
        return `rotate(${rotate}) translate(${outerRadius + 8},0)${flip ? ' rotate(180)' : ''}`
      })
      .attr('text-anchor', d => ((d.startAngle + d.endAngle) / 2 > Math.PI ? 'end' : 'start'))
      .attr('fill', '#e5e7eb')
      .attr('font-size', '9px')
      .text(d => (top25.has(sorted[d.index].id) ? sorted[d.index].name : ''))

    return () => {
      tooltip.style('opacity', '0')
      tooltip.remove()
    }
  }, [nodes, links, minWeight])

  return <svg ref={svgRef} className="w-full h-full" />
}
