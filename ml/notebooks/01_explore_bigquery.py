"""Notebook 01 — explore BigQuery Ethereum dataset.

Goal for week 2: pull a small, partitioned slice of transactions touching
known Tornado Cash pools; write to Drive as Parquet; verify we're under
BigQuery free-tier budget.

Open in Colab, run 00_colab_setup first.
"""

# ruff: noqa

from google.cloud import bigquery

PROJECT = "YOUR_GCP_PROJECT"  # fill in
client = bigquery.Client(project=PROJECT)

# ---- Budget-safe query ----
# ALWAYS filter on block_timestamp partition. This query estimates ~1 GB scan.
# Set a dry-run check before executing.

SQL = """
SELECT
    from_address,
    to_address,
    value / 1e18 AS value_eth,
    gas,
    block_timestamp,
    transaction_hash
FROM `bigquery-public-data.crypto_ethereum.transactions`
WHERE block_timestamp BETWEEN TIMESTAMP('2024-01-01') AND TIMESTAMP('2024-01-07')
    AND (
        from_address IN UNNEST(@tornado_pools)
        OR to_address IN UNNEST(@tornado_pools)
    )
"""

TORNADO_POOLS = [
    "0x12d66f87a04a9e220743712ce6d9bb1b5616b8fc",  # 0.1 ETH
    "0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936",  # 1 ETH
    "0x910cbd523d972eb0a6f4cae4618ad62622b39dbf",  # 10 ETH
    "0xa160cdab225685da1d56aa342ad8841c3b53f291",  # 100 ETH
]

def run():
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ArrayQueryParameter("tornado_pools", "STRING", TORNADO_POOLS),
        ],
        dry_run=True,  # flip to False after you check the billed bytes
    )
    job = client.query(SQL, job_config=job_config)
    print(f"Estimated scan: {job.total_bytes_processed / 1e9:.2f} GB")
    return job


if __name__ == "__main__":
    run()
