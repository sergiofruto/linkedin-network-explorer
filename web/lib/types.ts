export interface PersonNode {
  id: string
  name: string
  title: string | null
  community_id: number
  pagerank: number
  degree: number
}

export interface GraphLink {
  source: string
  target: string
  weight: number
}

export interface GraphData {
  nodes: PersonNode[]
  links: GraphLink[]
}

export interface NetworkMetrics {
  node_count: number
  edge_count: number
  density: number
  communities: number
  components: number
  top_pagerank: Array<{ id: string; name: string; pagerank: number }>
  top_betweenness: Array<{ id: string; name: string; betweenness: number }>
}

export interface NodeProfile {
  full_name: string
  title: string | null
  linkedin_url: string | null
  location: string | null
  community_id: number
  pagerank: number
  betweenness: number
  degree: number
  pagerank_rank: number
  betweenness_rank: number
  community_size: number
  top_connections: Array<{ id: string; name: string; weight: number }>
}
