#!/usr/bin/env python3
"""
Regenera TODOS los assets de la marca MenuPro desde /home/z/my-project/upload/pasted_image_1785182364705.png
- Logos en /public: logo.webp, logo-192.webp, logo-512.webp, logo.png (fallback)
- Favicon multi-res: /public/favicon.ico, /public/icons/favicon-16x16.png, favicon-32x32.png, apple-touch-icon.png
- PWA icons: /public/icons/icon-{72,96,128,144,152,192,384,512}.png + maskable
- OG image (og-image.png) — 1200x630 con logo centrado sobre bg dark
- icon.webp en /src/app (Next.js metadata icon)
"""
import os
from PIL import Image, ImageDraw

SRC = '/home/z/my-project/upload/pasted_image_1785182364705.png'
PUBLIC = '/home/z/my-project/public'
ICONS = f'{PUBLIC}/icons'
APP = '/home/z/my-project/src/app'

os.makedirs(ICONS, exist_ok=True)
os.makedirs(APP, exist_ok=True)

# 1) Cargar source (1024x1024 RGBA)
src = Image.open(SRC).convert('RGBA')
print(f"Source: {src.size}, mode={src.mode}")

# 2) Logo principal en /public — webp con transparencia, 512x512 (alta calidad)
logo_512 = src.resize((512, 512), Image.LANCZOS)
logo_512.save(f'{PUBLIC}/logo.webp', 'WEBP', quality=95, lossless=False, method=6)
print(f"✓ {PUBLIC}/logo.webp (512x512)")

# 3) Logo compacto 192px webp
logo_192 = src.resize((192, 192), Image.LANCZOS)
logo_192.save(f'{PUBLIC}/logo-192.webp', 'WEBP', quality=95, method=6)
print(f"✓ {PUBLIC}/logo-192.webp (192x192)")

# 4) Fallback PNG (para navegadores viejos / clientes que no soportan webp)
src.resize((512, 512), Image.LANCZOS).save(f'{PUBLIC}/logo.png', 'PNG', optimize=True)
src.resize((192, 192), Image.LANCZOS).save(f'{PUBLIC}/logo-192.png', 'PNG', optimize=True)
print(f"✓ {PUBLIC}/logo.png + logo-192.png (fallback PNG)")

# 5) icon.webp en src/app/ (lo usa Next.js como icon por defecto)
src.resize((512, 512), Image.LANCZOS).save(f'{APP}/icon.webp', 'WEBP', quality=95, method=6)
print(f"✓ {APP}/icon.webp (Next.js default icon)")

# 6) PWA icons (PNG, todos los tamaños estándar)
PWA_SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
for size in PWA_SIZES:
    out = f'{ICONS}/icon-{size}x{size}.png'
    src.resize((size, size), Image.LANCZOS).save(out, 'PNG', optimize=True)
    print(f"✓ {out}")

