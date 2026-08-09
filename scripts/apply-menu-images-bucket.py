#!/usr/bin/python3
"""
Aplica supabase/menu-images-bucket.sql a Supabase PRODUCCION.
Crea el bucket "menu-images" + policies de RLS para que:
- Lectura pública (los menús publicados embeben las URLs)
- Escritura solo a usuarios autenticados y solo en su propio prefijo {user_id}/

Esto resuelve el error "Unexpected token '<!DOCTYPE'... is not valid JSON"
que aparecía al subir logo/cover/fotos de platos desde el editor del menú.
"""
import psycopg2
import sys
from pathlib import Path

DB_HOST = "aws-0-sa-east-1.pooler.supabase.com"
DB_PORT = 5432
DB_NAME = "postgres"
DB_USER = "postgres.bkxtploibraiovgrjtwn"
DB_PASSWORD = "Wafla0523129500"


def main():
    base = Path(__file__).resolve().parent.parent
    sql_path = base / "supabase" / "menu-images-bucket.sql"
    if not sql_path.exists():
        print(f"FAIL: no existe {sql_path}")
        sys.exit(1)
    sql = sql_path.read_text(encoding="utf-8")

    print(f"Connecting to {DB_HOST}:{DB_PORT}/{DB_NAME}...")
    try:
        conn = psycopg2.connect(
            host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
            user=DB_USER, password=DB_PASSWORD,
            connect_timeout=20, options="-c search_path=public",
        )
        conn.autocommit = True
        cur = conn.cursor()
    except Exception as e:
        print(f"FAIL: {e}")
        sys.exit(1)

    # 1. Verificar si el bucket existe
    cur.execute("SELECT id, name, public FROM storage.buckets WHERE id = 'menu-images';")
    row = cur.fetchone()
    if row:
        print(f"Bucket ya existe: id={row[0]} name={row[1]} public={row[2]}")
    else:
        print("Bucket NO existe — creando...")
        cur.execute("""
            INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
            VALUES ('menu-images', 'menu-images', true,
                    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
                    5242880)
            ON CONFLICT (id) DO NOTHING;
        """)
        cur.execute("SELECT id, name, public FROM storage.buckets WHERE id = 'menu-images';")
        row = cur.fetchone()
        print(f"Bucket creado: id={row[0]} name={row[1]} public={row[2]}")

    # 2. Aplicar policies (idempotente — usa DO $$)
    print("\n=== Aplicando RLS policies (idempotente) ===")
    try:
        cur.execute(sql)
        # Si llegamos aquí sin excepción, todo ok
        print("Policies aplicadas OK")
    except Exception as e:
        # Algunas statements ya pueden haberse ejecutado (DO blocks)
        print(f"Warning durante la ejecucion: {e}")
        # Continuamos

    # 3. Verificar las policies
    cur.execute("""
        SELECT name, cmd FROM storage.policies
        WHERE bucket_id = 'menu-images'
        ORDER BY name;
    """)
    rows = cur.fetchall()
    print(f"\nPolicies en bucket 'menu-images': {len(rows)}")
    for r in rows:
        print(f"  - {r[0]} ({r[1]})")

    # 4. Listar buckets existentes (para referencia)
    cur.execute("SELECT id, name, public FROM storage.buckets ORDER BY name;")
    rows = cur.fetchall()
    print(f"\nTodos los buckets ({len(rows)}):")
    for r in rows:
        print(f"  - {r[0]} | public={r[2]}")

    cur.close()
    conn.close()
    print("\n=== DONE ===")


if __name__ == "__main__":
    main()
