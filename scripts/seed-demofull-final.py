#!/usr/bin/env python3
"""Final completion: 20 comandas restantes + 80 movimientos + recetas + dominio."""
import sys, uuid, random, time, bcrypt, psycopg2
from datetime import datetime, timedelta, timezone

DEMO_PASSWORD = "DemoMenuPro2025!"
USER_ID = "cdfa64d6-8f31-5b61-80c9-ee27e68fa9f1"
NS = uuid.UUID("00000000-0000-0000-0000-0000cafef00d")
USER_SEED = "demo-full-user-v1"

CONN = dict(
    host='aws-0-sa-east-1.pooler.supabase.com', port=5432, dbname='postgres',
    user='postgres.bkxtploibraiovgrjtwn', password='Wafla0523129500',
    sslmode='require', connect_timeout=30,
)
random.seed(99887766)

def uid(p): return str(uuid.uuid5(NS, p))
def random_dt_in_last(days):
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=days)
    return start + timedelta(seconds=random.randint(0, int((end-start).total_seconds())))

conn = None

def main():
    global conn
    print("=== FINAL COMPLETION demofull ===")
    start = time.time()
    conn = psycopg2.connect(**CONN)
    conn.autocommit = False
    cur = conn.cursor()
    user_id = USER_ID
    
    # Branches, waiters, tables, inventory existentes
    cur.execute("SELECT id FROM branches WHERE owner_id=%s ORDER BY name;", (user_id,))
    branch_ids = [r[0] for r in cur.fetchall()]
    cur.execute("SELECT id, branch_id FROM waiters WHERE owner_id=%s;", (user_id,))
    waiters = [{"id": r[0], "branch_id": r[1]} for r in cur.fetchall()]
    cur.execute("SELECT id, branch_id FROM tables WHERE owner_id=%s;", (user_id,))
    tables = [{"id": r[0], "branch_id": r[1]} for r in cur.fetchall()]
    cur.execute("SELECT id, branch_id, cost_per_unit::float FROM inventory_items WHERE owner_id=%s;", (user_id,))
    inventory = [{"id": r[0], "branch_id": r[1], "cost": r[2]} for r in cur.fetchall()]
    
    # Menus + dishes
    cur.execute("SELECT id, slug FROM menus WHERE user_id=%s ORDER BY slug;", (user_id,))
    menu_rows = cur.fetchall()
    menus_dishes = {}
    for mid, slug in menu_rows:
        cur.execute("""SELECT d.id, d.name, d.price::float FROM dishes d
            JOIN categories c ON c.id = d.category_id WHERE c.menu_id = %s ORDER BY d.name;""", (mid,))
        menus_dishes[mid] = [{"id": r[0], "name": r[1], "price": r[2]} for r in cur.fetchall()]
    menu_ids = [m[0] for m in menu_rows]
    
    # 1. Crear 20 comandas restantes (101-120)
    cur.execute("SELECT COUNT(*) FROM orders WHERE owner_id=%s;", (user_id,))
    existing_orders = cur.fetchone()[0]
    print(f"Existing orders: {existing_orders}")
    
    statuses = ["borrador","enviada","en_preparacion","lista","entregada","entregada","entregada","facturada","facturada","cancelada"]
    otypes = ["mesa","mesa","mesa","para_llevar","delivery"]
    customers = ["Cliente Mostrador","Anónimo","Pedido WhatsApp",None,None,None]
    notes_opt = [None,None,None,"Sin cebolla","Picante aparte","Para llevar caliente","Sin ají","Extra salsa"]
    vouchers = 0
    
    for i in range(existing_orders, 120):
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
        creason = random.choice(["Cliente canceló","Error en pedido","Tiempo excedido"]) if status == "cancelada" else None
        notes = random.choice(notes_opt)
        
        cur.execute("""INSERT INTO orders (id, owner_id, branch_id, table_id, waiter_id, order_number, status, order_type,
            customer_name, customer_phone, party_size, notes, subtotal, tax, tip, total, currency,
            sent_at, ready_at, delivered_at, invoiced_at, cancelled_at, cancel_reason, created_at, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s::order_status,%s::order_type,%s,NULL,%s,%s,%s,%s,%s,%s,'S/',%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (id) DO UPDATE SET status=EXCLUDED.status, total=EXCLUDED.total, updated_at=NOW();""",
            (oid,user_id,bid,table["id"],waiter["id"],onum,status,otype,cust,psize,notes,subtotal,tax,tip,total,
             sent,ready,deliv,invc,canc,creason,cdt,cdt))
        
        for idx, item in enumerate(items):
            iid = uid(f"item-{USER_SEED}-{i}-{idx}")
            prep = None
            if item["status"] in ("listo","entregado"):
                prep = cdt + timedelta(minutes=random.randint(10,25))
            cur.execute("""INSERT INTO order_items (id, order_id, menu_item_id, menu_item_name, menu_item_price, quantity, notes, status, prepared_at, created_at, updated_at)
                VALUES (%s,%s,%s,%s,%s,%s,NULL,%s::order_item_status,%s,%s,%s) ON CONFLICT (id) DO UPDATE SET quantity=EXCLUDED.quantity, status=EXCLUDED.status;""",
                (iid,oid,item["id"],item["name"],item["price"],item["qty"],item["status"],prep,cdt,cdt))
        
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
                VALUES (%s,%s,%s,%s,%s,'pos_80mm',%s) ON CONFLICT (id) DO UPDATE SET voucher_number=EXCLUDED.voucher_number;""",
                (vid,user_id,oid,vnum,"cajero_01",invc))
            vouchers += 1
        
        if (i+1) % 5 == 0:
            conn.commit()
            print(f"  comandas: {i+1}/120 (new vouchers: {vouchers})", flush=True)
    conn.commit()
    print(f"✅ Comandas completas: 120")
    
    # 2. Movimientos (80)
    print("→ Creando 80 movimientos de inventario...")
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
            VALUES (%s,%s,%s,%s,%s::movement_type,%s,%s,%s,%s,%s) ON CONFLICT (id) DO UPDATE SET movement_type=EXCLUDED.movement_type, quantity=EXCLUDED.quantity;""",
            (mid,user_id,item["branch_id"],item["id"],mtype,qty,item["cost"],reason,"sistema",cdt))
        if (i+1) % 20 == 0:
            conn.commit()
            print(f"  movimientos: {i+1}/80", flush=True)
    conn.commit()
    print("✅ 80 movimientos creados")
    
    # 3. Recetas plato→insumo
    print("→ Creando recetas plato→insumo...")
    sample = []
    for mid, dishes in menus_dishes.items():
        for d in dishes[:5]:
            sample.append(d)
    cnt = 0
    for i, dish in enumerate(sample):
        n_ing = random.randint(2,4)
        ings = random.sample(inventory, min(n_ing, len(inventory)))
        for j, ing in enumerate(ings):
            rid = uid(f"recipe-{USER_SEED}-{i}-{j}")
            qty = round(random.uniform(0.05,0.5), 3)
            cur.execute("""INSERT INTO product_recipes (id, owner_id, menu_item_id, menu_item_name, inventory_item_id, quantity_per_dish, notes, created_at, updated_at)
                VALUES (%s,%s,%s,%s,%s,%s,NULL,NOW(),NOW()) ON CONFLICT (id) DO UPDATE SET quantity_per_dish=EXCLUDED.quantity_per_dish;""",
                (rid,user_id,dish["id"],dish["name"],ing["id"],qty))
            cnt += 1
        if (i+1) % 10 == 0:
            conn.commit()
            print(f"  recetas plato: {i+1}/{len(sample)}", flush=True)
    conn.commit()
    print(f"✅ {cnt} recetas creadas")
    
    # 4. Custom domain
    print("→ Creando dominio custom...")
    did = uid(f"domain-{USER_SEED}")
    dom = "demo-full.menudigital.pro"
    vt = uid(f"verify-{USER_SEED}")
    cur.execute("""INSERT INTO custom_domains (id, user_id, menu_id, domain, is_verified, verification_token, dns_checked_at, ssl_status, created_at, updated_at)
        VALUES (%s,%s,%s,%s,TRUE,%s,NOW(),'active',NOW(),NOW()) ON CONFLICT (id) DO UPDATE SET domain=EXCLUDED.domain, is_verified=TRUE, ssl_status='active';""",
        (did,user_id,menu_ids[0] if menu_ids else None,dom,vt))
    conn.commit()
    print("✅ demo-full.menudigital.pro")
    
    # 5. Verificar login
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
        if conn:
            conn.rollback()
        sys.exit(1)