# 7) Maskable icons (con padding seguro ~10% en bg dark)
DARK_BG = (7, 7, 11, 255)  # #07070b
for size in [192, 512]:
    canvas = Image.new('RGBA', (size, size), DARK_BG)
    # Safe zone = 80% del centro
    inner = int(size * 0.80)
    logo_resized = src.resize((inner, inner), Image.LANCZOS)
    offset = ((size - inner) // 2, (size - inner) // 2)
    canvas.paste(logo_resized, offset, logo_resized)
    out = f'{ICONS}/icon-{size}x{size}-maskable.png'
    canvas.save(out, 'PNG', optimize=True)
    print(f"✓ {out} (maskable)")

# 8) Favicon PNG 16/32
src.resize((16, 16), Image.LANCZOS).save(f'{ICONS}/favicon-16x16.png', 'PNG', optimize=True)
src.resize((32, 32), Image.LANCZOS).save(f'{ICONS}/favicon-32x32.png', 'PNG', optimize=True)
print(f"✓ favicon-16x16.png, favicon-32x32.png")

# 9) Apple touch icon (180x180, bg dark para que se vea bien en iOS home screen)
apple_size = 180
canvas = Image.new('RGBA', (apple_size, apple_size), DARK_BG)
inner = int(apple_size * 0.85)
logo_resized = src.resize((inner, inner), Image.LANCZOS)
offset = ((apple_size - inner) // 2, (apple_size - inner) // 2)
canvas.paste(logo_resized, offset, logo_resized)
canvas.save(f'{ICONS}/apple-touch-icon.png', 'PNG', optimize=True)
print(f"✓ apple-touch-icon.png (180x180 con bg dark)")

# 10) Favicon ICO multi-resolución (16, 32, 48, 64)
ico_sizes = [(16,16), (32,32), (48,48), (64,64)]
ico_images = [src.resize(s, Image.LANCZOS) for s in ico_sizes]
ico_images[0].save(
    f'{PUBLIC}/favicon.ico',
    format='ICO',
    sizes=ico_sizes,
    append_images=ico_images[1:]
)
# Copia también a /icons/favicon.ico para los que referencian esa ruta
ico_images[0].save(
    f'{ICONS}/favicon.ico',
    format='ICO',
    sizes=ico_sizes,
    append_images=ico_images[1:]
)
print(f"✓ favicon.ico multi-res (16,32,48,64)")

# 11) OG image 1200x630 — logo centrado sobre fondo dark con sutil gradient
og_w, og_h = 1200, 630
og = Image.new('RGBA', (og_w, og_h), DARK_BG)
# Gradiente sutil: overlay dorado muy tenue en la mitad superior
grad = Image.new('RGBA', (og_w, og_h), (0,0,0,0))
gd = ImageDraw.Draw(grad)
for y in range(og_h):
    alpha = int(20 * (1 - y/og_h))  # más fuerte arriba
    gd.line([(0,y),(og_w,y)], fill=(212, 175, 55, alpha))
og = Image.alpha_composite(og, grad)
# Logo grande centrado (60% de la altura)
logo_h = int(og_h * 0.60)
logo_w = logo_h  # cuadrado
logo_og = src.resize((logo_w, logo_h), Image.LANCZOS)
offset = ((og_w - logo_w)//2, (og_h - logo_h)//2 - 30)
og.paste(logo_og, offset, logo_og)
# Texto "MenuPro" abajo — lo dejamos al logo; si quieres texto usaría PIL font
og.convert('RGB').save(f'{PUBLIC}/og-image.png', 'PNG', optimize=True)
print(f"✓ og-image.png (1200x630)")

# 12) screenshots para PWA (las viejas pueden estar ok pero las regenero con el brand si quieres)
# Skip — las screenshots son mockups del producto, no logo

# 13) logo.svg — generar uno simple como fallback si alguien lo referencia
# (algunos componentes pueden seguir referenciando /logo.svg)
# Mantengo el svg anterior si existe, o genero uno que apunta al webp
svg_path = f'{PUBLIC}/logo.svg'
if not os.path.exists(svg_path):
    with open(svg_path, 'w') as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n'
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">\n'
                '  <image href="/logo.webp" width="512" height="512"/>\n'
                '</svg>\n')
    print(f"✓ logo.svg (wrapper a webp)")
else:
    print(f"• logo.svg ya existe (mantengo)")

print("\n✅ TODOS los assets regenerados.")
print("Resumen archivos:")
for p in [f'{PUBLIC}/logo.webp', f'{PUBLIC}/logo-192.webp', f'{PUBLIC}/logo.png',
          f'{PUBLIC}/logo-192.png', f'{PUBLIC}/favicon.ico', f'{PUBLIC}/og-image.png',
          f'{APP}/icon.webp', f'{ICONS}/apple-touch-icon.png']:
    if os.path.exists(p):
        sz = os.path.getsize(p)
        print(f"  {p}  ({sz:,} bytes)")
