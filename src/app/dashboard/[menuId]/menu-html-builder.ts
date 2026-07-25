import { escapeHtml, hexToRgbStr, type MenuData } from '@/lib/menu-utils';

/**
 * Construye el HTML completo autocontenido del menú público.
 * Usa concatenación de strings (no template literals anidados) para evitar
 * problemas de escape. Inyecta los datos via JSON.stringify().
 *
 * Soporta tema personalizables (plan Pro): layout, image_size, card_style,
 * font, secondary color, dark mode, cover image, search, etc.
 */
export function buildMenuHTML(data: MenuData): string {
  // Defaults seguros (plan Free = single col, medium img, expanded card, dark)
  const layout = data.theme_layout || 'single';
  const imageSize = data.theme_image_size || 'medium';
  const cardStyle = data.theme_card_style || 'expanded';
  const font = data.theme_font || 'Inter';
  const darkMode = data.theme_dark_mode !== false; // default true
  const showSearch = data.theme_show_search !== false;
  const showCatIcons = data.theme_show_category_icons !== false;
  const rounded = data.theme_rounded_corners !== false;
  const coverUrl = data.theme_cover_url || null;
  const secondary = data.theme_color_secondary || '#1a1a2e';

  const css = buildCSS({ layout, imageSize, cardStyle, font, darkMode, showSearch, showCatIcons, rounded, coverUrl, secondary });
  const js = buildJS({ layout, imageSize, cardStyle, showSearch });
  const colorRgb = hexToRgbStr(data.color);
  const secondaryRgb = hexToRgbStr(secondary);

  // Font CDN (solo si no es Inter/system)
  const fontImport = ['Inter', 'system-ui', '-apple-system'].includes(font)
    ? ''
    : `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;500;600;700;800&display=swap" rel="stylesheet">`;

  let html = '';
  html += '<!DOCTYPE html>\n';
  html += '<html lang="es">\n';
  html += '<head>\n';
  html += '<meta charset="UTF-8">\n';
  html += '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">\n';
  html += '<meta name="theme-color" content="' + data.color + '">\n';
  html += '<meta name="description" content="' + escapeHtml(data.description || data.name) + '">\n';
  html += '<title>' + escapeHtml(data.name) + '</title>\n';
  html += fontImport + '\n';
  html += '<style>' + css + '</style>\n';
  html += '</head>\n';
  html += '<body>\n';
  html += '<div id="app"></div>\n';
  html += '<script>\n';
  html += 'var RESTAURANT = ' + JSON.stringify(data) + ';\n';
  html += 'var SHOW_BRANDING = ' + (!!data.branding_text) + ';\n';
  html += 'var BRANDING_TEXT = ' + JSON.stringify(data.branding_text || '') + ';\n';
  html += 'var THEME = ' + JSON.stringify({ layout, imageSize, cardStyle, showSearch }) + ';\n';
  html += 'document.documentElement.style.setProperty("--accent", "' + data.color + '");\n';
  html += 'document.documentElement.style.setProperty("--accent-rgb", "' + colorRgb + '");\n';
  html += 'document.documentElement.style.setProperty("--secondary", "' + secondary + '");\n';
  html += 'document.documentElement.style.setProperty("--secondary-rgb", "' + secondaryRgb + '");\n';
  html += 'document.documentElement.style.setProperty("--font-main", "' + font + '", "Inter", sans-serif);\n';
  html += js + '\n';
  html += '</scr' + 'ipt>\n';
  html += '</body>\n';
  html += '</html>';
  return html;
}

interface ThemeOpts {
  layout: 'single' | 'double' | 'grid';
  imageSize: 'none' | 'small' | 'medium' | 'large' | 'hero';
  cardStyle: 'compact' | 'expanded' | 'minimal';
  font: string;
  darkMode: boolean;
  showSearch: boolean;
  showCatIcons: boolean;
  rounded: boolean;
  coverUrl: string | null;
  secondary: string;
}

