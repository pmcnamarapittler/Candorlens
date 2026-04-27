"""Extract evidence-sized text snippets from Firecrawl markdown."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

MIN_SNIPPET_CHARS = 12
MAX_SNIPPET_CHARS = 320
MAX_SNIPPETS_PER_EVENT = 40

MARKDOWN_LINK_RE = re.compile(r"\[([^\]]+)\]\([^)]+\)")
URL_RE = re.compile(r"https?://\S+")
SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+")
SPACE_RE = re.compile(r"\s+")

NOISE_PREFIXES = (
    "privacy policy",
    "terms of use",
    "terms of service",
    "cookie policy",
    "copyright",
    "©",
)

NAV_ONLY_TERMS = {
    "home",
    "products",
    "product",
    "resources",
    "pricing",
    "plans",
    "company",
    "support",
    "help",
    "contact",
    "about",
    "blog",
    "docs",
    "documentation",
    "features",
    "learn more",
}

NAV_SEPARATOR_RE = re.compile(r"[|/>\-·•]+")
CTA_FRAGMENT_RE = re.compile(
    r"^(learn more|get started|start now|start free|book demo|contact sales|view pricing|read more)$",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class EvidenceSnippet:
    text: str
    context_text: str | None
    flow_id: str
    flow_step: int
    url: str | None
    page_title: str | None
    snippet_index: int


def _clean_markdown(value: str) -> str:
    text = MARKDOWN_LINK_RE.sub(r"\1", value)
    text = re.sub(r"^[#>*\-\s]+", "", text).strip()
    return SPACE_RE.sub(" ", text)


def _is_noise(value: str) -> bool:
    text = value.strip()
    lower = text.lower()
    if len(text) < MIN_SNIPPET_CHARS:
        return True
    if URL_RE.fullmatch(text):
        return True
    if lower in {"products", "resources", "company", "support", "help", "pricing"}:
        return True
    if lower in NAV_ONLY_TERMS:
        return True
    if CTA_FRAGMENT_RE.fullmatch(lower):
        return True
    if any(lower.startswith(prefix) for prefix in NOISE_PREFIXES):
        return True
    if text.count("http") >= 2:
        return True
    if NAV_SEPARATOR_RE.search(text):
        nav_parts = [part.strip().lower() for part in NAV_SEPARATOR_RE.split(text) if part.strip()]
        if nav_parts and len(nav_parts) <= 8 and all(part in NAV_ONLY_TERMS for part in nav_parts):
            return True
    words = re.findall(r"[A-Za-z0-9$%]+", text)
    if len(words) < 3:
        return True
    if len(words) <= 5 and text.strip()[-1:] not in {".", "!", "?"}:
        # Very short, punctuation-less fragments are commonly nav/CTA labels.
        return True
    return False


def _split_long_text(text: str) -> list[str]:
    if len(text) <= MAX_SNIPPET_CHARS:
        return [text]

    sentences = [part.strip() for part in SENTENCE_SPLIT_RE.split(text) if part.strip()]
    chunks: list[str] = []
    current = ""
    for sentence in sentences:
        if len(sentence) > MAX_SNIPPET_CHARS:
            if current:
                chunks.append(current)
                current = ""
            chunks.append(sentence[:MAX_SNIPPET_CHARS].strip())
            continue
        candidate = f"{current} {sentence}".strip()
        if len(candidate) <= MAX_SNIPPET_CHARS:
            current = candidate
        else:
            if current:
                chunks.append(current)
            current = sentence
    if current:
        chunks.append(current)
    return chunks


def extract_evidence_snippets(event: dict[str, Any]) -> list[EvidenceSnippet]:
    """Convert a page-level Firecrawl event into candidate evidence snippets."""
    raw_text = event.get("text") or ""
    lines = [_clean_markdown(line) for line in raw_text.splitlines()]
    candidates: list[str] = []
    seen: set[str] = set()

    for line in lines:
        if not line:
            continue
        for snippet in _split_long_text(line):
            normalized = snippet.strip()
            key = normalized.lower()
            if key in seen or _is_noise(normalized):
                continue
            seen.add(key)
            candidates.append(normalized)
            if len(candidates) >= MAX_SNIPPETS_PER_EVENT:
                break
        if len(candidates) >= MAX_SNIPPETS_PER_EVENT:
            break

    flow_id = event.get("flow_id", "flow")
    flow_step = event.get("flow_step", 0)
    url = event.get("url")
    page_title = event.get("page_title")
    snippets: list[EvidenceSnippet] = []
    for index, text in enumerate(candidates):
        context_start = max(0, index - 1)
        context_end = min(len(candidates), index + 2)
        context_text = " ".join(candidates[context_start:context_end])
        snippets.append(
            EvidenceSnippet(
                text=text,
                context_text=context_text if context_text != text else None,
                flow_id=flow_id,
                flow_step=flow_step,
                url=url,
                page_title=page_title,
                snippet_index=index,
            )
        )
    return snippets
