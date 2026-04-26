"""
Runtime flow ingestion for website-specific analysis.

Uses Firecrawl `/v2/scrape` to render the homepage (markdown + outgoing
links), filters those links to same-origin pages whose path matches a flow
keyword, then scrapes each candidate. Returns the analyze-flow event input
shape consumed by the BERT classifier.
"""

from __future__ import annotations

import os
from urllib.parse import urlparse

import httpx
from dotenv import load_dotenv

load_dotenv()

FIRECRAWL_BASE_URL = os.getenv("FIRECRAWL_BASE_URL", "https://api.firecrawl.dev/v2")
FIRECRAWL_REQUEST_TIMEOUT = 90.0
FIRECRAWL_SCRAPE_TIMEOUT_MS = 30000

FLOW_KEYWORDS = (
    "checkout",
    "pricing",
    "plans",
    "cancel",
    "signup",
    "register",
    "trial",
    "account",
    "billing",
    "buy",
    "shop",
    "subscribe",
    "upgrade",
    "order",
    "payment",
    "premium",
    "purchase",
)

HIGH_RISK_KEYWORDS = ("checkout", "cancel", "pricing", "purchase", "buy", "billing")


def _truncate(text: str, max_len: int) -> str:
    if not text:
        return ""
    return text if len(text) <= max_len else text[:max_len]


def _coerce_str(value) -> str:
    if isinstance(value, list):
        return value[0] if value else ""
    return value or ""


def _firecrawl_client(api_key: str) -> httpx.Client:
    return httpx.Client(
        base_url=FIRECRAWL_BASE_URL,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        timeout=FIRECRAWL_REQUEST_TIMEOUT,
    )


def _firecrawl_scrape(client: httpx.Client, url: str, with_links: bool = False) -> tuple[str, str, str, list[str]]:
    """
    Returns (resolved_url, page_title, markdown, links). Raises on Firecrawl error.
    """
    formats: list[str] = ["markdown"]
    if with_links:
        formats.append("links")
    response = client.post(
        "/scrape",
        json={
            "url": url,
            "formats": formats,
            "onlyMainContent": True,
            "timeout": FIRECRAWL_SCRAPE_TIMEOUT_MS,
        },
    )
    response.raise_for_status()
    payload = response.json()
    if not payload.get("success", True):
        raise RuntimeError(f"Firecrawl /scrape returned failure: {payload}")
    data = payload.get("data") or {}
    metadata = data.get("metadata") or {}
    title = _coerce_str(metadata.get("title"))
    resolved_url = _coerce_str(metadata.get("url")) or url
    markdown = data.get("markdown") or ""
    links = data.get("links") or []
    return resolved_url, title, markdown, links


def _flow_id_from_url(url: str) -> str:
    path = (urlparse(url).path or "/").strip("/")
    return path.replace("/", "_") if path else "home"


def _select_candidate_urls(homepage_url: str, outgoing_links: list[str], max_candidates: int) -> list[str]:
    """
    Pick up to max_candidates same-origin URLs whose path matches a flow keyword.
    Sort by path length so brand-owned navigation paths (`/pricing`) outrank deep
    platform-hosted user content (`/some-user/Pricing-Plans-...`).
    """
    parsed_home = urlparse(homepage_url)
    same_origin = f"{parsed_home.scheme}://{parsed_home.netloc}"

    matches: list[tuple[int, str]] = []
    seen: set[str] = {homepage_url}
    for link in outgoing_links:
        if not link:
            continue
        parsed = urlparse(link)
        if f"{parsed.scheme}://{parsed.netloc}" != same_origin:
            continue
        path = parsed.path or "/"
        path_lower = path.lower()
        if not any(keyword in path_lower for keyword in FLOW_KEYWORDS):
            continue
        canonical = f"{parsed.scheme}://{parsed.netloc}{path}"
        if canonical in seen:
            continue
        seen.add(canonical)
        matches.append((len(path), canonical))

    matches.sort(key=lambda pair: pair[0])
    return [url for _, url in matches[:max_candidates]]


def collect_flow_events(website_url: str, max_steps: int = 8) -> dict:
    """
    Collect website-specific flow steps via Firecrawl and convert to the
    analyze-flow event input shape.
    """
    api_key = os.getenv("FIRECRAWL_API_KEY")
    if not api_key:
        raise RuntimeError("FIRECRAWL_API_KEY env var is not set")

    max_steps = max(1, min(max_steps, 12))

    with _firecrawl_client(api_key) as client:
        try:
            resolved_url, root_title, root_markdown, root_links = _firecrawl_scrape(
                client, website_url, with_links=True
            )
        except httpx.HTTPError as exc:
            raise RuntimeError(f"Firecrawl could not load {website_url}: {exc}") from exc

        events: list[dict] = [
            {
                "text": _truncate(root_markdown, max_len=4000),
                "flow_id": "root",
                "flow_step": 0,
                "url": resolved_url,
                "page_title": root_title or "Home",
            }
        ]
        discovered_flows: list[dict] = []
        flow_step_counters: dict[str, int] = {"root": 0}

        candidates = _select_candidate_urls(resolved_url, root_links, max_steps - 1)

        for candidate_url in candidates:
            try:
                page_url, page_title, page_markdown, _ = _firecrawl_scrape(
                    client, candidate_url, with_links=False
                )
            except httpx.HTTPError:
                continue
            except RuntimeError:
                continue

            flow_id = _flow_id_from_url(candidate_url)
            flow_step_counters[flow_id] = flow_step_counters.get(flow_id, -1) + 1
            display_title = page_title or flow_id

            events.append(
                {
                    "text": _truncate(page_markdown, max_len=4000),
                    "flow_id": flow_id,
                    "flow_step": flow_step_counters[flow_id],
                    "url": page_url,
                    "page_title": display_title,
                }
            )
            discovered_flows.append(
                {
                    "id": flow_id,
                    "title": display_title[:60],
                    "path": urlparse(candidate_url).path or "/",
                    "risk_hint": "HIGH"
                    if any(keyword in flow_id for keyword in HIGH_RISK_KEYWORDS)
                    else "MEDIUM",
                }
            )

    return {
        "events": events,
        "discovered_flows": discovered_flows,
        "pages_discovered": len(events),
    }
