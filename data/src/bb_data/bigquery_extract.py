"""Budget-safe BigQuery extraction.

Rules:
1. Always filter on `block_timestamp` (partition column).
2. Always dry-run first; abort if the estimated scan > SAFE_GB.
3. Write output as Parquet to R2 (or Drive during dev).
"""

from __future__ import annotations

import argparse
import os
import sys
from dataclasses import dataclass
from datetime import date

from google.cloud import bigquery

SAFE_GB = 5  # hard ceiling per query

TRANSFER_QUERY = """
SELECT
    from_address,
    to_address,
    value / 1e18 AS value_eth,
    gas,
    block_timestamp,
    transaction_hash
FROM `bigquery-public-data.crypto_ethereum.transactions`
WHERE block_timestamp >= TIMESTAMP(@start_ts)
    AND block_timestamp < TIMESTAMP(@end_ts)
"""


@dataclass
class ExtractJob:
    start: date
    end: date
    output_uri: str
    project: str


def estimate_bytes(client: bigquery.Client, query: str, params: list) -> int:
    job_config = bigquery.QueryJobConfig(query_parameters=params, dry_run=True)
    job = client.query(query, job_config=job_config)
    return job.total_bytes_processed or 0


def extract(job: ExtractJob) -> None:
    client = bigquery.Client(project=job.project)
    params = [
        bigquery.ScalarQueryParameter("start_ts", "STRING", job.start.isoformat()),
        bigquery.ScalarQueryParameter("end_ts", "STRING", job.end.isoformat()),
    ]

    est_bytes = estimate_bytes(client, TRANSFER_QUERY, params)
    est_gb = est_bytes / 1e9
    print(f"[bigquery] estimated scan: {est_gb:.2f} GB")
    if est_gb > SAFE_GB:
        print(f"[bigquery] ABORT: exceeds SAFE_GB={SAFE_GB}", file=sys.stderr)
        sys.exit(2)

    print("[bigquery] running...")
    job_config = bigquery.QueryJobConfig(query_parameters=params)
    rows = client.query(TRANSFER_QUERY, job_config=job_config).to_dataframe()
    print(f"[bigquery] {len(rows):,} rows")

    rows.to_parquet(job.output_uri, index=False)
    print(f"[bigquery] wrote {job.output_uri}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", type=date.fromisoformat, required=True)
    parser.add_argument("--end", type=date.fromisoformat, required=True)
    parser.add_argument("--out", required=True, help="output parquet URI or local path")
    parser.add_argument("--project", default=os.environ.get("GCP_PROJECT_ID"))
    args = parser.parse_args()
    if not args.project:
        print("GCP_PROJECT_ID not set", file=sys.stderr)
        sys.exit(1)

    extract(ExtractJob(start=args.start, end=args.end, output_uri=args.out, project=args.project))


if __name__ == "__main__":
    main()
