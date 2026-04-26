"""
Runtime flow ingestion for website-specific analysis.
Uses Playwright to collect page text/CTA labels and converts to analyze-flow events.
"""

from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urljoin, urlparse

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

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


@dataclass
class CollectedStep:
    flow_id: str
    flow_step: int
    url: str
    page_title: str
    text: str
    cta_labels: list[str]


def _compact_text(value: str, max_len: int = 3000) -> str:
    return " ".join((value or "").split())[:max_len]


def _extract_cta_labels(page) -> list[str]:
    try:
        labels = page.evaluate(
            """() => {
                const els = document.querySelectorAll('button, a, [role="button"], input[type="submit"]');
                return Array.from(els)
                  .map(el => (el.innerText || el.value || '').trim())
                  .filter(Boolean)
                  .slice(0, 25);
            }"""
        )
        return labels or []
    except Exception:
        return []


def _extract_text(page) -> str:
    try:
        body = page.evaluate("() => document.body ? document.body.innerText : ''")
        return _compact_text(body, max_len=5000)
    except Exception:
        return ""


def _safe_goto(page, url: str, timeout_ms: int) -> None:
    """
    Navigate and give SPAs a chance to hydrate. After domcontentloaded, briefly
    wait for the body to render visible text. The wait is best-effort — sites
    with persistent polling never reach networkidle, so we cap at 5s.
    """
    page.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)
    try:
        page.wait_for_function(
            "() => document.body && document.body.innerText.trim().length > 100",
            timeout=5000,
        )
    except Exception:
        pass


def _discover_candidate_links(page, base_url: str, limit: int = 8) -> list[str]:
    parsed_base = urlparse(base_url)
    same_origin = f"{parsed_base.scheme}://{parsed_base.netloc}"

    try:
        hrefs = page.evaluate(
            """() => Array.from(document.querySelectorAll('a[href]'))
                .map(a => a.getAttribute('href'))
                .filter(Boolean)"""
        )
    except Exception:
        hrefs = []

    candidates: list[str] = []
    for href in hrefs or []:
        absolute = urljoin(base_url, href)
        parsed = urlparse(absolute)
        if f"{parsed.scheme}://{parsed.netloc}" != same_origin:
            continue
        path_lower = (parsed.path or "").lower()
        if not any(k in path_lower for k in FLOW_KEYWORDS):
            continue
        cleaned = f"{parsed.scheme}://{parsed.netloc}{parsed.path or '/'}"
        if cleaned not in candidates:
            candidates.append(cleaned)
        if len(candidates) >= limit:
            break
    return candidates


def collect_flow_events(website_url: str, max_steps: int = 8) -> dict:
    """
    Collect website-specific flow steps and convert to analyze-flow event input shape.
    Performs 2-hop discovery: links matching flow keywords are followed from the
    homepage, and additional candidate links are harvested from each visited page
    until max_steps is reached.
    """
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as exc:
        raise RuntimeError("Playwright is required for runtime flow collection") from exc

    max_steps = max(1, min(max_steps, 12))
    collected: list[CollectedStep] = []
    discovered_flows: list[dict] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            context = browser.new_context(
                viewport={"width": 1420, "height": 900},
                user_agent=USER_AGENT,
            )
            page = context.new_page()
            try:
                _safe_goto(page, website_url, timeout_ms=25000)
            except Exception as exc:
                raise RuntimeError(f"Could not load website: {exc}") from exc

            root_text = _extract_text(page)
            root_cta = _extract_cta_labels(page)
            collected.append(
                CollectedStep(
                    flow_id="root",
                    flow_step=0,
                    url=page.url,
                    page_title=page.title() or "Home",
                    text=root_text,
                    cta_labels=root_cta,
                )
            )

            visited: set[str] = {page.url}
            queue: list[tuple[int, str]] = [
                (1, link)
                for link in _discover_candidate_links(page, page.url, limit=max_steps - 1)
                if link not in visited
            ]
            for _, link in queue:
                visited.add(link)

            qi = 0
            flow_step_counters: dict[str, int] = {}
            while qi < len(queue) and len(collected) < max_steps:
                depth, link = queue[qi]
                qi += 1
                try:
                    _safe_goto(page, link, timeout_ms=20000)
                except Exception:
                    continue
                flow_id = (urlparse(link).path or "/").strip("/").replace("/", "_") or "home"
                flow_step_counters[flow_id] = flow_step_counters.get(flow_id, -1) + 1
                step = CollectedStep(
                    flow_id=flow_id,
                    flow_step=flow_step_counters[flow_id],
                    url=page.url,
                    page_title=page.title() or flow_id,
                    text=_extract_text(page),
                    cta_labels=_extract_cta_labels(page),
                )
                collected.append(step)
                discovered_flows.append(
                    {
                        "id": flow_id,
                        "title": step.page_title[:60],
                        "path": urlparse(step.url).path or "/",
                        "risk_hint": "HIGH"
                        if any(k in flow_id for k in ("checkout", "cancel", "pricing", "purchase", "buy"))
                        else "MEDIUM",
                    }
                )

                if depth < 2 and len(collected) + (len(queue) - qi) < max_steps:
                    remaining = max_steps - len(collected) - (len(queue) - qi)
                    for nlink in _discover_candidate_links(page, page.url, limit=remaining):
                        if nlink not in visited:
                            visited.add(nlink)
                            queue.append((depth + 1, nlink))
        finally:
            browser.close()

    events: list[dict] = []
    for step in collected:
        cta_section = ""
        if step.cta_labels:
            cta_section = f"\n\nCTA labels: {', '.join(step.cta_labels)}"
        body_budget = max(0, 4000 - len(cta_section))
        body_compact = _compact_text(step.text, max_len=body_budget)
        events.append(
            {
                "text": body_compact + cta_section,
                "flow_id": step.flow_id,
                "flow_step": step.flow_step,
                "url": step.url,
                "page_title": step.page_title,
            }
        )

    return {
        "events": events,
        "discovered_flows": discovered_flows,
        "pages_discovered": len(collected),
    }
