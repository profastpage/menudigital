#!/usr/bin/env python3
"""
Fix duplicate categories in polleria-el-dorado menu.
Keep the oldest category (lowest created_at), move dishes from duplicates to it, then delete dups.
"""
import psycopg2

DB_HOST = "aws-0-sa-east-1.pooler.supabase.com"
DB_PORT = 5432
DB_NAME = "postgres"
DB_USER = "postgres.bkxtploibraiovgrjtwn"
DB_PASSWORD = "Wafla0523129500"

def main():
    conn = psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
        user=DB_USER, password=DB_PASSWORD,
        connect_timeout=20, options="-c search_path=public,auth,storage"
    )
    conn.autocommit = True
    cur = conn.cursor()

    menu_slug = "polleria-el-dorado"

    # Get menu id
    cur.execute("SELECT id FROM menus WHERE slug=%s", (menu_slug,))
    row = cur.fetchone()
    if not row:
        print(f"Menu {menu_slug} not found")
        return
    menu_id = row[0]
    print(f"Menu: {menu_id}")

    # Find duplicate category names
    cur.execute("""
      SELECT name FROM categories
      WHERE menu_id = %s
      GROUP BY name
      HAVING COUNT(*) > 1
    """, (menu_id,))
    dups = [r[0] for r in cur.fetchall()]
    print(f"Duplicate categories: {dups}")

    for name in dups:
        # Get all categories with this name, ordered by created_at ASC (oldest first = keep)
        cur.execute("""
          SELECT id, created_at FROM categories
          WHERE menu_id = %s AND name = %s
          ORDER BY created_at ASC
        """, (menu_id, name))
        cats = cur.fetchall()
        keep_id = cats[0][0]
        dup_ids = [c[0] for c in cats[1:]]
        print(f"\n  '{name}': keep {keep_id[:8]}, remove {[d[:8] for d in dup_ids]}")

        # Move dishes from dups to keep
        for dup_id in dup_ids:
            cur.execute("""
              UPDATE dishes SET category_id = %s WHERE category_id = %s
            """, (keep_id, dup_id))
            moved = cur.rowcount
            print(f"    Moved {moved} dishes from {dup_id[:8]} to {keep_id[:8]}")

            # Delete the duplicate category
            cur.execute("DELETE FROM categories WHERE id = %s", (dup_id,))
            print(f"    Deleted duplicate category {dup_id[:8]}")

    # Verify
    print("\n=== After dedup ===")
    cur.execute("""
      SELECT name, COUNT(*) FROM categories
      WHERE menu_id = %s GROUP BY name ORDER BY name
    """, (menu_id,))
    for r in cur.fetchall():
        print(f"  {r[0]}: x{r[1]}")

    # Final counts
    cur.execute("""
      SELECT COUNT(DISTINCT c.id), COUNT(DISTINCT d.id)
      FROM categories c
      LEFT JOIN dishes d ON d.category_id = c.id
      WHERE c.menu_id = %s
    """, (menu_id,))
    counts = cur.fetchone()
    print(f"\nFinal: {counts[0]} categories, {counts[1]} dishes")

    cur.close()
    conn.close()
    print("\n✅ DONE")

if __name__ == "__main__":
    main()
