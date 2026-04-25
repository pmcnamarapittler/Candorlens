"""
Runtime flow ingestion for website-specific analysis.
Uses Playwright to collect page text/CTA labels and converts to analyze-flow events.
"""

from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urljoin, urlparse


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


def _discover_candidate_links(page, base_url: str, limit: int = 8) -> list[str]:
    keywords = (
        "checkout",
        "pricing",
        "plans",
        "cancel",
        "signup",
        "register",
        "trial",
        "account",
        "billing",
    )
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
        if not any(k in path_lower for k in keywords):
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
        context = browser.new_context(viewport={"width": 1420, "height": 900})
        page = context.new_page()
        try:
            page.goto(website_url, wait_until="domcontentloaded", timeout=25000)
        except Exception as exc:
            browser.close()
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

        links = _discover_candidate_links(page, page.url, limit=max_steps - 1)
        for idx, link in enumerate(links, start=1):
            try:
                page.goto(link, wait_until="domcontentloaded", timeout=20000)
            except Exception:
                continue
            flow_id = (urlparse(link).path or "/").strip("/") or "home"
            flow_id = flow_id.replace("/", "_")
            step = CollectedStep(
                flow_id=flow_id,
                flow_step=idx,
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
                    "risk_hint": "HIGH" if any(k in flow_id for k in ("checkout", "cancel", "pricing")) else "MEDIUM",
                }
            )
            if len(collected) >= max_steps:
                break
        browser.close()

    events: list[dict] = []
    for i, step in enumerate(collected):
        combined = step.text
        if step.cta_labels:
            combined = f"{combined}\n\nCTA labels: {', '.join(step.cta_labels)}"
        events.append(
            {
                "text": _compact_text(combined, max_len=4000),
                "flow_id": step.flow_id,
                "flow_step": i,
                "url": step.url,
                "page_title": step.page_title,
            }
        )

    return {
        "events": events,
        "discovered_flows": discovered_flows,
        "pages_discovered": len(collected),
    }

