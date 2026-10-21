// Supabase Edge Function "huur-import" (project "scraper").
// Ontvangt de resultaten van de huurwoningen-scraper uit GitHub Actions en schrijft ze naar
// huur_woningen / huur_bronnen / huur_instellingen. Alleen de eigen workflow mag dit (zie lib.ts).
// Deploy zonder Supabase-JWT-controle (verify_jwt = false): de controle gebeurt op het GitHub-token.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { createRemoteJWKSet } from "npm:jose@5.9.6";
import { type Db, handle, ISSUER, verifyGithubToken } from "./lib.ts";

const keys = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks`));
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PAGE = 1000;

const db: Db = {
  async select(table) {
    const rows: unknown[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase.from(table).select("*").order("id").range(from, from + PAGE - 1);
      if (error) throw new Error(error.message);
      rows.push(...(data ?? []));
      if (!data || data.length < PAGE) return rows;
    }
  },
  async upsert(table, rows) {
    const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });
    if (error) throw new Error(error.message);
  },
  async deleteOlder(table, stamp) {
    const { error } = await supabase.from(table).delete().lt("gesynchroniseerd", stamp);
    if (error) throw new Error(error.message);
  },
  async updateSettings(fields) {
    const { error } = await supabase.from("huur_instellingen").update(fields).eq("id", true);
    if (error) throw new Error(error.message);
  },
};

Deno.serve((req) => handle(req, { verify: (token) => verifyGithubToken(token, keys), db }));
