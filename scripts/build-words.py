#!/usr/bin/env python3
"""Build src/data/words.json — top Italian frequency → Spanish."""
from __future__ import annotations

import json
import re
import time
from pathlib import Path

from deep_translator import GoogleTranslator

ROOT = Path(__file__).resolve().parents[1]
FREQ = Path("/tmp/it_50k.txt")
CACHE = Path(__file__).resolve().parent / ".translate-cache.json"
OUT = ROOT / "src" / "data" / "words.json"
LIMIT = 5000
BATCH = 30

OVERRIDES = {
    "e": "y",
    "non": "no",
    "che": "que",
    "di": "de",
    "la": "la",
    "il": "el",
    "un": "un",
    "una": "una",
    "a": "a / hacia",
    "per": "para / por",
    "in": "en",
    "è": "es / está",
    "sono": "soy / son / estoy",
    "ciao": "hola / adiós",
    "grazie": "gracias",
    "prego": "de nada / por favor",
}


def load_cache() -> dict[str, str]:
    if CACHE.exists():
        return json.loads(CACHE.read_text())
    return {}


def save_cache(cache: dict[str, str]) -> None:
    CACHE.write_text(json.dumps(cache, ensure_ascii=False))


def load_words() -> list[str]:
    raw = FREQ.read_text(encoding="utf-8").splitlines()
    seen: set[str] = set()
    out: list[str] = []
    pat = re.compile(r"^[a-zàèéìíîòóùú'\-]+$", re.I)
    for line in raw:
        w = line.strip().split()[0].lower() if line.strip() else ""
        if not w or not pat.match(w):
            continue
        if len(w) == 1 and w not in {"e", "a", "i", "o", "è"}:
            continue
        if w in seen:
            continue
        seen.add(w)
        out.append(w)
        if len(out) >= LIMIT:
            break
    return out


def main() -> None:
    words = load_words()
    cache = load_cache()
    translator = GoogleTranslator(source="it", target="es")
    pending = [w for w in words if w not in cache and w not in OVERRIDES]
    print(f"words={len(words)} cached={len(cache)} pending={len(pending)}", flush=True)

    for i in range(0, len(pending), BATCH):
        chunk = pending[i : i + BATCH]
        try:
            translated = translator.translate_batch(chunk)
            if not isinstance(translated, list) or len(translated) != len(chunk):
                raise RuntimeError("bad batch result")
            for w, es in zip(chunk, translated):
                cache[w] = (es or w).strip() or w
        except Exception as exc:  # noqa: BLE001
            print(f"batch fail @{i}: {exc} — fallback one-by-one", flush=True)
            for w in chunk:
                try:
                    cache[w] = (translator.translate(w) or w).strip() or w
                except Exception as exc2:  # noqa: BLE001
                    print(f"  fail {w}: {exc2}", flush=True)
                    cache[w] = w
                    time.sleep(1)
                time.sleep(0.05)
        save_cache(cache)
        print(f"  {min(i + BATCH, len(pending))}/{len(pending)}", flush=True)
        time.sleep(0.25)

    result = []
    for idx, it in enumerate(words, start=1):
        es = OVERRIDES.get(it) or cache.get(it) or it
        result.append({"id": f"w{idx:04d}", "rank": idx, "it": it, "es": es})

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {len(result)} → {OUT}", flush=True)


if __name__ == "__main__":
    main()
