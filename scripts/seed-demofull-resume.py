#!/usr/bin/env python3
"""Resume demofull seed: solo analytics faltantes + extras."""
import os, sys, uuid, random, time, bcrypt, psycopg2
from psycopg2.extras import execute_values
from datetime import datetime, timedelta, timezone

DEMO_EMAIL = "demofull@menudigital.pro"
DEMO_PASSWORD = "DemoMenuPro2025!"
USER_ID = "cdfa64d6-8f31-5b61-80c9-ee27e68fa9f1"
NS = uuid.UUID("00000000-0000-0000-0000-0000cafef00d")
USER_SEED = "demo-full-user-v1"

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

def uid(p): return str(uuid.uuid5(NS, p))
def unsplash(pid, w=800, h=600): return f"https://images.unsplash.com/photo-{pid}?w={w}&h={h}&fit=crop&crop=entropy&q=80&fm=webp"
def random_dt_in_last(days):
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=days)
    return start + timedelta(seconds=random.randint(0, int((end-start).total_seconds())))

# Para que el resumen final sea consistente
import importlib.util
spec = importlib.util.spec_from_file_location("full", "/home/z/my-project/scripts/seed-demofull-account.py")
full = importlib.util.module_from_spec(spec)
# No ejecutamos main, solo importamos funciones
import sys as _sys
_sys.modules['full'] = full
# Para evitar el main(), parchamos
import builtins
_orig_main = None

# Cargamos el archivo como texto y extraemos solo las funciones que necesitamos
# En lugar de importar (que ejecutaría main), copiamos las funciones relevantes

def generate_menu_views_batch(cur, menu_id, total_views, days):
    sources = ['direct', 'qr', 'social', 'google', 'instagram', 'facebook', 'tiktok']
    uas = ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)", "Mozilla/5.0 (Linux; Android 13)", "Mozilla/5.0 (Windows NT 10.0)"]
    BATCH = 100
    inserted = 0
    while inserted < total_views:
        n = min(BATCH, total_views - inserted)
        rows = []
        for _ in range(n):
            dt = random_dt_in_last(days)
            src = random.choices(sources, weights=[50, 20, 15, 8, 5, 1, 1])[0]
            ip = f"200.106.{random.randint(0,255)}.{random.randint(1,254)}"
            ua = random.choice(uas)
            rows.append((menu_id, ip, ua, dt, src))
        execute_values(cur, "INSERT INTO menu_views (menu_id, ip, user_agent, created_at, source) VALUES %s ON CONFLICT DO NOTHING;", rows, page_size=50)
        inserted += n
    cur.execute("UPDATE menus SET views_count = %s WHERE id = %s;", (total_views, menu_id))

def generate_whatsapp_clicks_batch(cur, menu_id, total_clicks, days):
    uas = ["Mozilla/5.0 (iPhone)", "Mozilla/5.0 (Linux; Android 13)", "Mozilla/5.0 (Linux; Android 12)"]
    BATCH = 100
    inserted = 0
    while inserted < total_clicks:
        n = min(BATCH, total_clicks - inserted)
        rows = []
        for _ in range(n):
            dt = random_dt_in_last(days)
            src = random.choices(['cart', 'social', 'direct'], weights=[65, 25, 10])[0]
            ip = f"200.106.{random.randint(0,255)}.{random.randint(1,254)}"
            ua = random.choice(uas)
            rows.append((menu_id, ip, ua, src, dt))
        execute_values(cur, "INSERT INTO whatsapp_clicks (menu_id, ip, user_agent, source, created_at) VALUES %s ON CONFLICT DO NOTHING;", rows, page_size=50)
        inserted += n

