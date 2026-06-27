"""
Exploratory analysis of x-connections.json before ingestion.
Prints a structural summary: record count, field coverage, data shape.
"""

import json
import os
from collections import Counter

DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'x-connections.json')


def main():
    with open(DATA_PATH) as f:
        raw = json.load(f)

    records = raw['data'] if isinstance(raw, dict) else raw
    total = len(records)
    print(f"Total records: {total}\n")

    # Top-level keys
    all_keys = Counter()
    for r in records:
        all_keys.update(r.keys())
    print("Top-level keys (coverage out of total):")
    for key, count in sorted(all_keys.items(), key=lambda x: -x[1]):
        pct = count / total * 100
        print(f"  {key:<30s} {count:>3}/{total}  ({pct:.0f}%)")

    # Experience depth
    exp_lengths = [len(r.get('experience', [])) for r in records]
    print(f"\nExperience entries per person:")
    print(f"  min={min(exp_lengths)}  max={max(exp_lengths)}  avg={sum(exp_lengths)/total:.1f}")
    print(f"  People with 0 experience: {exp_lengths.count(0)}")

    # Education depth
    edu_lengths = [len(r.get('education', [])) for r in records]
    print(f"\nEducation entries per person:")
    print(f"  min={min(edu_lengths)}  max={max(edu_lengths)}  avg={sum(edu_lengths)/total:.1f}")
    print(f"  People with 0 education: {edu_lengths.count(0)}")

    # Social media coverage
    has_social = sum(1 for r in records if r.get('social_media'))
    linkedin_active = 0
    for r in records:
        for s in r.get('social_media', []):
            if s.get('network') == 'linkedin' and s.get('url_status') == 'active':
                linkedin_active += 1
                break
    print(f"\nSocial media:")
    print(f"  Has social_media field: {has_social}/{total}")
    print(f"  Active LinkedIn URL:    {linkedin_active}/{total}")

    # Location type variance (string vs list)
    loc_types = Counter()
    for r in records:
        loc = r.get('current_location')
        loc_types[type(loc).__name__] += 1
    print(f"\ncurrent_location types: {dict(loc_types)}")

    # Company field shape in experience
    company_types = Counter()
    for r in records:
        for exp in r.get('experience', []):
            c = exp.get('company')
            company_types[type(c).__name__] += 1
    print(f"\ncompany field types in experience: {dict(company_types)}")

    # Sample record (truncated)
    sample = records[0]
    print(f"\nSample record — {sample.get('first_name')} {sample.get('last_name')}:")
    print(f"  current_title:   {sample.get('current_title')}")
    print(f"  current_company: {sample.get('current_company_name')}")
    print(f"  experience:      {len(sample.get('experience', []))} entries")
    print(f"  education:       {len(sample.get('education', []))} entries")


if __name__ == '__main__':
    main()
