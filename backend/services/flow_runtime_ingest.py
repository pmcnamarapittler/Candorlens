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
# If true, Firecrawl strips nav/secondary content — good for noise, bad for sparse SPAs.
# Set FIRECRAWL_ONLY_MAIN_CONTENT=false in .env when many sites return almost empty markdown.
MIN_MARKDOWN_CHARS_FOR_FULL_PAGE_RETRY = 200


def _only_main_content_default_true() -> bool:
    v = (os.getenv("FIRECRAWL_ONLY_MAIN_CONTENT") or "true").lower().strip()
    return v not in ("0", "false", "no", "off")

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
    "family",
    "student",
    "individual",
    "purchase",
)

# High-risk paths get the largest score boost in candidate selection because
# they are the most likely to contain dark-pattern language (forced
# continuity, hidden cancellation, etc).
HIGH_RISK_KEYWORDS = (
    "checkout",
    "cancel",
    "pricing",
    "purchase",
    "buy",
    "billing",
    "subscribe",
    "premium",
    "plans",
    "trial",
    "signup",
    "upgrade",
)
MEDIUM_RISK_KEYWORDS = ("api", "integrations", "demo", "contact-sales", "signup", "trial")
TOP_LEVEL_FLOW_PATHS = {
    "pricing",
    "premium",
    "plans",
    "checkout",
    "subscribe",
    "trial",
    "signup",
    "sign-up",
    "upgrade",
    "billing",
    "purchase",
    "buy",
    "cancel",
    "family",
    "student",
    "products",
    "industries",
    "industry",
    "customers",
    "customer",
    "events",
    "learning",
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
# Lower number = higher priority (sorted ascending). Subscription/billing
# flows are highest because that's where forced-continuity violations live.
TOP_LEVEL_FLOW_PRIORITY = {
    "pricing": 0,
    "premium": 0,
    "plans": 0,
    "checkout": 1,
    "subscribe": 1,
    "trial": 1,
    "signup": 2,
    "sign-up": 2,
    "upgrade": 2,
    "billing": 2,
    "purchase": 2,
    "buy": 2,
    "cancel": 2,
    "family": 3,
    "student": 3,
    "products": 4,
    "industries": 5,
    "industry": 5,
    "customers": 6,
    "customer": 6,
    "events": 7,
    "learning": 8,
    "sales": 9,
    "service": 10,
    "commerce": 11,
    "marketing": 12,
    "platform": 13,
    "solutions": 14,
    "small-business": 15,
    "api": 16,
    "integrations": 17,
    "chrome": 18,
    "login": 19,
    "contact": 20,
    "contact-us": 20,
}

# Common commerce / subscription paths to attempt on every site, even if the
# homepage doesn't link to them. Many SPAs (Spotify, etc.) redirect their root
# to a player or login that hides the marketing pages — probing these paths
# directly recovers the dark-pattern surface.
PROBE_PATH_SUFFIXES = (
    "/pricing",
    "/plans",
    "/premium",
    "/subscribe",
    "/upgrade",
    "/signup",
    "/sign-up",
    "/checkout",
    "/cancel",
    "/family",
    "/student",
    "/trial",
    "/free-trial",
    "/buy",
    "/account/billing",
    "/account/cancel",
    # Locale-prefixed variants for sites that use /us/, /en/, etc.
    "/us/premium",
    "/us/family",
    "/us/student",
    "/us/pricing",
    "/us/plans",
    "/en-us/pricing",
    "/en/pricing",
)
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
    # Subscription/billing keywords always rank highest, even when nested
    # under a locale path (e.g. /us/premium, /en-us/pricing).
    if any(keyword in lower for keyword in HIGH_RISK_KEYWORDS):
        return 145 if "/" not in lower else 120
    if lower in TOP_LEVEL_FLOW_PATHS:
        return 140
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
    # Iterate from highest priority (lowest number) to lowest so the
    # most-relevant keyword wins when several are substrings of the path.
    for keyword, priority in sorted(
        TOP_LEVEL_FLOW_PRIORITY.items(), key=lambda kv: kv[1]
    ):
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


def _canonical_url(url: str) -> str:
    """Lowercase host + trim trailing slash so probe-vs-discovered dedupe is
    stable across (`https://x.com/foo`, `https://X.com/foo/`)."""
    if not url:
        return ""
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    netloc = host
    if parsed.port:
        netloc = f"{host}:{parsed.port}"
    path = parsed.path or "/"
    if len(path) > 1:
        path = path.rstrip("/")
    return f"{parsed.scheme}://{netloc}{path}"


def _build_probe_urls(website_url: str, resolved_url: str) -> list[str]:
    """Generate well-known commerce paths to attempt on every site.

    Many SPAs (Spotify, etc.) redirect their homepage to a player or login
    that hides marketing copy. Probing predictable paths recovers the
    dark-pattern surface even when the homepage links don't expose them.
    Probes both the user-supplied origin and the resolved origin so a
    `www.spotify.com → open.spotify.com` redirect doesn't lose the
    marketing host.
    """
    origins: list[str] = []
    seen_origins: set[str] = set()
    for raw_url in (website_url, resolved_url):
        if not raw_url:
            continue
        parsed = urlparse(raw_url)
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            continue
        origin = f"{parsed.scheme}://{parsed.netloc}"
        if origin not in seen_origins:
            seen_origins.add(origin)
            origins.append(origin)

    probes: list[str] = []
    seen: set[str] = set()
    for origin in origins:
        for suffix in PROBE_PATH_SUFFIXES:
            candidate = f"{origin}{suffix}"
            canonical = _canonical_url(candidate)
            if canonical and canonical not in seen:
                seen.add(canonical)
                probes.append(candidate)
    return probes


def _scrape_with_retry(
    client: httpx.Client,
    url: str,
    *,
    with_links: bool = False,
) -> tuple[str, str, str, list]:
    """Scrape `url`, falling back to onlyMainContent=false if the first pass
    returns thin content. Returns (resolved_url, title, markdown, links)."""
    use_main = _only_main_content_default_true()
    resolved_url, title, markdown, links = _firecrawl_scrape(
        client, url, with_links=with_links, only_main_content=use_main
    )
    if use_main and len((markdown or "").strip()) < MIN_MARKDOWN_CHARS_FOR_FULL_PAGE_RETRY:
        try:
            ru, rt, md, lk = _firecrawl_scrape(
                client, url, with_links=with_links, only_main_content=False
            )
            if len((md or "").strip()) > len((markdown or "").strip()):
                return ru, rt, md, lk
        except (httpx.HTTPError, RuntimeError):
            pass
    return resolved_url, title, markdown, links


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
            resolved_url, root_title, root_markdown, root_links = _scrape_with_retry(
                client, website_url, with_links=True
            )
        except httpx.HTTPError as exc:
            raise RuntimeError(f"Firecrawl could not load {website_url}: {exc}") from exc

        root_links = [*root_links, *_extract_markdown_links(root_markdown)]
        discovery_debug: dict = {
            "root_url": website_url,
            "resolved_url": resolved_url,
            "links_returned": len(root_links),
            "same_origin_links": 0,
            "candidate_urls": [],
            "fallback_used": False,
            "probe_paths_used": False,
            "duplicates_skipped": 0,
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
        # Track resolved canonical URLs we already have content for so that
        # multiple discovery sources (links → map fallback → probes) and
        # post-redirect collisions (intl-ar → open.spotify.com) don't all
        # end up as duplicate events.
        seen_resolved: set[str] = {_canonical_url(resolved_url)}
        duplicates_skipped = 0

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

        # Always add high-value commerce probes after link-based discovery.
        # They're appended (not prepended) so the link-based candidates keep
        # priority, but they fill empty slots and recover marketing pages
        # whose paths are predictable but not linked from the rendered
        # homepage (Spotify Premium, /pricing, /checkout, etc.).
        probe_urls = _build_probe_urls(website_url, resolved_url)
        if probe_urls:
            existing = {_canonical_url(c) for c in candidates}
            existing.update(seen_resolved)
            for probe in probe_urls:
                key = _canonical_url(probe)
                if key and key not in existing:
                    candidates.append(probe)
                    existing.add(key)
            discovery_debug["probe_paths_used"] = True

        for candidate_url in candidates:
            if len(events) - 1 >= max_steps - 1:
                break
            try:
                page_url, page_title, page_markdown, _ = _scrape_with_retry(
                    client, candidate_url, with_links=False
                )
            except httpx.HTTPError:
                continue
            except RuntimeError:
                continue

            resolved_key = _canonical_url(page_url or candidate_url)
            if resolved_key in seen_resolved:
                # Skip pages that, after following redirects, point at a URL
                # we've already scraped (e.g. Spotify intl-* → player).
                duplicates_skipped += 1
                continue
            seen_resolved.add(resolved_key)

            # Skip thin pages — usually a 404, captcha, or bot wall — so we
            # don't pad the audit with empty content that drags scoring noise.
            if len((page_markdown or "").strip()) < MIN_MARKDOWN_CHARS_FOR_FULL_PAGE_RETRY:
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

        discovery_debug["duplicates_skipped"] = duplicates_skipped

    return {
        "events": events,
        "discovered_flows": discovered_flows,
        "pages_discovered": len(events),
        "discovery_debug": discovery_debug,
    }
