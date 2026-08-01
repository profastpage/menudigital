#!/usr/bin/env python3
"""
MenuPro — Seed SOLO demofull@menudigital.pro (plan FULL).

Versión enfocada y optimizada para no tocar las cuentas demo y demopro ya creadas.
Usa batch inserts (execute_values) para velocidad.

Crea:
  - 7 menús (polleria, chifa, pizzeria, cevicheria, burger, burger-gourmet, cafe-postres)
  - ~180 platos con gallery
  - ~7000 views + ~1200 WA clicks distribuidos en 90 días
  - 3 sucursales, 15 mozos, 30 mesas, 50 insumos, 120 comandas con items
  - Recetas plato→insumo, 80 movimientos de inventario, ~60 vouchers impresos
  - 1 dominio custom (demo-full.menudigital.pro)
  - White-label (sin branding MenuPro)

Credenciales:
  Email:    demofull@menudigital.pro
  Password: DemoMenuPro2025!

Idempotente: ON CONFLICT DO UPDATE.
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

DEMO_EMAIL = "demofull@menudigital.pro"
DEMO_PASSWORD = "DemoMenuPro2025!"
DEMO_FULL_NAME = "Demo Full MenuPro"
DEMO_PLAN = "full"
USER_SEED = "demo-full-user-v1"

NS = uuid.UUID("00000000-0000-0000-0000-0000cafef00d")

CONN = dict(
    host='aws-0-sa-east-1.pooler.supabase.com',
    port=5432,
    dbname='postgres',
    user='postgres.bkxtploibraiovgrjtwn',
    password='Wafla0523129500',
    sslmode='require',
    connect_timeout=30,
)

random.seed(20250802)

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def uid(prefix: str) -> str:
    return str(uuid.uuid5(NS, prefix))

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=10)).decode()

def unsplash(photo_id: str, w: int = 800, h: int = 600) -> str:
    return f"https://images.unsplash.com/photo-{photo_id}?w={w}&h={h}&fit=crop&crop=entropy&q=80&fm=webp"

def random_dt_in_last(days: int) -> datetime:
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=days)
    delta = end - start
    return start + timedelta(seconds=random.randint(0, int(delta.total_seconds())))


# ─────────────────────────────────────────────────────────────────────────────
# Definición de 7 restaurantes
# ─────────────────────────────────────────────────────────────────────────────

RESTAURANTS = [
    {
        "key": "polleria", "name": "Pollería El Dorado Chicken",
        "slogan": "El verdadero pollo a la brasa peruano",
        "description": "Más de 25 años llevando el mejor pollo a la brasa a tu mesa.",
        "whatsapp": "+51987654321", "color": "#d62828", "secondary": "#1a1a2e",
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
                ("Pollo a la Brasa Entero", "1 pollo entero (8 presas) ahumado al carbón, papas fritas, ensalada y ají.", 58.00, "1606756790138-261d2b21cd75"),
                ("Medio Pollo a la Brasa", "4 presas con papas fritas y ensalada.", 34.00, "1598103442097-8b74394b95c6"),
                ("Cuarto de Pollo", "2 presas con papas y ensalada.", 19.00, "1569058242253-92a9c755a0ec"),
                ("Cuarto + Porción Extra", "Cuarto con doble porción de papas.", 24.00, "1606756790138-261d2b21cd75"),
                ("Pollo Picante", "Pollo a la brasa bañado en salsa picante.", 36.00, "1555939594-58d7cb561ad1"),
            ]},
            {"name": "Pollo Broaster", "dishes": [
                ("Pollo Broaster Entero", "8 presas broaster crujientes.", 56.00, "1569058242253-92a9c755a0ec"),
                ("Medio Broaster", "4 presas broaster con papas.", 32.00, "1555939594-58d7cb561ad1"),
                ("Cuarto Broaster", "2 presas broaster con papas.", 18.00, "1606756790138-261d2b21cd75"),
                ("Alitas Broaster (12u)", "12 alitas crujientes con salsa.", 28.00, "1598103442097-8b74394b95c6"),
                ("Nuggets (10u)", "10 nuggets con salsa.", 18.00, "1607013251379-e6eecfffe234"),
            ]},
            {"name": "Guarniciones", "dishes": [
                ("Papas Fritas Familiares", "Porción grande para 4 personas.", 14.00, "1573080496219-bb080dd4f877"),
                ("Ensalada Familiar", "Lechuga, tomate, cebolla, zanahoria y palta.", 12.00, "1512621776951-a57141f2eefd"),
                ("Arroz Blanco", "Porción de arroz graneado.", 6.00, "1586201375761-83865001e31c"),
                ("Arroz Chaufa", "Salteado al wok con huevo y cebollita china.", 18.00, "1606756790138-261d2b21cd75"),
            ]},
            {"name": "Combos", "dishes": [
                ("Combo Familiar 4P", "1 pollo + papas + ensalada + 4 gaseosas.", 75.00, "1606756790138-261d2b21cd75"),
                ("Combo Pareja", "1/2 pollo + papas + ensalada + 2 gaseosas.", 45.00, "1598103442097-8b74394b95c6"),
                ("Combo Súper Familiar", "1 pollo + 1/4 extra + papas grandes + 4 gaseosas.", 89.00, "1569058242253-92a9c755a0ec"),
                ("Combo Individual", "1/4 pollo + papas + gaseosa.", 22.00, "1518492104633-130d0cc84637"),
            ]},
            {"name": "Bebidas", "dishes": [
                ("Inca Kola 500ml", "Personal 500ml helada.", 5.00, "1437418747212-8d9709afab22"),
                ("Coca Cola 500ml", "Personal 500ml.", 5.00, "1554866585-cd94860890b7"),
                ("Chicha Morada 1L", "Casera con maíz morado, piña y canela.", 12.00, "1606756790138-261d2b21cd75"),
                ("Maracuyá 1L", "Jugo natural.", 14.00, "1606756790138-261d2b21cd75"),
            ]},
        ],
    },
    {
        "key": "chifa", "name": "Chifa Dragón de Oro",
        "slogan": "Tradición china peruana desde 1985",
        "description": "Auténtica comida china-peruana preparada por chefs cantoneses.",
        "whatsapp": "+51987654322", "color": "#c1121f", "secondary": "#1a1a2e",
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
                ("Wantán Frito (12u)", "12 wantanes crujientes con salsa tamarindo.", 18.00, "1606756790138-261d2b21cd75"),
                ("Sopa Wantán", "Sopa con wantanes, pollo, huevos y cebollita china.", 16.00, "1504674900247-0877df9cc836"),
                ("Chijaukay de Pollo", "Pollo rebozado frito con salsa dulce-tamarindo.", 26.00, "1569058242253-92a9c755a0ec"),
                ("Ensalada de Wantán", "Wantanes fritos sobre lechuga.", 20.00, "1512621776951-a57141f2eefd"),
            ]},
            {"name": "Sopas", "dishes": [
                ("Sopa Wantán Especial", "Caldo con wantanes, pollo y huevos.", 18.00, "1606756790138-261d2b21cd75"),
                ("Sopa Fuchifú", "Sopa de arroz inflado con pollo.", 16.00, "1606756790138-261d2b21cd75"),
                ("SuedPa", "Sopa con fideos chinos, mariscos y pollo.", 28.00, "1606756790138-261d2b21cd75"),
                ("Sopa de Mariscos", "Caldo con camarones, calamar y pescado.", 32.00, "1606756790138-261d2b21cd75"),
            ]},
            {"name": "Arroz Chaufa", "dishes": [
                ("Chaufa de Pollo", "Arroz frito con pollo, huevos y sillao.", 22.00, "1525755662778-989d0524087e"),
                ("Chaufa de Camarón", "Arroz frito con camarones.", 32.00, "1582450871972-ab5ca641643d"),
                ("Chaufa Especial", "Pollo, camarón, jamón y huevos.", 36.00, "1582450871972-ab5ca641643d"),
                ("Chaufa con Tallarín", "Mitad chaufa, mitad tallarín.", 28.00, "1606756790138-261d2b21cd75"),
                ("Arroz Tipakay", "Arroz frito con pollo rebozado.", 30.00, "1606756790138-261d2b21cd75"),
            ]},
            {"name": "Tallarines", "dishes": [
                ("Tallarín Saltado de Pollo", "Fideos chinos con pollo y sillao.", 24.00, "1606756790138-261d2b21cd75"),
                ("Tallarín de Camarón", "Fideos con camarones.", 34.00, "1606756790138-261d2b21cd75"),
                ("Tallarín Especial", "Pollo, camarón, jamón y huevos.", 38.00, "1606756790138-261d2b21cd75"),
                ("Tallarín con Tamarindo", "Fideos con salsa tamarindo.", 28.00, "1606756790138-261d2b21cd75"),
            ]},
            {"name": "Especiales", "dishes": [
                ("Pollo Chi Jau Kay", "Pollo rebozado con salsa tamarindo.", 28.00, "1569058242253-92a9c755a0ec"),
                ("Camarón Chi Jau Kay", "Camarones rebozados con tamarindo.", 42.00, "1606756790138-261d2b21cd75"),
                ("Pollo Kallu", "Pollo deshilachado con tallarín y ajo.", 26.00, "1606756790138-261d2b21cd75"),
                ("Japu", "Arroz chaufa cubierto con pollo saltado.", 32.00, "1606756790138-261d2b21cd75"),
                ("Pollo Sueco", "Pollo frito con salsa agridulce.", 26.00, "1606756790138-261d2b21cd75"),
            ]},
            {"name": "Bebidas", "dishes": [
                ("Té Chino", "Té de jazmín caliente.", 4.00, "1606756790138-261d2b21cd75"),
                ("Chicha Morada 1L", "Casera.", 12.00, "1606756790138-261d2b21cd75"),
                ("Inca Kola 1.5L", "Para compartir.", 12.00, "1606756790138-261d2b21cd75"),
                ("Limón Frío 1L", "Limonada con hierbabuena.", 10.00, "1606756790138-261d2b21cd75"),
            ]},
        ],
    },
    {
        "key": "pizzeria", "name": "Pizzería Bella Napoli",
        "slogan": "Auténtica pizza napolitana al horno de piedra",
        "description": "Pizza artesanal con masa madre e ingredientes importados de Italia.",
        "whatsapp": "+51987654323", "color": "#bc4749", "secondary": "#f2e8cf",
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
                ("Margherita", "Tomate San Marzano, mozzarella fior di latte, albahaca.", 38.00, "1513104890138-7c749659a591"),
                ("Napolitana", "Tomate, mozzarella, anchoas, alcaparras.", 42.00, "1574071318508-1cdbab80d002"),
                ("Pepperoni", "Tomate, mozzarella y pepperoni picante.", 44.00, "1565299624946-b28f40a0ae38"),
                ("Quattro Formaggi", "Mozzarella, gorgonzola, parmesano y fontina.", 48.00, "1604382354936-07c5d9983bd3"),
                ("Quattro Stagioni", "Jamón, champiñones, alcachofas y aceitunas.", 46.00, "1593560708920-61dd98c46a4e"),
                ("Prosciutto e Funghi", "Jamón italiano y champiñones frescos.", 44.00, "1604382354936-07c5d9983bd3"),
            ]},
            {"name": "Pizzas Especiales", "dishes": [
                ("Diavola", "Salsa picante, salame picante y ají molido.", 46.00, "1574071318508-1cdbab80d002"),
                ("Tartufo", "Crema de trufa negra, champiñones y parmesano.", 58.00, "1593560708920-61dd98c46a4e"),
                ("Prosciutto e Rucola", "Jamón crudo, rúcula y parmesano.", 52.00, "1565299624946-b28f40a0ae38"),
                ("Capricciosa", "Jamón, champiñones, alcachofas y aceitunas negras.", 48.00, "1604382354936-07c5d9983bd3"),
                ("Frutti di Mare", "Camarones, calamar y mejillones.", 56.00, "1574071318508-1cdbab80d002"),
            ]},
            {"name": "Pastas", "dishes": [
                ("Spaghetti Carbonara", "Guanciale, yema, pecorino y pimienta.", 32.00, "1551183053-bf91a1d81141"),
                ("Spaghetti Bolognese", "Ragú de res cocido 6 horas.", 30.00, "1481931098730-318b6f776db0"),
                ("Lasaña Boloñesa", "Capas de pasta con bechamel y parmesano.", 36.00, "1574894709920-11b280e736e8"),
                ("Fettuccine Alfredo", "Mantequilla, crema y parmesano.", 34.00, "1551183053-bf91a1d81141"),
                ("Ravioli Ricotta e Spinaci", "Raviolis con salsa de salvia.", 38.00, "1481931098730-318b6f776db0"),
            ]},
            {"name": "Entradas", "dishes": [
                ("Bruschetta Classica", "Pan tostado con tomate, ajo y albahaca.", 16.00, "1481931098730-318b6f776db0"),
                ("Caprese", "Tomate, mozzarella fresca y albahaca.", 22.00, "1565299624946-b28f40a0ae38"),
                ("Antipasto Italiano", "Jamón crudo, salame, quesos y aceitunas.", 38.00, "1574071318508-1cdbab80d002"),
                ("Garlic Bread", "Pan con mantequilla de ajo y mozzarella.", 14.00, "1481931098730-318b6f776db0"),
            ]},
            {"name": "Postres", "dishes": [
                ("Tiramisú", "Café espresso, mascarpone y cacao.", 18.00, "1571877221080-a3dca66a22c3"),
                ("Panna Cotta", "Crema con salsa de frutos rojos.", 16.00, "1488477181946-6428a0291777"),
                ("Cannoli Siciliani", "Cannoli con crema de ricotta y pistachos.", 17.00, "1571877221080-a3dca66a22c3"),
                ("Gelato (2 bolas)", "Pistacho, fresa, chocolate o vainilla.", 14.00, "1488477181946-6428a0291777"),
            ]},
            {"name": "Bebidas", "dishes": [
                ("Limonata Italiana 500ml", "Limonada con gas.", 8.00, "1606756790138-261d2b21cd75"),
                ("Coca Cola 500ml", "Personal.", 6.00, "1554866585-cd94860890b7"),
                ("Vino Tinto Copa", "Chianti DOCG.", 18.00, "1510812438-f0d9a4d4e7c3"),
                ("Vino Blanco Copa", "Pinot Grigio.", 16.00, "1510812438-f0d9a4d4e7c3"),
                ("Agua Mineral 500ml", "Con o sin gas.", 4.00, "1606756790138-261d2b21cd75"),
            ]},
        ],
    },
    {
        "key": "cevicheria", "name": "La Mar Cevichería",
        "slogan": "El verdadero ceviche peruano",
        "description": "Cevichería tradicional con pescado fresco del día.",
        "whatsapp": "+51987654325", "color": "#2a9d8f", "secondary": "#264653",
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
                ("Ceviche Clásico", "Pescado fresco, limón, cebolla, cilantro, ají limo y camote.", 28.00, "1559847844-5315695dadae"),
                ("Ceviche Mixto", "Pescado, camarones, calamar y conchas.", 42.00, "1582450871972-ab5ca641643d"),
                ("Ceviche de Camarón", "Camarones frescos macerados en limón.", 38.00, "1582450871972-ab5ca641643d"),
                ("Ceviche de Conchas", "Conchas de abanico con ají limo.", 44.00, "1582450871972-ab5ca641643d"),
                ("Ceviche Norteño", "Estilo norteño con más limón y ají limo.", 30.00, "1559847844-5315695dadae"),
                ("Ceviche Tropical", "Con mango, maracuyá y ají limo.", 32.00, "1559847844-5315695dadae"),
            ]},
            {"name": "Tiraditos", "dishes": [
                ("Tiradito Clásico", "Filete cortado fino en salsa de limón y ají amarillo.", 32.00, "1559847844-5315695dadae"),
                ("Tiradito Ají Amarillo", "Salsa cremosa de ají amarillo.", 34.00, "1559847844-5315695dadae"),
                ("Tiradito Acevichado", "Salsa de ceviche con cilantro y ají limo.", 34.00, "1582450871972-ab5ca641643d"),
                ("Tiradito de Pulpo", "Pulpo cocido en salsa de ají amarillo.", 42.00, "1582450871972-ab5ca641643d"),
            ]},
            {"name": "Leches de Tigre", "dishes": [
                ("Leche de Tigre Clásica", "Caldo ácido con trozos de pescado.", 22.00, "1559847844-5315695dadae"),
                ("Leche de Pantera", "Versión con mariscos negros.", 28.00, "1582450871972-ab5ca641643d"),
                ("Leche de Tigre Mixta", "Pescado, camarón y calamar.", 26.00, "1559847844-5315695dadae"),
            ]},
            {"name": "Calientes", "dishes": [
                ("Chicharrón de Pescado", "Pescado frito crujiente con yuca.", 32.00, "1559847844-5315695dadae"),
                ("Chicharrón de Calamar", "Calamar frito con salsa tártara.", 34.00, "1582450871972-ab5ca641643d"),
                ("Pescado Frito", "Filete con yuca y ensalada.", 28.00, "1559847844-5315695dadae"),
                ("Arroz con Mariscos", "Arroz graneado con mariscos.", 36.00, "1582450871972-ab5ca641643d"),
                ("Parihuela", "Sopa de mariscos picante.", 38.00, "1582450871972-ab5ca641643d"),
            ]},
            {"name": "Entradas", "dishes": [
                ("Conchas a la Parmesana", "Conchas gratinadas con parmesano.", 32.00, "1582450871972-ab5ca641643d"),
                ("Causa de Camarón", "Causa de papa amarilla con camarón.", 22.00, "1559847844-5315695dadae"),
                ("Causa Limeña", "Causa con pollo, palta y mayonesa.", 18.00, "1559847844-5315695dadae"),
                ("Pulpo al Olivo", "Pulpo con salsa de aceitunas.", 38.00, "1582450871972-ab5ca641643d"),
            ]},
            {"name": "Bebidas", "dishes": [
                ("Chicha Morada 1L", "Casera.", 12.00, "1606756790138-261d2b21cd75"),
                ("Maracuyá 1L", "Natural.", 14.00, "1606756790138-261d2b21cd75"),
                ("Limonada Fría 1L", "Con hierbabuena.", 10.00, "1606756790138-261d2b21cd75"),
                ("Cerveza Cusqueña", "620ml helada.", 12.00, "1606756790138-261d2b21cd75"),
                ("Cerveza Cristal", "620ml helada.", 10.00, "1606756790138-261d2b21cd75"),
            ]},
        ],
    },
    {
        "key": "burger", "name": "Smash Brothers Burger House",
        "slogan": "Smash burgers con carne 100% de res",
        "description": "Hamburguesas smash style con carne angus y pan brioche horneado.",
        "whatsapp": "+51987654324", "color": "#e63946", "secondary": "#1d3557",
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
                ("Single Smash", "1 patty angus 100g, cheddar, pepinillos.", 18.00, "1568901346375-23c9450c58cd"),
                ("Double Smash", "2 patties 200g, cheddar doble.", 26.00, "1571091718767-18b5b1457add"),
                ("Triple Smash", "3 patties 300g, cheddar triple, bacon.", 34.00, "1565299624946-b28f40a0ae38"),
                ("Bacon Smash", "1 patty, cheddar, bacon, BBQ.", 24.00, "1550547660-d9450f85e341"),
                ("Mushroom Smash", "1 patty, champiñones y salsa trufa.", 22.00, "1565299624946-b28f40a0ae38"),
            ]},
            {"name": "Especiales", "dishes": [
                ("Brothers Signature", "Doble patty, cheddar, bacon, huevo.", 32.00, "1571091718767-18b5b1457add"),
                ("Truffle Burger", "Doble patty, gruyere, champiñones trufados.", 36.00, "1565299624946-b28f40a0ae38"),
                ("Spicy Mexican", "Doble patty, jalapeños, guacamole.", 28.00, "1565299624946-b28f40a0ae38"),
                ("Blue Cheese Burger", "Doble patty, queso azul, rúcula.", 30.00, "1550547660-d9450f85e341"),
            ]},
            {"name": "Chicken Burgers", "dishes": [
                ("Crispy Chicken", "Pollo crujiente, lechuga, tomate.", 22.00, "1606756790138-261d2b21cd75"),
                ("Spicy Chicken", "Pollo picante, jalapeños, cheddar.", 24.00, "1606756790138-261d2b21cd75"),
                ("Grilled Chicken", "Pechuga a la parrilla, salsa cesar.", 20.00, "1606756790138-261d2b21cd75"),
            ]},
            {"name": "Sides", "dishes": [
                ("Papas Crinkle", "Papas crinkle fritas con ketchup y mayo.", 10.00, "1573080496219-bb080dd4f877"),
                ("Papas Cargadas", "Papas con cheddar, bacon, jalapeños.", 18.00, "1573080496219-bb080dd4f877"),
                ("Onion Rings", "Aros de cebolla crujientes con ranch.", 14.00, "1571091718767-18b5b1457add"),
                ("Nachos Supreme", "Nachos con cheddar, guacamole, jalapeños.", 22.00, "1571091718767-18b5b1457add"),
            ]},
            {"name": "Milkshakes", "dishes": [
                ("Clásico Vainilla", "Milkshake con crema.", 14.00, "1571091718767-18b5b1457add"),
                ("Chocolate Oreo", "Con galletas oreo molidas.", 16.00, "1571091718767-18b5b1457add"),
                ("Fresa Cheesecake", "Con trozos de cheesecake.", 16.00, "1571091718767-18b5b1457add"),
                ("Salted Caramel", "Caramelo salado con crema.", 16.00, "1571091718767-18b5b1457add"),
            ]},
            {"name": "Bebidas", "dishes": [
                ("Coca Cola 500ml", "Personal helada.", 6.00, "1554866585-cd94860890b7"),
                ("Inca Kola 500ml", "Personal helada.", 6.00, "1437418747212-8d9709afab22"),
                ("Limonada Fría 500ml", "Con hierbabuena.", 7.00, "1606756790138-261d2b21cd75"),
                ("Cerveza Artesanal", "IPA o APA de la casa.", 18.00, "1606756790138-261d2b21cd75"),
            ]},
            {"name": "Combos", "dishes": [
                ("Combo Single", "Single + papas + bebida.", 28.00, "1568901346375-23c9450c58cd"),
                ("Combo Double", "Double + papas + milkshake.", 42.00, "1571091718767-18b5b1457add"),
                ("Combo Pareja", "2 Double + papas cargadas + 2 bebidas.", 68.00, "1571091718767-18b5b1457add"),
                ("Combo Familiar", "4 Single + papas + onion rings + 4 bebidas.", 95.00, "1571091718767-18b5b1457add"),
            ]},
        ],
    },
    {
        "key": "burger-gourmet", "name": "Black & Gold Gourmet Burgers",
        "slogan": "Hamburguesas gourmet con ingredientes premium",
        "description": "Hamburguesas premium con carne wagyu, pan brioche artesanal y quesos importados.",
        "whatsapp": "+51987654326", "color": "#1a1a2e", "secondary": "#c9a227",
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
                ("Wagyu Truffle", "Wagyu 200g, gruyere, champiñones trufados.", 68.00, "1565299624946-b28f40a0ae38"),
                ("Black Angus Gold", "Angus 200g, brie, hojuelas de oro comestible.", 58.00, "1571091718767-18b5b1457add"),
                ("Foie Gras Burger", "Angus, foie gras, cebolla confitada.", 78.00, "1565299624946-b28f40a0ae38"),
                ("Blue Cheese & Walnut", "Angus, queso azul, nueces caramelizadas.", 52.00, "1550547660-d9450f85e341"),
                ("Spicy Wagyu", "Wagyu, cheddar, jalapeños asados.", 64.00, "1565299624946-b28f40a0ae38"),
            ]},
            {"name": "Premium Sides", "dishes": [
                ("Truffle Fries", "Papas con aceite de trufa y parmesano.", 22.00, "1573080496219-bb080dd4f877"),
                ("Sweet Potato Fries", "Papas camote con miel y mostaza.", 18.00, "1573080496219-bb080dd4f877"),
                ("Grilled Asparagus", "Espárragos con parmesano.", 24.00, "1571091718767-18b5b1457add"),
                ("Burrata Salad", "Burrata, tomate cherry, rúcula y pesto.", 38.00, "1565299624946-b28f40a0ae38"),
            ]},
            {"name": "Gourmet Shakes", "dishes": [
                ("Belgian Chocolate", "Chocolate belga con crema.", 28.00, "1571091718767-18b5b1457add"),
                ("Madagascar Vanilla", "Vainilla de Madagascar con amaretto.", 26.00, "1571091718767-18b5b1457add"),
                ("Salted Caramel Gold", "Caramelo salado con hojuelas de oro.", 32.00, "1571091718767-18b5b1457add"),
            ]},
            {"name": "Cervezas Premium", "dishes": [
                ("IPA Artesanal", "IPA de la casa, lúpulo citrus.", 22.00, "1606756790138-261d2b21cd75"),
                ("Stout Imperial", "Stout 8%, café y chocolate.", 24.00, "1606756790138-261d2b21cd75"),
                ("Belgian Tripel", "Belga tripel 9%.", 28.00, "1606756790138-261d2b21cd75"),
            ]},
        ],
    },
    {
        "key": "cafe-postres", "name": "Dolce Caffè Artisan",
        "slogan": "Café de especialidad y postres artesanales",
        "description": "Cafetería de especialidad con granos de origen único y repostería francesa.",
        "whatsapp": "+51987654327", "color": "#8b5e34", "secondary": "#f4e9d8",
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
                ("Espresso Single Origin", "Chanchamayo. Notas a chocolate y frutos rojos.", 8.00, "1495474472287-4d71bcdd2085"),
                ("Flat White", "Doble espresso con microespuma.", 12.00, "1559496417-e7f25cb247f3"),
                ("Cappuccino", "Espresso con leche vaporizada.", 10.00, "1559496417-e7f25cb247f3"),
                ("Latte Vainilla", "Con jarabe de vainilla de Madagascar.", 14.00, "1559496417-e7f25cb247f3"),
                ("Cold Brew", "Café extraído en frío por 18 horas.", 14.00, "1495474472287-4d71bcdd2085"),
                ("V60 Pour Over", "Filtrado manual de origen único.", 16.00, "1495474472287-4d71bcdd2085"),
            ]},
            {"name": "Postres Franceses", "dishes": [
                ("Macarons (6u)", "Surtido: pistacho, frambuesa, chocolate, vainilla, café, caramelo.", 28.00, "1571877221080-a3dca66a22c3"),
                ("Éclair de Chocolate", "Relleno de crema pastelera con chocolate belga.", 16.00, "1488477181946-6428a0291777"),
                ("Mille-Feuille", "Mil hojas con crema de vainilla y caramelo.", 22.00, "1488477181946-6428a0291777"),
                ("Tarta de Limón", "Merengada al estilo francés.", 18.00, "1488477181946-6428a0291777"),
                ("Opera Cake", "Capas de café, chocolate y almendra.", 26.00, "1571877221080-a3dca66a22c3"),
            ]},
            {"name": "Repostería", "dishes": [
                ("Croissant de Mantequilla", "Con mantequilla normanda.", 8.00, "1555507036-ab1f4048607a"),
                ("Pain au Chocolat", "Con chocolate belga.", 10.00, "1555507036-ab1f4048607a"),
                ("Croissant de Almendras", "Con crema frangipane.", 12.00, "1555507036-ab1f4048607a"),
                ("Brioche Confitura", "Con mermelada artesanal de frutos rojos.", 10.00, "1555507036-ab1f4048607a"),
                ("Cinnamon Roll", "Con crema de queso y nueces.", 12.00, "1555507036-ab1f4048607a"),
            ]},
            {"name": "Té y Otras Bebidas", "dishes": [
                ("Chai Latte", "Con cardamomo, canela y jengibre.", 12.00, "1556679343-c7306c1976bc"),
                ("Matcha Latte", "Matcha japonés ceremonial grade.", 14.00, "1556679343-c7306c1976bc"),
                ("Té de Hierbas", "Manzanilla, menta o hierbaluisa.", 8.00, "1556679343-c7306c1976bc"),
                ("Chocolate Caliente Belga", "Con crema y malvaviscos.", 14.00, "1556679343-c7306c1976bc"),
            ]},
            {"name": "Salados", "dishes": [
                ("Croissant Jamón y Queso", "Jamón español y queso gruyere.", 14.00, "1555507036-ab1f4048607a"),
                ("Quiche Lorraine", "Con bacon, queso y cebolla.", 18.00, "1555507036-ab1f4048607a"),
                ("Baguette Caprese", "Tomate, mozzarella, albahaca y pesto.", 16.00, "1555507036-ab1f4048607a"),
                ("Sándwich Club", "Pollo, bacon, lechuga, tomate y mayo.", 20.00, "1555507036-ab1f4048607a"),
            ]},
            {"name": "Combos", "dishes": [
                ("Combo Desayuno", "Cappuccino + croissant + jugo de naranja.", 22.00, "1495474472287-4d71bcdd2085"),
                ("Combo Media Tarde", "Flat White + 2 macarons.", 22.00, "1559496417-e7f25cb247f3"),
                ("Combo Dulce", "Latte vainilla + mille-feuille.", 32.00, "1559496417-e7f25cb247f3"),
                ("Combo Salado", "Café americano + quiche lorraine.", 24.00, "1495474472287-4d71bcdd2085"),
            ]},
        ],
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# Funciones de seed (todas idempotentes)
# ─────────────────────────────────────────────────────────────────────────────

def create_auth_user(cur, user_id: str, email: str, full_name: str, pwd_hash: str):
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
            %s, %s, %s::jsonb, 'email', %s,
            NOW(), NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            identity_data = EXCLUDED.identity_data, updated_at = NOW();
    """, (identity_id, user_id, f'{{"sub":"{user_id}","email":"{email}"}}', user_id))


