"""
Copies the fully-analyzed graph from a local Neo4j instance to Neo4j Aura.

Since Aura Free does not include GDS, this script transfers the already-computed
node properties (pagerank, betweenness, degree, community_id, component_id) along
with Person nodes and KNOWS relationships — bypassing the need to re-run GDS.

Usage:
    Set SOURCE_* vars to your local Neo4j (or leave as defaults).
    Set TARGET_* vars to your Aura Free credentials.

    python scripts/seed_aura.py
"""

import os
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# Source: always local Neo4j (Docker)
SOURCE_URI      = 'bolt://localhost:7687'
SOURCE_USER     = 'neo4j'
SOURCE_PASSWORD = 'password'

# Target: Aura credentials (from the downloaded .env)
TARGET_URI      = os.getenv('NEO4J_URI')
TARGET_USER     = os.getenv('NEO4J_USERNAME', 'neo4j')
TARGET_PASSWORD = os.getenv('NEO4J_PASSWORD')

BATCH = 100


def fetch_persons(session) -> list[dict]:
    result = session.run("""
        MATCH (p:Person)
        RETURN
            p.id                   AS id,
            p.full_name            AS full_name,
            p.linkedin_url         AS linkedin_url,
            p.current_title        AS current_title,
            p.current_company      AS current_company,
            p.current_location     AS current_location,
            p.linkedin_connections AS linkedin_connections,
            coalesce(p.pagerank,      0.0) AS pagerank,
            coalesce(p.betweenness,   0.0) AS betweenness,
            coalesce(p.degree,        0.0) AS degree,
            coalesce(p.community_id,  -1)  AS community_id,
            coalesce(p.component_id,  -1)  AS component_id
    """)
    return [dict(r) for r in result]


def fetch_knows(session) -> list[dict]:
    result = session.run("""
        MATCH (a:Person)-[k:KNOWS]->(b:Person)
        RETURN a.id AS source, b.id AS target,
               k.weight AS weight, k.shared_orgs AS shared_orgs
    """)
    return [dict(r) for r in result]


def write_persons(session, persons: list[dict]) -> None:
    for i in range(0, len(persons), BATCH):
        batch = persons[i:i + BATCH]
        session.run("""
            UNWIND $batch AS p
            MERGE (n:Person {id: p.id})
            SET
                n.full_name            = p.full_name,
                n.linkedin_url         = p.linkedin_url,
                n.current_title        = p.current_title,
                n.current_company      = p.current_company,
                n.current_location     = p.current_location,
                n.linkedin_connections = p.linkedin_connections,
                n.pagerank             = p.pagerank,
                n.betweenness          = p.betweenness,
                n.degree               = p.degree,
                n.community_id         = p.community_id,
                n.component_id         = p.component_id
        """, batch=batch)
        print(f"  Persons: {min(i + BATCH, len(persons))}/{len(persons)}")


def write_knows(session, edges: list[dict]) -> None:
    for i in range(0, len(edges), BATCH):
        batch = edges[i:i + BATCH]
        session.run("""
            UNWIND $batch AS e
            MATCH (a:Person {id: e.source}), (b:Person {id: e.target})
            MERGE (a)-[k:KNOWS]->(b)
            SET k.weight = e.weight, k.shared_orgs = e.shared_orgs
        """, batch=batch)
        print(f"  KNOWS edges: {min(i + BATCH, len(edges))}/{len(edges)}")


def create_constraints(session) -> None:
    session.run("CREATE CONSTRAINT person_id IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE")


def main():
    if not TARGET_URI or not TARGET_PASSWORD:
        print("ERROR: NEO4J_URI or NEO4J_PASSWORD not found in .env")
        print("  Copy your Aura credentials file content into .env")
        return

    print("Reading from local Neo4j...")
    src = GraphDatabase.driver(SOURCE_URI, auth=(SOURCE_USER, SOURCE_PASSWORD))
    with src.session() as s:
        persons = fetch_persons(s)
        edges   = fetch_knows(s)
    src.close()
    print(f"  {len(persons)} Person nodes, {len(edges)} KNOWS edges\n")

    print("Writing to Aura...")
    tgt = GraphDatabase.driver(TARGET_URI, auth=(TARGET_USER, TARGET_PASSWORD))
    with tgt.session() as s:
        create_constraints(s)
        write_persons(s, persons)
        write_knows(s, edges)
    tgt.close()

    print("\nDone. Your Aura instance is ready.")


if __name__ == '__main__':
    main()
