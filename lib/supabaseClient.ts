import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://epkbpaecdzvstbinnmkk.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_kty3kQwr2Xqte625hqwMkg_zlh0MGBc';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  DEFAULT_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
