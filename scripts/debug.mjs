// scripts/debug.mjs — tests each Supabase operation independently
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error("❌  Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env");
    process.exit(1);
}

const client = createClient(url, key);

console.log("🔌  URL:", url);
console.log("🔑  Key starts with:", key.substring(0, 20) + "...\n");

// 1. Test INSERT into rooms
console.log("1️⃣   Testing INSERT into rooms...");
const code = "DBGXXX";
const { data: insertData, error: insertErr } = await client
    .from("rooms")
    .insert({ code, host_id: "testhost", is_locked: false, template_image: "" })
    .select()
    .single();

if (insertErr) {
    console.error("❌  INSERT failed:", insertErr.message);
    console.error("    Code:", insertErr.code);
    console.error("    Details:", insertErr.details);
    console.error("    Hint:", insertErr.hint);
} else {
    console.log("✅  INSERT succeeded:", insertData);

    // 2. Test SELECT
    console.log("\n2️⃣   Testing SELECT from rooms...");
    const { data: selectData, error: selectErr } = await client
        .from("rooms").select("*").eq("code", code).single();
    if (selectErr) console.error("❌  SELECT failed:", selectErr.message);
    else console.log("✅  SELECT succeeded:", selectData);

    // 3. Cleanup
    await client.from("rooms").delete().eq("code", code);
    console.log("🧹  Cleaned up test row.");
}
