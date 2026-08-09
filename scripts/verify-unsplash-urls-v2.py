#!/usr/bin/env python3
"""
Verifica que todas las URLs de Unsplash usadas en el proyecto retornan 200.
Lista las URLs rotas (404).
"""
import re
import sys
import urllib.request
import urllib.error
import concurrent.futures
from pathlib import Path

# Recoger todas las URLs de Unsplash de los archivos relevantes
PATTERNS = [
    re.compile(r'https://images\.unsplash\.com/photo-[a-zA-Z0-9\-]+(?:\?[^\s"\'<>]*)?'),
]

SEARCH_PATHS = [
    Path("/home/z/my-project/public/demo-menus"),
    Path("/home/z/my-project/src/components/landing"),
    Path("/home/z/my-project/src/app/page.tsx"),
    Path("/home/z/my-project/src/app/layout.tsx"),
    Path("/home/z/my-project/src/app/dashboard"),
]

urls = set()
for sp in SEARCH_PATHS:
    if sp.is_file():
        files = [sp]
    else:
        files = list(sp.rglob("*.tsx")) + list(sp.rglob("*.ts")) + list(sp.rglob("*.html"))
    for f in files:
        try:
            text = f.read_text(encoding="utf-8")
        except Exception:
            continue
        for pat in PATTERNS:
            for m in pat.finditer(text):
                url = m.group(0).rstrip('",\'<>')
                # Normalizar: quitar fragmentos pero conservar query params
                urls.add(url)

print(f"Encontradas {len(urls)} URLs únicas de Unsplash")
print("Verificando (HEAD request, 8 hilos)...\n")

def check(url):
    try:
        req = urllib.request.Request(url, method="HEAD", headers={
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
        })
        with urllib.request.urlopen(req, timeout=15) as resp:
            return (url, resp.status, None)
    except urllib.error.HTTPError as e:
        return (url, e.code, str(e))
    except Exception as e:
        return (url, None, str(e))

ok = 0
broken = []
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
    for url, status, err in ex.map(check, sorted(urls)):
        if status == 200:
            ok += 1
            # print(f"  OK   {url[:80]}")
        else:
            broken.append((url, status, err))
            print(f"  BROKEN  [{status}] {url}")

print(f"\n✅ OK: {ok}")
print(f"❌ Broken: {len(broken)}")
if broken:
    print("\nURLs rotas:")
    for u, s, e in broken:
        print(f"  [{s}] {u}")
