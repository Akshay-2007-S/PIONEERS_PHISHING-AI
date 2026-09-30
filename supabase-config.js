/**
 * PhishGuard AI — Supabase Client Configuration
 *
 * The ANON / PUBLISHABLE key is intentionally safe for frontend code.
 * It is subject to Row Level Security (RLS) on the Supabase side.
 * NEVER place the service_role / secret key in any frontend file.
 */

const SUPABASE_URL      = 'https://clhuuowndjwsqdivbevv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_0ekSPySrXNnBzWMWVZ9DYQ_hN7rWFQU';

// supabase is loaded globally from the CDN <script> tag in index.html
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