def create_waiters(cur, user_id, branch_ids):
    first = ["Carlos","María","José","Ana","Luis","Carmen","Pedro","Rosa","Miguel","Lucía","Jorge","Patricia","Fernando","Sofía","Diego"]
    last = ["Quispe","Huamán","Ccente","Mamani","Condori","Aparicio","Ramos","Flores","García","Vargas","Castillo","Ríos","Salazar","Mendoza","Paredes"]
    out = []
    for i in range(15):
        name = f"{random.choice(first)} {random.choice(last)}"
        wid = uid(f"waiter-{USER_SEED}-{i}")
        pin = f"{random.randint(1000,9999)}"
        qr = uid(f"qr-waiter-{USER_SEED}-{i}")
        bid = branch_ids[i % len(branch_ids)]
        phone = f"+51 9{random.randint(50,99)} {random.randint(100,999)} {random.randint(100,999)}"
        pwd = bcrypt.hashpw(f"mozo{pin}".encode(), bcrypt.gensalt(10)).decode()
        cur.execute("""INSERT INTO waiters (id, owner_id, branch_id, full_name, phone, pin, qr_token, is_active, created_at, updated_at, password)
            VALUES (%s,%s,%s,%s,%s,%s,%s,TRUE,NOW(),NOW(),%s) ON CONFLICT (id) DO UPDATE SET
            branch_id=EXCLUDED.branch_id, full_name=EXCLUDED.full_name, phone=EXCLUDED.phone, pin=EXCLUDED.pin,
            qr_token=EXCLUDED.qr_token, is_active=TRUE, updated_at=NOW();""", (wid,user_id,bid,name,phone,pin,qr,pwd))
        out.append({"id": wid, "name": name, "branch_id": bid})
    return out

def create_tables(cur, user_id, branch_ids):
    out = []
    for i in range(30):
        tid = uid(f"table-{USER_SEED}-{i}")
        n = i + 1
        cap = random.choice([2,4,4,6,6,8])
        st = random.choice(["libre","libre","libre","ocupada","reservada"])
        qr = uid(f"qr-table-{USER_SEED}-{i}")
        bid = branch_ids[i % len(branch_ids)]
        loc = random.choice(["Salón Principal","Terraza","Segundo Piso","Barra"])
        cur.execute("""INSERT INTO tables (id, owner_id, branch_id, number, name, capacity, status, qr_token, location, is_active, created_at, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s::table_status,%s,%s,TRUE,NOW(),NOW()) ON CONFLICT (id) DO UPDATE SET
            branch_id=EXCLUDED.branch_id, number=EXCLUDED.number, name=EXCLUDED.name, capacity=EXCLUDED.capacity,
            status=EXCLUDED.status, qr_token=EXCLUDED.qr_token, location=EXCLUDED.location, updated_at=NOW();""",
            (tid,user_id,bid,n,f"Mesa {n}",cap,st,qr,loc))
        out.append({"id": tid, "number": n, "branch_id": bid})
    return out