def create_profile(cur, user_id: str, email: str, full_name: str, plan: str):
    cur.execute("""
        INSERT INTO profiles (
            id, email, full_name, plan, is_super_admin, is_active,
            onboarding_completed_at, created_at, updated_at
        ) VALUES (
            %s, %s, %s, %s, FALSE, TRUE, NOW(), NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email, full_name = EXCLUDED.full_name, plan = EXCLUDED.plan,
            is_active = TRUE, updated_at = NOW();
    """, (user_id, email, full_name, plan))


def create_menu(cur, user_id: str, r: dict) -> tuple[str, list[dict]]:
    slug = r["key"] + "-full"
    menu_id = uid(f"menu-{USER_SEED}-{r['key']}")
    t = r["theme"]
    cur.execute("""
        INSERT INTO menus (
            id, user_id, name, slug, slogan, description, whatsapp,
            color, currency, logo_url, branding_text, is_published,
            theme_color_secondary, theme_font, theme_layout, theme_image_size,
            theme_card_style, theme_cover_url, theme_show_search,
            theme_show_category_icons, theme_rounded_corners, theme_dark_mode,
            theme_dish_gallery, theme_carta_style, theme_carta_list_style,
            theme_carta_autoscroll, theme_carta_scroll_speed,
            social_facebook, social_instagram, social_whatsapp, social_tiktok,
            created_at, updated_at
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s,
            %s, 'S/', %s, NULL, TRUE,
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s,
            %s, %s, %s, %s,
            NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name, slug = EXCLUDED.slug, slogan = EXCLUDED.slogan,
            description = EXCLUDED.description, whatsapp = EXCLUDED.whatsapp,
            color = EXCLUDED.color, logo_url = EXCLUDED.logo_url, is_published = TRUE,
            theme_color_secondary = EXCLUDED.theme_color_secondary,
            theme_font = EXCLUDED.theme_font, theme_layout = EXCLUDED.theme_layout,
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
            updated_at = NOW();
    """, (menu_id, user_id, r["name"], slug, r["slogan"], r["description"], r["whatsapp"],
          r["color"], r["logo"], r["secondary"], t["font"], t["layout"], t["image_size"],
          t["card_style"], r["cover"], t["show_search"], t["show_category_icons"],
          t["rounded_corners"], t["dark_mode"], t["dish_gallery"],
          t["carta_style"], t["carta_list_style"], t["carta_autoscroll"], t["carta_scroll_speed"],
          r["social"].get("facebook"), r["social"].get("instagram"), r["whatsapp"],
          r["social"].get("tiktok")))
    return menu_id


