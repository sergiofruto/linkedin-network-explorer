"""
GDS algorithm pipeline on the Person-Person KNOWS graph.
"""

import os
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

URI      = os.getenv('NEO4J_URI',      'bolt://localhost:7687')
USER     = os.getenv('NEO4J_USER',     'neo4j')
PASSWORD = os.getenv('NEO4J_PASSWORD', 'password')
GRAPH    = 'person-network'


def run(session, cypher: str, label: str = '') -> dict:
    if label:
        print(f"  {label}...")
    result = session.run(cypher)
    record = result.single()
    return dict(record) if record else {}


def analyze(session) -> None:
    session.run(f"CALL gds.graph.drop('{GRAPH}', false) YIELD graphName")

    print("Projecting Person→Person graph (KNOWS, undirected, weighted)...")
    stats = run(session, f"""
        CALL gds.graph.project(
            '{GRAPH}',
            'Person',
            {{
                KNOWS: {{
                    orientation: 'UNDIRECTED',
                    properties: ['weight']
                }}
            }}
        ) YIELD nodeCount, relationshipCount
    """)
    print(f"  {stats['nodeCount']} nodes · {stats['relationshipCount']} relationships\n")

    # ── WCC: Weakly Connected Components ──────────────────────────────────────
    r = run(session, f"""
        CALL gds.wcc.write('{GRAPH}', {{writeProperty: 'component_id'}})
        YIELD componentCount, nodePropertiesWritten
    """, "WCC — weakly connected components")
    print(f"    → {r['componentCount']} components\n")

    # ── Louvain: Community Detection ──────────────────────────────────────────
    r = run(session, f"""
        CALL gds.louvain.write('{GRAPH}', {{
            writeProperty: 'community_id',
            relationshipWeightProperty: 'weight'
        }}) YIELD communityCount, modularity
    """, "Louvain — community detection")
    print(f"    → {r['communityCount']} communities · modularity={r['modularity']:.4f}\n")

    # ── PageRank: Influence Score ─────────────────────────────────────────────
    run(session, f"""
        CALL gds.pageRank.write('{GRAPH}', {{
            writeProperty: 'pagerank',
            relationshipWeightProperty: 'weight',
            maxIterations: 20,
            dampingFactor: 0.85
        }}) YIELD ranIterations, nodePropertiesWritten
    """, "PageRank — influence score")
    print()

    # ── Betweenness Centrality: Bridge Nodes ──────────────────────────────────
    run(session, f"""
        CALL gds.betweenness.write('{GRAPH}', {{writeProperty: 'betweenness'}})
        YIELD nodePropertiesWritten
    """, "Betweenness Centrality — bridge nodes")
    print()

    session.run(f"CALL gds.graph.drop('{GRAPH}') YIELD graphName")

    print("Component sizes (top 10):")
    for r in session.run("""
        MATCH (p:Person)
        WITH p.component_id AS component, count(*) AS size
        ORDER BY size DESC LIMIT 10
        RETURN component, size
    """):
        print(f"  Component {r['component']:>5}: {r['size']} people")

    print("\nCommunity sizes (top 10):")
    for r in session.run("""
        MATCH (p:Person)
        WITH p.community_id AS community, count(*) AS size
        ORDER BY size DESC LIMIT 10
        RETURN community, size
    """):
        print(f"  Community {r['community']:>5}: {r['size']} people")

    print("\nTop 10 by PageRank:")
    for r in session.run("""
        MATCH (p:Person)
        RETURN p.full_name AS name, p.pagerank AS pr, p.community_id AS community
        ORDER BY p.pagerank DESC LIMIT 10
    """):
        print(f"  {r['name']:<35s}  PR={r['pr']:.4f}  community={r['community']}")

    print("\nTop 10 by Betweenness:")
    for r in session.run("""
        MATCH (p:Person)
        RETURN p.full_name AS name, p.betweenness AS bc, p.community_id AS community
        ORDER BY p.betweenness DESC LIMIT 10
    """):
        print(f"  {r['name']:<35s}  BC={r['bc']:.1f}  community={r['community']}")


def main():
    driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))
    with driver.session() as session:
        analyze(session)
    driver.close()
    print("\nDone.")


if __name__ == '__main__':
    main()