def create_inventory(cur, user_id, branch_ids):
    items = [
        ("Pollo entero","kg",200,20,80,12.50,"Don Pollo SAC","Carnes"),
        ("Pollo pechuga","kg",100,10,40,18.00,"Don Pollo SAC","Carnes"),
        ("Carne de res","kg",80,10,30,35.00,"Frigorífico Lima","Carnes"),
        ("Camarones","kg",30,5,15,85.00,"Mariscos del Pacífico","Carnes"),
        ("Calamar","kg",40,5,20,45.00,"Mariscos del Pacífico","Carnes"),
        ("Pescado fresco","kg",80,15,40,38.00,"Mariscos del Pacífico","Carnes"),
        ("Cerdo","kg",60,8,25,22.00,"Frigorífico Lima","Carnes"),
        ("Bacon","paquete",60,10,30,28.00,"Importaciones Food","Carnes"),
        ("Wagyu","kg",15,3,8,280.00,"Importaciones Food","Carnes"),
        ("Jamón crudo","kg",10,2,5,180.00,"Importaciones Food","Carnes"),
        ("Papa blanca","caja",30,5,12,3.50,"Mercado Mayorista","Vegetales"),
        ("Papa amarilla","caja",20,3,8,4.50,"Mercado Mayorista","Vegetales"),
        ("Cebolla roja","caja",25,4,10,2.80,"Mercado Mayorista","Vegetales"),
        ("Tomate","caja",30,5,15,4.00,"Mercado Mayorista","Vegetales"),
        ("Lechuga","docena",40,8,20,8.00,"Mercado Mayorista","Vegetales"),
        ("Cilantro","paquete",60,10,30,1.50,"Mercado Mayorista","Vegetales"),
        ("Ají limo","kg",15,3,8,12.00,"Mercado Mayorista","Vegetales"),
        ("Ají amarillo","kg",20,4,10,10.00,"Mercado Mayorista","Vegetales"),
        ("Ajo","kg",12,2,6,8.00,"Mercado Mayorista","Vegetales"),
        ("Camote","caja",20,3,8,4.00,"Mercado Mayorista","Vegetales"),
        ("Yuca","caja",15,2,6,3.50,"Mercado Mayorista","Vegetales"),
        ("Rúcula","paquete",30,5,15,4.50,"Verduras Orgánicas","Vegetales"),
        ("Leche entera 1L","unidad",150,20,60,4.50,"Gloria SAC","Lácteos"),
        ("Queso mozzarella","kg",50,8,25,32.00,"Laive","Lácteos"),
        ("Queso parmesano","kg",15,3,8,85.00,"Laive","Lácteos"),
        ("Queso azul","kg",10,2,5,120.00,"Importaciones Food","Lácteos"),
        ("Queso gruyere","kg",12,2,6,95.00,"Importaciones Food","Lácteos"),
        ("Mantequilla","kg",30,5,15,28.00,"Laive","Lácteos"),
        ("Crema de leche","litro",40,8,20,12.00,"Gloria SAC","Lácteos"),
        ("Huevos","docena",100,20,50,12.00,"Avícola San Fernando","Lácteos"),
        ("Helado vainilla","litro",20,3,10,22.00,"D'Onofrio","Lácteos"),
        ("Coca Cola 500ml","caja",100,10,40,22.00,"Coca Cola Perú","Bebidas"),
        ("Inca Kola 500ml","caja",100,10,40,22.00,"AJE Group","Bebidas"),
        ("Cerveza Cristal 620ml","caja",80,10,30,48.00,"Backus","Bebidas"),
        ("Cerveza Cusqueña 620ml","caja",60,8,25,52.00,"Backus","Bebidas"),
        ("Vino tinto Chianti","unidad",30,4,12,45.00,"Importaciones Food","Bebidas"),
        ("Vino blanco Pinot Grigio","unidad",20,3,8,42.00,"Importaciones Food","Bebidas"),
        ("Chicha morada 1L","litro",50,8,25,8.00,"Preparación propia","Bebidas"),
        ("Maracuyá 1L","litro",40,5,20,10.00,"Preparación propia","Bebidas"),
        ("Harina de trigo","caja",50,5,20,4.50,"Blanca Flor","Harinas y Granos"),
        ("Arroz","caja",40,5,15,4.00,"Costeño","Harinas y Granos"),
        ("Fideos chinos","paquete",50,8,25,6.50,"Don Vittorio","Harinas y Granos"),
        ("Pasta spaghetti","paquete",60,10,30,5.50,"Don Vittorio","Harinas y Granos"),
        ("Pan brioche","paquete",80,15,40,12.00,"Panadería La Especial","Harinas y Granos"),
        ("Maíz morado","kg",20,3,8,6.50,"Mercado Mayorista","Harinas y Granos"),
        ("Aceite vegetal 5L","litro",20,3,8,65.00,"Cooks SAC","Aceites y Salsas"),
        ("Aceite de oliva","litro",15,2,6,45.00,"Importaciones Food","Aceites y Salsas"),
        ("Sillao (salsa soya)","litro",25,3,10,18.00,"Ajiperú","Aceites y Salsas"),
        ("Salsa de tomate","kg",30,4,12,8.50,"Nestlé","Aceites y Salsas"),
        ("Mayonesa","kg",20,3,8,14.00,"Hellmann's","Aceites y Salsas"),
    ]
    out = []
    for i, (name, unit, smax, smin, smax_limit, cost, sup, cat) in enumerate(items):
        iid = uid(f"inv-{USER_SEED}-{i}")
        stock = random.uniform(smin, smax * 0.7)
        bid = branch_ids[i % len(branch_ids)]
        sku = f"INV-{i+1:03d}-FULL"
        cur.execute("""INSERT INTO inventory_items (id, owner_id, branch_id, name, sku, unit, stock_current, stock_min, stock_max, cost_per_unit, supplier, category, is_active, created_at, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s::inventory_unit,%s,%s,%s,%s,%s,%s,TRUE,NOW(),NOW()) ON CONFLICT (id) DO UPDATE SET
            branch_id=EXCLUDED.branch_id, name=EXCLUDED.name, sku=EXCLUDED.sku, unit=EXCLUDED.unit,
            stock_current=EXCLUDED.stock_current, stock_min=EXCLUDED.stock_min, stock_max=EXCLUDED.stock_max,
            cost_per_unit=EXCLUDED.cost_per_unit, supplier=EXCLUDED.supplier, category=EXCLUDED.category, updated_at=NOW();""",
            (iid,user_id,bid,name,sku,unit,stock,smin,smax_limit,cost,sup,cat))
        out.append({"id": iid, "name": name, "branch_id": bid, "cost": cost, "unit": unit})
    return out

