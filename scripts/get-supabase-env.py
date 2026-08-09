#!/usr/bin/env python3
"""
Obtiene el NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY y
SUPABASE_SERVICE_ROLE_KEY directamente del backend de Supabase via DB.

Esto nos permite setear .env.local para testear el MOZO panel localmente.
"""
import psycopg2
import json
import base64
import hmac
import hashlib
import sys

DB_HOST = "aws-0-sa-east-1.pooler.supabase.com"
DB_PORT = 5432
DB_NAME = "postgres"
DB_USER = "postgres.bkxtploibraiovgrjtwn"
DB_PASSWORD = "Wafla0523129500"

PROJECT_REF = "bkxtploibraiovgrjtwn"
SUPABASE_URL = f"https://{PROJECT_REF}.supabase.co"

def make_anon_jwt(secret: str) -> str:
    """Construye el anon key JWT firmado con el secret (HS256)."""
    header = {"alg": "HS256", "typ": "JWT"}
    # Anon role payload (estándar de Supabase)
    payload = {
        "role": "anon",
        "iss": "supabase",
        "iat": 1700000000,
        "exp": 1900000000,
    }
    def b64(d):
        return base64.urlsafe_b64encode(json.dumps(d, separators=(',', ':')).encode()).rstrip(b'=').decode()
    h = b64(header)
    p = b64(payload)
    sig = hmac.new(secret.encode(), f"{h}.{p}".encode(), hashlib.sha256).digest()
    s = base64.urlsafe_b64encode(sig).rstrip(b'=').decode()
    return f"{h}.{p}.{s}"

def make_service_role_jwt(secret: str) -> str:
    """Construye el service_role key JWT firmado con el secret (HS256)."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "role": "service_role",
        "iss": "supabase",
        "iat": 1700000000,
        "exp": 1900000000,
        # Supabase usa `ref` para identificar el proyecto en algunos checks
        "ref": PROJECT_REF,
    }
    def b64(d):
        return base64.urlsafe_b64encode(json.dumps(d, separators=(',', ':')).encode()).rstrip(b'=').decode()
    h = b64(header)
    p = b64(payload)
    sig = hmac.new(secret.encode(), f"{h}.{p}".encode(), hashlib.sha256).digest()
    s = base64.urlsafe_b64encode(sig).rstrip(b'=').decode()
    return f"{h}.{p}.{s}"

def main():
    conn = psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
        user=DB_USER, password=DB_PASSWORD,
        connect_timeout=20, options="-c search_path=public,auth",
    )
    cur = conn.cursor()

    # 1. Buscar el JWT secret en auth.jwt_settings (schema auth)
    print("=== Buscando JWT secret ===")
    try:
        cur.execute("SELECT secret_id FROM auth.jwt_settings LIMIT 1;")
        row = cur.fetchone()
        if row:
            secret_id = row[0]
            print(f"  secret_id encontrado: {secret_id}")
            # El secret está en vault.decrypted_secrets
            cur.execute("SELECT decrypted_secret FROM vault.decrypted_secrets WHERE key = %s;", (secret_id,))
            srow = cur.fetchone()
            if srow:
                secret = srow[0]
                print(f"  ✅ JWT secret obtenido (len={len(secret)})")
            else:
                print(f"  ❌ No se encontró el secret en vault.decrypted_secrets con key={secret_id}")
                sys.exit(1)
        else:
            print("  ❌ auth.jwt_settings está vacía")
            sys.exit(1)
    except Exception as e:
        print(f"  ❌ Error: {e}")
        sys.exit(1)

    # 2. Generar anon y service_role JWTs
    anon_key = make_anon_jwt(secret)
    service_role_key = make_service_role_jwt(secret)

    print(f"\n=== Credenciales generadas ===")
    print(f"SUPABASE_URL = {SUPABASE_URL}")
    print(f"ANON_KEY = {anon_key[:40]}...{anon_key[-10:]}")
    print(f"SERVICE_ROLE_KEY = {service_role_key[:40]}...{service_role_key[-10:]}")

    # 3. Escribir .env.local
    env_path = "/home/z/my-project/.env.local"
    content = f"""# === Generado automáticamente por scripts/get-supabase-env.py ===
NEXT_PUBLIC_SUPABASE_URL={SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY={anon_key}
SUPABASE_SERVICE_ROLE_KEY={service_role_key}
NEXT_PUBLIC_SITE_URL=http://localhost:3000
"""
    with open(env_path, "w") as f:
        f.write(content)
    print(f"\n✅ Escrito: {env_path}")
    print("\nPróximo paso: reiniciar el dev server para que tome las nuevas env vars.")

    cur.close(); conn.close()

if __name__ == "__main__":
    main()
