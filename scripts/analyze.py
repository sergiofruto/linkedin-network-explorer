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

    session.run(f"CALL gds.graph.drop('{GRAPH}') YIELD graphName")

    print("Component sizes (top 10):")
    for r in session.run("""
        MATCH (p:Person)
        WITH p.component_id AS component, count(*) AS size
        ORDER BY size DESC LIMIT 10
        RETURN component, size
    """):
        print(f"  Component {r['component']:>5}: {r['size']} people")


def main():
    driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))
    with driver.session() as session:
        analyze(session)
    driver.close()
    print("\nDone.")


if __name__ == '__main__':
    main()
