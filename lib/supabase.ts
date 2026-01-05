import { createClient } from '@supabase/supabase-js';
import { Database } from '../types';

const supabaseUrl = 'https://cyxsdewmlqeypdmfdiho.supabase.co';
const supabaseAnonKey = 'sb_publishable_ekAS5w464DSz_817-zbi9w_9XpC2DrL';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase credentials missing. Check your constants.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
