import { escapeHtml, hexToRgbStr, type MenuData } from '@/lib/menu-utils';

/**
 * Construye el HTML completo autocontenido del menú público.
 * Usa concatenación de strings (no template literals anidados) para evitar
 * problemas de escape. Inyecta los datos via JSON.stringify().
 */
export function buildMenuHTML(data: MenuData): string {
  const css = buildCSS();
  const js = buildJS();
  const colorRgb = hexToRgbStr(data.color);

  let html = '';
  html += '<!DOCTYPE html>\n';
  html += '<html lang="es">\n';
  html += '<head>\n';
  html += '<meta charset="UTF-8">\n';
  html += '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
  html += '<meta name="theme-color" content="' + data.color + '">\n';
  html += '<meta name="description" content="' + escapeHtml(data.description || data.name) + '">\n';
  html += '<title>' + escapeHtml(data.name) + '</title>\n';
  html += '<style>' + css + '</style>\n';
  html += '</head>\n';
  html += '<body>\n';
  html += '<div id="app"></div>\n';
  html += '<script>\n';
  html += 'var RESTAURANT = ' + JSON.stringify(data) + ';\n';
  html += 'var SHOW_BRANDING = ' + (!!data.branding_text) + ';\n';
  html += 'var BRANDING_TEXT = ' + JSON.stringify(data.branding_text || '') + ';\n';
  html += 'document.documentElement.style.setProperty("--accent", "' + data.color + '");\n';
  html += 'document.documentElement.style.setProperty("--accent-rgb", "' + colorRgb + '");\n';
  html += js + '\n';
  html += '</scr' + 'ipt>\n';
  html += '</body>\n';
  html += '</html>';
  return html;
}