def create_orders(cur, user_id, branch_ids, waiters, tables, menus_dishes):
    statuses = ["borrador","enviada","en_preparacion","lista","entregada","entregada","entregada","facturada","facturada","cancelada"]
    otypes = ["mesa","mesa","mesa","para_llevar","delivery"]
    customers = ["Cliente Mostrador","Anónimo","Pedido WhatsApp",None,None,None]
    notes_opt = [None,None,None,"Sin cebolla","Picante aparte","Para llevar caliente","Cliente alérgico a maní","Sin ají","Extra salsa","Servir rápido"]
    vouchers = 0
    for i in range(120):
        oid = uid(f"order-{USER_SEED}-{i}")
        mid = random.choice(list(menus_dishes.keys()))
        dishes = menus_dishes[mid]
        bid = random.choice(branch_ids)
        sb_t = [t for t in tables if t["branch_id"] == bid]
        table = random.choice(sb_t) if sb_t else random.choice(tables)
        sb_w = [w for w in waiters if w["branch_id"] == bid]
        waiter = random.choice(sb_w) if sb_w else random.choice(waiters)
        n_items = random.randint(2,6)
        chosen = random.sample(dishes, min(n_items, len(dishes)))
        subtotal = 0
        items = []
        for d in chosen:
            qty = random.randint(1,3)
            subtotal += d["price"] * qty
            items.append({"id": d["id"], "name": d["name"], "price": d["price"], "qty": qty,
                          "status": random.choice(["pendiente","en_preparacion","listo","entregado","entregado"])})
        tax = round(subtotal * 0.18, 2)
        tip = round(subtotal * random.choice([0,0,0,0.05,0.10]), 2)
        total = subtotal + tax + tip
        status = random.choice(statuses)
        otype = random.choice(otypes)
        cust = random.choice(customers)
        psize = random.randint(1,8) if otype == "mesa" else None
        onum = f"#{1000+i:04d}"
        cdt = random_dt_in_last(90)
        sent = cdt + timedelta(minutes=random.randint(2,15)) if status != "borrador" else None
        ready = sent + timedelta(minutes=random.randint(10,30)) if status in ("lista","entregada","facturada") else None
        deliv = ready + timedelta(minutes=random.randint(5,20)) if status in ("entregada","facturada") else None
        invc = deliv + timedelta(minutes=random.randint(5,60)) if status == "facturada" else None
        canc = cdt + timedelta(minutes=random.randint(5,60)) if status == "cancelada" else None
        creason = random.choice(["Cliente canceló","Error en pedido","Tiempo excedido","Producto agotado"]) if status == "cancelada" else None
        notes = random.choice(notes_opt)
        cur.execute("""INSERT INTO orders (id, owner_id, branch_id, table_id, waiter_id, order_number, status, order_type,
            customer_name, customer_phone, party_size, notes, subtotal, tax, tip, total, currency,
            sent_at, ready_at, delivered_at, invoiced_at, cancelled_at, cancel_reason, created_at, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s::order_status,%s::order_type,%s,NULL,%s,%s,%s,%s,%s,%s,'S/',%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (id) DO UPDATE SET branch_id=EXCLUDED.branch_id, table_id=EXCLUDED.table_id, waiter_id=EXCLUDED.waiter_id,
            status=EXCLUDED.status, order_type=EXCLUDED.order_type, customer_name=EXCLUDED.customer_name,
            subtotal=EXCLUDED.subtotal, tax=EXCLUDED.tax, tip=EXCLUDED.tip, total=EXCLUDED.total, updated_at=NOW();""",
            (oid,user_id,bid,table["id"],waiter["id"],onum,status,otype,cust,psize,notes,subtotal,tax,tip,total,
             sent,ready,deliv,invc,canc,creason,cdt,cdt))
        for idx, item in enumerate(items):
            iid = uid(f"item-{USER_SEED}-{i}-{idx}")
            prep = None
            if item["status"] in ("listo","entregado"):
                prep = cdt + timedelta(minutes=random.randint(10,25))
            cur.execute("""INSERT INTO order_items (id, order_id, menu_item_id, menu_item_name, menu_item_price, quantity, notes, status, prepared_at, created_at, updated_at)
                VALUES (%s,%s,%s,%s,%s,%s,NULL,%s::order_item_status,%s,%s,%s) ON CONFLICT (id) DO UPDATE SET
                menu_item_name=EXCLUDED.menu_item_name, menu_item_price=EXCLUDED.menu_item_price, quantity=EXCLUDED.quantity, status=EXCLUDED.status;""",
                (iid,oid,item["id"],item["name"],item["price"],item["qty"],item["status"],prep,cdt,cdt))
        # Status history
        hist = ["enviada"]
        if status in ("en_preparacion","lista","entregada","facturada"): hist.append("en_preparacion")
        if status in ("lista","entregada","facturada"): hist.append("lista")
        if status in ("entregada","facturada"): hist.append("entregada")
        if status == "facturada": hist.append("facturada")
        if status == "cancelada": hist = ["cancelada"]
        prev = None
        for h_idx, hs in enumerate(hist):
            hid = uid(f"hist-{USER_SEED}-{i}-{h_idx}")
            hdt = cdt + timedelta(minutes=h_idx * random.randint(5,20))
            cur.execute("""INSERT INTO order_status_history (id, order_id, from_status, to_status, changed_by, notes, created_at)
                VALUES (%s,%s,%s::order_status,%s::order_status,%s,NULL,%s) ON CONFLICT (id) DO NOTHING;""",
                (hid,oid,prev,hs,"sistema",hdt))
            prev = hs
        if status == "facturada":
            vid = uid(f"voucher-{USER_SEED}-{i}")
            vnum = f"B001-{10000+i:06d}"
            cur.execute("""INSERT INTO voucher_prints (id, owner_id, order_id, voucher_number, printed_by, print_format, printed_at)
                VALUES (%s,%s,%s,%s,%s,'pos_80mm',%s) ON CONFLICT (id) DO UPDATE SET voucher_number=EXCLUDED.voucher_number, printed_at=EXCLUDED.printed_at;""",
                (vid,user_id,oid,vnum,"cajero_01",invc))
            vouchers += 1
    return vouchers

