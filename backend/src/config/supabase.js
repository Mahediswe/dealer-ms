import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.warn(
    '[supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — API will start but DB calls will fail. Copy .env.example to .env and fill in your Supabase project keys.'
  );
}

// Service-role client: used only on the server, bypasses RLS.
// Never expose this key to the frontend.
export const supabase = createClient(url || 'https://placeholder.supabase.co', serviceKey || 'placeholder', {
  auth: { persistSession: false, autoRefreshToken: false },
});

export default supabase;
