#!/usr/bin/env python3
"""
MenuPro — Seed 3 cuentas demo (PRO / PREMIUM / FULL) para publicidad.

Crea 3 cuentas demo completamente funcionales y pobladas con métricas realistas:

  1. demopro@menudigital.pro       (plan PRO)
     - 3 menús (Pollería, Pizzería, Burger House) — ~70 platos
     - ~900 views + ~150 WA clicks distribuidos en 90 días
     - NO mozos/mesas/inventario (PRO no los tiene)
     - Branding "Creado con MenuPro" visible

  2. demopremium@menudigital.pro   (plan PREMIUM)
     - 5 menús (Pollería, Chifa, Pizzería, Cevichería, Burger) — ~120 platos
     - ~3000 views + ~500 WA clicks distribuidos en 90 días
     - 1 sucursal, 8 mozos, 15 mesas, 25 insumos, 50 comandas con items
     - White-label (sin branding MenuPro)

  3. demofull@menudigital.pro      (plan FULL)
     - 7 menús (los 5 anteriores + Burger Gourmet + Café Postres) — ~180 platos
     - ~7000 views + ~1200 WA clicks distribuidos en 90 días
     - 3 sucursales, 15 mozos, 30 mesas, 50 insumos, 120 comandas
     - Recetas plato→insumo, movimientos de inventario, vouchers impresos
     - 1 dominio custom (demo)

Credenciales para las 3:
  Password: DemoMenuPro2025!

Idempotente: usa uuid5 determinístico + ON CONFLICT DO UPDATE.
Se puede ejecutar cuantas veces se quiera sin romper nada.
"""

import os
import sys
import uuid
import random
import time
import bcrypt
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime, timedelta, timezone

# ─────────────────────────────────────────────────────────────────────────────
# Configuración
# ─────────────────────────────────────────────────────────────────────────────

DEMO_PASSWORD = "DemoMenuPro2025!"

# Namespace fijo para UUIDs determinísticos
NS = uuid.UUID("00000000-0000-0000-0000-0000cafef00d")

# Conexión Supabase producción
CONN = dict(
    host='aws-0-sa-east-1.pooler.supabase.com',
    port=5432,
    dbname='postgres',
    user='postgres.bkxtploibraiovgrjtwn',
    password='Wafla0523129500',
    sslmode='require',
    connect_timeout=30,
)

# Para que random sea reproducible (métricas consistentes entre runs)
random.seed(20250802)

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def uid(prefix: str) -> str:
    """UUID determinístico."""
    return str(uuid.uuid5(NS, prefix))

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def unsplash(photo_id: str, w: int = 800, h: int = 600) -> str:
    return f"https://images.unsplash.com/photo-{photo_id}?w={w}&h={h}&fit=crop&crop=entropy&q=80&fm=webp"

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def random_dt_in_last(days: int, jitter_hours: int = 0) -> datetime:
    """Datetime aleatorio en los últimos `days` días."""
    end = datetime.now(timezone.utc) - timedelta(hours=jitter_hours)
    start = end - timedelta(days=days)
    delta = end - start
    seconds = int(delta.total_seconds())
    return start + timedelta(seconds=random.randint(0, seconds))

def sql_str(s) -> str:
    if s is None:
        return "NULL"
    if isinstance(s, str):
        return "'" + s.replace("'", "''") + "'"
    return str(s)


# ─────────────────────────────────────────────────────────────────────────────
# Definición de restaurantes (reutiliza datos del demo seed original)
# ─────────────────────────────────────────────────────────────────────────────