def create_categories_and_dishes(cur, menu_id: str, r: dict) -> list[dict]:
    dishes_created = []
    for c_idx, cat in enumerate(r["categories"]):
        cat_id = uid(f"cat-{USER_SEED}-{r['key']}-{c_idx}")
        cur.execute("""
            INSERT INTO categories (id, menu_id, name, sort_order, created_at)
            VALUES (%s, %s, %s, %s, NOW())
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;
        """, (cat_id, menu_id, cat["name"], c_idx))
        
        for d_idx, (dname, ddesc, dprice, dphoto) in enumerate(cat["dishes"]):
            dish_id = uid(f"dish-{USER_SEED}-{r['key']}-{c_idx}-{d_idx}")
            img_url = unsplash(dphoto)
            gallery = [unsplash(dphoto, 1200, 800), unsplash(dphoto, 400, 400)]
            cur.execute("""
                INSERT INTO dishes (
                    id, category_id, name, description, price, image_url, sort_order, gallery, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price,
                    image_url = EXCLUDED.image_url, sort_order = EXCLUDED.sort_order, gallery = EXCLUDED.gallery;
            """, (dish_id, cat_id, dname, ddesc, dprice, img_url, d_idx, gallery))
            dishes_created.append({"id": dish_id, "name": dname, "price": float(dprice),
                                    "category": cat["name"]})
    return dishes_created


