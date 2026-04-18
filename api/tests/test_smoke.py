from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_ok():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_stats_shape():
    r = client.get("/stats")
    assert r.status_code == 200
    data = r.json()
    assert {"wallets_scanned", "flagged_today", "avg_risk_score"} <= data.keys()


def test_analyze_round_trip():
    addr = "0x" + "a" * 40
    r = client.post("/analyze", json={"address": addr})
    assert r.status_code == 200
    job = r.json()
    assert job["status"] == "complete"
    assert job["result"]["address"] == addr

    r2 = client.get(f"/analyze/{job['job_id']}")
    assert r2.status_code == 200
    assert r2.json()["job_id"] == job["job_id"]


def test_analyze_rejects_bad_address():
    r = client.post("/analyze", json={"address": "not-an-address"})
    assert r.status_code == 422


def test_feedback_accepts_ok():
    r = client.post(
        "/feedback",
        json={"prediction_id": "abc", "verdict": "correct"},
    )
    assert r.status_code == 200
    assert r.json()["ok"] is True