def create_inventory_movements(cur, user_id, inventory):
    mtypes = ["entrada","salida","salida","salida","ajuste","merma"]
    reasons = {"entrada":["Compra a proveedor","Ingreso inicial","Devolución de cocina"],
               "salida":["Consumo en cocina","Salida a producción","Uso en plato"],
               "ajuste":["Ajuste por inventario físico","Corrección de stock"],
               "merma":["Merma por vencimiento","Merma por deterioro","Merma por mala calidad"]}
    for i in range(80):
        item = random.choice(inventory)
        mtype = random.choice(mtypes)
        qty = round(random.uniform(1,20), 2)
        mid = uid(f"mov-{USER_SEED}-{i}")
        reason = random.choice(reasons[mtype])
        cdt = random_dt_in_last(90)
        cur.execute("""INSERT INTO inventory_movements (id, owner_id, branch_id, inventory_item_id, movement_type, quantity, unit_cost, reason, created_by, created_at)
            VALUES (%s,%s,%s,%s,%s::movement_type,%s,%s,%s,%s,%s) ON CONFLICT (id) DO UPDATE SET
            movement_type=EXCLUDED.movement_type, quantity=EXCLUDED.quantity, unit_cost=EXCLUDED.unit_cost, reason=EXCLUDED.reason;""",
            (mid,user_id,item["branch_id"],item["id"],mtype,qty,item["cost"],reason,"sistema",cdt))

