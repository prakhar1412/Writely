// scripts/migrate.mjs  — run once to apply the schema to Supabase
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error("❌  Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env");
    process.exit(1);
}

// We can't run raw DDL via the anon key (needs service_role / SQL editor).
// This script tests the connection and prints the required SQL to paste.
const client = createClient(url, key);

console.log("🔌  Testing connection to Supabase...");
const { error } = await client.from("rooms").select("code").limit(1);

if (error && error.code === "42P01") {
    // Table doesn't exist yet — that's expected before migration
    console.log("\n✅  Connection successful!\n");
    console.log("⚠️   Tables not found — you need to run the SQL migration:\n");
    console.log("1. Open: https://supabase.com/dashboard/project/lyvquxtcrdgjxgxpqnhr/sql/new");
    console.log("2. Paste the contents of:  supabase/migrations/001_initial_schema.sql");
    console.log("3. Click Run\n");
    console.log("Then restart the dev server — it will automatically use Supabase.\n");
} else if (error) {
    console.error("❌  Connection error:", error.message);
    process.exit(1);
} else {
    console.log("✅  Connection successful! Tables already exist and ready.\n");
}
