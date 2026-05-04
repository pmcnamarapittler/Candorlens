from backend.services import flow_runtime_ingest
from backend.services.flow_runtime_ingest import _risk_hint_from_flow_id, _select_candidate_urls


class FakeFirecrawlResponse:
    def __init__(self, payload):
        self.payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self.payload


class FakeFirecrawlClient:
    def __init__(self):
        self.posts = []

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return None

    def post(self, endpoint, json):
        self.posts.append((endpoint, json))
        if endpoint == "/map":
            return FakeFirecrawlResponse(
                {
                    "success": True,
                    "data": {
                        "links": [
                            "https://www.salesforce.com/products/",
                            "https://www.salesforce.com/industries/",
                        ]
                    },
                }
            )
        scrape_url = json.get("url", "") if endpoint == "/scrape" else ""
        if endpoint == "/scrape" and scrape_url.rstrip("/").endswith("/products"):
            return FakeFirecrawlResponse(
                {
                    "success": True,
                    "data": {
                        "metadata": {"url": scrape_url, "title": "Products"},
                        # Long enough to clear MIN_MARKDOWN_CHARS_FOR_FULL_PAGE_RETRY
                        # so collect_flow_events keeps the event (real scrapes
                        # always return >200 chars).
                        "markdown": "Products page. " + ("Lorem ipsum dolor sit amet. " * 20),
                    },
                }
            )
        if endpoint == "/scrape" and scrape_url.rstrip("/").endswith("/industries"):
            return FakeFirecrawlResponse(
                {
                    "success": True,
                    "data": {
                        "metadata": {"url": scrape_url, "title": "Industries"},
                        "markdown": "Industries page. " + ("Lorem ipsum dolor sit amet. " * 20),
                    },
                }
            )
        return FakeFirecrawlResponse(
            {
                "success": True,
                "data": {
                    "metadata": {"url": "https://www.salesforce.com/", "title": "Salesforce"},
                    # Real homepages return rich markdown; mirror that so the
                    # root event isn't filtered by the thin-page guard.
                    "markdown": "Home. " + ("Welcome to Salesforce. " * 30),
                    "links": [],
                },
            }
        )


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
        "https://example.com/about",
        "https://example.com/blog",
    ]


def test_select_candidate_urls_treats_www_as_same_site_and_scores_salesforce_navigation():
    links = [
        "https://www.salesforce.com/products/",
        "https://www.salesforce.com/industries/",
        "https://www.salesforce.com/customers/",
        "https://www.salesforce.com/events/",
        "https://www.salesforce.com/learning/",
        "https://www.salesforce.com/login/",
        "https://external.example/products/",
    ]

    selected = _select_candidate_urls("https://salesforce.com/", links, max_candidates=6)

    assert selected == [
        "https://www.salesforce.com/products",
        "https://www.salesforce.com/industries",
        "https://www.salesforce.com/customers",
        "https://www.salesforce.com/events",
        "https://www.salesforce.com/learning",
        "https://www.salesforce.com/login",
    ]


def test_collect_flow_events_uses_map_fallback_when_homepage_links_are_sparse(monkeypatch):
    fake_client = FakeFirecrawlClient()
    monkeypatch.setenv("FIRECRAWL_API_KEY", "test-key")
    monkeypatch.setattr(flow_runtime_ingest, "_firecrawl_client", lambda api_key: fake_client)

    payload = flow_runtime_ingest.collect_flow_events("https://www.salesforce.com/", max_steps=4)

    assert payload["discovery_debug"]["fallback_used"] is True
    assert [flow["path"] for flow in payload["discovered_flows"]] == ["/products", "/industries"]
    assert any(endpoint == "/map" for endpoint, _ in fake_client.posts)
    first_scrape_payload = next(json for endpoint, json in fake_client.posts if endpoint == "/scrape")
    assert first_scrape_payload["onlyMainContent"] is True


def test_risk_hint_uses_flow_keywords():
    assert _risk_hint_from_flow_id("checkout") == "HIGH"
    assert _risk_hint_from_flow_id("api") == "MEDIUM"
    assert _risk_hint_from_flow_id("about") == "LOW"
