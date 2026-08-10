#!/usr/bin/env python3
"""
Aplica la migración hybrid-flow-migration.sql a la base de datos Supabase de producción.

Crea:
  - waiters.max_tables (cantidad de mesas por mozo, 1-20)
  - waiter_tables (tabla puente mozo↔mesa)
  - notifications (push notifications cocina↔mozo)
  - auto_assign_waiter() function
  - create_order_from_public_menu() function
  - notify_order_status_change() function + trigger

Uso:
  SUPABASE_DB_PASSWORD=xxx python3 scripts/apply-hybrid-flow.py
"""
import os
import sys
import psycopg2
from pathlib import Path

PASSWORD = os.environ.get("SUPABASE_DB_PASSWORD")
if not PASSWORD:
    print("ERROR: SUPABASE_DB_PASSWORD not set", file=sys.stderr)
    print("Export SUPABASE_DB_PASSWORD=... antes de ejecutar", file=sys.stderr)
    sys.exit(1)

HOST = "aws-0-sa-east-1.pooler.supabase.com"
PORT = 5432
DATABASE = "postgres"
USER = "postgres.bkxtploibraiovgrjtwn"

SQL_FILE = Path(__file__).parent.parent / "supabase" / "hybrid-flow-migration.sql"

def log(msg, level="INFO"):
    print(f"[{level}] {msg}", flush=True)

def main():
    if not SQL_FILE.exists():
        log(f"SQL file not found: {SQL_FILE}", "ERROR")
        sys.exit(1)

    log(f"Conectando a {HOST}:{PORT}/{DATABASE} como {USER}...")
    try:
        conn = psycopg2.connect(
            host=HOST, port=PORT, dbname=DATABASE, user=USER, password=PASSWORD
        )
    except Exception as e:
        log(f"Error de conexión: {e}", "ERROR")
        sys.exit(1)

    log(f"✓ Conexión OK")

    sql_content = SQL_FILE.read_text()
    log(f"Ejecutando migración: {SQL_FILE.name} ({len(sql_content)} bytes)")

    cur = conn.cursor()
    try:
        # Capturar notices
        notices = []
        try:
            conn.notices = []
        except Exception:
            pass

        cur.execute(sql_content)
        conn.commit()

        # Recoger notices
        try:
            notices = list(conn.notices)
        except Exception:
            pass

        log("✓ Migración ejecutada correctamente")
        for n in notices:
            log(f"  PG: {n.strip()}")

        # Verificación
        log("\nVerificación:")
        checks = [
            ("waiters.max_tables column",
             "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='waiters' AND column_name='max_tables')"),
            ("waiter_tables table",
             "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='waiter_tables')"),
            ("notifications table",
             "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='notifications')"),
            ("auto_assign_waiter() function",
             "SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname='auto_assign_waiter')"),
            ("create_order_from_public_menu() function",
             "SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname='create_order_from_public_menu')"),
            ("notify_order_status_change() function",
             "SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname='notify_order_status_change')"),
            ("trg_order_status_change trigger",
             "SELECT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='trg_order_status_change')"),
        ]
        for label, q in checks:
            cur.execute(q)
            exists = cur.fetchone()[0]
            log(f"  {'✓' if exists else '✗'} {label}: {exists}")

        log("\n✅ Migración hybrid-flow aplicada correctamente en producción")
    except Exception as e:
        conn.rollback()
        log(f"✗ Error: {e}", "ERROR")
        sys.exit(1)
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    main()