def generate_menu_views_batch(cur, menu_id: str, total_views: int, days: int):
    sources = ['direct', 'qr', 'social', 'google', 'instagram', 'facebook', 'tiktok']
    user_agents = [
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15",
        "Mozilla/5.0 (Linux; Android 13; SM-A145F) AppleWebKit/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/119.0.0.0",
        "Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36",
    ]
    # Batch pequeño para no consumir memoria
    BATCH = 100
    inserted = 0
    while inserted < total_views:
        n = min(BATCH, total_views - inserted)
        rows = []
        for _ in range(n):
            dt = random_dt_in_last(days)
            src = random.choices(sources, weights=[50, 20, 15, 8, 5, 1, 1])[0]
            ip = f"200.106.{random.randint(0,255)}.{random.randint(1,254)}"
            ua = random.choice(user_agents)
            rows.append((menu_id, ip, ua, dt, src))
        execute_values(cur, """
            INSERT INTO menu_views (menu_id, ip, user_agent, created_at, source)
            VALUES %s ON CONFLICT DO NOTHING;
        """, rows, page_size=50)
        inserted += n
        if inserted % 500 == 0:
            print(f"     views: {inserted}/{total_views}", flush=True)

    cur.execute("UPDATE menus SET views_count = %s WHERE id = %s;", (total_views, menu_id))