RESTAURANTS = [
    {
        "key": "polleria",
        "name": "Pollería El Dorado Chicken",
        "slogan": "El verdadero pollo a la brasa peruano",
        "description": "Más de 25 años llevando el mejor pollo a la brasa a tu mesa. Brasa, broaster y guarniciones hechas en casa todos los días.",
        "whatsapp": "+51987654321",
        "color": "#d62828",
        "secondary": "#1a1a2e",
        "logo": unsplash("1518492104633-130d0cc84637", 400, 400),
        "cover": unsplash("1606756790138-261d2b21cd75", 1600, 600),
        "theme": {"layout": "single", "dark_mode": True, "card_style": "expanded",
                  "image_size": "large", "font": "Inter", "show_search": True,
                  "show_category_icons": True, "rounded_corners": True, "dish_gallery": True,
                  "carta_style": False, "carta_list_style": False, "carta_autoscroll": False,
                  "carta_scroll_speed": 30},
        "social": {"facebook": "https://facebook.com/elpolleriaeldorado",
                   "instagram": "https://instagram.com/eldorado_chicken",
                   "tiktok": "https://tiktok.com/@eldoradochicken"},
        "categories": [
            {"name": "Pollos a la Brasa", "dishes": [
                ("Pollo a la Brasa Entero", "1 pollo entero (8 presas) ahumado al carbón, servido con papas fritas, ensalada y ají de la casa.", 58.00, "1606756790138-261d2b21cd75"),
                ("Medio Pollo a la Brasa", "4 presas de pollo a la brasa con papas fritas y ensalada clásica.", 34.00, "1598103442097-8b74394b95c6"),
                ("Cuarto de Pollo", "2 presas de pollo a la brasa con papas fritas y ensalada.", 19.00, "1569058242253-92a9c755a0ec"),
                ("Cuarto de Pollo + Porción Extra", "Cuarto de pollo con doble porción de papas fritas y ensalada familiar.", 24.00, "1606756790138-261d2b21cd75"),
                ("Pollo a la Brasa Picante", "Pollo a la brasa bañado en salsa picante de la casa. Para los amantes del ají.", 36.00, "1555939594-58d7cb561ad1"),
            ]},
            {"name": "Pollo Broaster", "dishes": [
                ("Pollo Broaster Entero", "8 presas de pollo broaster crujiente con papas fritas y ají.", 56.00, "1569058242253-92a9c755a0ec"),
                ("Medio Pollo Broaster", "4 presas broaster con papas fritas y ensalada.", 32.00, "1555939594-58d7cb561ad1"),
                ("Cuarto Broaster", "2 presas broaster con papas fritas.", 18.00, "1606756790138-261d2b21cd75"),
                ("Alitas Broaster (12 u)", "12 alitas broaster crujientes con salsa a elección.", 28.00, "1598103442097-8b74394b95c6"),
                ("Nuggets de Pollo (10 u)", "10 nuggets crujientes con salsa a elección.", 18.00, "1607013251379-e6eecfffe234"),
            ]},
            {"name": "Guarniciones", "dishes": [
                ("Papas Fritas Familiares", "Porción grande de papas fritas crujientes para 4 personas.", 14.00, "1573080496219-bb080dd4f877"),
                ("Ensalada Familiar", "Lechuga, tomate, cebolla, zanahoria y palta. Aderezo de la casa.", 12.00, "1512621776951-a57141f2eefd"),
                ("Arroz Blanco", "Porción de arroz blanco graneado para acompañar.", 6.00, "1586201375761-83865001e31c"),
                ("Arroz Chaufa de Pollo", "Salteado al wok con huevo, sillao y cebollita china.", 18.00, "1606756790138-261d2b21cd75"),
                ("Frijoles Patrones", "Porción de frijoles canarios guisados al estilo peruano.", 8.00, "1606756790138-261d2b21cd75"),
            ]},
            {"name": "Combos Familiares", "dishes": [
                ("Combo Familiar 4 Personas", "1 pollo entero a la brasa + papas + ensalada + 4 gaseosas 500ml.", 75.00, "1606756790138-261d2b21cd75"),
                ("Combo Pareja", "1/2 pollo + papas + ensalada + 2 gaseosas 500ml.", 45.00, "1598103442097-8b74394b95c6"),
                ("Combo Súper Familiar", "1 pollo entero + 1/4 pollo extra + papas grandes + ensalada + 4 gaseosas.", 89.00, "1569058242253-92a9c755a0ec"),
                ("Combo Individual", "1/4 pollo + papas + ensalada + gaseosa 500ml.", 22.00, "1518492104633-130d0cc84637"),
            ]},
            {"name": "Bebidas", "dishes": [
                ("Inca Kola 500ml", "Gaseosa Inca Kola personal 500ml bien helada.", 5.00, "1437418747212-8d9709afab22"),
                ("Coca Cola 500ml", "Gaseosa Coca Cola personal 500ml.", 5.00, "1554866585-cd94860890b7"),
                ("Chicha Morada 1L", "Chicha morada casera preparada con maíz morado, piña y canela.", 12.00, "1606756790138-261d2b21cd75"),
                ("Maracuyá 1L", "Jugo de maracuyá natural preparado al momento.", 14.00, "1606756790138-261d2b21cd75"),
                ("Limonada Fría 1L", "Limonada con hierbabuena fría.", 10.00, "1606756790138-261d2b21cd75"),
            ]},
        ],
    },
    {
        "key": "chifa",
        "name": "Chifa Dragón de Oro",
        "slogan": "Tradición china peruana desde 1985",
        "description": "Auténtica comida china-peruana preparada por chefs cantoneses. Wok al fuego, ingredientes frescos y el verdadero sabor del chifa peruano.",
        "whatsapp": "+51987654322",
        "color": "#c1121f",
        "secondary": "#1a1a2e",
        "logo": unsplash("1525755662778-989d0524087e", 400, 400),
        "cover": unsplash("1582450871972-ab5ca641643d", 1600, 600),
        "theme": {"layout": "double", "dark_mode": True, "card_style": "expanded",
                  "image_size": "medium", "font": "Playfair Display", "show_search": True,
                  "show_category_icons": True, "rounded_corners": True, "dish_gallery": True,
                  "carta_style": False, "carta_list_style": False, "carta_autoscroll": False,
                  "carta_scroll_speed": 30},
        "social": {"facebook": "https://facebook.com/chifadragondeoro",
                   "instagram": "https://instagram.com/dragondeoro"},
        "categories": [
            {"name": "Entradas", "dishes": [
                ("Wantán Frito (12 u)", "12 wantanes crujientes rellenos de carne de cerdo, con salsa tamarindo.", 18.00, "1606756790138-261d2b21cd75"),
                ("Sopa Wantán", "Sopa con wantanes de cerdo, pollo, huevos y cebollita china.", 16.00, "1504674900247-0877df9cc836"),
                ("Tallarín Saltado Kallu", "Tallarín chino saltado al wok con pollo, sillao y vegetales.", 22.00, "1606756790138-261d2b21cd75"),
                ("Chijaukay de Pollo", "Pollo rebozado frito con salsa dulce-tamarindo y semillas de sésamo.", 26.00, "1569058242253-92a9c755a0ec"),
                ("Ensalada de Wantán", "Wantanes fritos sobre lechuga con aderezo de mostaza y sillao.", 20.00, "1512621776951-a57141f2eefd"),
            ]},
            {"name": "Sopas", "dishes": [
                ("Sopa Wantán Especial", "Caldo de pollo con wantanes, pollo, huevos y cebollita china.", 18.00, "1606756790138-261d2b21cd75"),
                ("Sopa Fuchifú", "Sopa de arroz inflado con pollo, huevos y cebollita china.", 16.00, "1606756790138-261d2b21cd75"),
                ("SuedPa", "Sopa con fideos chinos, mariscos, pollo y huevos.", 28.00, "1606756790138-261d2b21cd75"),
                ("Sopa de Mariscos", "Caldo con camarones, calamar, pescado y huevos.", 32.00, "1606756790138-261d2b21cd75"),
            ]},
            {"name": "Arroz Chaufa", "dishes": [
                ("Arroz Chaufa de Pollo", "Arroz frito al wok con pollo, huevos, sillao y cebollita china.", 22.00, "1525755662778-989d0524087e"),
                ("Arroz Chaufa de Camarón", "Arroz frito con camarones, huevos y vegetales.", 32.00, "1582450871972-ab5ca641643d"),
                ("Arroz Chaufa Especial", "Arroz frito con pollo, camarón, jamón y huevos.", 36.00, "1582450871972-ab5ca641643d"),
                ("Arroz Chaufa con Tallarín", "Mitad arroz chaufa, mitad tallarín saltado. Para indecisos.", 28.00, "1606756790138-261d2b21cd75"),
                ("Arroz Tipakay", "Arroz frito con pollo rebozado, jamón y huevos.", 30.00, "1606756790138-261d2b21cd75"),
            ]},
            {"name": "Tallarines", "dishes": [
                ("Tallarín Saltado de Pollo", "Fideos chinos saltados al wok con pollo, sillao y cebollita china.", 24.00, "1606756790138-261d2b21cd75"),
                ("Tallarín Saltado de Camarón", "Fideos chinos saltados con camarones y vegetales.", 34.00, "1606756790138-261d2b21cd75"),
                ("Tallarín Saltado Especial", "Fideos con pollo, camarón, jamón y huevos.", 38.00, "1606756790138-261d2b21cd75"),
                ("Tallarín con Tamarindo", "Fideos chinos con salsa tamarindo y pollo rebozado.", 28.00, "1606756790138-261d2b21cd75"),
            ]},
            {"name": "Especiales", "dishes": [
                ("Pollo Chi Jau Kay", "Pollo rebozado crujiente con salsa tamarindo dulce.", 28.00, "1569058242253-92a9c755a0ec"),
                ("Camarón Chi Jau Kay", "Camarones rebozados con salsa tamarindo.", 42.00, "1606756790138-261d2b21cd75"),
                ("Pollo Kallu", "Pollo deshilachado saltado con tallarín, ajo y sillao.", 26.00, "1606756790138-261d2b21cd75"),
                ("Japu", "Arroz chaufa cubierto con pollo saltado al wok.", 32.00, "1606756790138-261d2b21cd75"),
                ("Pollo Sueco", "Pollo frito con salsa agridulce de tomate.", 26.00, "1606756790138-261d2b21cd75"),
            ]},
            {"name": "Bebidas", "dishes": [
                ("Té Chino", "Té de jazmín caliente para acompañar la comida.", 4.00, "1606756790138-261d2b21cd75"),
                ("Chicha Morada 1L", "Chicha morada casera preparada con maíz morado.", 12.00, "1606756790138-261d2b21cd75"),
                ("Inca Kola 1.5L", "Gaseosa Inca Kola 1.5 litros para compartir.", 12.00, "1606756790138-261d2b21cd75"),
                ("Coca Cola 1.5L", "Gaseosa Coca Cola 1.5 litros.", 12.00, "1606756790138-261d2b21cd75"),
                ("Limón Frío 1L", "Limonada con hierbabuena bien fría.", 10.00, "1606756790138-261d2b21cd75"),
            ]},
        ],
    },
    {
        "key": "pizzeria",
        "name": "Pizzería Bella Napoli",
        "slogan": "Auténtica pizza napolitana al horno de piedra",
        "description": "Pizza artesanal hecha con masa madre y horno de piedra. Ingredientes importados de Italia y mozzarella fior di latte.",
        "whatsapp": "+51987654323",
        "color": "#bc4749",
        "secondary": "#f2e8cf",
        "logo": unsplash("1513104890138-7c749659a591", 400, 400),
        "cover": unsplash("1565299624946-b28f40a0ae38", 1600, 600),
        "theme": {"layout": "grid", "dark_mode": False, "card_style": "minimal",
                  "image_size": "medium", "font": "Playfair Display", "show_search": True,
                  "show_category_icons": True, "rounded_corners": True, "dish_gallery": True,
                  "carta_style": False, "carta_list_style": False, "carta_autoscroll": False,
                  "carta_scroll_speed": 30},
        "social": {"instagram": "https://instagram.com/bellanapoli_pe",
                   "facebook": "https://facebook.com/bellanapolipizzeria",
                   "tiktok": "https://tiktok.com/@bellanapoli"},
        "categories": [
            {"name": "Pizzas Clásicas", "dishes": [
                ("Pizza Margherita", "Salsa de tomate San Marzano, mozzarella fior di latte, albahaca fresca y aceite de oliva.", 38.00, "1513104890138-7c749659a591"),
                ("Pizza Napolitana", "Salsa de tomate, mozzarella, anchoas, alcaparras y orégano.", 42.00, "1574071318508-1cdbab80d002"),
                ("Pizza Pepperoni", "Salsa de tomate, mozzarella y pepperoni picante.", 44.00, "1565299624946-b28f40a0ae38"),
                ("Pizza Quattro Formaggi", "Mozzarella, gorgonzola, parmesano y fontina.", 48.00, "1604382354936-07c5d9983bd3"),
                ("Pizza Quattro Stagioni", "Tomate, mozzarella, jamón, champiñones, alcachofas y aceitunas.", 46.00, "1593560708920-61dd98c46a4e"),
                ("Pizza Prosciutto e Funghi", "Tomate, mozzarella, jamón italiano y champiñones frescos.", 44.00, "1604382354936-07c5d9983bd3"),
            ]},
            {"name": "Pizzas Especiales", "dishes": [
                ("Pizza Diavola", "Salsa picante, mozzarella, salame picante y ají molido.", 46.00, "1574071318508-1cdbab80d002"),
                ("Pizza Tartufo", "Mozzarella, crema de trufa negra, champiñones y parmesano.", 58.00, "1593560708920-61dd98c46a4e"),
                ("Pizza Prosciutto e Rucola", "Mozzarella, jamón crudo, rúcula fresca y parmesano en lascas.", 52.00, "1565299624946-b28f40a0ae38"),
                ("Pizza Capricciosa", "Tomate, mozzarella, jamón, champiñones, alcachofas y aceitunas negras.", 48.00, "1604382354936-07c5d9983bd3"),
                ("Pizza Frutti di Mare", "Salsa de tomate, mozzarella, camarones, calamar y mejillones.", 56.00, "1574071318508-1cdbab80d002"),
            ]},
            {"name": "Pastas", "dishes": [
                ("Spaghetti Carbonara", "Spaghetti con guanciale, yema de huevo, pecorino y pimienta negra.", 32.00, "1551183053-bf91a1d81141"),
                ("Spaghetti Bolognese", "Salsa boloñesa de res cocida 6 horas con tomate y verduras.", 30.00, "1481931098730-318b6f776db0"),
                ("Lasaña Boloñesa", "Capas de pasta con ragú boloñés, bechamel y parmesano gratinado.", 36.00, "1574894709920-11b280e736e8"),
                ("Fettuccine Alfredo", "Fettuccine con mantequilla, crema de leche y parmesano.", 34.00, "1551183053-bf91a1d81141"),
                ("Ravioli di Ricotta e Spinaci", "Raviolis rellenos de ricotta y espinaca con salsa de salvia y mantequilla.", 38.00, "1481931098730-318b6f776db0"),
            ]},
            {"name": "Entradas", "dishes": [
                ("Bruschetta Classica", "Pan tostado con tomate fresco, ajo, albahaca y aceite de oliva.", 16.00, "1481931098730-318b6f776db0"),
                ("Caprese", "Tomate, mozzarella fresca, albahaca y aceite de oliva.", 22.00, "1565299624946-b28f40a0ae38"),
                ("Antipasto Italiano", "Tabla de jamón crudo, salame, quesos, aceitunas y tomate seco.", 38.00, "1574071318508-1cdbab80d002"),
                ("Garlic Bread", "Pan italiano con mantequilla de ajo y perejil, gratinado con mozzarella.", 14.00, "1481931098730-318b6f776db0"),
            ]},
            {"name": "Postres", "dishes": [
                ("Tiramisú", "Clásico postre italiano con café espresso, mascarpone y cacao.", 18.00, "1571877221080-a3dca66a22c3"),
                ("Panna Cotta", "Crema cocida con vainilla, servida con salsa de frutos rojos.", 16.00, "1488477181946-6428a0291777"),
                ("Cannoli Siciliani", "Cannoli crujientes rellenos de crema de ricotta y pistachos.", 17.00, "1571877221080-a3dca66a22c3"),
                ("Gelato (2 bolas)", "Helado artesanal italiano. Sabores: pistacho, fresa, chocolate, vainilla.", 14.00, "1488477181946-6428a0291777"),
            ]},
            {"name": "Bebidas", "dishes": [
                ("Limonata Italiana 500ml", "Limonada italiana con gas, refrescante.", 8.00, "1606756790138-261d2b21cd75"),
                ("Coca Cola 500ml", "Gaseosa Coca Cola personal 500ml.", 6.00, "1554866585-cd94860890b7"),
                ("Vino Tinto Copa", "Copa de vino tinto Chianti DOCG.", 18.00, "1510812438-f0d9a4d4e7c3"),
                ("Vino Blanco Copa", "Copa de vino blanco Pinot Grigio.", 16.00, "1510812438-f0d9a4d4e7c3"),
                ("Agua Mineral 500ml", "Agua mineral con o sin gas.", 4.00, "1606756790138-261d2b21cd75"),
            ]},
        ],
    },
    {
        "key": "burger",
        "name": "Smash Brothers Burger House",
        "slogan": "Smash burgers con carne 100% de res",
        "description": "Hamburguesas smash style con carne angus, pan brioche horneado y salsas de la casa. Combo perfecto con papas crinkle y milkshakes artesanales.",
        "whatsapp": "+51987654324",
        "color": "#e63946",
        "secondary": "#1d3557",
        "logo": unsplash("1571091718767-18b5b1457add", 400, 400),
        "cover": unsplash("1568901346375-23c9450c58cd", 1600, 600),
        "theme": {"layout": "single", "dark_mode": True, "card_style": "expanded",
                  "image_size": "medium", "font": "Inter", "show_search": True,
                  "show_category_icons": True, "rounded_corners": True, "dish_gallery": True,
                  "carta_style": True, "carta_list_style": False, "carta_autoscroll": True,
                  "carta_scroll_speed": 30},
        "social": {"instagram": "https://instagram.com/smashbrothers_pe",
                   "facebook": "https://facebook.com/smashbrothersburger",
                   "tiktok": "https://tiktok.com/@smashbrothers"},
        "categories": [
            {"name": "Smash Burgers", "dishes": [
                ("Single Smash", "1 smash patty angus 100g, cheddar, pepinillos, cebolla y salsa smash.", 18.00, "1568901346375-23c9450c58cd"),
                ("Double Smash", "2 smash patties angus 200g, cheddar doble, pepinillos y salsa smash.", 26.00, "1571091718767-18b5b1457add"),
                ("Triple Smash", "3 smash patties angus 300g, cheddar triple, bacon y salsa smash.", 34.00, "1565299624946-b28f40a0ae38"),
                ("Bacon Smash", "1 smash patty, cheddar, bacon crujiente, cebolla caramelizada y BBQ.", 24.00, "1550547660-d9450f85e341"),
                ("Mushroom Smash", "1 smash patty, cheddar, champiñones salteados y salsa trufa.", 22.00, "1565299624946-b28f40a0ae38"),
            ]},
            {"name": "Especiales", "dishes": [
                ("Brothers Signature", "Doble patty, cheddar, bacon, huevo frito, cebolla crispy y salsa brothers.", 32.00, "1571091718767-18b5b1457add"),
                ("Truffle Burger", "Doble patty, gruyere, champiñones trufados y mayo de trufa.", 36.00, "1565299624946-b28f40a0ae38"),
                ("Spicy Mexican", "Doble patty, jalapeños, guacamole, cheddar y mayo chipotle.", 28.00, "1565299624946-b28f40a0ae38"),
                ("Blue Cheese Burger", "Doble patty, queso azul, cebolla caramelizada y rúcula.", 30.00, "1550547660-d9450f85e341"),
            ]},
            {"name": "Chicken Burgers", "dishes": [
                ("Crispy Chicken", "Filete de pollo crujiente, lechuga, tomate y mayo de chipotle.", 22.00, "1606756790138-261d2b21cd75"),
                ("Spicy Chicken", "Filete de pollo picante, jalapeños, cheddar y salsa buffalo.", 24.00, "1606756790138-261d2b21cd75"),
                ("Grilled Chicken", "Pechuga a la parrilla, lechuga, tomate y salsa cesar.", 20.00, "1606756790138-261d2b21cd75"),
            ]},
            {"name": "Sides", "dishes": [
                ("Papas Crinkle", "Papas crinkle fritas crujientes con ketchup y mayo de la casa.", 10.00, "1573080496219-bb080dd4f877"),
                ("Papas Cargadas", "Papas con cheddar, bacon, jalapeños y crema agria.", 18.00, "1573080496219-bb080dd4f877"),
                ("Onion Rings", "Aros de cebolla rebozados crujientes con salsa ranch.", 14.00, "1571091718767-18b5b1457add"),
                ("Aros de Calabacín", "Aros de calabacín rebozados con parmesano y hierbas.", 12.00, "1571091718767-18b5b1457add"),
                ("Nachos Supreme", "Nachos con cheddar, guacamole, pico de gallo y jalapeños.", 22.00, "1571091718767-18b5b1457add"),
            ]},
            {"name": "Milkshakes", "dishes": [
                ("Clásico Vainilla", "Milkshake de vainilla con crema y sprinkles.", 14.00, "1571091718767-18b5b1457add"),
                ("Chocolate Oreo", "Milkshake de chocolate con galletas oreo molidas.", 16.00, "1571091718767-18b5b1457add"),
                ("Fresa Cheesecake", "Milkshake de fresa con trozos de cheesecake.", 16.00, "1571091718767-18b5b1457add"),
                ("Salted Caramel", "Milkshake de caramelo salado con crema y salsa de caramelo.", 16.00, "1571091718767-18b5b1457add"),
            ]},
            {"name": "Bebidas", "dishes": [
                ("Coca Cola 500ml", "Gaseosa Coca Cola 500ml bien helada.", 6.00, "1554866585-cd94860890b7"),
                ("Inca Kola 500ml", "Gaseosa Inca Kola 500ml.", 6.00, "1437418747212-8d9709afab22"),
                ("Limonada Fría 500ml", "Limonada con hierbabuena fría.", 7.00, "1606756790138-261d2b21cd75"),
                ("Cerveza Artesanal", "Cerveza artesanal de la casa (IPA o APA).", 18.00, "1606756790138-261d2b21cd75"),
            ]},
            {"name": "Combos", "dishes": [
                ("Combo Single", "Single Smash + papas crinkle + bebida 500ml.", 28.00, "1568901346375-23c9450c58cd"),
                ("Combo Double", "Double Smash + papas crinkle + milkshake.", 42.00, "1571091718767-18b5b1457add"),
                ("Combo Pareja", "2 Double Smash + papas cargadas + 2 bebidas.", 68.00, "1571091718767-18b5b1457add"),
                ("Combo Familiar", "4 Single Smash + papas crinkle + onion rings + 4 bebidas.", 95.00, "1571091718767-18b5b1457add"),
            ]},
        ],
    },
    {
        "key": "cevicheria",
        "name": "La Mar Cevichería",
        "slogan": "El verdadero ceviche peruano",
        "description": "Cevichería tradicional con pescado fresco del día. Ceviches, tiraditos, leches de tigre y mariscos preparados al momento.",
        "whatsapp": "+51987654325",
        "color": "#2a9d8f",
        "secondary": "#264653",
        "logo": unsplash("1559847844-5315695dadae", 400, 400),
        "cover": unsplash("1582450871972-ab5ca641643d", 1600, 600),
        "theme": {"layout": "single", "dark_mode": False, "card_style": "minimal",
                  "image_size": "medium", "font": "Inter", "show_search": True,
                  "show_category_icons": True, "rounded_corners": True, "dish_gallery": True,
                  "carta_style": False, "carta_list_style": True, "carta_autoscroll": False,
                  "carta_scroll_speed": 30},
        "social": {"facebook": "https://facebook.com/lamarcevicheria",
                   "instagram": "https://instagram.com/lamarcevicheria_pe"},
        "categories": [
            {"name": "Ceviches", "dishes": [
                ("Ceviche Clásico", "Pescado fresco macerado en limón, cebolla, cilantro, ají limo y camote.", 28.00, "1559847844-5315695dadae"),
                ("Ceviche Mixto", "Pescado, camarones, calamar y conchas de abanico macerados en limón.", 42.00, "1582450871972-ab5ca641643d"),
                ("Ceviche de Camarón", "Camarones frescos macerados en limón con cebolla y cilantro.", 38.00, "1582450871972-ab5ca641643d"),
                ("Ceviche de Conchas", "Conchas de abanico maceradas en limón con cebolla y ají limo.", 44.00, "1582450871972-ab5ca641643d"),
                ("Ceviche Norteño", "Ceviche al estilo norteño con más limón y ají limo picado.", 30.00, "1559847844-5315695dadae"),
                ("Ceviche Tropical", "Ceviche con mango, maracuyá y ají limo. Refrescante y dulce.", 32.00, "1559847844-5315695dadae"),
            ]},
            {"name": "Tiraditos", "dishes": [
                ("Tiradito Clásico", "Filete de pescado cortado fino en salsa de limón y ají amarillo.", 32.00, "1559847844-5315695dadae"),
                ("Tiradito Aji Amarillo", "Tiradito en salsa cremosa de ají amarillo.", 34.00, "1559847844-5315695dadae"),
                ("Tiradito Acevichado", "Tiradito en salsa de ceviche con cilantro y ají limo.", 34.00, "1582450871972-ab5ca641643d"),
                ("Tiradito de Pulpo", "Tiradito de pulpo cocido en salsa de ají amarillo.", 42.00, "1582450871972-ab5ca641643d"),
            ]},
            {"name": "Leches de Tigre", "dishes": [
                ("Leche de Tigre Clásica", "Caldo ácido de ceviche con trozos de pescado, cebolla y cilantro.", 22.00, "1559847844-5315695dadae"),
                ("Leche de Pantera", "Versión con mariscos negros, más intensa.", 28.00, "1582450871972-ab5ca641643d"),
                ("Leche de Tigre Mixta", "Leche de tigre con pescado, camarón y calamar.", 26.00, "1559847844-5315695dadae"),
            ]},
            {"name": "Calientes", "dishes": [
                ("Chicharrón de Pescado", "Pescado frito crujiente con yuca y salsa criolla.", 32.00, "1559847844-5315695dadae"),
                ("Chicharrón de Calamar", "Calamar frito crujiente con salsa tártara.", 34.00, "1582450871972-ab5ca641643d"),
                ("Pescado Frito", "Filete de pescado frito con yuca y ensalada.", 28.00, "1559847844-5315695dadae"),
                ("Arroz con Mariscos", "Arroz graneado con mariscos salteados al wok.", 36.00, "1582450871972-ab5ca641643d"),
                ("Parihuela", "Sopa de mariscos picante con pescado, camarones, calamar y conchas.", 38.00, "1582450871972-ab5ca641643d"),
            ]},
            {"name": "Entradas", "dishes": [
                ("Conchas a la Parmesana", "Conchas de abanico gratinadas con parmesano y mantequilla.", 32.00, "1582450871972-ab5ca641643d"),
                ("Causa de Camarón", "Causa de papa amarilla con relleno de camarón.", 22.00, "1559847844-5315695dadae"),
                ("Causa Limeña", "Causa de papa amarilla con pollo, palta y mayonesa.", 18.00, "1559847844-5315695dadae"),
                ("Pulpo al Olivo", "Pulpo cocido con salsa de aceitunas y tomate.", 38.00, "1582450871972-ab5ca641643d"),
            ]},
            {"name": "Bebidas", "dishes": [
                ("Chicha Morada 1L", "Chicha morada casera preparada con maíz morado.", 12.00, "1606756790138-261d2b21cd75"),
                ("Maracuyá 1L", "Jugo de maracuyá natural.", 14.00, "1606756790138-261d2b21cd75"),
                ("Limonada Fría 1L", "Limonada con hierbabuena fría.", 10.00, "1606756790138-261d2b21cd75"),
                ("Cerveza Cusqueña", "Cerveza Cusqueña 620ml bien fría.", 12.00, "1606756790138-261d2b21cd75"),
                ("Cerveza Cristal", "Cerveza Cristal 620ml bien fría.", 10.00, "1606756790138-261d2b21cd75"),
            ]},
        ],
    },
    # 6 y 7 solo para FULL plan
    {
        "key": "burger-gourmet",
        "name": "Black & Gold Gourmet Burgers",
        "slogan": "Hamburguesas gourmet con ingredientes premium",
        "description": "Hamburguesas premium con carne wagyu, pan brioche artesanal, quesos importados y salsas exclusivas. Experiencia gastronómica única.",
        "whatsapp": "+51987654326",
        "color": "#1a1a2e",
        "secondary": "#c9a227",
        "logo": unsplash("1565299624946-b28f40a0ae38", 400, 400),
        "cover": unsplash("1571091718767-18b5b1457add", 1600, 600),
        "theme": {"layout": "single", "dark_mode": True, "card_style": "expanded",
                  "image_size": "large", "font": "Playfair Display", "show_search": True,
                  "show_category_icons": True, "rounded_corners": True, "dish_gallery": True,
                  "carta_style": False, "carta_list_style": False, "carta_autoscroll": False,
                  "carta_scroll_speed": 30},
        "social": {"instagram": "https://instagram.com/blackandgold_pe",
                   "facebook": "https://facebook.com/blackandgoldburgers"},
        "categories": [
            {"name": "Gourmet Burgers", "dishes": [
                ("Wagyu Truffle", "Patty de wagyu 200g, queso gruyere, champiñones trufados y mayo de trufa negra.", 68.00, "1565299624946-b28f40a0ae38"),
                ("Black Angus Gold", "Patty angus 200g, queso brie, cebolla caramelizada y hojuelas de oro comestible.", 58.00, "1571091718767-18b5b1457add"),
                ("Foie Gras Burger", "Patty angus, foie gras salteado, cebolla confitada y salsa de oporto.", 78.00, "1565299624946-b28f40a0ae38"),
                ("Blue Cheese & Walnut", "Patty angus, queso azul, nueces caramelizadas y pera confitada.", 52.00, "1550547660-d9450f85e341"),
                ("Spicy Wagyu", "Patty wagyu, queso cheddar, jalapeños asados y salsa chipotle ahumada.", 64.00, "1565299624946-b28f40a0ae38"),
            ]},
            {"name": "Premium Sides", "dishes": [
                ("Truffle Fries", "Papas fritas con aceite de trufa, parmesano y perejil.", 22.00, "1573080496219-bb080dd4f877"),
                ("Sweet Potato Fries", "Papas camote fritas con salsa de miel y mostaza.", 18.00, "1573080496219-bb080dd4f877"),
                ("Grilled Asparagus", "Espárragos asados con parmesano y aceite de oliva.", 24.00, "1571091718767-18b5b1457add"),
                ("Burrata Salad", "Burrata fresca, tomate cherry, rúcula y pesto de albahaca.", 38.00, "1565299624946-b28f40a0ae38"),
            ]},
            {"name": "Gourmet Shakes", "dishes": [
                ("Belgian Chocolate", "Milkshake de chocolate belga con crema y cacao importado.", 28.00, "1571091718767-18b5b1457add"),
                ("Madagascar Vanilla", "Milkshake de vainilla de Madagascar con galleta amaretto.", 26.00, "1571091718767-18b5b1457add"),
                ("Salted Caramel Gold", "Milkshake de caramelo salado con hojuelas de oro.", 32.00, "1571091718767-18b5b1457add"),
            ]},
            {"name": "Cervezas Premium", "dishes": [
                ("IPA Artesanal", "Cerveza IPA artesanal de la casa, lúpulo citrus.", 22.00, "1606756790138-261d2b21cd75"),
                ("Stout Imperial", "Cerveza stout imperial 8% alcohol, café y chocolate.", 24.00, "1606756790138-261d2b21cd75"),
                ("Belgian Tripel", "Cerveza belga tripel 9% alcohol, dulce y especiada.", 28.00, "1606756790138-261d2b21cd75"),
            ]},
        ],
    },
    {
        "key": "cafe-postres",
        "name": "Dolce Caffè Artisan",
        "slogan": "Café de especialidad y postres artesanales",
        "description": "Cafetería de especialidad con granos de origen único, postres artesanales y repostería francesa. El lugar perfecto para tu pausa dulce.",
        "whatsapp": "+51987654327",
        "color": "#8b5e34",
        "secondary": "#f4e9d8",
        "logo": unsplash("1495474472287-4d71bcdd2085", 400, 400),
        "cover": unsplash("1559496417-e7f25cb247f3", 1600, 600),
        "theme": {"layout": "grid", "dark_mode": False, "card_style": "minimal",
                  "image_size": "medium", "font": "Playfair Display", "show_search": True,
                  "show_category_icons": True, "rounded_corners": True, "dish_gallery": True,
                  "carta_style": False, "carta_list_style": False, "carta_autoscroll": False,
                  "carta_scroll_speed": 30},
        "social": {"instagram": "https://instagram.com/dolcecaffe_pe",
                   "facebook": "https://facebook.com/dolcecaffeartisan"},
        "categories": [
            {"name": "Café de Especialidad", "dishes": [
                ("Espresso Single Origin", "Espresso de granos single origin de Chanchamayo. Notas a chocolate y frutos rojos.", 8.00, "1495474472287-4d71bcdd2085"),
                ("Flat White", "Doble espresso con microespuma de leche texturizada.", 12.00, "1559496417-e7f25cb247f3"),
                ("Cappuccino", "Espresso con leche vaporizada y espuma de leche.", 10.00, "1559496417-e7f25cb247f3"),
                ("Latte Vainilla", "Latte con jarabe de vainilla de Madagascar.", 14.00, "1559496417-e7f25cb247f3"),
                ("Cold Brew", "Café extraído en frío por 18 horas. Suave y menos ácido.", 14.00, "1495474472287-4d71bcdd2085"),
                ("V60 Pour Over", "Café filtrado manual V60 de origen único.", 16.00, "1495474472287-4d71bcdd2085"),
            ]},
            {"name": "Postres Franceses", "dishes": [
                ("Macarons (6 u)", "Surtido de 6 macarons franceses: pistacho, frambuesa, chocolate, vainilla, café y caramelo.", 28.00, "1571877221080-a3dca66a22c3"),
                ("Éclair de Chocolate", "Éclair relleno de crema pastelera con cobertura de chocolate belga.", 16.00, "1488477181946-6428a0291777"),
                ("Mille-Feuille", "Mil hojas con crema de vainilla y caramelo caramelizado.", 22.00, "1488477181946-6428a0291777"),
                ("Tarta de Limón", "Tarta de limón merengada al estilo francés.", 18.00, "1488477181946-6428a0291777"),
                ("Opera Cake", "Clásico postre francés con capas de café, chocolate y almendra.", 26.00, "1571877221080-a3dca66a22c3"),
            ]},
            {"name": "Repostería", "dishes": [
                ("Croissant de Mantequilla", "Croissant francés hecho con mantequilla normanda.", 8.00, "1555507036-ab1f4048607a"),
                ("Pain au Chocolat", "Croissant relleno de chocolate belga.", 10.00, "1555507036-ab1f4048607a"),
                ("Croissant de Almendras", "Croissant relleno de crema frangipane de almendras.", 12.00, "1555507036-ab1f4048607a"),
                ("Brioche Confitura", "Brioche tostado con mermelada artesanal de frutos rojos.", 10.00, "1555507036-ab1f4048607a"),
                ("Cinnamon Roll", "Rol de canela con crema de queso y nueces.", 12.00, "1555507036-ab1f4048607a"),
            ]},
            {"name": "Té y Otras Bebidas", "dishes": [
                ("Chai Latte", "Latte de chai especiado con cardamomo, canela y jengibre.", 12.00, "1556679343-c7306c1976bc"),
                ("Matcha Latte", "Latte de matcha japonés ceremonial grade.", 14.00, "1556679343-c7306c1976bc"),
                ("Té de Hierbas", "Selección de tés de hierbas frescas: manzanilla, menta, hierbaluisa.", 8.00, "1556679343-c7306c1976bc"),
                ("Chocolate Caliente Belga", "Chocolate belga caliente con crema y malvaviscos.", 14.00, "1556679343-c7306c1976bc"),
            ]},
            {"name": "Salados", "dishes": [
                ("Croissant de Jamón y Queso", "Croissant relleno de jamón español y queso gruyere.", 14.00, "1555507036-ab1f4048607a"),
                ("Quiche Lorraine", "Quiche francés con bacon, queso y cebolla.", 18.00, "1555507036-ab1f4048607a"),
                ("Baguette Caprese", "Baguette con tomate, mozzarella fresca, albahaca y pesto.", 16.00, "1555507036-ab1f4048607a"),
                ("Sándwich Club", "Triple sándwich con pollo, bacon, lechuga, tomate y mayo.", 20.00, "1555507036-ab1f4048607a"),
            ]},
            {"name": "Combos", "dishes": [
                ("Combo Desayuno", "Cappuccino + croissant de mantequilla + jugo de naranja.", 22.00, "1495474472287-4d71bcdd2085"),
                ("Combo Media Tarde", "Flat White + 2 macarons.", 22.00, "1559496417-e7f25cb247f3"),
                ("Combo Dulce", "Latte vainilla + mille-feuille.", 32.00, "1559496417-e7f25cb247f3"),
                ("Combo Salado", "Café americano + quiche lorraine.", 24.00, "1495474472287-4d71bcdd2085"),
            ]},
        ],
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# Configuración por cuenta demo
# ─────────────────────────────────────────────────────────────────────────────

DEMO_ACCOUNTS = [
    {
        "email": "demopro@menudigital.pro",
        "full_name": "Demo Pro MenuPro",
        "plan": "pro",
        "user_seed": "demo-pro-user-v1",
        "restaurants": ["polleria", "pizzeria", "burger"],
        "branding_text": "Creado con MenuPro",  # PRO muestra branding
        "analytics": {"views_per_menu": 280, "wa_clicks_per_menu": 50},
        "days_history": 60,
        "extras": None,  # PRO no tiene mozos/mesas/inventario/comandas
    },
    {
        "email": "demopremium@menudigital.pro",
        "full_name": "Demo Premium MenuPro",
        "plan": "premium",
        "user_seed": "demo-premium-user-v1",
        "restaurants": ["polleria", "chifa", "pizzeria", "cevicheria", "burger"],
        "branding_text": None,  # Premium white-label
        "analytics": {"views_per_menu": 600, "wa_clicks_per_menu": 100},
        "days_history": 90,
        "extras": {"waiters": 8, "tables": 15, "inventory": 25, "orders": 50, "branches": 1},
    },
    {
        "email": "demofull@menudigital.pro",
        "full_name": "Demo Full MenuPro",
        "plan": "full",
        "user_seed": "demo-full-user-v1",
        "restaurants": ["polleria", "chifa", "pizzeria", "cevicheria", "burger",
                        "burger-gourmet", "cafe-postres"],
        "branding_text": None,  # Full white-label
        "analytics": {"views_per_menu": 1000, "wa_clicks_per_menu": 180},
        "days_history": 90,
        "extras": {"waiters": 15, "tables": 30, "inventory": 50, "orders": 120,
                   "branches": 3, "custom_domain": True, "product_recipes": True,
                   "inventory_movements": 80, "voucher_prints": 60},
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# Funciones de seed
# ─────────────────────────────────────────────────────────────────────────────

def find_restaurant(key: str) -> dict:
    for r in RESTAURANTS:
        if r["key"] == key:
            return r
    raise ValueError(f"Restaurante '{key}' no encontrado")


def create_auth_user(cur, user_id: str, email: str, full_name: str, pwd_hash: str):
    """Crea usuario en auth.users + auth.identities (idempotente)."""
    cur.execute("""
        INSERT INTO auth.users (
            id, instance_id, aud, role, email,
            encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data,
            created_at, updated_at, last_sign_in_at,
            confirmation_token, recovery_token,
            email_change_token_new, email_change,
            phone, phone_confirmed_at,
            banned_until, is_sso_user, deleted_at
        ) VALUES (
            %s, '00000000-0000-0000-0000-000000000000'::uuid,
            'authenticated', 'authenticated', %s,
            %s, NOW(),
            '{}'::jsonb, %s,
            NOW(), NOW(), NOW(),
            '', '', '', '',
            NULL, NULL,
            NULL, FALSE, NULL
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    """, (user_id, email, pwd_hash, f'{{"full_name":"{full_name}"}}'))
    
    identity_id = str(uuid.uuid5(NS, f"identity-{email}"))
    cur.execute("""
        INSERT INTO auth.identities (
            id, user_id, identity_data, provider, provider_id,
            last_sign_in_at, created_at, updated_at
        ) VALUES (
            %s, %s,
            %s::jsonb,
            'email', %s,
            NOW(), NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            identity_data = EXCLUDED.identity_data,
            updated_at = NOW();
    """, (identity_id, user_id,
          f'{{"sub":"{user_id}","email":"{email}"}}',
          user_id))


def create_profile(cur, user_id: str, email: str, full_name: str, plan: str):
    """Crea el profile con el plan indicado."""
    cur.execute("""
        INSERT INTO profiles (
            id, email, full_name, plan, is_super_admin, is_active,
            onboarding_completed_at, created_at, updated_at
        ) VALUES (
            %s, %s, %s, %s, FALSE, TRUE,
            NOW(), NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            plan = EXCLUDED.plan,
            is_active = TRUE,
            onboarding_completed_at = COALESCE(profiles.onboarding_completed_at, NOW()),
            updated_at = NOW();
    """, (user_id, email, full_name, plan))


def create_menu(cur, account: dict, restaurant_key: str, user_id: str) -> tuple[str, dict]:
    """Crea un menú con su tema, social, etc. Retorna (menu_id, restaurant_data)."""
    r = find_restaurant(restaurant_key)
    # Slug único por cuenta para evitar colisiones
    plan_suffix = {"pro": "-pro", "premium": "-prem", "full": "-full"}[account["plan"]]
    slug = r["key"] + plan_suffix
    menu_id = uid(f"menu-{account['user_seed']}-{r['key']}")
    t = r["theme"]
    print(f"     → menu_id={menu_id[:8]}  slug={slug}", flush=True)
    
    cur.execute("""
        INSERT INTO menus (
            id, user_id, name, slug, slogan, description, whatsapp,
            color, currency, logo_url, branding_text, is_published,
            theme_color_secondary, theme_font, theme_layout,
            theme_image_size, theme_card_style, theme_cover_url,
            theme_show_search, theme_show_category_icons,
            theme_rounded_corners, theme_dark_mode, theme_dish_gallery,
            theme_carta_style, theme_carta_list_style,
            theme_carta_autoscroll, theme_carta_scroll_speed,
            social_facebook, social_instagram, social_whatsapp,
            social_tiktok, social_twitter, social_youtube, social_web,
            created_at, updated_at
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s,
            %s, 'S/', %s, %s, TRUE,
            %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s,
            %s, %s, %s, %s,
            %s, %s, %s, %s, NULL, NULL, NULL,
            NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            slug = EXCLUDED.slug,
            slogan = EXCLUDED.slogan,
            description = EXCLUDED.description,
            whatsapp = EXCLUDED.whatsapp,
            color = EXCLUDED.color,
            logo_url = EXCLUDED.logo_url,
            branding_text = EXCLUDED.branding_text,
            is_published = TRUE,
            theme_color_secondary = EXCLUDED.theme_color_secondary,
            theme_font = EXCLUDED.theme_font,
            theme_layout = EXCLUDED.theme_layout,
            theme_image_size = EXCLUDED.theme_image_size,
            theme_card_style = EXCLUDED.theme_card_style,
            theme_cover_url = EXCLUDED.theme_cover_url,
            theme_show_search = EXCLUDED.theme_show_search,
            theme_show_category_icons = EXCLUDED.theme_show_category_icons,
            theme_rounded_corners = EXCLUDED.theme_rounded_corners,
            theme_dark_mode = EXCLUDED.theme_dark_mode,
            theme_dish_gallery = EXCLUDED.theme_dish_gallery,
            theme_carta_style = EXCLUDED.theme_carta_style,
            theme_carta_list_style = EXCLUDED.theme_carta_list_style,
            theme_carta_autoscroll = EXCLUDED.theme_carta_autoscroll,
            theme_carta_scroll_speed = EXCLUDED.theme_carta_scroll_speed,
            social_facebook = EXCLUDED.social_facebook,
            social_instagram = EXCLUDED.social_instagram,
            social_whatsapp = EXCLUDED.social_whatsapp,
            social_tiktok = EXCLUDED.social_tiktok,
            updated_at = NOW()
        RETURNING id;
    """, (
        menu_id, user_id, r["name"], slug, r["slogan"], r["description"], r["whatsapp"],
        r["color"], r["logo"], account["branding_text"],
        r["secondary"], t["font"], t["layout"], t["image_size"], t["card_style"], r["cover"],
        t["show_search"], t["show_category_icons"], t["rounded_corners"], t["dark_mode"], t["dish_gallery"],
        t["carta_style"], t["carta_list_style"], t["carta_autoscroll"], t["carta_scroll_speed"],
        r["social"].get("facebook"), r["social"].get("instagram"), r["whatsapp"],
        r["social"].get("tiktok"),
    ))
    return menu_id, r


def create_categories_and_dishes(cur, account: dict, menu_id: str, restaurant_key: str) -> list[dict]:
    """Crea categorías y platos. Retorna lista de {dish_id, name, price} para usar en orders."""
    r = find_restaurant(restaurant_key)
    dishes_created = []
    for c_idx, cat in enumerate(r["categories"]):
        cat_id = uid(f"cat-{account['user_seed']}-{restaurant_key}-{c_idx}")
        cur.execute("""
            INSERT INTO categories (id, menu_id, name, sort_order, created_at)
            VALUES (%s, %s, %s, %s, NOW())
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;
        """, (cat_id, menu_id, cat["name"], c_idx))
        
        for d_idx, (dname, ddesc, dprice, dphoto) in enumerate(cat["dishes"]):
            dish_id = uid(f"dish-{account['user_seed']}-{restaurant_key}-{c_idx}-{d_idx}")
            img_url = unsplash(dphoto)
            # Para Premium/Full: gallery con 2-3 imágenes extra
            gallery = []
            if account["plan"] in ("premium", "full"):
                gallery = [
                    unsplash(dphoto, 1200, 800),
                    unsplash(dphoto, 400, 400),
                ]
            
            cur.execute("""
                INSERT INTO dishes (
                    id, category_id, name, description, price, image_url, sort_order, gallery, created_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, NOW()
                )
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    price = EXCLUDED.price,
                    image_url = EXCLUDED.image_url,
                    sort_order = EXCLUDED.sort_order,
                    gallery = EXCLUDED.gallery;
            """, (dish_id, cat_id, dname, ddesc, dprice, img_url, d_idx, gallery))
            dishes_created.append({"id": dish_id, "name": dname, "price": float(dprice),
                                    "category": cat["name"]})
    return dishes_created


def generate_menu_views(cur, menu_id: str, total_views: int, days: int):
    """Genera vistas distribuidas en los últimos `days` días."""
    # Pesos: más vistas en fines de semana y último mes
    now = datetime.now(timezone.utc)
    rows = []
    sources = ['direct', 'qr', 'social', 'google', 'instagram', 'facebook', 'tiktok']
    for _ in range(total_views):
        dt = random_dt_in_last(days)
        # Distribución: 60% direct, 15% qr, 15% social, 10% search engines
        src = random.choices(sources, weights=[50, 20, 15, 8, 5, 1, 1])[0]
        ip = f"200.106.{random.randint(0,255)}.{random.randint(1,254)}"
        ua = random.choice([
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15",
            "Mozilla/5.0 (Linux; Android 13; SM-A145F) AppleWebKit/537.36 (KHTML, like Gecko)",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/119.0.0.0",
            "Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko)",
        ])
        rows.append((menu_id, ip, ua, dt, src))
    
    execute_values(cur, """
        INSERT INTO menu_views (menu_id, ip, user_agent, created_at, source)
        VALUES %s
        ON CONFLICT DO NOTHING;
    """, rows)
    
    # Actualizar views_count del menú
    cur.execute("UPDATE menus SET views_count = %s WHERE id = %s;", (total_views, menu_id))


def generate_whatsapp_clicks(cur, menu_id: str, total_clicks: int, days: int):
    """Genera clics de WhatsApp distribuidos."""
    rows = []
    for _ in range(total_clicks):
        dt = random_dt_in_last(days)
        # 65% cart, 25% social, 10% direct
        src = random.choices(['cart', 'social', 'direct'], weights=[65, 25, 10])[0]
        ip = f"200.106.{random.randint(0,255)}.{random.randint(1,254)}"
        ua = random.choice([
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15",
            "Mozilla/5.0 (Linux; Android 13; SM-A145F) AppleWebKit/537.36",
            "Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36",
        ])
        rows.append((menu_id, ip, ua, src, dt))
    
    execute_values(cur, """
        INSERT INTO whatsapp_clicks (menu_id, ip, user_agent, source, created_at)
        VALUES %s
        ON CONFLICT DO NOTHING;
    """, rows)


def create_branches(cur, user_id: str, account: dict) -> list[str]:
    """Crea sucursales para planes Premium (1) y Full (3)."""
    branches_data = {
        "premium": [("Sucursal Principal", "Av. Javier Prado 1234, San Isidro, Lima", "+51 987 654 321")],
        "full": [
            ("Sucursal San Isidro", "Av. Javier Prado 1234, San Isidro, Lima", "+51 987 654 321"),
            ("Sucursal Miraflores", "Av. Larco 879, Miraflores, Lima", "+51 987 654 322"),
            ("Sucursal Surco", "Av. Caminos del Inca 510, Surco, Lima", "+51 987 654 323"),
        ],
    }
    branches = branches_data.get(account["plan"], [])
    branch_ids = []
    for name, addr, phone in branches:
        bid = uid(f"branch-{account['user_seed']}-{name}")
        cur.execute("""
            INSERT INTO branches (id, owner_id, name, address, phone, is_active, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, TRUE, NOW(), NOW())
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                address = EXCLUDED.address,
                phone = EXCLUDED.phone,
                updated_at = NOW();
        """, (bid, user_id, name, addr, phone))
        branch_ids.append(bid)
    return branch_ids


def create_waiters(cur, user_id: str, account: dict, branch_ids: list[str]) -> list[dict]:
    """Crea mozos con PIN y QR token."""
    first_names = ["Carlos", "María", "José", "Ana", "Luis", "Carmen", "Pedro", "Rosa",
                   "Miguel", "Lucía", "Jorge", "Patricia", "Fernando", "Sofía", "Diego"]
    last_names = ["Quispe", "Huamán", "Ccente", "Mamani", "Condori", "Aparicio", "Ramos",
                  "Flores", "García", "Vargas", "Castillo", "Ríos", "Salazar", "Mendoza"]
    
    count = account["extras"]["waiters"]
    waiters = []
    for i in range(count):
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        wid = uid(f"waiter-{account['user_seed']}-{i}")
        pin = f"{random.randint(1000, 9999)}"
        qr_token = uid(f"qr-waiter-{account['user_seed']}-{i}")
        branch_id = branch_ids[i % len(branch_ids)] if branch_ids else None
        phone = f"+51 9{random.randint(50,99)} {random.randint(100,999)} {random.randint(100,999)}"
        cur.execute("""
            INSERT INTO waiters (
                id, owner_id, branch_id, full_name, phone, pin, qr_token, is_active,
                created_at, updated_at, password
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, TRUE,
                NOW(), NOW(), %s
            )
            ON CONFLICT (id) DO UPDATE SET
                branch_id = EXCLUDED.branch_id,
                full_name = EXCLUDED.full_name,
                phone = EXCLUDED.phone,
                pin = EXCLUDED.pin,
                qr_token = EXCLUDED.qr_token,
                is_active = TRUE,
                updated_at = NOW();
        """, (wid, user_id, branch_id, name, phone, pin, qr_token,
              # Password para login de mozo
              bcrypt.hashpw(f"mozo{pin}".encode(), bcrypt.gensalt(10)).decode()))
        waiters.append({"id": wid, "name": name, "branch_id": branch_id})
    return waiters


def create_tables(cur, user_id: str, account: dict, branch_ids: list[str]) -> list[dict]:
    """Crea mesas con números y QR tokens."""
    count = account["extras"]["tables"]
    tables = []
    for i in range(count):
        tid = uid(f"table-{account['user_seed']}-{i}")
        number = i + 1
        capacity = random.choice([2, 4, 4, 6, 6, 8])
        status = random.choice(["libre", "libre", "libre", "ocupada", "reservada"])
        qr_token = uid(f"qr-table-{account['user_seed']}-{i}")
        branch_id = branch_ids[i % len(branch_ids)] if branch_ids else None
        location = random.choice(["Salón Principal", "Terraza", "Segundo Piso", "Barra"])
        cur.execute("""
            INSERT INTO tables (
                id, owner_id, branch_id, number, name, capacity, status, qr_token,
                location, is_active, created_at, updated_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s::table_status, %s,
                %s, TRUE, NOW(), NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                branch_id = EXCLUDED.branch_id,
                number = EXCLUDED.number,
                name = EXCLUDED.name,
                capacity = EXCLUDED.capacity,
                status = EXCLUDED.status,
                qr_token = EXCLUDED.qr_token,
                location = EXCLUDED.location,
                updated_at = NOW();
        """, (tid, user_id, branch_id, number, f"Mesa {number}", capacity, status, qr_token, location))
        tables.append({"id": tid, "number": number, "branch_id": branch_id})
    return tables


def create_inventory(cur, user_id: str, account: dict, branch_ids: list[str]) -> list[dict]:
    """Crea insumos de inventario."""
    # Inventario típico de restaurante
    items_by_category = {
        "Carnes": [
            ("Pollo entero", "kg", 80, 20, 200, 12.50, "Don Pollo SAC"),
            ("Pollo pechuga", "kg", 40, 10, 100, 18.00, "Don Pollo SAC"),
            ("Carne de res", "kg", 30, 10, 80, 35.00, "Frigorífico Lima"),
            ("Camarones", "kg", 15, 5, 30, 85.00, "Mariscos del Pacífico"),
            ("Calamar", "kg", 20, 5, 40, 45.00, "Mariscos del Pacífico"),
            ("Pescado fresco", "kg", 40, 15, 80, 38.00, "Mariscos del Pacífico"),
            ("Cerdo", "kg", 25, 8, 60, 22.00, "Frigorífico Lima"),
            ("Bacon", "paquete", 30, 10, 60, 28.00, "Importaciones Food"),
            ("Wagyu", "kg", 8, 3, 15, 280.00, "Importaciones Food"),
            ("Jamón crudo", "kg", 5, 2, 10, 180.00, "Importaciones Food"),
        ],
        "Vegetales": [
            ("Papa blanca", "caja", 12, 5, 30, 3.50, "Mercado Mayorista"),
            ("Papa amarilla", "caja", 8, 3, 20, 4.50, "Mercado Mayorista"),
            ("Cebolla roja", "caja", 10, 4, 25, 2.80, "Mercado Mayorista"),
            ("Tomate", "caja", 15, 5, 30, 4.00, "Mercado Mayorista"),
            ("Lechuga", "docena", 20, 8, 40, 8.00, "Mercado Mayorista"),
            ("Cilantro", "paquete", 30, 10, 60, 1.50, "Mercado Mayorista"),
            ("Ají limo", "kg", 8, 3, 15, 12.00, "Mercado Mayorista"),
            ("Ají amarillo", "kg", 10, 4, 20, 10.00, "Mercado Mayorista"),
            ("Ajo", "kg", 6, 2, 12, 8.00, "Mercado Mayorista"),
            ("Camote", "caja", 8, 3, 20, 4.00, "Mercado Mayorista"),
            ("Yuca", "caja", 6, 2, 15, 3.50, "Mercado Mayorista"),
            ("Rúcula", "paquete", 15, 5, 30, 4.50, "Verduras Orgánicas"),
        ],
        "Lácteos y Huevos": [
            ("Leche entera 1L", "unidad", 60, 20, 150, 4.50, "Gloria SAC"),
            ("Queso mozzarella", "kg", 25, 8, 50, 32.00, "Laive"),
            ("Queso parmesano", "kg", 8, 3, 15, 85.00, "Laive"),
            ("Queso azul", "kg", 5, 2, 10, 120.00, "Importaciones Food"),
            ("Queso gruyere", "kg", 6, 2, 12, 95.00, "Importaciones Food"),
            ("Mantequilla", "kg", 15, 5, 30, 28.00, "Laive"),
            ("Crema de leche", "litro", 20, 8, 40, 12.00, "Gloria SAC"),
            ("Huevos", "docena", 50, 20, 100, 12.00, "Avícola San Fernando"),
            ("Helado vainilla", "litro", 10, 3, 20, 22.00, "D'Onofrio"),
        ],
        "Bebidas": [
            ("Coca Cola 500ml", "caja", 40, 10, 100, 22.00, "Coca Cola Perú"),
            ("Inca Kola 500ml", "caja", 40, 10, 100, 22.00, "AJE Group"),
            ("Cerveza Cristal 620ml", "caja", 30, 10, 80, 48.00, "Backus"),
            ("Cerveza Cusqueña 620ml", "caja", 25, 8, 60, 52.00, "Backus"),
            ("Vino tinto Chianti", "unidad", 12, 4, 30, 45.00, "Importaciones Food"),
            ("Vino blanco Pinot Grigio", "unidad", 8, 3, 20, 42.00, "Importaciones Food"),
            ("Chicha morada 1L", "litro", 25, 8, 50, 8.00, "Preparación propia"),
            ("Maracuyá 1L", "litro", 20, 5, 40, 10.00, "Preparación propia"),
        ],
        "Harinas y Granos": [
            ("Harina de trigo", "caja", 20, 5, 50, 4.50, "Blanca Flor"),
            ("Arroz", "caja", 15, 5, 40, 4.00, "Costeño"),
            ("Fideos chinos", "paquete", 25, 8, 50, 6.50, "Don Vittorio"),
            ("Pasta spaghetti", "paquete", 30, 10, 60, 5.50, "Don Vittorio"),
            ("Pan brioche", "paquete", 40, 15, 80, 12.00, "Panadería La Especial"),
            ("Maíz morado", "kg", 8, 3, 20, 6.50, "Mercado Mayorista"),
        ],
        "Aceites y Salsas": [
            ("Aceite vegetal 5L", "litro", 8, 3, 20, 65.00, "Cooks SAC"),
            ("Aceite de oliva", "litro", 6, 2, 15, 45.00, "Importaciones Food"),
            ("Sillao (salsa soya)", "litro", 10, 3, 25, 18.00, "Ajiperú"),
            ("Salsa de tomate", "kg", 12, 4, 30, 8.50, "Nestlé"),
            ("Mayonesa", "kg", 8, 3, 20, 14.00, "Hellmann's"),
            ("Salsa BBQ", "litro", 5, 2, 12, 22.00, "Importaciones Food"),
            ("Aceite de trufa", "ml", 4, 1, 8, 0.35, "Importaciones Food"),
        ],
        "Especias y Otros": [
            ("Sal", "kg", 5, 2, 15, 2.50, "Mercado Mayorista"),
            ("Pimienta negra", "kg", 3, 1, 8, 28.00, "Importaciones Food"),
            ("Comino", "kg", 2, 1, 5, 32.00, "Mercado Mayorista"),
            ("Orégano", "kg", 2, 1, 5, 25.00, "Mercado Mayorista"),
            ("Albahaca fresca", "paquete", 10, 3, 25, 3.50, "Verduras Orgánicas"),
            ("Café Chanchamayo", "kg", 8, 3, 20, 65.00, "Café Perú SAC"),
            ("Cacao belga", "kg", 4, 1, 10, 85.00, "Importaciones Food"),
            ("Vainilla Madagascar", "ml", 2, 1, 5, 0.85, "Importaciones Food"),
        ],
    }
    
    count = account["extras"]["inventory"]
    all_items = []
    for cat, items in items_by_category.items():
        for name, unit, stock_max, stock_min, stock_max_limit, cost, supplier in items:
            all_items.append({"name": name, "unit": unit, "stock_max": stock_max,
                              "stock_min": stock_min, "stock_max_limit": stock_max_limit,
                              "cost": cost, "supplier": supplier, "category": cat})
    
    random.shuffle(all_items)
    selected = all_items[:count]
    inventory = []
    for i, item in enumerate(selected):
        iid = uid(f"inv-{account['user_seed']}-{i}")
        # Stock aleatorio entre min y max
        stock = random.uniform(item["stock_min"], item["stock_max"] * 0.7)
        branch_id = branch_ids[i % len(branch_ids)] if branch_ids else None
        sku = f"INV-{i+1:03d}-{account['plan'].upper()}"
        cur.execute("""
            INSERT INTO inventory_items (
                id, owner_id, branch_id, name, sku, unit, stock_current, stock_min,
                stock_max, cost_per_unit, supplier, category, is_active,
                created_at, updated_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s::inventory_unit, %s, %s,
                %s, %s, %s, %s, TRUE,
                NOW(), NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                branch_id = EXCLUDED.branch_id,
                name = EXCLUDED.name,
                sku = EXCLUDED.sku,
                unit = EXCLUDED.unit,
                stock_current = EXCLUDED.stock_current,
                stock_min = EXCLUDED.stock_min,
                stock_max = EXCLUDED.stock_max,
                cost_per_unit = EXCLUDED.cost_per_unit,
                supplier = EXCLUDED.supplier,
                category = EXCLUDED.category,
                updated_at = NOW();
        """, (iid, user_id, branch_id, item["name"], sku, item["unit"],
              stock, item["stock_min"], item["stock_max_limit"],
              item["cost"], item["supplier"], item["category"]))
        inventory.append({"id": iid, "name": item["name"], "branch_id": branch_id,
                          "cost": item["cost"], "unit": item["unit"]})
    return inventory


def create_orders(cur, user_id: str, account: dict, branch_ids: list[str],
                   waiters: list[dict], tables: list[dict],
                   menus_dishes: dict) -> list[dict]:
    """
    Crea comandas (orders + order_items).
    menus_dishes: {menu_id: [list of dish dicts]}
    """
    count = account["extras"]["orders"]
    orders = []
    statuses = ["borrador", "enviada", "en_preparacion", "lista", "entregada",
                "entregada", "entregada", "facturada", "facturada", "cancelada"]
    order_types = ["mesa", "mesa", "mesa", "para_llevar", "delivery"]
    customer_names = ["Cliente Mostrador", "Anónimo", "Pedido WhatsApp", None, None, None]
    
    for i in range(count):
        order_id = uid(f"order-{account['user_seed']}-{i}")
        # Seleccionar menú aleatorio
        menu_id = random.choice(list(menus_dishes.keys()))
        dishes = menus_dishes[menu_id]
        
        # Branch, table, waiter
        branch_id = random.choice(branch_ids) if branch_ids else None
        # Mesa que pertenezca al mismo branch si hay branches
        if tables:
            same_branch_tables = [t for t in tables if t["branch_id"] == branch_id] if branch_id else tables
            table = random.choice(same_branch_tables or tables)
            table_id = table["id"]
        else:
            table_id = None
        
        # Mozo del mismo branch si hay branches
        if waiters:
            same_branch_waiters = [w for w in waiters if w["branch_id"] == branch_id] if branch_id else waiters
            waiter = random.choice(same_branch_waiters or waiters)
            waiter_id = waiter["id"]
        else:
            waiter_id = None
        
        # Crear 2-6 items
        n_items = random.randint(2, 6)
        chosen_dishes = random.sample(dishes, min(n_items, len(dishes)))
        
        subtotal = 0
        items_data = []
        for dish in chosen_dishes:
            qty = random.randint(1, 3)
            line_total = dish["price"] * qty
            subtotal += line_total
            item_status = random.choice(["pendiente", "en_preparacion", "listo", "entregado", "entregado"])
            items_data.append({
                "menu_item_id": dish["id"],
                "menu_item_name": dish["name"],
                "menu_item_price": dish["price"],
                "quantity": qty,
                "status": item_status,
            })
        
        tax = round(subtotal * 0.18, 2)  # IGV 18%
        tip = round(subtotal * random.choice([0, 0, 0, 0.05, 0.10]), 2)
        total = subtotal + tax + tip
        
        status = random.choice(statuses)
        order_type = random.choice(order_types)
        customer = random.choice(customer_names)
        party_size = random.randint(1, 8) if order_type == "mesa" else None
        order_number = f"#{1000 + i:04d}"
        created_dt = random_dt_in_last(account["days_history"])
        
        # Timestamps según status
        sent_at = created_dt + timedelta(minutes=random.randint(2, 15)) if status != "borrador" else None
        ready_at = sent_at + timedelta(minutes=random.randint(10, 30)) if status in ("lista", "entregada", "facturada") else None
        delivered_at = ready_at + timedelta(minutes=random.randint(5, 20)) if status in ("entregada", "facturada") else None
        invoiced_at = delivered_at + timedelta(minutes=random.randint(5, 60)) if status == "facturada" else None
        cancelled_at = created_dt + timedelta(minutes=random.randint(5, 60)) if status == "cancelada" else None
        cancel_reason = random.choice(["Cliente canceló", "Error en pedido", "Tiempo excedido", "Producto agotado"]) if status == "cancelada" else None
        
        notes_options = [None, None, None, "Sin cebolla", "Picante aparte", "Para llevar caliente",
                         "Cliente alérgico a maní", "Sin ají", "Extra salsa", "Servir rápido"]
        notes = random.choice(notes_options)
        
        cur.execute("""
            INSERT INTO orders (
                id, owner_id, branch_id, table_id, waiter_id,
                order_number, status, order_type,
                customer_name, customer_phone, party_size, notes,
                subtotal, tax, tip, total, currency,
                sent_at, ready_at, delivered_at, invoiced_at, cancelled_at, cancel_reason,
                created_at, updated_at
            ) VALUES (
                %s, %s, %s, %s, %s,
                %s, %s::order_status, %s::order_type,
                %s, %s, %s, %s,
                %s, %s, %s, %s, 'S/',
                %s, %s, %s, %s, %s, %s,
                %s, %s
            )
            ON CONFLICT (id) DO UPDATE SET
                branch_id = EXCLUDED.branch_id,
                table_id = EXCLUDED.table_id,
                waiter_id = EXCLUDED.waiter_id,
                status = EXCLUDED.status,
                order_type = EXCLUDED.order_type,
                customer_name = EXCLUDED.customer_name,
                subtotal = EXCLUDED.subtotal,
                tax = EXCLUDED.tax,
                tip = EXCLUDED.tip,
                total = EXCLUDED.total,
                updated_at = NOW();
        """, (order_id, user_id, branch_id, table_id, waiter_id,
              order_number, status, order_type,
              customer, None, party_size, notes,
              subtotal, tax, tip, total,
              sent_at, ready_at, delivered_at, invoiced_at, cancelled_at, cancel_reason,
              created_dt, created_dt))
        
        # Insertar items
        for idx, item in enumerate(items_data):
            item_id = uid(f"item-{account['user_seed']}-{i}-{idx}")
            prepared_at = None
            if item["status"] in ("listo", "entregado"):
                prepared_at = created_dt + timedelta(minutes=random.randint(10, 25))
            cur.execute("""
                INSERT INTO order_items (
                    id, order_id, menu_item_id, menu_item_name, menu_item_price,
                    quantity, notes, status, prepared_at, created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s,
                    %s, NULL, %s::order_item_status, %s, %s, %s
                )
                ON CONFLICT (id) DO UPDATE SET
                    menu_item_name = EXCLUDED.menu_item_name,
                    menu_item_price = EXCLUDED.menu_item_price,
                    quantity = EXCLUDED.quantity,
                    status = EXCLUDED.status;
            """, (item_id, order_id, item["menu_item_id"], item["menu_item_name"],
                  item["menu_item_price"], item["quantity"], item["status"],
                  prepared_at, created_dt, created_dt))
        
        # Status history
        history_statuses = ["enviada"]
        if status in ("en_preparacion", "lista", "entregada", "facturada"):
            history_statuses.append("en_preparacion")
        if status in ("lista", "entregada", "facturada"):
            history_statuses.append("lista")
        if status in ("entregada", "facturada"):
            history_statuses.append("entregada")
        if status == "facturada":
            history_statuses.append("facturada")
        if status == "cancelada":
            history_statuses = ["cancelada"]
        
        prev = None
        for h_idx, hs in enumerate(history_statuses):
            hist_id = uid(f"hist-{account['user_seed']}-{i}-{h_idx}")
            hist_dt = created_dt + timedelta(minutes=h_idx * random.randint(5, 20))
            cur.execute("""
                INSERT INTO order_status_history (
                    id, order_id, from_status, to_status, changed_by, notes, created_at
                ) VALUES (
                    %s, %s, %s::order_status, %s::order_status, %s, %s, %s
                )
                ON CONFLICT (id) DO NOTHING;
            """, (hist_id, order_id, prev, hs, "sistema", None, hist_dt))
            prev = hs
        
        # Voucher print si está facturada
        if status == "facturada" and account["plan"] == "full":
            voucher_id = uid(f"voucher-{account['user_seed']}-{i}")
            voucher_number = f"B001-{10000 + i:06d}"
            cur.execute("""
                INSERT INTO voucher_prints (
                    id, owner_id, order_id, voucher_number, printed_by,
                    print_format, printed_at
                ) VALUES (
                    %s, %s, %s, %s, %s, 'pos_80mm', %s
                )
                ON CONFLICT (id) DO UPDATE SET
                    voucher_number = EXCLUDED.voucher_number,
                    printed_at = EXCLUDED.printed_at;
            """, (voucher_id, user_id, order_id, voucher_number, "cajero_01", invoiced_at))
        
        orders.append({"id": order_id, "total": total, "status": status, "branch_id": branch_id,
                       "menu_id": menu_id})
    return orders


def create_inventory_movements(cur, user_id: str, account: dict, inventory: list[dict]):
    """Crea movimientos de inventario (entradas y salidas)."""
    count = account["extras"].get("inventory_movements", 0)
    if count == 0:
        return
    movement_types = ["entrada", "salida", "salida", "salida", "ajuste", "merma"]
    reasons = {
        "entrada": ["Compra a proveedor", "Ingreso inicial", "Devolución de cocina"],
        "salida": ["Consumo en cocina", "Salida a producción", "Uso en plato"],
        "ajuste": ["Ajuste por inventario físico", "Corrección de stock"],
        "merma": ["Merma por vencimiento", "Merma por deterioro", "Merma por mala calidad"],
    }
    for i in range(count):
        item = random.choice(inventory)
        mtype = random.choice(movement_types)
        qty = round(random.uniform(1, 20), 2)
        unit_cost = item["cost"]
        mid = uid(f"mov-{account['user_seed']}-{i}")
        reason = random.choice(reasons[mtype])
        created_dt = random_dt_in_last(account["days_history"])
        cur.execute("""
            INSERT INTO inventory_movements (
                id, owner_id, branch_id, inventory_item_id, movement_type,
                quantity, unit_cost, reason, created_by, created_at
            ) VALUES (
                %s, %s, %s, %s, %s::movement_type,
                %s, %s, %s, %s, %s
            )
            ON CONFLICT (id) DO UPDATE SET
                movement_type = EXCLUDED.movement_type,
                quantity = EXCLUDED.quantity,
                unit_cost = EXCLUDED.unit_cost,
                reason = EXCLUDED.reason;
        """, (mid, user_id, item["branch_id"], item["id"], mtype,
              qty, unit_cost, reason, "sistema", created_dt))


def create_custom_domain(cur, user_id: str, account: dict, menu_ids: list[str]):
    """Crea un dominio custom simulado (no verifica DNS real)."""
    if not account["extras"].get("custom_domain"):
        return
    domain_id = uid(f"domain-{account['user_seed']}")
    domain = f"demo-{account['plan']}.menudigital.pro"
    verification_token = uid(f"verify-{account['user_seed']}")
    cur.execute("""
        INSERT INTO custom_domains (
            id, user_id, menu_id, domain, is_verified, verification_token,
            dns_checked_at, ssl_status, created_at, updated_at
        ) VALUES (
            %s, %s, %s, %s, TRUE, %s,
            NOW(), 'active', NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            menu_id = EXCLUDED.menu_id,
            domain = EXCLUDED.domain,
            is_verified = TRUE,
            ssl_status = 'active',
            updated_at = NOW();
    """, (domain_id, user_id, menu_ids[0] if menu_ids else None, domain, verification_token))


def create_product_recipes(cur, user_id: str, account: dict, menus_dishes: dict, inventory: list[dict]):
    """Crea recetas plato → insumo."""
    if not account["extras"].get("product_recipes"):
        return
    # Para algunos platos, vincular con insumos aleatorios
    sample_dishes = []
    for menu_id, dishes in menus_dishes.items():
        for d in dishes[:5]:  # Solo los primeros 5 platos por menú
            sample_dishes.append(d)
    
    for i, dish in enumerate(sample_dishes):
        n_ingredients = random.randint(2, 4)
        ingredients = random.sample(inventory, min(n_ingredients, len(inventory)))
        for j, ing in enumerate(ingredients):
            recipe_id = uid(f"recipe-{account['user_seed']}-{i}-{j}")
            qty_per_dish = round(random.uniform(0.05, 0.5), 3)
            cur.execute("""
                INSERT INTO product_recipes (
                    id, owner_id, menu_item_id, menu_item_name, inventory_item_id,
                    quantity_per_dish, notes, created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s,
                    %s, NULL, NOW(), NOW()
                )
                ON CONFLICT (id) DO UPDATE SET
                    menu_item_name = EXCLUDED.menu_item_name,
                    inventory_item_id = EXCLUDED.inventory_item_id,
                    quantity_per_dish = EXCLUDED.quantity_per_dish;
            """, (recipe_id, user_id, dish["id"], dish["name"], ing["id"], qty_per_dish))


# ─────────────────────────────────────────────────────────────────────────────
# Función principal
# ─────────────────────────────────────────────────────────────────────────────

def seed_account(cur, account: dict) -> dict:
    """Puebla una cuenta demo completa. Retorna stats."""
    print(f"\n{'═' * 70}")
    print(f"  Poblando: {account['email']}  (plan: {account['plan'].upper()})")
    print(f"{'═' * 70}")
    
    user_id = uid(account["user_seed"])
    pwd_hash = hash_password(DEMO_PASSWORD)
    
    # 1. Auth user + profile
    print(f"  → Creando auth user + profile...")
    create_auth_user(cur, user_id, account["email"], account["full_name"], pwd_hash)
    create_profile(cur, user_id, account["email"], account["full_name"], account["plan"])
    
    # 2. Branches (Premium y Full)
    branch_ids = []
    if account["extras"]:
        print(f"  → Creando {account['extras'].get('branches', 0)} sucursal(es)...")
        branch_ids = create_branches(cur, user_id, account)
    
    # 3. Menús + categorías + platos
    menu_ids = []
    menus_dishes = {}
    total_dishes = 0
    for r_key in account["restaurants"]:
        print(f"  → Creando menú: {r_key}...")
        menu_id, r = create_menu(cur, account, r_key, user_id)
        menu_ids.append(menu_id)
        dishes = create_categories_and_dishes(cur, account, menu_id, r_key)
        menus_dishes[menu_id] = dishes
        total_dishes += len(dishes)
    
    # 4. Analytics (views + WA clicks)
    total_views = 0
    total_wa = 0
    for menu_id in menu_ids:
        n_views = account["analytics"]["views_per_menu"] + random.randint(-50, 50)
        n_wa = account["analytics"]["wa_clicks_per_menu"] + random.randint(-15, 15)
        print(f"  → Generando {n_views} views + {n_wa} WA clicks para menú {menu_id[:8]}...")
        generate_menu_views(cur, menu_id, n_views, account["days_history"])
        generate_whatsapp_clicks(cur, menu_id, n_wa, account["days_history"])
        total_views += n_views
        total_wa += n_wa
    
    # 5. Waiters + tables + inventory + orders (Premium y Full)
    stats = {
        "email": account["email"], "plan": account["plan"], "menus": len(menu_ids),
        "dishes": total_dishes, "views": total_views, "wa_clicks": total_wa,
        "branches": len(branch_ids), "waiters": 0, "tables": 0,
        "inventory": 0, "orders": 0, "inventory_movements": 0, "voucher_prints": 0,
    }
    
    if account["extras"]:
        print(f"  → Creando {account['extras']['waiters']} mozos...")
        waiters = create_waiters(cur, user_id, account, branch_ids)
        stats["waiters"] = len(waiters)
        
        print(f"  → Creando {account['extras']['tables']} mesas...")
        tables = create_tables(cur, user_id, account, branch_ids)
        stats["tables"] = len(tables)
        
        print(f"  → Creando {account['extras']['inventory']} insumos...")
        inventory = create_inventory(cur, user_id, account, branch_ids)
        stats["inventory"] = len(inventory)
        
        print(f"  → Creando {account['extras']['orders']} comandas...")
        orders = create_orders(cur, user_id, account, branch_ids, waiters, tables, menus_dishes)
        stats["orders"] = len(orders)
        
        # Recetas e inventario movimientos (Full)
        create_product_recipes(cur, user_id, account, menus_dishes, inventory)
        create_inventory_movements(cur, user_id, account, inventory)
        stats["inventory_movements"] = account["extras"].get("inventory_movements", 0)
        stats["voucher_prints"] = sum(1 for o in orders if o["status"] == "facturada") if account["plan"] == "full" else 0
        
        # Dominio custom (Full)
        create_custom_domain(cur, user_id, account, menu_ids)
    
    print(f"\n  ✅ {account['email']} poblado:")
    print(f"     Menús: {stats['menus']}  | Platos: {stats['dishes']}")
    print(f"     Views: {stats['views']}  | WA clicks: {stats['wa_clicks']}")
    if account["extras"]:
        print(f"     Sucursales: {stats['branches']}  | Mozos: {stats['waiters']}  | Mesas: {stats['tables']}")
        print(f"     Inventario: {stats['inventory']}  | Comandas: {stats['orders']}")
        if stats['inventory_movements']:
            print(f"     Movimientos: {stats['inventory_movements']}  | Vouchers: {stats['voucher_prints']}")
    
    return stats


def verify_demo_login(cur, email: str) -> bool:
    """Verifica que el usuario existe y tiene password válido."""
    cur.execute("""
        SELECT u.id, u.email, u.encrypted_password, p.plan, p.is_active
        FROM auth.users u
        JOIN profiles p ON p.id = u.id
        WHERE u.email = %s;
    """, (email,))
    row = cur.fetchone()
    if not row:
        print(f"  ❌ {email}: NO existe en auth.users")
        return False
    # Verificar password
    ok = bcrypt.checkpw(DEMO_PASSWORD.encode(), row[2].encode())
    if not ok:
        print(f"  ❌ {email}: password no coincide")
        return False
    print(f"  ✅ {email}: login OK (plan={row[3]}, active={row[4]})")
    return True


def main():
    print("=" * 70)
    print(" MENU PRO — SEED 3 CUENTAS DEMO (PRO / PREMIUM / FULL)")
    print("=" * 70)
    print(f" Password para las 3: {DEMO_PASSWORD}")
    print(f" Días de histórico: PRO=60, PREMIUM=90, FULL=90")
    print()
    
    start_time = time.time()
    
    print("🔌 Conectando a Supabase producción...")
    conn = psycopg2.connect(**CONN)
    conn.autocommit = False
    cur = conn.cursor()
    print("✅ Conexión OK")
    
    # Asegurar que el enum user_plan tiene todos los valores
    print("\n→ Asegurando enum user_plan...")
    cur.execute("ALTER TYPE user_plan ADD VALUE IF NOT EXISTS 'premium';")
    cur.execute("ALTER TYPE user_plan ADD VALUE IF NOT EXISTS 'full';")
    conn.commit()
    
    all_stats = []
    for account in DEMO_ACCOUNTS:
        try:
            stats = seed_account(cur, account)
            all_stats.append(stats)
            conn.commit()
            print(f"  💾 Commit OK para {account['email']}")
        except Exception as e:
            conn.rollback()
            print(f"  ❌ ERROR poblando {account['email']}: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    # Verificación final: probar login de cada cuenta
    print(f"\n{'═' * 70}")
    print("  VERIFICACIÓN DE LOGIN")
    print(f"{'═' * 70}")
    for account in DEMO_ACCOUNTS:
        verify_demo_login(cur, account["email"])
    
    cur.close()
    conn.close()
    
    elapsed = time.time() - start_time
    
    print(f"\n{'═' * 70}")
    print(f"  RESUMEN FINAL ({elapsed:.1f}s)")
    print(f"{'═' * 70}")
    print(f"{'Email':<35} {'Plan':<10} {'Menús':>6} {'Platos':>8} {'Views':>8} {'WA':>6} {'Orders':>8}")
    print("-" * 90)
    for s in all_stats:
        print(f"{s['email']:<35} {s['plan'].upper():<10} {s['menus']:>6} {s['dishes']:>8} "
              f"{s['views']:>8} {s['wa_clicks']:>6} {s['orders']:>8}")
    
    print(f"\n🔑 Credenciales para las 3 cuentas:")
    print(f"   Email:    demopro@menudigital.pro  |  demopremium@menudigital.pro  |  demofull@menudigital.pro")
    print(f"   Password: {DEMO_PASSWORD}")
    
    print(f"\n🌐 URLs públicas de los menús (ejemplos):")
    for s in all_stats:
        suffix = {"pro": "-pro", "premium": "-prem", "full": "-full"}[s["plan"]]
        print(f"   https://menudigital.pro/r/polleria{suffix}  ({s['email']})")
    
    print("\n✅ DONE")


if __name__ == "__main__":
    main()
