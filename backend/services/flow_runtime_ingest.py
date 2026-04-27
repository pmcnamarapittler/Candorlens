"""
Runtime flow ingestion for website-specific analysis.

Uses Firecrawl `/v2/scrape` to render the homepage (markdown + outgoing
links), filters those links to same-origin pages whose path matches a flow
keyword, then scrapes each candidate. Returns the analyze-flow event input
shape consumed by the BERT classifier.
"""

from __future__ import annotations

import os
import re
from urllib.parse import urljoin, urlparse

import httpx
from dotenv import load_dotenv

load_dotenv()

FIRECRAWL_BASE_URL = os.getenv("FIRECRAWL_BASE_URL", "https://api.firecrawl.dev/v2")
FIRECRAWL_REQUEST_TIMEOUT = 90.0
FIRECRAWL_SCRAPE_TIMEOUT_MS = 30000
MIN_LINKS_BEFORE_MAP_FALLBACK = 3

FLOW_KEYWORDS = (
    "product",
    "products",
    "ai-detector",
    "advanced",
    "scan",
    "checker",
    "plagiarism",
    "grammar",
    "api",
    "integrations",
    "contact-sales",
    "demo",
    "chrome",
    "docs",
    "solutions",
    "resources",
    "industries",
    "industry",
    "customers",
    "customer",
    "events",
    "learning",
    "login",
    "contact",
    "sales",
    "service",
    "marketing",
    "commerce",
    "platform",
    "small-business",
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

HIGH_RISK_KEYWORDS = ("checkout", "cancel", "pricing", "purchase", "buy", "billing", "subscribe")
MEDIUM_RISK_KEYWORDS = ("api", "integrations", "demo", "contact-sales", "signup", "trial")
TOP_LEVEL_FLOW_PATHS = {
    "products",
    "industries",
    "industry",
    "customers",
    "customer",
    "events",
    "learning",
    "pricing",
    "login",
    "contact",
    "contact-us",
    "solutions",
    "small-business",
    "sales",
    "service",
    "marketing",
    "commerce",
    "platform",
    "api",
    "integrations",
    "chrome",
}
TOP_LEVEL_FLOW_PRIORITY = {
    "products": 0,
    "industries": 1,
    "industry": 1,
    "customers": 2,
    "customer": 2,
    "events": 3,
    "learning": 4,
    "pricing": 5,
    "sales": 6,
    "service": 7,
    "commerce": 8,
    "marketing": 9,
    "platform": 10,
    "solutions": 11,
    "small-business": 12,
    "api": 13,
    "integrations": 14,
    "chrome": 15,
    "login": 16,
    "contact": 17,
    "contact-us": 17,
}
LOW_VALUE_PATH_KEYWORDS = (
    "blog",
    "news",
    "press",
    "privacy",
    "terms",
    "legal",
    "cookies",
    "careers",
    "jobs",
    "assets",
)
MARKDOWN_LINK_RE = re.compile(r"\[[^\]]+\]\(([^)]+)\)")


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


def _firecrawl_scrape(
    client: httpx.Client,
    url: str,
    with_links: bool = False,
    only_main_content: bool = True,
) -> tuple[str, str, str, list]:
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
            "onlyMainContent": only_main_content,
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


def _firecrawl_map(client: httpx.Client, url: str, limit: int) -> list[str]:
    """
    Bounded URL discovery fallback. Firecrawl deployments may return links either
    at top level or under data.links; tolerate both shapes.
    """
    response = client.post(
        "/map",
        json={
            "url": url,
            "limit": limit,
        },
    )
    response.raise_for_status()
    payload = response.json()
    data = payload.get("data") if isinstance(payload, dict) else None
    if isinstance(data, dict):
        links = data.get("links") or data.get("urls") or []
    elif isinstance(payload, dict):
        links = payload.get("links") or payload.get("urls") or []
    else:
        links = []
    return [_coerce_str(link.get("url") if isinstance(link, dict) else link) for link in links]


def _flow_id_from_url(url: str) -> str:
    path = (urlparse(url).path or "/").strip("/")
    return path.replace("/", "_") if path else "home"


def _same_site_host(hostname: str | None) -> str:
    if not hostname:
        return ""
    hostname = hostname.lower()
    return hostname[4:] if hostname.startswith("www.") else hostname


def _extract_markdown_links(markdown: str) -> list[str]:
    return [match.group(1) for match in MARKDOWN_LINK_RE.finditer(markdown or "")]


def _candidate_score(path: str) -> int:
    lower = path.strip("/").lower()
    if not lower:
        return -100
    if lower in TOP_LEVEL_FLOW_PATHS:
        return 140
    if any(keyword in lower for keyword in HIGH_RISK_KEYWORDS):
        return 130 if "/" not in lower else 95
    if any(keyword in lower for keyword in FLOW_KEYWORDS):
        return 90 if "/" not in lower else 70
    if any(keyword in lower for keyword in LOW_VALUE_PATH_KEYWORDS):
        return 10
    if "/" not in lower:
        return 50
    return 25


def _candidate_priority(path: str) -> int:
    lower = path.strip("/").lower()
    if lower in TOP_LEVEL_FLOW_PRIORITY:
        return TOP_LEVEL_FLOW_PRIORITY[lower]
    for keyword, priority in TOP_LEVEL_FLOW_PRIORITY.items():
        if keyword in lower:
            return priority
    return 100


def _select_candidate_urls_with_debug(
    homepage_url: str, outgoing_links: list, max_candidates: int
) -> tuple[list[str], dict]:
    """
    Pick up to max_candidates same-site URLs, preferring high-value flow paths.
    """
    parsed_home = urlparse(homepage_url)
    home_site = _same_site_host(parsed_home.hostname)

    candidates: list[tuple[int, int, str]] = []
    seen: set[str] = {homepage_url}
    skipped_reason_counts: dict[str, int] = {}
    same_origin_links = 0

    def skip(reason: str) -> None:
        skipped_reason_counts[reason] = skipped_reason_counts.get(reason, 0) + 1

    for link in outgoing_links:
        if not link:
            skip("empty")
            continue
        raw_link = _coerce_str(link.get("url") if isinstance(link, dict) else link)
        if not raw_link or raw_link.startswith(("mailto:", "tel:", "javascript:", "#")):
            skip("non_http")
            continue
        absolute_link = urljoin(homepage_url, raw_link)
        parsed = urlparse(absolute_link)
        if parsed.scheme not in ("http", "https"):
            skip("non_http")
            continue
        if _same_site_host(parsed.hostname) != home_site:
            skip("offsite")
            continue
        same_origin_links += 1
        path = parsed.path or "/"
        if path in ("", "/"):
            skip("root")
            continue
        path_lower = path.lower()
        canonical = f"{parsed.scheme}://{parsed.netloc}{path.rstrip('/') or '/'}"
        if canonical in seen:
            skip("duplicate")
            continue
        seen.add(canonical)
        score = _candidate_score(path_lower)
        if score <= 0:
            skip("low_value")
            continue
        candidates.append((-score, _candidate_priority(path_lower), len(path), canonical))

    candidates.sort(key=lambda item: (item[0], item[1], item[2], item[3]))
    selected = [url for _, _, _, url in candidates[:max_candidates]]
    debug = {
        "links_returned": len(outgoing_links),
        "same_origin_links": same_origin_links,
        "candidate_urls": selected,
        "skipped_reason_counts": skipped_reason_counts,
        "fallback_used": False,
    }
    return selected, debug


def _select_candidate_urls(homepage_url: str, outgoing_links: list[str], max_candidates: int) -> list[str]:
    selected, _ = _select_candidate_urls_with_debug(homepage_url, outgoing_links, max_candidates)
    return selected


def _risk_hint_from_flow_id(flow_id: str) -> str:
    flow_id_lower = flow_id.lower()
    if any(keyword in flow_id_lower for keyword in HIGH_RISK_KEYWORDS):
        return "HIGH"
    if any(keyword in flow_id_lower for keyword in MEDIUM_RISK_KEYWORDS):
        return "MEDIUM"
    return "LOW"


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
                client, website_url, with_links=True, only_main_content=False
            )
        except httpx.HTTPError as exc:
            raise RuntimeError(f"Firecrawl could not load {website_url}: {exc}") from exc

        root_links = [*root_links, *_extract_markdown_links(root_markdown)]
        discovery_debug = {
            "root_url": website_url,
            "resolved_url": resolved_url,
            "links_returned": len(root_links),
            "same_origin_links": 0,
            "candidate_urls": [],
            "fallback_used": False,
            "skipped_reason_counts": {},
        }

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

        candidates, selection_debug = _select_candidate_urls_with_debug(
            resolved_url, root_links, max_steps - 1
        )
        discovery_debug.update(selection_debug)

        if len(candidates) < min(max_steps - 1, MIN_LINKS_BEFORE_MAP_FALLBACK):
            try:
                mapped_links = _firecrawl_map(client, resolved_url, limit=max_steps * 4)
                mapped_candidates, mapped_debug = _select_candidate_urls_with_debug(
                    resolved_url, mapped_links, max_steps - 1
                )
                if len(mapped_candidates) > len(candidates):
                    candidates = mapped_candidates
                    discovery_debug.update(mapped_debug)
                    discovery_debug["fallback_used"] = True
                    discovery_debug["links_returned"] = len(root_links) + len(mapped_links)
            except httpx.HTTPError:
                discovery_debug["map_error"] = "Firecrawl map fallback failed"
            except RuntimeError:
                discovery_debug["map_error"] = "Firecrawl map fallback failed"

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
                    "risk_hint": _risk_hint_from_flow_id(flow_id),
                }
            )

    return {
        "events": events,
        "discovered_flows": discovered_flows,
        "pages_discovered": len(events),
        "discovery_debug": discovery_debug,
    }