def create_custom_domain(cur, user_id, menu_ids):
    did = uid(f"domain-{USER_SEED}")
    dom = "demo-full.menudigital.pro"
    vt = uid(f"verify-{USER_SEED}")
    cur.execute("""INSERT INTO custom_domains (id, user_id, menu_id, domain, is_verified, verification_token, dns_checked_at, ssl_status, created_at, updated_at)
        VALUES (%s,%s,%s,%s,TRUE,%s,NOW(),'active',NOW(),NOW()) ON CONFLICT (id) DO UPDATE SET
        menu_id=EXCLUDED.menu_id, domain=EXCLUDED.domain, is_verified=TRUE, ssl_status='active', updated_at=NOW();""",
        (did,user_id,menu_ids[0] if menu_ids else None,dom,vt))

def create_product_recipes(cur, user_id, menus_dishes, inventory):
    sample = []
    for mid, dishes in menus_dishes.items():
        for d in dishes[:5]:
            sample.append(d)
    for i, dish in enumerate(sample):
        n_ing = random.randint(2,4)
        ings = random.sample(inventory, min(n_ing, len(inventory)))
        for j, ing in enumerate(ings):
            rid = uid(f"recipe-{USER_SEED}-{i}-{j}")
            qty = round(random.uniform(0.05,0.5), 3)
            cur.execute("""INSERT INTO product_recipes (id, owner_id, menu_item_id, menu_item_name, inventory_item_id, quantity_per_dish, notes, created_at, updated_at)
                VALUES (%s,%s,%s,%s,%s,%s,NULL,NOW(),NOW()) ON CONFLICT (id) DO UPDATE SET
                menu_item_name=EXCLUDED.menu_item_name, inventory_item_id=EXCLUDED.inventory_item_id, quantity_per_dish=EXCLUDED.quantity_per_dish;""",
                (rid,user_id,dish["id"],dish["name"],ing["id"],qty))


