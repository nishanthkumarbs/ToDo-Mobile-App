import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://vynchejvskgtxiybttoc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_dMEbzdyLCfUZoTBi-Pg16Q_lYTCMa7U';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

