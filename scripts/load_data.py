"""
Ingests x-connections.json into Neo4j.

Graph model:
  (Person)-[:WORKED_AT]->(Company)
  (Person)-[:STUDIED_AT]->(School)
  (Person)-[:KNOWS {weight, shared_orgs}]->(Person)  ← derived from shared orgs
"""

import json
import os
import re
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

URI      = os.getenv('NEO4J_URI',      'bolt://localhost:7687')
USER     = os.getenv('NEO4J_USER',     'neo4j')
PASSWORD = os.getenv('NEO4J_PASSWORD', 'password')
DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'x-connections.json')


def slugify(name: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')


# ── STEP 1: Constraints ────────────────────────────────────────────────────────

def create_constraints(session) -> None:
    print("Creating uniqueness constraints...")
    session.run("CREATE CONSTRAINT person_id  IF NOT EXISTS FOR (p:Person)  REQUIRE p.id IS UNIQUE")
    session.run("CREATE CONSTRAINT company_id IF NOT EXISTS FOR (c:Company) REQUIRE c.id IS UNIQUE")
    session.run("CREATE CONSTRAINT school_id  IF NOT EXISTS FOR (s:School)  REQUIRE s.id IS UNIQUE")
    print("  Done.\n")


# ── STEP 2: Person nodes ───────────────────────────────────────────────────────

def load_persons(session, records: list) -> None:
    print(f"Loading {len(records)} Person nodes...")
    for i, r in enumerate(records):
        pid = r.get('id') or r.get('linkedin_url', f'person-{i}')

        # Prefer active LinkedIn entry for connection count
        social = r.get('social_media', [])
        linkedin = [s for s in social if s.get('network') == 'linkedin']
        active = next((s for s in linkedin if s.get('url_status') == 'active'), None)
        entry = active or (linkedin[0] if linkedin else None)
        linkedin_connections = entry.get('connections', 0) if entry else 0

        # full_name is always present; first/last are only 71–73% populated
        full_name = (
            r.get('full_name')
            or f"{r.get('first_name', '')} {r.get('last_name', '')}".strip()
            or 'Unknown'
        )

        session.run("""
            MERGE (p:Person {id: $id})
            SET p.full_name           = $full_name,
                p.linkedin_url        = $linkedin_url,
                p.current_title       = $current_title,
                p.current_company     = $current_company,
                p.current_location    = $current_location,
                p.linkedin_connections = $linkedin_connections
        """, {
            'id':                   pid,
            'full_name':            full_name,
            'linkedin_url':         r.get('linkedin_url', ''),
            'current_title':        r.get('current_title', ''),
            'current_company':      r.get('current_company_name', ''),
            'current_location':     r.get('current_location', ''),
            'linkedin_connections': linkedin_connections,
        })

        if (i + 1) % 50 == 0:
            print(f"  {i + 1}/{len(records)}")

    print(f"  {len(records)}/{len(records)} — done.\n")


# ── STEP 3: Company nodes + WORKED_AT edges ────────────────────────────────────

def load_companies(session, records: list) -> None:
    print("Loading Company nodes and WORKED_AT relationships...")
    count = 0
    for r in records:
        pid = r.get('id') or r.get('linkedin_url')
        for exp in r.get('experience', []):
            company = exp.get('company') or {}
            # company can be a dict or occasionally None
            if isinstance(company, dict):
                co_name = company.get('name', '')
                co_id   = company.get('id') or slugify(co_name)
            else:
                co_name = str(company)
                co_id   = slugify(co_name)
            if not co_name:
                continue

            session.run("MERGE (c:Company {id: $cid}) SET c.name = $name",
                        {'cid': co_id, 'name': co_name})
            session.run("""
                MATCH (p:Person {id: $pid}), (c:Company {id: $cid})
                MERGE (p)-[r:WORKED_AT {title: $title}]->(c)
                SET r.start_date = $start_date,
                    r.end_date   = $end_date,
                    r.is_current = $is_current
            """, {
                'pid':        pid,
                'cid':        co_id,
                'title':      exp.get('title', ''),
                'start_date': exp.get('start_date', ''),
                'end_date':   exp.get('end_date', ''),
                'is_current': exp.get('is_current', False) or exp.get('status') == 'ongoing',
            })
            count += 1

    print(f"  {count} WORKED_AT relationships created.\n")


# ── STEP 4: School nodes + STUDIED_AT edges ────────────────────────────────────

def load_schools(session, records: list) -> None:
    print("Loading School nodes and STUDIED_AT relationships...")
    count = 0
    for r in records:
        pid = r.get('id') or r.get('linkedin_url')
        for edu in r.get('education', []):
            school = edu.get('school') or {}
            if isinstance(school, str):
                s_name, s_id = school, slugify(school)
            elif isinstance(school, dict):
                s_name = school.get('name', '')
                s_id   = school.get('linkedin_id') or school.get('id') or slugify(s_name)
            else:
                continue
            if not s_name:
                continue

            # degrees and majors are lists in this dataset
            degrees = edu.get('degrees') or []
            majors  = edu.get('majors')  or []

            session.run("MERGE (s:School {id: $sid}) SET s.name = $name",
                        {'sid': s_id, 'name': s_name})
            session.run("""
                MATCH (p:Person {id: $pid}), (s:School {id: $sid})
                MERGE (p)-[r:STUDIED_AT]->(s)
                SET r.degrees = $degrees,
                    r.majors  = $majors,
                    r.start_date = $start_date,
                    r.end_date   = $end_date
            """, {
                'pid':        pid,
                'sid':        s_id,
                'degrees':    degrees,
                'majors':     majors,
                'start_date': edu.get('start_date', ''),
                'end_date':   edu.get('end_date', ''),
            })
            count += 1

    print(f"  {count} STUDIED_AT relationships created.\n")


# ── STEP 5: Derive KNOWS edges from shared orgs ────────────────────────────────

def derive_knows(session) -> None:
    print("Deriving KNOWS edges from shared employers and schools...")
    result = session.run("""
        MATCH (a:Person)-[:WORKED_AT|STUDIED_AT]->(org)<-[:WORKED_AT|STUDIED_AT]-(b:Person)
        WHERE id(a) < id(b)
        WITH a, b, collect(DISTINCT org.name) AS shared_orgs
        MERGE (a)-[k:KNOWS]->(b)
        SET k.weight     = size(shared_orgs),
            k.shared_orgs = shared_orgs
        RETURN count(*) AS total
    """)
    total = result.single()['total']
    print(f"  {total} KNOWS edges created.\n")


# ── MAIN ───────────────────────────────────────────────────────────────────────

def main():
    with open(DATA_PATH) as f:
        raw = json.load(f)
    records = raw['data'] if isinstance(raw, dict) else raw

    driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))
    with driver.session() as session:
        create_constraints(session)
        load_persons(session, records)
        load_companies(session, records)
        load_schools(session, records)
        derive_knows(session)

    driver.close()
    print("Ingestion complete.")


if __name__ == '__main__':
    main()