function buildCSS(): string {
  let c = '';
  c += ':root{--accent:#ff6b35;--accent-rgb:255,107,53;--gold:#d4af37;--bg-0:#07070b;--bg-1:#0f0f1a;--glass:rgba(255,255,255,0.035);--glass-strong:rgba(255,255,255,0.07);--border:rgba(255,255,255,0.08);--border-strong:rgba(255,255,255,0.14);--text:#f4f4fa;--text-muted:#8a8a9a;--text-soft:#b8b8c8;}';
  c += '*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}';
  c += 'html{scroll-behavior:smooth;}';
  c += 'body{font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:var(--bg-0);color:var(--text);min-height:100vh;padding-bottom:140px;position:relative;overflow-x:hidden;}';
  c += 'body::before,body::after{content:"";position:fixed;width:500px;height:500px;border-radius:50%;filter:blur(140px);opacity:0.18;z-index:0;pointer-events:none;}';
  c += 'body::before{background:var(--accent);top:-200px;right:-150px;}';
  c += 'body::after{background:var(--gold);bottom:-200px;left:-150px;}';
  c += '#app{position:relative;z-index:1;}';
  // Header
  c += '.header{padding:38px 24px 30px;text-align:center;position:relative;background:linear-gradient(180deg,rgba(255,255,255,0.03) 0%,transparent 100%);border-bottom:1px solid var(--border);}';
  c += '.header::after{content:"";position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:140px;height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent);}';
  c += '.logo-wrap{position:relative;display:inline-block;margin-bottom:16px;width:96px;height:96px;}';
  c += '.logo-wrap::before{content:"";position:absolute;inset:-6px;border-radius:50%;background:conic-gradient(from 0deg,var(--accent),var(--gold),var(--accent));filter:blur(10px);opacity:0.5;z-index:0;animation:rotate 8s linear infinite;}';
  c += '@keyframes rotate{to{transform:rotate(360deg);}}';
  c += '.logo{width:96px;height:96px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,0.12);box-shadow:0 8px 32px rgba(0,0,0,0.5);background:var(--glass);position:absolute;inset:0;z-index:2;}';
  c += '.logo-placeholder{width:96px;height:96px;border-radius:50%;background:linear-gradient(135deg,var(--accent),rgba(var(--accent-rgb),0.6));display:flex;align-items:center;justify-content:center;font-size:38px;font-weight:800;color:#fff;position:absolute;inset:0;z-index:1;border:3px solid rgba(255,255,255,0.12);box-shadow:0 8px 32px rgba(0,0,0,0.5);}';
  c += '.restaurant-name{font-size:28px;font-weight:800;margin-bottom:6px;letter-spacing:-0.5px;background:linear-gradient(180deg,#fff,#c8c8d4);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;}';
  c += '.slogan{font-size:11px;color:var(--gold);letter-spacing:4px;text-transform:uppercase;font-weight:600;margin-bottom:8px;}';
  c += '.restaurant-desc{color:var(--text-soft);font-size:14px;margin-bottom:18px;max-width:440px;margin-left:auto;margin-right:auto;line-height:1.5;}';
  c += '.open-badge{display:inline-flex;align-items:center;gap:7px;background:rgba(6,214,160,0.12);color:#06d6a0;padding:6px 14px;border-radius:20px;font-size:11.5px;font-weight:600;border:1px solid rgba(6,214,160,0.25);letter-spacing:0.5px;text-transform:uppercase;}';
  c += '.open-badge::before{content:"";width:6px;height:6px;border-radius:50%;background:#06d6a0;box-shadow:0 0 8px #06d6a0;animation:pulse 2s infinite;}';
  c += '@keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.4;transform:scale(1.3);}}';
  // Nav
  c += '.nav{position:sticky;top:0;background:rgba(7,7,11,0.78);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border-bottom:1px solid var(--border);z-index:100;padding:14px 0;overflow-x:auto;scrollbar-width:none;}';
  c += '.nav::-webkit-scrollbar{display:none;}';
  c += '.nav-inner{display:flex;gap:8px;padding:0 20px;min-width:max-content;}';
  c += '.nav-item{white-space:nowrap;padding:8px 18px;background:var(--glass);border:1px solid var(--border);border-radius:24px;color:var(--text-soft);font-size:13.5px;font-weight:500;cursor:pointer;transition:all 0.25s cubic-bezier(0.4,0,0.2,1);}';
  c += '.nav-item:hover{background:var(--glass-strong);color:var(--text);transform:translateY(-1px);}';
  c += '.nav-item.active{background:linear-gradient(135deg,var(--accent),rgba(var(--accent-rgb),0.85));color:#fff;border-color:transparent;box-shadow:0 4px 16px rgba(var(--accent-rgb),0.4);}';
  // Section
  c += '.section{padding:24px 20px 8px;max-width:620px;margin:0 auto;width:100%;}';
  c += '.section-title{font-size:21px;font-weight:700;margin-bottom:18px;display:flex;align-items:center;gap:12px;letter-spacing:-0.3px;}';
  c += '.section-title::before{content:"";width:4px;height:22px;background:linear-gradient(180deg,var(--accent),var(--gold));border-radius:2px;}';
  // Dish
  c += '.dish{display:flex;gap:14px;background:var(--glass);border:1px solid var(--border);border-radius:16px;padding:14px;margin-bottom:12px;transition:all 0.3s cubic-bezier(0.4,0,0.2,1);opacity:0;transform:translateY(20px);position:relative;overflow:hidden;cursor:pointer;}';
  c += '.dish.revealed{opacity:1;transform:translateY(0);}';
  c += '.dish::before{content:"";position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent);opacity:0;transition:opacity 0.3s;}';
  c += '.dish:hover{border-color:rgba(var(--accent-rgb),0.3);background:rgba(var(--accent-rgb),0.04);transform:translateY(-3px);box-shadow:0 10px 28px rgba(0,0,0,0.35);}';
  c += '.dish:hover::before{opacity:1;}';
  c += '.dish:active{transform:translateY(0) scale(0.99);}';
  c += '.dish-img{width:84px;height:84px;border-radius:12px;object-fit:cover;flex-shrink:0;background:linear-gradient(135deg,var(--glass),var(--glass-strong));border:1px solid var(--border);}';
  c += '.dish-info{flex:1;min-width:0;display:flex;flex-direction:column;}';
  c += '.dish-name{font-size:16px;font-weight:600;margin-bottom:4px;letter-spacing:-0.2px;}';
  c += '.dish-desc{font-size:13px;color:var(--text-muted);margin-bottom:10px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}';
  c += '.dish-bottom{display:flex;justify-content:space-between;align-items:center;margin-top:auto;}';
  c += '.dish-price{font-size:18px;font-weight:700;color:var(--accent);letter-spacing:-0.5px;}';
  c += '.add-btn{width:36px;height:36px;border-radius:12px;background:linear-gradient(135deg,var(--accent),rgba(var(--accent-rgb),0.8));color:#fff;border:none;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.25s;line-height:1;font-weight:300;box-shadow:0 4px 14px rgba(var(--accent-rgb),0.35);}';
  c += '.add-btn:hover{transform:scale(1.1) rotate(90deg);box-shadow:0 6px 20px rgba(var(--accent-rgb),0.55);}';
  c += '.add-btn:active{transform:scale(0.95);}';
  c += '.added-flash{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(0);background:#06d6a0;color:#fff;padding:8px 18px;border-radius:24px;font-size:12px;font-weight:700;pointer-events:none;z-index:5;box-shadow:0 6px 18px rgba(6,214,160,0.5);animation:flashAdd 0.9s ease forwards;letter-spacing:0.3px;}';
  c += '@keyframes flashAdd{0%{transform:translate(-50%,-50%) scale(0);opacity:0;}25%{transform:translate(-50%,-50%) scale(1);opacity:1;}75%{transform:translate(-50%,-90%) scale(1);opacity:1;}100%{transform:translate(-50%,-130%) scale(0.8);opacity:0;}}';
  // Cart
  c += '.cart{position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(140px);width:calc(100% - 32px);max-width:480px;background:linear-gradient(135deg,var(--accent),rgba(var(--accent-rgb),0.9));color:#fff;border-radius:16px;padding:16px 22px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 14px 40px rgba(var(--accent-rgb),0.45),0 4px 12px rgba(0,0,0,0.4);cursor:pointer;transition:transform 0.4s cubic-bezier(0.4,0,0.2,1);z-index:90;border:1px solid rgba(255,255,255,0.18);}';
  c += '.cart.visible{transform:translateX(-50%) translateY(0);}';
  c += '.cart-left{display:flex;align-items:center;gap:10px;font-weight:600;font-size:15px;}';
  c += '.cart-count{background:rgba(255,255,255,0.25);padding:3px 10px;border-radius:12px;font-size:13px;font-weight:700;min-width:28px;text-align:center;}';
  c += '.cart-count.pulse{animation:countPulse 0.4s ease;}';
  c += '@keyframes countPulse{0%,100%{transform:scale(1);}50%{transform:scale(1.4);background:rgba(255,255,255,0.4);}}';
  c += '.cart-total{font-size:18px;font-weight:800;letter-spacing:-0.3px;}';
  // Modal
  c += '.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:200;display:none;align-items:flex-end;justify-content:center;}';
  c += '.modal-overlay.visible{display:flex;}';
  c += '.modal{background:linear-gradient(180deg,#1c1c2e,#14141f);width:100%;max-width:500px;border-radius:24px 24px 0 0;padding:28px 24px;max-height:85vh;overflow-y:auto;animation:slideUp 0.4s cubic-bezier(0.4,0,0.2,1);border:1px solid rgba(255,255,255,0.08);border-bottom:none;box-shadow:0 -16px 48px rgba(0,0,0,0.5);}';
  c += '@keyframes slideUp{from{transform:translateY(100%);}to{transform:translateY(0);}}';
  c += '.modal-title{font-size:22px;font-weight:700;margin-bottom:4px;text-align:center;letter-spacing:-0.3px;}';
  c += '.modal-subtitle{text-align:center;font-size:12.5px;color:var(--text-muted);margin-bottom:22px;letter-spacing:0.3px;}';
  c += '.modal-divider{height:1px;background:linear-gradient(90deg,transparent,var(--border-strong),transparent);margin:0 -24px 20px;}';
  c += '.cart-item{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid var(--border);gap:10px;animation:itemIn 0.3s ease;}';
  c += '@keyframes itemIn{from{opacity:0;transform:translateX(-10px);}to{opacity:1;transform:translateX(0);}}';
  c += '.cart-item-info{flex:1;min-width:0;}';
  c += '.cart-item-name{font-weight:600;font-size:15px;margin-bottom:2px;}';
  c += '.cart-item-price{color:var(--text-muted);font-size:12.5px;}';
  c += '.qty-control{display:flex;align-items:center;gap:10px;background:var(--glass);padding:4px;border-radius:24px;border:1px solid var(--border);}';
  c += '.qty-btn{width:28px;height:28px;border-radius:50%;background:var(--glass-strong);color:#fff;border:none;cursor:pointer;font-size:16px;line-height:1;transition:all 0.2s;display:flex;align-items:center;justify-content:center;}';
  c += '.qty-btn:hover{background:var(--accent);transform:scale(1.1);}';
  c += '.qty{min-width:24px;text-align:center;font-weight:600;font-size:14px;}';
  c += '.cart-item-total{font-weight:700;color:var(--accent);min-width:75px;text-align:right;font-size:15px;}';
  c += '.cart-empty{text-align:center;padding:50px 0;color:var(--text-muted);font-size:14px;}';
  c += '.cart-summary{margin-top:20px;padding-top:20px;border-top:2px solid var(--border);}';
  c += '.summary-row{display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;color:var(--text-soft);}';
  c += '.summary-total{font-size:18px;font-weight:700;margin-top:12px;color:#fff;display:flex;justify-content:space-between;align-items:center;}';
  c += '.summary-total .amount{color:var(--accent);font-size:24px;font-weight:800;letter-spacing:-0.5px;}';
  c += '.wa-btn{width:100%;background:linear-gradient(135deg,#25d366,#1da851);color:#fff;border:none;padding:16px;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;margin-top:22px;display:flex;align-items:center;justify-content:center;gap:10px;transition:all 0.2s;box-shadow:0 6px 20px rgba(37,211,102,0.35);letter-spacing:0.2px;}';
  c += '.wa-btn:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(37,211,102,0.5);}';
  c += '.wa-btn:active{transform:translateY(0);}';
  c += '.wa-icon{width:18px;height:18px;fill:currentColor;}';
  c += '.close-btn{width:100%;background:var(--glass);color:var(--text-soft);border:1px solid var(--border);padding:13px;border-radius:12px;font-size:14px;cursor:pointer;margin-top:10px;transition:all 0.2s;font-weight:500;}';
  c += '.close-btn:hover{background:var(--glass-strong);color:#fff;}';
  c += '.menu-footer{text-align:center;padding:30px 20px;color:var(--text-muted);font-size:11.5px;border-top:1px solid var(--border);margin-top:20px;}';
  c += '.menu-footer a{color:var(--gold);text-decoration:none;font-weight:600;letter-spacing:1px;}';
  c += '@media (min-width:600px){.dish{padding:16px;}.dish-img{width:100px;height:100px;}.restaurant-name{font-size:34px;}.logo,.logo-placeholder{width:104px;height:104px;}.section{padding:28px 24px 8px;}}';
  return c;
}

