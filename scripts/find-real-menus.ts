import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

(async () => {
  const sb = createClient(url, key);
  const { data, error } = await sb
    .from('menus')
    .select('id, name, slug, logo_url, description, primary_color')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(15);
  if (error) { console.error('ERR', error); process.exit(1); }
  console.log(JSON.stringify(data, null, 2));
})();
