import { createClient } from '@supabase/supabase-js';

// Credentials sudah diisi otomatis - KAMU TIDAK PERLU EDIT
const supabaseUrl = 'https://dzmelmmnqdglpxafleby.supabase.co';
const supabaseAnonKey = 'sb_publishable_nZHk_8JJiNSyocCdZYh2dA_t1jvsaf4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);