function buildCSS(opts: ThemeOpts): string {
  const { layout, imageSize, cardStyle, font, darkMode, showSearch, showCatIcons, rounded, coverUrl, secondary } = opts;
  const radius = rounded ? '16px' : '4px';
  const radiusSm = rounded ? '12px' : '2px';
  const radiusLg = rounded ? '24px' : '8px';

  // Colores según dark/light
  const bg0 = darkMode ? '#07070b' : '#fafafa';
  const bg1 = darkMode ? '#0f0f1a' : '#ffffff';
  const text = darkMode ? '#f4f4fa' : '#1a1a2e';
  const textMuted = darkMode ? '#8a8a9a' : '#6a6a7a';
  const textSoft = darkMode ? '#b8b8c8' : '#3a3a4a';
  const glass = darkMode ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.025)';
  const glassStrong = darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';
  const border = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const borderStrong = darkMode ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.14)';

  let c = '';
  c += `:root{--accent:#ff6b35;--accent-rgb:255,107,53;--secondary:${secondary};--gold:#d4af37;--bg-0:${bg0};--bg-1:${bg1};--glass:${glass};--glass-strong:${glassStrong};--border:${border};--border-strong:${borderStrong};--text:${text};--text-muted:${textMuted};--text-soft:${textSoft};--font-main:${font},"Inter",sans-serif;--radius:${radius};--radius-sm:${radiusSm};--radius-lg:${radiusLg};}`;
  c += '*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}';
  c += 'html{scroll-behavior:smooth;-webkit-text-size-adjust:100%;}';
  c += `body{font-family:var(--font-main);background:var(--bg-0);color:var(--text);min-height:100vh;padding-bottom:calc(140px + env(safe-area-inset-bottom, 0px));position:relative;overflow-x:hidden;overscroll-behavior-y:contain;-webkit-overflow-scrolling:touch;}`;
  if (darkMode) {
    c += 'body::before,body::after{content:"";position:fixed;width:500px;height:500px;border-radius:50%;filter:blur(140px);opacity:0.18;z-index:0;pointer-events:none;}';
    c += 'body::before{background:var(--accent);top:-200px;right:-150px;}';
    c += 'body::after{background:var(--gold);bottom:-200px;left:-150px;}';
  }
  c += '#app{position:relative;z-index:1;}';

  // Cover image (si existe)
  if (coverUrl) {
    c += `.cover{width:100%;height:240px;position:relative;overflow:hidden;background:var(--bg-1);}`;
    c += `.cover img{width:100%;height:100%;object-fit:cover;}`;
    c += `.cover::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 50%,var(--bg-0) 100%);}`;
    c += `@media(min-width:600px){.cover{height:320px;}}`;
  }

  // Header
  c += `.header{padding:${coverUrl ? '20px' : '38px'} 24px 30px;text-align:center;position:relative;background:linear-gradient(180deg,rgba(255,255,255,0.03) 0%,transparent 100%);border-bottom:1px solid var(--border);}`;
  c += '.header::after{content:"";position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:140px;height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent);}';
  c += '.logo-wrap{position:relative;display:inline-block;margin-bottom:16px;width:96px;height:96px;}';
  c += '.logo-wrap::before{content:"";position:absolute;inset:-6px;border-radius:50%;background:conic-gradient(from 0deg,var(--accent),var(--gold),var(--accent));filter:blur(10px);opacity:0.5;z-index:0;animation:rotate 8s linear infinite;}';
  c += '@keyframes rotate{to{transform:rotate(360deg);}}';
  c += `.logo{width:96px;height:96px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,0.12);box-shadow:0 8px 32px rgba(0,0,0,0.5);background:var(--glass);position:absolute;inset:0;z-index:2;}`;
  c += '.logo-placeholder{width:96px;height:96px;border-radius:50%;background:linear-gradient(135deg,var(--accent),rgba(var(--accent-rgb),0.6));display:flex;align-items:center;justify-content:center;font-size:38px;font-weight:800;color:#fff;position:absolute;inset:0;z-index:1;border:3px solid rgba(255,255,255,0.12);box-shadow:0 8px 32px rgba(0,0,0,0.5);}';
  c += '.restaurant-name{font-size:28px;font-weight:800;margin-bottom:6px;letter-spacing:-0.5px;color:var(--text);}';
  c += '.slogan{font-size:11px;color:var(--gold);letter-spacing:4px;text-transform:uppercase;font-weight:600;margin-bottom:8px;}';
  c += '.restaurant-desc{color:var(--text-soft);font-size:14px;margin-bottom:18px;max-width:440px;margin-left:auto;margin-right:auto;line-height:1.5;}';
  c += '.open-badge{display:inline-flex;align-items:center;gap:7px;background:rgba(6,214,160,0.12);color:#06d6a0;padding:6px 14px;border-radius:20px;font-size:11.5px;font-weight:600;border:1px solid rgba(6,214,160,0.25);letter-spacing:0.5px;text-transform:uppercase;}';
  c += '.open-badge::before{content:"";width:6px;height:6px;border-radius:50%;background:#06d6a0;box-shadow:0 0 8px #06d6a0;animation:pulse 2s infinite;}';
  c += '@keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.4;transform:scale(1.3);}}';

  // Search bar (opcional, Pro)
  if (showSearch) {
    c += '.search-wrap{padding:12px 20px 0;max-width:620px;margin:0 auto;}';
    c += '.search-input{width:100%;padding:12px 16px 12px 44px;border-radius:var(--radius-sm);background:var(--glass);border:1px solid var(--border);color:var(--text);font-size:15px;font-family:var(--font-main);outline:none;transition:border 0.2s;}';
    c += '.search-input:focus{border-color:rgba(var(--accent-rgb),0.5);background:var(--glass-strong);}';
    c += '.search-input::placeholder{color:var(--text-muted);}';
    c += '.search-icon{position:absolute;left:36px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--text-muted);pointer-events:none;}';
  }

  // Nav
  c += '.nav{position:sticky;top:0;background:' + (darkMode ? 'rgba(7,7,11,0.78)' : 'rgba(250,250,250,0.85)') + ';backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border-bottom:1px solid var(--border);z-index:100;padding:14px 0;overflow-x:auto;scrollbar-width:none;}';
  c += '.nav::-webkit-scrollbar{display:none;}';
  c += '.nav-inner{display:flex;gap:8px;padding:0 20px;min-width:max-content;}';
  c += '.nav-item{white-space:nowrap;padding:8px 18px;background:var(--glass);border:1px solid var(--border);border-radius:24px;color:var(--text-soft);font-size:13.5px;font-weight:500;cursor:pointer;transition:all 0.25s cubic-bezier(0.4,0,0.2,1);display:flex;align-items:center;gap:6px;}';
  c += '.nav-item:hover{background:var(--glass-strong);color:var(--text);transform:translateY(-1px);}';
  c += '.nav-item.active{background:linear-gradient(135deg,var(--accent),rgba(var(--accent-rgb),0.85));color:#fff;border-color:transparent;box-shadow:0 4px 16px rgba(var(--accent-rgb),0.4);}';
  if (showCatIcons) {
    c += '.nav-item-icon{font-size:16px;line-height:1;}';
  }

  // Section
  const sectionMaxW = layout === 'single' ? '620px' : '1100px';
  c += `.section{padding:24px 20px 8px;max-width:${sectionMaxW};margin:0 auto;width:100%;}`;
  c += '.section-title{font-size:21px;font-weight:700;margin-bottom:18px;display:flex;align-items:center;gap:12px;letter-spacing:-0.3px;}';
  c += '.section-title::before{content:"";width:4px;height:22px;background:linear-gradient(180deg,var(--accent),var(--gold));border-radius:2px;}';

  // ─── Layout: contenedor de platos ───
  if (layout === 'double') {
    c += '.dishes-grid{display:grid;grid-template-columns:1fr;gap:12px;}';
    c += '@media(min-width:640px){.dishes-grid{grid-template-columns:1fr 1fr;}}';
  } else if (layout === 'grid') {
    c += '.dishes-grid{display:grid;grid-template-columns:1fr;gap:12px;}';
    c += '@media(min-width:480px){.dishes-grid{grid-template-columns:1fr 1fr;}}';
    c += '@media(min-width:900px){.dishes-grid{grid-template-columns:1fr 1fr 1fr;}}';
  } else {
    c += '.dishes-grid{display:flex;flex-direction:column;gap:12px;}';
  }

  // ─── Image size variants ───
  const imgSizeMap: Record<string, string> = {
    none: '0',
    small: '60px',
    medium: '84px',
    large: '120px',
  };
  const imgSize = imgSizeMap[imageSize] || '84px';

  // ─── Card style variants ───
  let dishLayoutCss = '';
  if (imageSize === 'hero' || imageSize === 'large') {
    // Imagen grande arriba, info abajo (vertical)
    dishLayoutCss = `.dish{flex-direction:column;padding:0;overflow:hidden;}`;
    c += dishLayoutCss;
    c += `.dish-img{width:100%;height:${imageSize === 'hero' ? '200px' : '140px'};border-radius:0;aspect-ratio:${imageSize === 'hero' ? '16/9' : 'auto'};}`;
    c += '.dish-info{padding:14px;width:100%;}';
    c += '.dish-bottom{padding:0 14px 14px;}';
  } else if (imageSize === 'none') {
    // Sin imagen
    c += '.dish-img{display:none;}';
  } else {
    // Horizontal clásico (small/medium)
    c += `.dish{display:flex;gap:14px;}`;
    c += `.dish-img{width:${imgSize};height:${imgSize};flex-shrink:0;}`;
    c += '.dish-info{flex:1;min-width:0;display:flex;flex-direction:column;}';
  }

  // Card style (compact = menos padding, minimal = sin borde/background)
  if (cardStyle === 'compact') {
    c += '.dish{padding:10px;}';
  } else if (cardStyle === 'minimal') {
    c += '.dish{background:transparent;border:1px solid transparent;padding:8px 4px;}';
    c += '.dish:hover{background:transparent;border-color:transparent;transform:none;box-shadow:none;}';
  }

  // Base dish styles (solo los que no sobreescribimos arriba)
  c += `.dish{background:var(--glass);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:0;transition:all 0.3s cubic-bezier(0.4,0,0.2,1);opacity:0;transform:translateY(20px);position:relative;overflow:hidden;cursor:pointer;}`;
  c += '.dish.revealed{opacity:1;transform:translateY(0);}';
  c += '.dish::before{content:"";position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent);opacity:0;transition:opacity 0.3s;}';
  c += '.dish:hover{border-color:rgba(var(--accent-rgb),0.3);background:rgba(var(--accent-rgb),0.04);transform:translateY(-3px);box-shadow:0 10px 28px rgba(0,0,0,0.35);}';
  c += '.dish:hover::before{opacity:1;}';
  c += '.dish:active{transform:translateY(0) scale(0.99);}';
  c += `.dish-img{object-fit:cover;border-radius:var(--radius-sm);background:linear-gradient(135deg,var(--glass),var(--glass-strong));border:1px solid var(--border);}`;
  c += '.dish-name{font-size:16px;font-weight:600;margin-bottom:4px;letter-spacing:-0.2px;color:var(--text);}';
  c += '.dish-desc{font-size:13px;color:var(--text-muted);margin-bottom:10px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}';
  c += '.dish-bottom{display:flex;justify-content:space-between;align-items:center;margin-top:auto;gap:10px;}';
  c += '.dish-price{font-size:18px;font-weight:700;color:var(--accent);letter-spacing:-0.5px;}';
  c += '.add-btn{width:36px;height:36px;border-radius:var(--radius-sm);background:linear-gradient(135deg,var(--accent),rgba(var(--accent-rgb),0.8));color:#fff;border:none;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.25s;line-height:1;font-weight:300;box-shadow:0 4px 14px rgba(var(--accent-rgb),0.35);flex-shrink:0;}';
  c += '.add-btn:hover{transform:scale(1.1) rotate(90deg);box-shadow:0 6px 20px rgba(var(--accent-rgb),0.55);}';
  c += '.add-btn:active{transform:scale(0.95);}';
  c += '.added-flash{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(0);background:#06d6a0;color:#fff;padding:8px 18px;border-radius:24px;font-size:12px;font-weight:700;pointer-events:none;z-index:5;box-shadow:0 6px 18px rgba(6,214,160,0.5);animation:flashAdd 0.9s ease forwards;letter-spacing:0.3px;}';
  c += '@keyframes flashAdd{0%{transform:translate(-50%,-50%) scale(0);opacity:0;}25%{transform:translate(-50%,-50%) scale(1);opacity:1;}75%{transform:translate(-50%,-90%) scale(1);opacity:1;}100%{transform:translate(-50%,-130%) scale(0.8);opacity:0;}}';
  // Cart
  c += '.cart{position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(140px);width:calc(100% - 32px);max-width:480px;background:linear-gradient(135deg,var(--accent),rgba(var(--accent-rgb),0.9));color:#fff;border-radius:var(--radius);padding:16px 22px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 14px 40px rgba(var(--accent-rgb),0.45),0 4px 12px rgba(0,0,0,0.4);cursor:pointer;transition:transform 0.4s cubic-bezier(0.4,0,0.2,1);z-index:90;border:1px solid rgba(255,255,255,0.18);margin-bottom:env(safe-area-inset-bottom,0px);}';
  c += '.cart.visible{transform:translateX(-50%) translateY(0);}';
  c += '.cart-left{display:flex;align-items:center;gap:10px;font-weight:600;font-size:15px;}';
  c += '.cart-count{background:rgba(255,255,255,0.25);padding:3px 10px;border-radius:12px;font-size:13px;font-weight:700;min-width:28px;text-align:center;}';
  c += '.cart-count.pulse{animation:countPulse 0.4s ease;}';
  c += '@keyframes countPulse{0%,100%{transform:scale(1);}50%{transform:scale(1.4);background:rgba(255,255,255,0.4);}}';
  c += '.cart-total{font-size:18px;font-weight:800;letter-spacing:-0.3px;}';
  // Modal
  c += '.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:200;display:none;align-items:flex-end;justify-content:center;padding-bottom:env(safe-area-inset-bottom,0px);}';
  c += '.modal-overlay.visible{display:flex;}';
  c += `.modal{background:linear-gradient(180deg,${darkMode ? '#1c1c2e,#14141f' : '#fff,#f5f5f5'});width:100%;max-width:500px;border-radius:24px 24px 0 0;padding:28px 24px;max-height:85vh;overflow-y:auto;animation:slideUp 0.4s cubic-bezier(0.4,0,0.2,1);border:1px solid rgba(255,255,255,0.08);border-bottom:none;box-shadow:0 -16px 48px rgba(0,0,0,0.5);color:var(--text);}`;
  c += '@keyframes slideUp{from{transform:translateY(100%);}to{transform:translateY(0);}}';
  c += '.modal-title{font-size:22px;font-weight:700;margin-bottom:4px;text-align:center;letter-spacing:-0.3px;color:var(--text);}';
  c += '.modal-subtitle{text-align:center;font-size:12.5px;color:var(--text-muted);margin-bottom:22px;letter-spacing:0.3px;}';
  c += '.modal-divider{height:1px;background:linear-gradient(90deg,transparent,var(--border-strong),transparent);margin:0 -24px 20px;}';
  c += '.cart-item{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid var(--border);gap:10px;animation:itemIn 0.3s ease;}';
  c += '@keyframes itemIn{from{opacity:0;transform:translateX(-10px);}to{opacity:1;transform:translateX(0);}}';
  c += '.cart-item-info{flex:1;min-width:0;}';
  c += '.cart-item-name{font-weight:600;font-size:15px;margin-bottom:2px;color:var(--text);}';
  c += '.cart-item-price{color:var(--text-muted);font-size:12.5px;}';
  c += '.qty-control{display:flex;align-items:center;gap:10px;background:var(--glass);padding:4px;border-radius:24px;border:1px solid var(--border);}';
  c += '.qty-btn{width:28px;height:28px;border-radius:50%;background:var(--glass-strong);color:var(--text);border:none;cursor:pointer;font-size:16px;line-height:1;transition:all 0.2s;display:flex;align-items:center;justify-content:center;}';
  c += '.qty-btn:hover{background:var(--accent);color:#fff;transform:scale(1.1);}';
  c += '.qty{min-width:24px;text-align:center;font-weight:600;font-size:14px;color:var(--text);}';
  c += '.cart-item-total{font-weight:700;color:var(--accent);min-width:75px;text-align:right;font-size:15px;}';
  c += '.cart-empty{text-align:center;padding:50px 0;color:var(--text-muted);font-size:14px;}';
  c += '.cart-summary{margin-top:20px;padding-top:20px;border-top:2px solid var(--border);}';
  c += '.summary-row{display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;color:var(--text-soft);}';
  c += '.summary-total{font-size:18px;font-weight:700;margin-top:12px;color:var(--text);display:flex;justify-content:space-between;align-items:center;}';
  c += '.summary-total .amount{color:var(--accent);font-size:24px;font-weight:800;letter-spacing:-0.5px;}';
  c += '.wa-btn{width:100%;background:linear-gradient(135deg,#25d366,#1da851);color:#fff;border:none;padding:16px;border-radius:var(--radius);font-size:15px;font-weight:700;cursor:pointer;margin-top:22px;display:flex;align-items:center;justify-content:center;gap:10px;transition:all 0.2s;box-shadow:0 6px 20px rgba(37,211,102,0.35);letter-spacing:0.2px;}';
  c += '.wa-btn:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(37,211,102,0.5);}';
  c += '.wa-btn:active{transform:translateY(0);}';
  c += '.wa-icon{width:18px;height:18px;fill:currentColor;}';
  c += '.close-btn{width:100%;background:var(--glass);color:var(--text-soft);border:1px solid var(--border);padding:13px;border-radius:var(--radius-sm);font-size:14px;cursor:pointer;margin-top:10px;transition:all 0.2s;font-weight:500;}';
  c += '.close-btn:hover{background:var(--glass-strong);color:var(--text);}';
  c += '.menu-footer{text-align:center;padding:30px 20px;color:var(--text-muted);font-size:11.5px;border-top:1px solid var(--border);margin-top:20px;padding-bottom:calc(30px + env(safe-area-inset-bottom, 0px));}';
  c += '.menu-footer a{color:var(--gold);text-decoration:none;font-weight:600;letter-spacing:1px;}';
  c += '.no-results{text-align:center;padding:40px 20px;color:var(--text-muted);font-size:14px;}';
  return c;
}