def generate_whatsapp_clicks_batch(cur, menu_id: str, total_clicks: int, days: int):
    user_agents = [
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15",
        "Mozilla/5.0 (Linux; Android 13; SM-A145F) AppleWebKit/537.36",
        "Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36",
    ]
    BATCH = 100
    inserted = 0
    while inserted < total_clicks:
        n = min(BATCH, total_clicks - inserted)
        rows = []
        for _ in range(n):
            dt = random_dt_in_last(days)
            src = random.choices(['cart', 'social', 'direct'], weights=[65, 25, 10])[0]
            ip = f"200.106.{random.randint(0,255)}.{random.randint(1,254)}"
            ua = random.choice(user_agents)
            rows.append((menu_id, ip, ua, src, dt))
        execute_values(cur, """
            INSERT INTO whatsapp_clicks (menu_id, ip, user_agent, source, created_at)
            VALUES %s ON CONFLICT DO NOTHING;
        """, rows, page_size=50)
        inserted += n


def create_branches(cur, user_id: str) -> list[str]:
    branches = [
        ("Sucursal San Isidro", "Av. Javier Prado 1234, San Isidro, Lima", "+51 987 654 321"),
        ("Sucursal Miraflores", "Av. Larco 879, Miraflores, Lima", "+51 987 654 322"),
        ("Sucursal Surco", "Av. Caminos del Inca 510, Surco, Lima", "+51 987 654 323"),
    ]
    branch_ids = []
    for name, addr, phone in branches:
        bid = uid(f"branch-{USER_SEED}-{name}")
        cur.execute("""
            INSERT INTO branches (id, owner_id, name, address, phone, is_active, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, TRUE, NOW(), NOW())
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address,
                phone = EXCLUDED.phone, updated_at = NOW();
        """, (bid, user_id, name, addr, phone))
        branch_ids.append(bid)
    return branch_ids


def create_waiters(cur, user_id: str, branch_ids: list[str]) -> list[dict]:
    first_names = ["Carlos", "María", "José", "Ana", "Luis", "Carmen", "Pedro", "Rosa",
                   "Miguel", "Lucía", "Jorge", "Patricia", "Fernando", "Sofía", "Diego"]
    last_names = ["Quispe", "Huamán", "Ccente", "Mamani", "Condori", "Aparicio", "Ramos",
                  "Flores", "García", "Vargas", "Castillo", "Ríos", "Salazar", "Mendoza", "Paredes"]
    waiters = []
    for i in range(15):
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        wid = uid(f"waiter-{USER_SEED}-{i}")
        pin = f"{random.randint(1000, 9999)}"
        qr_token = uid(f"qr-waiter-{USER_SEED}-{i}")
        branch_id = branch_ids[i % len(branch_ids)]
        phone = f"+51 9{random.randint(50,99)} {random.randint(100,999)} {random.randint(100,999)}"
        pwd_hash = bcrypt.hashpw(f"mozo{pin}".encode(), bcrypt.gensalt(10)).decode()
        cur.execute("""
            INSERT INTO waiters (
                id, owner_id, branch_id, full_name, phone, pin, qr_token, is_active,
                created_at, updated_at, password
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE, NOW(), NOW(), %s)
            ON CONFLICT (id) DO UPDATE SET
                branch_id = EXCLUDED.branch_id, full_name = EXCLUDED.full_name,
                phone = EXCLUDED.phone, pin = EXCLUDED.pin, qr_token = EXCLUDED.qr_token,
                is_active = TRUE, updated_at = NOW();
        """, (wid, user_id, branch_id, name, phone, pin, qr_token, pwd_hash))
        waiters.append({"id": wid, "name": name, "branch_id": branch_id})
    return waiters


