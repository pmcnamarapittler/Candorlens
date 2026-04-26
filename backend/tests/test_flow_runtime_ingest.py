from backend.services.flow_runtime_ingest import _risk_hint_from_flow_id, _select_candidate_urls


def test_select_candidate_urls_resolves_relative_gptzero_links():
    links = [
        "/ai-detector",
        "/advanced-ai-scan",
        "/plagiarism-checker",
        "/grammar-checker",
        "/api",
        "https://external.example/pricing",
    ]

    selected = _select_candidate_urls("https://gptzero.me/", links, max_candidates=4)

    assert selected == [
        "https://gptzero.me/api",
        "https://gptzero.me/ai-detector",
        "https://gptzero.me/grammar-checker",
        "https://gptzero.me/advanced-ai-scan",
    ]


def test_select_candidate_urls_falls_back_to_same_origin_navigation():
    links = ["/about", "/team", "/blog", "/careers"]

    selected = _select_candidate_urls("https://example.com/", links, max_candidates=3)

    assert selected == [
        "https://example.com/team",
        "https://example.com/blog",
        "https://example.com/about",
    ]


def test_risk_hint_uses_flow_keywords():
    assert _risk_hint_from_flow_id("checkout") == "HIGH"
    assert _risk_hint_from_flow_id("api") == "MEDIUM"
    assert _risk_hint_from_flow_id("about") == "LOW"