interface JSOpts {
  layout: 'single' | 'double' | 'grid';
  imageSize: 'none' | 'small' | 'medium' | 'large' | 'hero';
  cardStyle: 'compact' | 'expanded' | 'minimal';
  showSearch: boolean;
}

function buildJS(opts: JSOpts): string {
  const { showSearch } = opts;
  let s = '';
  s += 'var cart = [];\n';
  s += 'var searchQuery = "";\n';
  s += 'function escapeHtml(s){if(s==null)return "";return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/\'/g,"&#39;");}\n';
  s += 'function formatPrice(n){return (RESTAURANT.currency||"S/")+" "+Number(n).toFixed(2);}\n';
  s += 'function dishMatches(dish,q){if(!q)return true;var n=(dish.name||"").toLowerCase();var d=(dish.description||"").toLowerCase();return n.indexOf(q)>=0||d.indexOf(q)>=0;}\n';
  s += 'function renderApp(){\n';
  s += '  var app=document.getElementById("app");\n';
  s += '  var html="";\n';
  // Cover image
  s += '  if(RESTAURANT.theme_cover_url){html+="<div class=\\"cover\\"><img src=\\""+escapeHtml(RESTAURANT.theme_cover_url)+"\\" alt=\\"cover\\" onerror=\\"this.remove()\\"/></div>";}\n';
  // Header
  s += '  html+="<header class=\\"header\\">";\n';
  s += '  html+="<div class=\\"logo-wrap\\">";\n';
  s += '  html+="<div class=\\"logo-placeholder\\">"+escapeHtml(RESTAURANT.name.charAt(0).toUpperCase())+"</div>";\n';
  s += '  if(RESTAURANT.logo_url){html+="<img src=\\""+escapeHtml(RESTAURANT.logo_url)+"\\" class=\\"logo\\" alt=\\"logo\\" onerror=\\"this.remove()\\"/>";}\n';
  s += '  html+="</div>";\n';
  s += '  html+="<h1 class=\\"restaurant-name\\">"+escapeHtml(RESTAURANT.name)+"</h1>";\n';
  s += '  if(RESTAURANT.slogan){html+="<div class=\\"slogan\\">"+escapeHtml(RESTAURANT.slogan)+"</div>";}\n';
  s += '  if(RESTAURANT.description){html+="<p class=\\"restaurant-desc\\">"+escapeHtml(RESTAURANT.description)+"</p>";}\n';
  s += '  html+="<span class=\\"open-badge\\">Abierto ahora</span>";\n';
  s += '  html+="</header>";\n';
  // Search bar (opcional)
  if (showSearch) {
    s += '  html+="<div class=\\"search-wrap\\" style=\\"position:relative\\"><svg class=\\"search-icon\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\"><circle cx=\\"11\\" cy=\\"11\\" r=\\"8\\"/><path d=\\"m21 21-4.3-4.3\\"/></svg><input type=\\"text\\" class=\\"search-input\\" id=\\"searchInput\\" placeholder=\\"Buscar plato...\\"/></div>";\n';
  }
  // Nav
  s += '  html+="<nav class=\\"nav\\"><div class=\\"nav-inner\\" id=\\"navInner\\">";\n';
  s += '  RESTAURANT.categories.forEach(function(cat,i){\n';
  s += '    var icon=THEME.showSearch? getCategoryIcon(cat.name):"";\n';
  s += '    html+="<div class=\\"nav-item"+(i===0?" active":"")+"\\" data-idx=\\""+i+"\\">"+(icon?"<span class=\\"nav-item-icon\\">"+icon+"</span>":"")+escapeHtml(cat.name)+"</div>";\n';
  s += '  });\n';
  s += '  html+="</div></nav>";\n';
  // Sections con dishes-grid
  s += '  RESTAURANT.categories.forEach(function(cat,i){\n';
  s += '    html+="<section class=\\"section\\" id=\\"cat-"+i+"\\">";\n';
  s += '    html+="<h2 class=\\"section-title\\">"+escapeHtml(cat.name)+"</h2>";\n';
  s += '    html+="<div class=\\"dishes-grid\\">";\n';
  s += '    cat.dishes.forEach(function(dish,j){\n';
  s += '      html+="<div class=\\"dish\\" data-cat=\\""+i+"\\" data-dish=\\""+j+"\\" data-name=\\""+escapeHtml((dish.name||"").toLowerCase())+"\\" data-desc=\\""+escapeHtml((dish.description||"").toLowerCase())+"\\" style=\\"transition-delay:"+(j*40)+"ms\\">";\n';
  s += '      if(dish.image_url){html+="<img src=\\""+escapeHtml(dish.image_url)+"\\" class=\\"dish-img\\" alt=\\"\\" onerror=\\"this.style.display=\\\'none\\\'\\" loading=\\"lazy\\"/>";}\n';
  s += '      else if(THEME.imageSize!=="none"){html+="<div class=\\"dish-img\\"></div>";}\n';
  s += '      html+="<div class=\\"dish-info\\">";\n';
  s += '      html+="<div class=\\"dish-name\\">"+escapeHtml(dish.name)+"</div>";\n';
  s += '      if(dish.description){html+="<div class=\\"dish-desc\\">"+escapeHtml(dish.description)+"</div>";}\n';
  s += '      html+="<div class=\\"dish-bottom\\">";\n';
  s += '      html+="<div class=\\"dish-price\\">"+formatPrice(dish.price)+"</div>";\n';
  s += '      html+="<button class=\\"add-btn\\" data-cat=\\""+i+"\\" data-dish=\\""+j+"\\" title=\\"Agregar\\">+</button>";\n';
  s += '      html+="</div></div></div>";\n';
  s += '    });\n';
  s += '    html+="</div></section>";\n';
  s += '  });\n';
  // Footer
  s += '  html+="<div class=\\"menu-footer\\"><span>"+escapeHtml(RESTAURANT.name)+"</span>";\n';
  s += '  if(SHOW_BRANDING){html+=" · <a href=\\"https://menupro.app\\" target=\\"_blank\\">"+escapeHtml(BRANDING_TEXT||"Creado con MenuPro")+"</a>";}\n';
  s += '  html+="</div>";\n';
  // Cart
  s += '  html+="<div class=\\"cart\\" id=\\"cartBar\\">";\n';
  s += '  html+="<div class=\\"cart-left\\"><span>Ver pedido</span><span class=\\"cart-count\\" id=\\"cartCount\\">0</span></div>";\n';
  s += '  html+="<div class=\\"cart-total\\" id=\\"cartTotal\\">"+formatPrice(0)+"</div>";\n';
  s += '  html+="</div>";\n';
  // Modal
  s += '  html+="<div class=\\"modal-overlay\\" id=\\"modal\\"><div class=\\"modal\\">";\n';
  s += '  html+="<h2 class=\\"modal-title\\">Tu Pedido</h2>";\n';
  s += '  html+="<p class=\\"modal-subtitle\\">Revisa tu orden antes de enviar por WhatsApp</p>";\n';
  s += '  html+="<div class=\\"modal-divider\\"></div>";\n';
  s += '  html+="<div id=\\"cartItems\\"></div>";\n';
  s += '  html+="<div class=\\"cart-summary\\" id=\\"cartSummary\\"></div>";\n';
  s += '  html+="<button class=\\"wa-btn\\" id=\\"waBtn\\"><svg class=\\"wa-icon\\" viewBox=\\"0 0 24 24\\"><path d=\\"M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z\\"/></svg>Enviar Pedido por WhatsApp</button>";\n';
  s += '  html+="<button class=\\"close-btn\\" id=\\"closeBtn\\">Seguir agregando</button>";\n';
  s += '  html+="</div></div>";\n';
  s += '  app.innerHTML=html;\n';
  s += '  attachEvents();\n';
  s += '  setupReveal();\n';

  // Helper getCategoryIcon
  s += 'function getCategoryIcon(name){var n=(name||"").toLowerCase();if(n.indexOf("entr")>=0||n.indexOf("aperit")>=0)return "🥗";if(n.indexOf("sopa")>=0||n.indexOf("caldo")>=0)return "🍜";if(n.indexOf("pasta")>=0)return "🍝";if(n.indexOf("parrilla")>=0||n.indexOf("grill")>=0||n.indexOf("carne")>=0)return "🥩";if(n.indexOf("pollo")>=0)return "🍗";if(n.indexOf("pesca")>=0||n.indexOf("maris")>=0)return "🐟";if(n.indexOf("postre")>=0)return "🍰";if(n.indexOf("bebida")>=0||n.indexOf("drink")>=0)return "🥤";if(n.indexOf("trago")>=0||n.indexOf("cocktail")>=0||n.indexOf("bar")>=0)return "🍸";if(n.indexOf("desay")>=0)return "🍳";if(n.indexOf("pizza")>=0)return "🍕";if(n.indexOf("burger")>=0||n.indexOf("hambur")>=0)return "🍔";if(n.indexOf("ensal")>=0)return "🥗";if(n.indexOf("sushi")>=0)return "🍣";if(n.indexOf("taco")>=0||n.indexOf("mexic")>=0)return "🌮";if(n.indexOf(" asia")>=0||n.indexOf("chino")>=0||n.indexOf("wok")>=0)return "🥡";if(n.indexOf("vegan")>=0||n.indexOf("veggie")>=0)return "🌱";if(n.indexOf("cafe")>=0||n.indexOf("coffee")>=0)return "☕";return "🍴";}\n';

  // searchInput event listener (si showSearch)
  if (showSearch) {
    s += 'var searchInput=document.getElementById("searchInput");\n';
    s += 'if(searchInput){searchInput.addEventListener("input",function(e){searchQuery=e.target.value.toLowerCase();filterDishes();});}\n';
    s += 'function filterDishes(){var dishes=document.querySelectorAll(".dish");var anyVisible=false;dishes.forEach(function(d){var n=d.getAttribute("data-name")||"";var desc=d.getAttribute("data-desc")||"";var visible=n.indexOf(searchQuery)>=0||desc.indexOf(searchQuery)>=0;d.style.display=visible?"":"none";if(visible)anyVisible=true;});document.querySelectorAll(".no-results").forEach(function(n){n.remove();});if(!anyVisible&&searchQuery){var sections=document.querySelectorAll(".section");if(sections.length){var last=sections[sections.length-1];last.insertAdjacentHTML("afterend","<div class=\\"no-results\\">No se encontraron platos</div>");}}}\n';
  }

  s += '  updateCart();\n';
  s += '}\n';
  // Reveal
  s += 'function setupReveal(){\n';
  s += '  var dishes=document.querySelectorAll(".dish");\n';
  s += '  if(!("IntersectionObserver" in window)){dishes.forEach(function(d){d.classList.add("revealed");});return;}\n';
  s += '  var io=new IntersectionObserver(function(entries){\n';
  s += '    entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add("revealed");io.unobserve(e.target);}});\n';
  s += '  },{threshold:0.05,rootMargin:"0px 0px -30px 0px"});\n';
  s += '  dishes.forEach(function(d){io.observe(d);});\n';
  s += '}\n';
  // Events
  s += 'function attachEvents(){\n';
  s += '  document.querySelectorAll(".add-btn").forEach(function(btn){\n';
  s += '    btn.addEventListener("click",function(e){\n';
  s += '      e.stopPropagation();\n';
  s += '      var catIdx=parseInt(this.dataset.cat);\n';
  s += '      var dishIdx=parseInt(this.dataset.dish);\n';
  s += '      addToCart(catIdx,dishIdx,this);\n';
  s += '    });\n';
  s += '  });\n';
  s += '  document.querySelectorAll(".dish").forEach(function(d){\n';
  s += '    d.addEventListener("click",function(){\n';
  s += '      var catIdx=parseInt(this.dataset.cat);\n';
  s += '      var dishIdx=parseInt(this.dataset.dish);\n';
  s += '      addToCart(catIdx,dishIdx);\n';
  s += '    });\n';
  s += '  });\n';
  s += '  document.querySelectorAll(".nav-item").forEach(function(item){\n';
  s += '    item.addEventListener("click",function(){\n';
  s += '      document.querySelectorAll(".nav-item").forEach(function(n){n.classList.remove("active");});\n';
  s += '      this.classList.add("active");\n';
  s += '      var idx=parseInt(this.dataset.idx);\n';
  s += '      var el=document.getElementById("cat-"+idx);\n';
  s += '      if(el){var top=el.getBoundingClientRect().top+window.pageYOffset-70;window.scrollTo({top:top,behavior:"smooth"});}\n';
  s += '    });\n';
  s += '  });\n';
  s += '  document.getElementById("cartBar").addEventListener("click",openModal);\n';
  s += '  document.getElementById("closeBtn").addEventListener("click",closeModal);\n';
  s += '  document.getElementById("waBtn").addEventListener("click",sendWhatsApp);\n';
  s += '  document.getElementById("modal").addEventListener("click",function(e){if(e.target===this)closeModal();});\n';
  s += '  window.addEventListener("scroll",updateActiveNav,{passive:true});\n';
  s += '}\n';
  // Update active nav
  s += 'function updateActiveNav(){\n';
  s += '  var scrollPos=window.pageYOffset+100;\n';
  s += '  var sections=document.querySelectorAll(".section");\n';
  s += '  var activeIdx=0;\n';
  s += '  for(var i=0;i<sections.length;i++){if(sections[i].offsetTop<=scrollPos)activeIdx=i;}\n';
  s += '  document.querySelectorAll(".nav-item").forEach(function(n,i){n.classList.toggle("active",i===activeIdx);});\n';
  s += '}\n';
  // Add to cart
  s += 'function addToCart(catIdx,dishIdx,btn){\n';
  s += '  var dish=RESTAURANT.categories[catIdx].dishes[dishIdx];\n';
  s += '  var existing=null;\n';
  s += '  for(var i=0;i<cart.length;i++){if(cart[i].catIdx===catIdx&&cart[i].dishIdx===dishIdx){existing=cart[i];break;}}\n';
  s += '  if(existing){existing.qty++;}\n';
  s += '  else{cart.push({catIdx:catIdx,dishIdx:dishIdx,name:dish.name,price:dish.price,qty:1});}\n';
  s += '  if(btn){showAddedFlash(btn.closest(".dish"));}\n';
  s += '  updateCart(true);\n';
  s += '}\n';
  // Show flash
  s += 'function showAddedFlash(dishEl){\n';
  s += '  if(!dishEl)return;\n';
  s += '  var flash=document.createElement("div");\n';
  s += '  flash.className="added-flash";\n';
  s += '  flash.textContent="AGREGADO";\n';
  s += '  dishEl.appendChild(flash);\n';
  s += '  setTimeout(function(){if(flash.parentNode)flash.parentNode.removeChild(flash);},900);\n';
  s += '}\n';
  // Update cart
  s += 'function updateCart(pulse){\n';
  s += '  var count=0,total=0;\n';
  s += '  cart.forEach(function(c){count+=c.qty;total+=c.price*c.qty;});\n';
  s += '  var countEl=document.getElementById("cartCount");\n';
  s += '  countEl.textContent=count;\n';
  s += '  document.getElementById("cartTotal").textContent=formatPrice(total);\n';
  s += '  var cartBar=document.getElementById("cartBar");\n';
  s += '  if(count>0){cartBar.classList.add("visible");}else{cartBar.classList.remove("visible");}\n';
  s += '  if(pulse){countEl.classList.remove("pulse");void countEl.offsetWidth;countEl.classList.add("pulse");}\n';
  s += '  renderCartItems();\n';
  s += '}\n';
  // Render cart items
  s += 'function renderCartItems(){\n';
  s += '  var container=document.getElementById("cartItems");\n';
  s += '  var summary=document.getElementById("cartSummary");\n';
  s += '  if(cart.length===0){\n';
  s += '    container.innerHTML="<div class=\\"cart-empty\\">Tu carrito esta vacio</div>";\n';
  s += '    summary.innerHTML="";\n';
  s += '    return;\n';
  s += '  }\n';
  s += '  var html="";\n';
  s += '  cart.forEach(function(item,i){\n';
  s += '    html+="<div class=\\"cart-item\\">";\n';
  s += '    html+="<div class=\\"cart-item-info\\">";\n';
  s += '    html+="<div class=\\"cart-item-name\\">"+escapeHtml(item.name)+"</div>";\n';
  s += '    html+="<div class=\\"cart-item-price\\">"+formatPrice(item.price)+" c/u</div>";\n';
  s += '    html+="</div>";\n';
  s += '    html+="<div class=\\"qty-control\\">";\n';
  s += '    html+="<button class=\\"qty-btn\\" data-action=\\"dec\\" data-idx=\\""+i+"\\">−</button>";\n';
  s += '    html+="<span class=\\"qty\\">"+item.qty+"</span>";\n';
  s += '    html+="<button class=\\"qty-btn\\" data-action=\\"inc\\" data-idx=\\""+i+"\\">+</button>";\n';
  s += '    html+="</div>";\n';
  s += '    html+="<div class=\\"cart-item-total\\">"+formatPrice(item.price*item.qty)+"</div>";\n';
  s += '    html+="</div>";\n';
  s += '  });\n';
  s += '  container.innerHTML=html;\n';
  s += '  var total=0;cart.forEach(function(c){total+=c.price*c.qty;});\n';
  s += '  summary.innerHTML="<div class=\\"summary-row\\"><span>Subtotal</span><span>"+formatPrice(total)+"</span></div>";\n';
  s += '  summary.innerHTML+="<div class=\\"summary-total\\"><span>Total</span><span class=\\"amount\\">"+formatPrice(total)+"</span></div>";\n';
  s += '  container.querySelectorAll(".qty-btn").forEach(function(btn){\n';
  s += '    btn.addEventListener("click",function(){\n';
  s += '      var idx=parseInt(this.dataset.idx);\n';
  s += '      if(this.dataset.action==="inc"){cart[idx].qty++;}\n';
  s += '      else{cart[idx].qty--;if(cart[idx].qty<=0)cart.splice(idx,1);}\n';
  s += '      updateCart();\n';
  s += '    });\n';
  s += '  });\n';
  s += '}\n';
  // Modal
  s += 'function openModal(){\n';
  s += '  if(cart.length===0)return;\n';
  s += '  document.getElementById("modal").classList.add("visible");\n';
  s += '}\n';
  s += 'function closeModal(){document.getElementById("modal").classList.remove("visible");}\n';
  // WhatsApp
  s += 'function sendWhatsApp(){\n';
  s += '  if(cart.length===0)return;\n';
  s += '  var msg="*"+RESTAURANT.name+"*\\n";\n';
  s += '  if(RESTAURANT.slogan){msg+="_"+RESTAURANT.slogan+"_\\n";}\n';
  s += '  msg+="\\n*PEDIDO*\\n\\n";\n';
  s += '  cart.forEach(function(item){\n';
  s += '    msg+="• "+item.qty+"x "+item.name+" — "+formatPrice(item.price*item.qty)+"\\n";\n';
  s += '  });\n';
  s += '  var total=0;cart.forEach(function(c){total+=c.price*c.qty;});\n';
  s += '  msg+="\\n*TOTAL: "+formatPrice(total)+"*\\n\\n";\n';
  s += '  msg+="Hola, quisiera confirmar este pedido por favor.";\n';
  s += '  var url="https://wa.me/"+RESTAURANT.whatsapp+"?text="+encodeURIComponent(msg);\n';
  s += '  window.open(url,"_blank");\n';
  s += '}\n';
  s += 'renderApp();\n';
  return s;
}
