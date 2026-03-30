"""
Shared category taxonomy for credit-intelligence services.

This keeps category inference consistent across stochastic planning and
future analytics features, while reducing fallback into "other".
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Dict, List, Optional


DEFAULT_OTHER_CATEGORY = "other"
DEFAULT_UNKNOWN_LABELS = ["other", "uncategorized", "unknown", "misc", "miscellaneous"]


def _taxonomy_path() -> Path:
    current_file = Path(__file__).resolve()

    # Optional explicit override for container/host-specific layouts.
    env_path = os.getenv("SHARED_TAXONOMY_PATH")
    if env_path:
        return Path(env_path).expanduser().resolve()

    # 1) Monorepo layout: <repo>/credit-intelligence-service/app/services/... -> <repo>/shared/...
    monorepo_shared = current_file.parents[3] / "shared" / "category-taxonomy.json"
    if monorepo_shared.exists():
        return monorepo_shared

    # 2) Service-local layout (Docker image): /app/app/services/... -> /app/shared/...
    service_shared = current_file.parents[2] / "shared" / "category-taxonomy.json"
    if service_shared.exists():
        return service_shared

    # Fall back to the service-local path for clearer startup errors.
    return service_shared


def _load_shared_taxonomy() -> Dict[str, object]:
    path = _taxonomy_path()
    if not path.exists():
        current_file = Path(__file__).resolve()
        expected = [
            path,
            current_file.parents[3] / "shared" / "category-taxonomy.json",
            current_file.parents[2] / "shared" / "category-taxonomy.json",
        ]
        tried = "\n - ".join(str(p) for p in dict.fromkeys(expected))
        raise RuntimeError(
            "Shared taxonomy file not found. Set SHARED_TAXONOMY_PATH or ensure one of these files exists:\n"
            f" - {tried}"
        )

    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        raise RuntimeError(f"Shared taxonomy file is not valid JSON: {path}")

    keywords = payload.get("keywords") if isinstance(payload, dict) else None
    if not isinstance(keywords, dict):
        raise RuntimeError("Shared taxonomy missing required 'keywords' object")

    sanitized_keywords: Dict[str, List[str]] = {}
    for category, values in keywords.items():
        if not isinstance(category, str) or not isinstance(values, list):
            continue
        sanitized_keywords[category] = [str(v).lower() for v in values if isinstance(v, str)]

    other_category = payload.get("otherCategory") if isinstance(payload, dict) else None
    if not isinstance(other_category, str) or not other_category:
        raise RuntimeError("Shared taxonomy missing required non-empty 'otherCategory' string")

    unknown_labels = payload.get("unknownLabels") if isinstance(payload, dict) else None
    if not isinstance(unknown_labels, list):
        raise RuntimeError("Shared taxonomy missing required 'unknownLabels' list")
    unknown_labels = [str(v).lower() for v in unknown_labels if isinstance(v, str)]

    return {
        "otherCategory": other_category,
        "unknownLabels": unknown_labels,
        "keywords": sanitized_keywords,
    }


_TAXONOMY = _load_shared_taxonomy()
OTHER_CATEGORY = str(_TAXONOMY["otherCategory"])
UNKNOWN_LABELS = set(_TAXONOMY["unknownLabels"])
SHARED_CATEGORY_KEYWORDS: Dict[str, List[str]] = _TAXONOMY["keywords"]
SHARED_CATEGORIES = tuple(list(SHARED_CATEGORY_KEYWORDS.keys()) + [OTHER_CATEGORY])


def _to_slug(value: str) -> str:
    slug = value.lower().replace("&", " and ")
    slug = re.sub(r"[^a-z0-9]+", "_", slug)
    slug = slug.strip("_")
    return slug


def infer_shared_category(
    raw_category: Optional[str],
    description: Optional[str] = None,
    merchant_name: Optional[str] = None,
) -> str:
    raw = (raw_category or "").strip().lower()
    source = f"{raw} {description or ''} {merchant_name or ''}".strip().lower()

    if not source:
        return OTHER_CATEGORY

    if raw in SHARED_CATEGORIES:
        return raw

    for category, keywords in SHARED_CATEGORY_KEYWORDS.items():
        if raw and any(keyword in raw for keyword in keywords):
            return category

    for category, keywords in SHARED_CATEGORY_KEYWORDS.items():
        if any(keyword in source for keyword in keywords):
            return category

    # Normalize common unknown labels into "other".
    if raw in UNKNOWN_LABELS:
        return OTHER_CATEGORY

    # Keep broad, clean labels from providers when present.
    if raw:
        slug = _to_slug(raw)
        if slug and slug not in UNKNOWN_LABELS:
            return slug

    return OTHER_CATEGORY