function buildJS(): string {
  let s = '';
  s += 'var cart = [];\n';
  s += 'function escapeHtml(s){if(s==null)return "";return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/\'/g,"&#39;");}\n';
  s += 'function formatPrice(n){return (RESTAURANT.currency||"S/")+" "+Number(n).toFixed(2);}\n';
  s += 'function renderApp(){\n';
  s += '  var app=document.getElementById("app");\n';
  s += '  var html="";\n';
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
  // Nav
  s += '  html+="<nav class=\\"nav\\"><div class=\\"nav-inner\\" id=\\"navInner\\">";\n';
  s += '  RESTAURANT.categories.forEach(function(cat,i){\n';
  s += '    html+="<div class=\\"nav-item"+(i===0?" active":"")+"\\" data-idx=\\""+i+"\\">"+escapeHtml(cat.name)+"</div>";\n';
  s += '  });\n';
  s += '  html+="</div></nav>";\n';
  // Sections
  s += '  RESTAURANT.categories.forEach(function(cat,i){\n';
  s += '    html+="<section class=\\"section\\" id=\\"cat-"+i+"\\">";\n';
  s += '    html+="<h2 class=\\"section-title\\">"+escapeHtml(cat.name)+"</h2>";\n';
  s += '    cat.dishes.forEach(function(dish,j){\n';
  s += '      html+="<div class=\\"dish\\" data-cat=\\""+i+"\\" data-dish=\\""+j+"\\" style=\\"transition-delay:"+(j*40)+"ms\\">";\n';
  s += '      if(dish.image_url){html+="<img src=\\""+escapeHtml(dish.image_url)+"\\" class=\\"dish-img\\" alt=\\"\\" onerror=\\"this.style.display=\\\'none\\\'\\"/>";}\n';
  s += '      else{html+="<div class=\\"dish-img\\"></div>";}\n';
  s += '      html+="<div class=\\"dish-info\\">";\n';
  s += '      html+="<div class=\\"dish-name\\">"+escapeHtml(dish.name)+"</div>";\n';
  s += '      if(dish.description){html+="<div class=\\"dish-desc\\">"+escapeHtml(dish.description)+"</div>";}\n';
  s += '      html+="<div class=\\"dish-bottom\\">";\n';
  s += '      html+="<div class=\\"dish-price\\">"+formatPrice(dish.price)+"</div>";\n';
  s += '      html+="<button class=\\"add-btn\\" data-cat=\\""+i+"\\" data-dish=\\""+j+"\\" title=\\"Agregar\\">+</button>";\n';
  s += '      html+="</div></div></div>";\n';
  s += '    });\n';
  s += '    html+="</section>";\n';
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
