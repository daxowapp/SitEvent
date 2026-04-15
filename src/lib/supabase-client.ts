import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://placeholder.supabase.co";

const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "placeholder-key";

if (supabaseUrl === "https://placeholder.supabase.co" || supabaseKey === "placeholder-key") {
    console.warn("⚠️ Supabase URL or Key is missing. Storage uploads will not work.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