def create_tables(cur, user_id: str, branch_ids: list[str]) -> list[dict]:
    tables = []
    for i in range(30):
        tid = uid(f"table-{USER_SEED}-{i}")
        number = i + 1
        capacity = random.choice([2, 4, 4, 6, 6, 8])
        status = random.choice(["libre", "libre", "libre", "ocupada", "reservada"])
        qr_token = uid(f"qr-table-{USER_SEED}-{i}")
        branch_id = branch_ids[i % len(branch_ids)]
        location = random.choice(["Salón Principal", "Terraza", "Segundo Piso", "Barra"])
        cur.execute("""
            INSERT INTO tables (
                id, owner_id, branch_id, number, name, capacity, status, qr_token,
                location, is_active, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s::table_status, %s, %s, TRUE, NOW(), NOW())
            ON CONFLICT (id) DO UPDATE SET
                branch_id = EXCLUDED.branch_id, number = EXCLUDED.number, name = EXCLUDED.name,
                capacity = EXCLUDED.capacity, status = EXCLUDED.status, qr_token = EXCLUDED.qr_token,
                location = EXCLUDED.location, updated_at = NOW();
        """, (tid, user_id, branch_id, number, f"Mesa {number}", capacity, status, qr_token, location))
        tables.append({"id": tid, "number": number, "branch_id": branch_id})
    return tables


def create_inventory(cur, user_id: str, branch_ids: list[str]) -> list[dict]:
    items_data = [
        ("Pollo entero", "kg", 200, 20, 80, 12.50, "Don Pollo SAC", "Carnes"),
        ("Pollo pechuga", "kg", 100, 10, 40, 18.00, "Don Pollo SAC", "Carnes"),
        ("Carne de res", "kg", 80, 10, 30, 35.00, "Frigorífico Lima", "Carnes"),
        ("Camarones", "kg", 30, 5, 15, 85.00, "Mariscos del Pacífico", "Carnes"),
        ("Calamar", "kg", 40, 5, 20, 45.00, "Mariscos del Pacífico", "Carnes"),
        ("Pescado fresco", "kg", 80, 15, 40, 38.00, "Mariscos del Pacífico", "Carnes"),
        ("Cerdo", "kg", 60, 8, 25, 22.00, "Frigorífico Lima", "Carnes"),
        ("Bacon", "paquete", 60, 10, 30, 28.00, "Importaciones Food", "Carnes"),
        ("Wagyu", "kg", 15, 3, 8, 280.00, "Importaciones Food", "Carnes"),
        ("Jamón crudo", "kg", 10, 2, 5, 180.00, "Importaciones Food", "Carnes"),
        ("Papa blanca", "caja", 30, 5, 12, 3.50, "Mercado Mayorista", "Vegetales"),
        ("Papa amarilla", "caja", 20, 3, 8, 4.50, "Mercado Mayorista", "Vegetales"),
        ("Cebolla roja", "caja", 25, 4, 10, 2.80, "Mercado Mayorista", "Vegetales"),
        ("Tomate", "caja", 30, 5, 15, 4.00, "Mercado Mayorista", "Vegetales"),
        ("Lechuga", "docena", 40, 8, 20, 8.00, "Mercado Mayorista", "Vegetales"),
        ("Cilantro", "paquete", 60, 10, 30, 1.50, "Mercado Mayorista", "Vegetales"),
        ("Ají limo", "kg", 15, 3, 8, 12.00, "Mercado Mayorista", "Vegetales"),
        ("Ají amarillo", "kg", 20, 4, 10, 10.00, "Mercado Mayorista", "Vegetales"),
        ("Ajo", "kg", 12, 2, 6, 8.00, "Mercado Mayorista", "Vegetales"),
        ("Camote", "caja", 20, 3, 8, 4.00, "Mercado Mayorista", "Vegetales"),
        ("Yuca", "caja", 15, 2, 6, 3.50, "Mercado Mayorista", "Vegetales"),
        ("Rúcula", "paquete", 30, 5, 15, 4.50, "Verduras Orgánicas", "Vegetales"),
        ("Leche entera 1L", "unidad", 150, 20, 60, 4.50, "Gloria SAC", "Lácteos"),
        ("Queso mozzarella", "kg", 50, 8, 25, 32.00, "Laive", "Lácteos"),
        ("Queso parmesano", "kg", 15, 3, 8, 85.00, "Laive", "Lácteos"),
        ("Queso azul", "kg", 10, 2, 5, 120.00, "Importaciones Food", "Lácteos"),
        ("Queso gruyere", "kg", 12, 2, 6, 95.00, "Importaciones Food", "Lácteos"),
        ("Mantequilla", "kg", 30, 5, 15, 28.00, "Laive", "Lácteos"),
        ("Crema de leche", "litro", 40, 8, 20, 12.00, "Gloria SAC", "Lácteos"),
        ("Huevos", "docena", 100, 20, 50, 12.00, "Avícola San Fernando", "Lácteos"),
        ("Helado vainilla", "litro", 20, 3, 10, 22.00, "D'Onofrio", "Lácteos"),
        ("Coca Cola 500ml", "caja", 100, 10, 40, 22.00, "Coca Cola Perú", "Bebidas"),
        ("Inca Kola 500ml", "caja", 100, 10, 40, 22.00, "AJE Group", "Bebidas"),
        ("Cerveza Cristal 620ml", "caja", 80, 10, 30, 48.00, "Backus", "Bebidas"),
        ("Cerveza Cusqueña 620ml", "caja", 60, 8, 25, 52.00, "Backus", "Bebidas"),
        ("Vino tinto Chianti", "unidad", 30, 4, 12, 45.00, "Importaciones Food", "Bebidas"),
        ("Vino blanco Pinot Grigio", "unidad", 20, 3, 8, 42.00, "Importaciones Food", "Bebidas"),
        ("Chicha morada 1L", "litro", 50, 8, 25, 8.00, "Preparación propia", "Bebidas"),
        ("Maracuyá 1L", "litro", 40, 5, 20, 10.00, "Preparación propia", "Bebidas"),
        ("Harina de trigo", "caja", 50, 5, 20, 4.50, "Blanca Flor", "Harinas y Granos"),
        ("Arroz", "caja", 40, 5, 15, 4.00, "Costeño", "Harinas y Granos"),
        ("Fideos chinos", "paquete", 50, 8, 25, 6.50, "Don Vittorio", "Harinas y Granos"),
        ("Pasta spaghetti", "paquete", 60, 10, 30, 5.50, "Don Vittorio", "Harinas y Granos"),
        ("Pan brioche", "paquete", 80, 15, 40, 12.00, "Panadería La Especial", "Harinas y Granos"),
        ("Maíz morado", "kg", 20, 3, 8, 6.50, "Mercado Mayorista", "Harinas y Granos"),
        ("Aceite vegetal 5L", "litro", 20, 3, 8, 65.00, "Cooks SAC", "Aceites y Salsas"),
        ("Aceite de oliva", "litro", 15, 2, 6, 45.00, "Importaciones Food", "Aceites y Salsas"),
        ("Sillao (salsa soya)", "litro", 25, 3, 10, 18.00, "Ajiperú", "Aceites y Salsas"),
        ("Salsa de tomate", "kg", 30, 4, 12, 8.50, "Nestlé", "Aceites y Salsas"),
        ("Mayonesa", "kg", 20, 3, 8, 14.00, "Hellmann's", "Aceites y Salsas"),
    ]
    inventory = []
    for i, (name, unit, stock_max, stock_min, stock_max_limit, cost, supplier, cat) in enumerate(items_data):
        iid = uid(f"inv-{USER_SEED}-{i}")
        stock = random.uniform(stock_min, stock_max * 0.7)
        branch_id = branch_ids[i % len(branch_ids)]
        sku = f"INV-{i+1:03d}-FULL"
        cur.execute("""
            INSERT INTO inventory_items (
                id, owner_id, branch_id, name, sku, unit, stock_current, stock_min,
                stock_max, cost_per_unit, supplier, category, is_active, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s::inventory_unit, %s, %s, %s, %s, %s, %s, TRUE, NOW(), NOW())
            ON CONFLICT (id) DO UPDATE SET
                branch_id = EXCLUDED.branch_id, name = EXCLUDED.name, sku = EXCLUDED.sku, unit = EXCLUDED.unit,
                stock_current = EXCLUDED.stock_current, stock_min = EXCLUDED.stock_min, stock_max = EXCLUDED.stock_max,
                cost_per_unit = EXCLUDED.cost_per_unit, supplier = EXCLUDED.supplier,
                category = EXCLUDED.category, updated_at = NOW();
        """, (iid, user_id, branch_id, name, sku, unit, stock, stock_min, stock_max_limit,
              cost, supplier, cat))
        inventory.append({"id": iid, "name": name, "branch_id": branch_id, "cost": cost, "unit": unit})
    return inventory


