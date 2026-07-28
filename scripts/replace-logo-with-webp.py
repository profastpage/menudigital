#!/usr/bin/env python3
"""
Reemplaza todas las referencias `<img src="/logo.png" ...>` y `<img src="/logo-192.png" ...>`
por `<picture>` con WebP + PNG fallback, en todos los archivos .tsx del proyecto.
Solo opera en src/ (no toca scripts/ ni skills/).
"""
import os
import re

ROOT = '/home/z/my-project/src'
TARGETS = ['src="/logo.png"', 'src="/logo-192.png"']

def transform(content: str) -> tuple[str, int]:
    """
    Reemplaza:
      <img src="/logo.png" ...>
    por:
      <picture>
        <source srcSet="/logo.webp" type="image/webp" />
        <img src="/logo.png" ...>
      </picture>
    
    Maneja ambos targets (logo.png y logo-192.png) mapeando a sus versiones webp.
    """
    count = 0
    # Pattern: <img ... src="/logo-192.png" ... > (no self-closing; cierra con >)
    # Acepta cualquier orden de atributos antes/después de src.
    # No consume self-closing porque nuestros <img> cierran con > (no />).
    img_pattern = re.compile(
        r'<img\b([^>]*?)(src="(/logo(?:-192)?\.png)")([^>]*?)>',
        re.DOTALL
    )
    
    def replace(m):
        nonlocal count
        before = m.group(1)
        src_attr = m.group(2)
        png_path = m.group(3)
        after = m.group(4)
        # Map png path → webp path
        webp_path = png_path.replace('.png', '.webp')
        count += 1
        return (
            f'<picture>\n'
            f'              <source srcSet="{webp_path}" type="image/webp" />\n'
            f'              <img{before}{src_attr}{after}>\n'
            f'            </picture>'
        )
    
    new_content = img_pattern.sub(replace, content)
    return new_content, count

changed_files = 0
total_replacements = 0
for root, dirs, files in os.walk(ROOT):
    for f in files:
        if not f.endswith('.tsx'):
            continue
        path = os.path.join(root, f)
        with open(path, 'r', encoding='utf-8') as fh:
            content = fh.read()
        # Skip if no target
        if not any(t in content for t in TARGETS):
            continue
        new_content, count = transform(content)
        if count > 0:
            with open(path, 'w', encoding='utf-8') as fh:
                fh.write(new_content)
            print(f"  ✓ {path}: {count} reemplazos")
            changed_files += 1
            total_replacements += count

print(f"\nTotal: {changed_files} archivos modificados, {total_replacements} <img> reemplazados por <picture>.")
