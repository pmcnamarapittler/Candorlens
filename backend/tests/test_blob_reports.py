from backend.services import blob_reports


def test_local_report_save_and_get(monkeypatch, tmp_path):
    monkeypatch.setenv("REPORT_STORAGE_BACKEND", "local")
    monkeypatch.setenv("REPORT_STORAGE_PATH", str(tmp_path))

    payload = {"url": "https://example.com", "summary": "ok", "labels": ["forced_continuity"]}
    blob_reports.save_report("https://example.com", payload)

    loaded = blob_reports.get_report("https://example.com")
    assert loaded == payload


def test_local_report_missing_returns_none(monkeypatch, tmp_path):
    monkeypatch.setenv("REPORT_STORAGE_BACKEND", "local")
    monkeypatch.setenv("REPORT_STORAGE_PATH", str(tmp_path))

    loaded = blob_reports.get_report("https://missing.example.com")
    assert loaded is None


def test_local_report_corrupt_file_returns_none(monkeypatch, tmp_path):
    monkeypatch.setenv("REPORT_STORAGE_BACKEND", "local")
    monkeypatch.setenv("REPORT_STORAGE_PATH", str(tmp_path))

    reports_dir = blob_reports._get_local_reports_dir()
    reports_dir.mkdir(parents=True, exist_ok=True)
    path = reports_dir / blob_reports._url_to_blob_name("https://example.com")
    path.write_text("{invalid json", encoding="utf-8")

    loaded = blob_reports.get_report("https://example.com")
    assert loaded is None