def main():
    print("=" * 70)
    print(f" RESUME demofull@menudigital.pro (plan FULL)")
    print("=" * 70)
    start = time.time()
    conn = psycopg2.connect(**CONN)
    conn.autocommit = False
    cur = conn.cursor()
    user_id = USER_ID
    
    # 1. Branches
    cur.execute("SELECT id, name FROM branches WHERE owner_id=%s ORDER BY name;", (user_id,))
    branch_ids = [r[0] for r in cur.fetchall()]
    print(f"✅ {len(branch_ids)} branches ya existen")
    
    # 2. Menus + dishes
    cur.execute("SELECT id, slug FROM menus WHERE user_id=%s ORDER BY slug;", (user_id,))
    menu_rows = cur.fetchall()
    print(f"✅ {len(menu_rows)} menús ya existen")
    menus_dishes = {}
    for mid, slug in menu_rows:
        cur.execute("""SELECT d.id, d.name, d.price::float FROM dishes d
            JOIN categories c ON c.id = d.category_id WHERE c.menu_id = %s ORDER BY d.name;""", (mid,))
        dishes = [{"id": r[0], "name": r[1], "price": r[2]} for r in cur.fetchall()]
        menus_dishes[mid] = dishes
        print(f"   {slug}: {len(dishes)} dishes")
    menu_ids = [m[0] for m in menu_rows]
    
    # 3. Analytics - check which menus have views
    for mid in menu_ids:
        cur.execute("SELECT views_count FROM menus WHERE id=%s", (mid,))
        vc = cur.fetchone()[0]
        if vc > 0:
            print(f"   → menu {mid[:8]} ya tiene {vc} views, skipping")
            continue
        n_views = 800 + random.randint(-100, 100)
        n_wa = 140 + random.randint(-30, 30)
        print(f"→ Generando {n_views} views + {n_wa} WA clicks para {mid[:8]}...")
        generate_menu_views_batch(cur, mid, n_views, 90)
        generate_whatsapp_clicks_batch(cur, mid, n_wa, 90)
        conn.commit()
        print(f"   ✅ Commit OK")
    
    # 4. Waiters
    cur.execute("SELECT COUNT(*) FROM waiters WHERE owner_id=%s", (user_id,))
    if cur.fetchone()[0] == 0:
        print("→ Creando 15 mozos...")
        waiters = create_waiters(cur, user_id, branch_ids)
        conn.commit()
        print(f"  ✅ {len(waiters)} mozos")
    else:
        cur.execute("SELECT id, branch_id FROM waiters WHERE owner_id=%s", (user_id,))
        waiters = [{"id": r[0], "branch_id": r[1]} for r in cur.fetchall()]
        print(f"✅ {len(waiters)} mozos ya existen")
    
    # 5. Tables
    cur.execute("SELECT COUNT(*) FROM tables WHERE owner_id=%s", (user_id,))
    if cur.fetchone()[0] == 0:
        print("→ Creando 30 mesas...")
        tables = create_tables(cur, user_id, branch_ids)
        conn.commit()
        print(f"  ✅ {len(tables)} mesas")
    else:
        cur.execute("SELECT id, branch_id FROM tables WHERE owner_id=%s", (user_id,))
        tables = [{"id": r[0], "branch_id": r[1]} for r in cur.fetchall()]
        print(f"✅ {len(tables)} mesas ya existen")
    
    # 6. Inventory
    cur.execute("SELECT COUNT(*) FROM inventory_items WHERE owner_id=%s", (user_id,))
    if cur.fetchone()[0] == 0:
        print("→ Creando 50 insumos...")
        inventory = create_inventory(cur, user_id, branch_ids)
        conn.commit()
        print(f"  ✅ {len(inventory)} insumos")
    else:
        cur.execute("SELECT id, branch_id, cost_per_unit::float FROM inventory_items WHERE owner_id=%s", (user_id,))
        inventory = [{"id": r[0], "branch_id": r[1], "cost": r[2]} for r in cur.fetchall()]
        print(f"✅ {len(inventory)} insumos ya existen")
    
    # 7. Orders
    cur.execute("SELECT COUNT(*) FROM orders WHERE owner_id=%s", (user_id,))
    if cur.fetchone()[0] == 0:
        print("→ Creando 120 comandas...")
        vouchers = create_orders(cur, user_id, branch_ids, waiters, tables, menus_dishes)
        conn.commit()
        print(f"  ✅ 120 comandas, ~{vouchers} vouchers")
    else:
        print("✅ comandas ya existen")
    
    # 8. Movements
    cur.execute("SELECT COUNT(*) FROM inventory_movements WHERE owner_id=%s", (user_id,))
    if cur.fetchone()[0] == 0:
        print("→ Creando 80 movimientos...")
        create_inventory_movements(cur, user_id, inventory)
        conn.commit()
        print("  ✅ 80 movimientos")
    else:
        print("✅ movimientos ya existen")
    
    # 9. Recipes
    cur.execute("SELECT COUNT(*) FROM product_recipes WHERE owner_id=%s", (user_id,))
    if cur.fetchone()[0] == 0:
        print("→ Creando recetas...")
        create_product_recipes(cur, user_id, menus_dishes, inventory)
        conn.commit()
        print("  ✅ recetas creadas")
    else:
        print("✅ recetas ya existen")
    
    # 10. Custom domain
    cur.execute("SELECT COUNT(*) FROM custom_domains WHERE user_id=%s", (user_id,))
    if cur.fetchone()[0] == 0:
        print("→ Creando dominio custom...")
        create_custom_domain(cur, user_id, menu_ids)
        conn.commit()
        print("  ✅ dominio demo-full.menudigital.pro")
    else:
        print("✅ dominio ya existe")
    
    # Verificación login
    cur.execute("SELECT encrypted_password FROM auth.users WHERE id=%s;", (user_id,))
    h = cur.fetchone()
    ok = bcrypt.checkpw(DEMO_PASSWORD.encode(), h[0].encode())
    print(f"\n  {'✅' if ok else '❌'} login: {'OK' if ok else 'FAIL'}")
    
    cur.close()
    conn.close()
    elapsed = time.time() - start
    print(f"\n✅ DONE en {elapsed:.1f}s")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        import traceback
        print(f"\n❌ ERROR: {e}")
        traceback.print_exc()
        sys.exit(1)