def create_orders(cur, user_id: str, branch_ids: list[str], waiters: list[dict],
                   tables: list[dict], menus_dishes: dict):
    statuses = ["borrador", "enviada", "en_preparacion", "lista", "entregada",
                "entregada", "entregada", "facturada", "facturada", "cancelada"]
    order_types = ["mesa", "mesa", "mesa", "para_llevar", "delivery"]
    customer_names = ["Cliente Mostrador", "Anónimo", "Pedido WhatsApp", None, None, None]
    notes_options = [None, None, None, "Sin cebolla", "Picante aparte", "Para llevar caliente",
                     "Cliente alérgico a maní", "Sin ají", "Extra salsa", "Servir rápido"]
    voucher_count = 0
    for i in range(120):
        order_id = uid(f"order-{USER_SEED}-{i}")
        menu_id = random.choice(list(menus_dishes.keys()))
        dishes = menus_dishes[menu_id]
        branch_id = random.choice(branch_ids)
        # Mesa del mismo branch
        same_branch_tables = [t for t in tables if t["branch_id"] == branch_id]
        table = random.choice(same_branch_tables) if same_branch_tables else random.choice(tables)
        # Mozo del mismo branch
        same_branch_waiters = [w for w in waiters if w["branch_id"] == branch_id]
        waiter = random.choice(same_branch_waiters) if same_branch_waiters else random.choice(waiters)
        
        n_items = random.randint(2, 6)
        chosen_dishes = random.sample(dishes, min(n_items, len(dishes)))
        subtotal = 0
        items_data = []
        for dish in chosen_dishes:
            qty = random.randint(1, 3)
            subtotal += dish["price"] * qty
            item_status = random.choice(["pendiente", "en_preparacion", "listo", "entregado", "entregado"])
            items_data.append({"menu_item_id": dish["id"], "menu_item_name": dish["name"],
                                "menu_item_price": dish["price"], "quantity": qty, "status": item_status})
        tax = round(subtotal * 0.18, 2)
        tip = round(subtotal * random.choice([0, 0, 0, 0.05, 0.10]), 2)
        total = subtotal + tax + tip
        status = random.choice(statuses)
        order_type = random.choice(order_types)
        customer = random.choice(customer_names)
        party_size = random.randint(1, 8) if order_type == "mesa" else None
        order_number = f"#{1000 + i:04d}"
        created_dt = random_dt_in_last(90)
        sent_at = created_dt + timedelta(minutes=random.randint(2, 15)) if status != "borrador" else None
        ready_at = sent_at + timedelta(minutes=random.randint(10, 30)) if status in ("lista", "entregada", "facturada") else None
        delivered_at = ready_at + timedelta(minutes=random.randint(5, 20)) if status in ("entregada", "facturada") else None
        invoiced_at = delivered_at + timedelta(minutes=random.randint(5, 60)) if status == "facturada" else None
        cancelled_at = created_dt + timedelta(minutes=random.randint(5, 60)) if status == "cancelada" else None
        cancel_reason = random.choice(["Cliente canceló", "Error en pedido", "Tiempo excedido", "Producto agotado"]) if status == "cancelada" else None
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
                %s, NULL, %s, %s,
                %s, %s, %s, %s, 'S/',
                %s, %s, %s, %s, %s, %s,
                %s, %s
            )
            ON CONFLICT (id) DO UPDATE SET
                branch_id = EXCLUDED.branch_id, table_id = EXCLUDED.table_id,
                waiter_id = EXCLUDED.waiter_id, status = EXCLUDED.status,
                order_type = EXCLUDED.order_type, customer_name = EXCLUDED.customer_name,
                subtotal = EXCLUDED.subtotal, tax = EXCLUDED.tax, tip = EXCLUDED.tip,
                total = EXCLUDED.total, updated_at = NOW();
        """, (order_id, user_id, branch_id, table["id"], waiter["id"],
              order_number, status, order_type, customer, party_size, notes,
              subtotal, tax, tip, total, sent_at, ready_at, delivered_at, invoiced_at,
              cancelled_at, cancel_reason, created_dt, created_dt))
        
        for idx, item in enumerate(items_data):
            item_id = uid(f"item-{USER_SEED}-{i}-{idx}")
            prepared_at = None
            if item["status"] in ("listo", "entregado"):
                prepared_at = created_dt + timedelta(minutes=random.randint(10, 25))
            cur.execute("""
                INSERT INTO order_items (
                    id, order_id, menu_item_id, menu_item_name, menu_item_price,
                    quantity, notes, status, prepared_at, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, NULL, %s::order_item_status, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    menu_item_name = EXCLUDED.menu_item_name, menu_item_price = EXCLUDED.menu_item_price,
                    quantity = EXCLUDED.quantity, status = EXCLUDED.status;
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
            hist_id = uid(f"hist-{USER_SEED}-{i}-{h_idx}")
            hist_dt = created_dt + timedelta(minutes=h_idx * random.randint(5, 20))
            cur.execute("""
                INSERT INTO order_status_history (id, order_id, from_status, to_status, changed_by, notes, created_at)
                VALUES (%s, %s, %s::order_status, %s::order_status, %s, NULL, %s)
                ON CONFLICT (id) DO NOTHING;
            """, (hist_id, order_id, prev, hs, "sistema", hist_dt))
            prev = hs
        
        # Voucher print si está facturada
        if status == "facturada":
            voucher_id = uid(f"voucher-{USER_SEED}-{i}")
            voucher_number = f"B001-{10000 + i:06d}"
            cur.execute("""
                INSERT INTO voucher_prints (id, owner_id, order_id, voucher_number, printed_by, print_format, printed_at)
                VALUES (%s, %s, %s, %s, %s, 'pos_80mm', %s)
                ON CONFLICT (id) DO UPDATE SET voucher_number = EXCLUDED.voucher_number, printed_at = EXCLUDED.printed_at;
            """, (voucher_id, user_id, order_id, voucher_number, "cajero_01", invoiced_at))
            voucher_count += 1
    return voucher_count


def create_inventory_movements(cur, user_id: str, inventory: list[dict]):
    movement_types = ["entrada", "salida", "salida", "salida", "ajuste", "merma"]
    reasons = {
        "entrada": ["Compra a proveedor", "Ingreso inicial", "Devolución de cocina"],
        "salida": ["Consumo en cocina", "Salida a producción", "Uso en plato"],
        "ajuste": ["Ajuste por inventario físico", "Corrección de stock"],
        "merma": ["Merma por vencimiento", "Merma por deterioro", "Merma por mala calidad"],
    }
    for i in range(80):
        item = random.choice(inventory)
        mtype = random.choice(movement_types)
        qty = round(random.uniform(1, 20), 2)
        unit_cost = item["cost"]
        mid = uid(f"mov-{USER_SEED}-{i}")
        reason = random.choice(reasons[mtype])
        created_dt = random_dt_in_last(90)
        cur.execute("""
            INSERT INTO inventory_movements (
                id, owner_id, branch_id, inventory_item_id, movement_type,
                quantity, unit_cost, reason, created_by, created_at
            ) VALUES (%s, %s, %s, %s, %s::movement_type, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET movement_type = EXCLUDED.movement_type,
                quantity = EXCLUDED.quantity, unit_cost = EXCLUDED.unit_cost, reason = EXCLUDED.reason;
        """, (mid, user_id, item["branch_id"], item["id"], mtype, qty, unit_cost, reason, "sistema", created_dt))


def create_custom_domain(cur, user_id: str, menu_ids: list[str]):
    domain_id = uid(f"domain-{USER_SEED}")
    domain = "demo-full.menudigital.pro"
    verification_token = uid(f"verify-{USER_SEED}")
    cur.execute("""
        INSERT INTO custom_domains (
            id, user_id, menu_id, domain, is_verified, verification_token,
            dns_checked_at, ssl_status, created_at, updated_at
        ) VALUES (%s, %s, %s, %s, TRUE, %s, NOW(), 'active', NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
            menu_id = EXCLUDED.menu_id, domain = EXCLUDED.domain, is_verified = TRUE,
            ssl_status = 'active', updated_at = NOW();
    """, (domain_id, user_id, menu_ids[0] if menu_ids else None, domain, verification_token))


def create_product_recipes(cur, user_id: str, menus_dishes: dict, inventory: list[dict]):
    sample_dishes = []
    for menu_id, dishes in menus_dishes.items():
        for d in dishes[:5]:
            sample_dishes.append(d)
    for i, dish in enumerate(sample_dishes):
        n_ingredients = random.randint(2, 4)
        ingredients = random.sample(inventory, min(n_ingredients, len(inventory)))
        for j, ing in enumerate(ingredients):
            recipe_id = uid(f"recipe-{USER_SEED}-{i}-{j}")
            qty_per_dish = round(random.uniform(0.05, 0.5), 3)
            cur.execute("""
                INSERT INTO product_recipes (
                    id, owner_id, menu_item_id, menu_item_name, inventory_item_id,
                    quantity_per_dish, notes, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, NULL, NOW(), NOW())
                ON CONFLICT (id) DO UPDATE SET
                    menu_item_name = EXCLUDED.menu_item_name,
                    inventory_item_id = EXCLUDED.inventory_item_id,
                    quantity_per_dish = EXCLUDED.quantity_per_dish;
            """, (recipe_id, user_id, dish["id"], dish["name"], ing["id"], qty_per_dish))


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("=" * 70)
    print(f" MENU PRO — SEED demofull@menudigital.pro (plan FULL)")
    print("=" * 70)
    print(f" Password: {DEMO_PASSWORD}")
    print(f" Días histórico: 90")
    print()
    
    start = time.time()
    
    print("🔌 Conectando a Supabase producción...")
    conn = psycopg2.connect(**CONN)
    conn.autocommit = False
    cur = conn.cursor()
    print("✅ Conexión OK")
    
    user_id = uid(USER_SEED)
    pwd_hash = hash_password(DEMO_PASSWORD)
    
    print("\n→ Creando auth user + profile...")
    create_auth_user(cur, user_id, DEMO_EMAIL, DEMO_FULL_NAME, pwd_hash)
    create_profile(cur, user_id, DEMO_EMAIL, DEMO_FULL_NAME, DEMO_PLAN)
    conn.commit()
    print("  ✅ Commit OK")
    
    print("\n→ Creando 3 sucursales...")
    branch_ids = create_branches(cur, user_id)
    conn.commit()
    print(f"  ✅ {len(branch_ids)} sucursales")
    
    # Crear menús + categorías + platos
    menu_ids = []
    menus_dishes = {}
    total_dishes = 0
    for r in RESTAURANTS:
        print(f"\n→ Creando menú: {r['key']}...")
        menu_id = create_menu(cur, user_id, r)
        dishes = create_categories_and_dishes(cur, menu_id, r)
        menu_ids.append(menu_id)
        menus_dishes[menu_id] = dishes
        total_dishes += len(dishes)
        print(f"     → {len(dishes)} platos creados")
        conn.commit()
    
    print(f"\n→ Total: {len(menu_ids)} menús, {total_dishes} platos")
    
    # Analytics (views + WA clicks) - batch
    total_views = 0
    total_wa = 0
    for menu_id in menu_ids:
        n_views = 800 + random.randint(-100, 100)
        n_wa = 140 + random.randint(-30, 30)
        print(f"→ Generando {n_views} views + {n_wa} WA clicks para {menu_id[:8]}...")
        generate_menu_views_batch(cur, menu_id, n_views, 90)
        generate_whatsapp_clicks_batch(cur, menu_id, n_wa, 90)
        total_views += n_views
        total_wa += n_wa
        conn.commit()
    
    print(f"\n→ Creando 15 mozos...")
    waiters = create_waiters(cur, user_id, branch_ids)
    conn.commit()
    print(f"  ✅ {len(waiters)} mozos")
    
    print("→ Creando 30 mesas...")
    tables = create_tables(cur, user_id, branch_ids)
    conn.commit()
    print(f"  ✅ {len(tables)} mesas")
    
    print("→ Creando 50 insumos...")
    inventory = create_inventory(cur, user_id, branch_ids)
    conn.commit()
    print(f"  ✅ {len(inventory)} insumos")
    
    print("→ Creando 120 comandas con items...")
    voucher_count = create_orders(cur, user_id, branch_ids, waiters, tables, menus_dishes)
    conn.commit()
    print(f"  ✅ 120 comandas, ~{voucher_count} vouchers")
    
    print("→ Creando 80 movimientos de inventario...")
    create_inventory_movements(cur, user_id, inventory)
    conn.commit()
    print("  ✅ 80 movimientos")
    
    print("→ Creando recetas plato→insumo...")
    create_product_recipes(cur, user_id, menus_dishes, inventory)
    conn.commit()
    print("  ✅ recetas creadas")
    
    print("→ Creando dominio custom demo-full.menudigital.pro...")
    create_custom_domain(cur, user_id, menu_ids)
    conn.commit()
    print("  ✅ dominio custom")
    
    # Verificar login
    print("\n→ Verificando login...")
    cur.execute("SELECT encrypted_password FROM auth.users WHERE id=%s;", (user_id,))
    h = cur.fetchone()
    ok = bcrypt.checkpw(DEMO_PASSWORD.encode(), h[0].encode())
    print(f"  {'✅' if ok else '❌'} login: {'OK' if ok else 'FAIL'}")
    
    cur.close()
    conn.close()
    
    elapsed = time.time() - start
    
    print(f"\n{'═' * 70}")
    print(f"  RESUMEN FINAL ({elapsed:.1f}s)")
    print(f"{'═' * 70}")
    print(f"  Email:    {DEMO_EMAIL}")
    print(f"  Plan:     FULL (white-label)")
    print(f"  Password: {DEMO_PASSWORD}")
    print(f"  Menús:    {len(menu_ids)}")
    print(f"  Platos:   {total_dishes}")
    print(f"  Views:    {total_views}")
    print(f"  WA clicks:{total_wa}")
    print(f"  Sucursales: 3")
    print(f"  Mozos:    15")
    print(f"  Mesas:    30")
    print(f"  Inventario: 50")
    print(f"  Comandas: 120")
    print(f"  Vouchers: ~{voucher_count}")
    print(f"  Movimientos: 80")
    print(f"  Recetas:  ~{5 * len(menu_ids) * 3}")
    print(f"  Dominio:  demo-full.menudigital.pro")
    print(f"\n🔑 Login: {DEMO_EMAIL} / {DEMO_PASSWORD}")
    print(f"\n🌐 URLs públicas:")
    for r in RESTAURANTS:
        print(f"   https://menudigital.pro/r/{r['key']}-full")
    print("\n✅ DONE")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        import traceback
        print(f"\n❌ ERROR FATAL: {e}")
        traceback.print_exc()
        sys.exit(1)
