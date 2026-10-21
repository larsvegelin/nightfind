// deno test scraper/supabase/functions/huur-import/lib_test.ts
import { createLocalJWKSet, exportJWK, generateKeyPair, type KeyLike, SignJWT } from "npm:jose@5.9.6";
import { AUDIENCE, type Db, handle, ISSUER, verifyGithubToken } from "./lib.ts";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const { publicKey, privateKey } = await generateKeyPair("RS256");
const jwk = { ...(await exportJWK(publicKey)), kid: "test", alg: "RS256" };
const keys = createLocalJWKSet({ keys: [jwk] });
const other = await generateKeyPair("RS256");

const GOOD = {
  repository: "larsvegelin/nightfind",
  workflow_ref: "larsvegelin/nightfind/.github/workflows/huurwoningen.yml@refs/heads/main",
  event_name: "schedule",
};

async function token(claims: Record<string, unknown>, opts: { aud?: string; iss?: string; exp?: string; key?: KeyLike } = {}) {
  return await new SignJWT(claims)
    .setProtectedHeader({ alg: "RS256", kid: "test" })
    .setIssuer(opts.iss ?? ISSUER)
    .setAudience(opts.aud ?? AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(opts.exp ?? "5m")
    .sign(opts.key ?? privateKey);
}

async function rejects(p: Promise<unknown>, what: string) {
  try {
    await p;
  } catch {
    return;
  }
  throw new Error(`niet geweigerd: ${what}`);
}

Deno.test("geldig token van de eigen workflow wordt geaccepteerd", async () => {
  await verifyGithubToken(await token(GOOD), keys);
  await verifyGithubToken(await token({ ...GOOD, workflow_ref: GOOD.workflow_ref.replace("refs/heads/main", "refs/heads/claude/loving-cerf-3no2e2"), event_name: "push" }), keys);
});

Deno.test("alles wat niet van de eigen workflow komt wordt geweigerd", async () => {
  await rejects(verifyGithubToken("", keys), "leeg");
  await rejects(verifyGithubToken(await token({ ...GOOD, repository: "iemand/nightfind" }), keys), "andere repo");
  await rejects(verifyGithubToken(await token({ ...GOOD, workflow_ref: "larsvegelin/nightfind/.github/workflows/qa.yml@refs/heads/main" }), keys), "andere workflow");
  await rejects(verifyGithubToken(await token({ ...GOOD, workflow_ref: GOOD.workflow_ref.replace("main", "feature-x") }), keys), "andere branch");
  await rejects(verifyGithubToken(await token({ ...GOOD, event_name: "pull_request" }), keys), "pull request");
  await rejects(verifyGithubToken(await token(GOOD, { aud: "iets-anders" }), keys), "verkeerde audience");
  await rejects(verifyGithubToken(await token(GOOD, { iss: "https://nep.example" }), keys), "verkeerde issuer");
  await rejects(verifyGithubToken(await token(GOOD, { exp: "-1m" }), keys), "verlopen");
  await rejects(verifyGithubToken(await token(GOOD, { key: other.privateKey }), keys), "verkeerde handtekening");
});

function fakeDb() {
  const calls: unknown[][] = [];
  const db: Db = {
    select: async (t) => (calls.push(["select", t]), [{ id: "funda:1" }]),
    upsert: async (t, rows) => void calls.push(["upsert", t, rows.length]),
    deleteOlder: async (t, s) => void calls.push(["delete", t, s]),
    updateSettings: async (f) => void calls.push(["settings", f]),
  };
  return { db, calls };
}

async function call(body: unknown, tok: string | null, db: Db, method = "POST") {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (tok) headers["x-github-oidc"] = tok;
  const req = new Request("http://x/huur-import", { method, headers, body: method === "POST" ? JSON.stringify(body) : undefined });
  return await handle(req, { verify: (t) => verifyGithubToken(t, keys), db });
}

Deno.test("acties", async () => {
  const good = await token(GOOD);
  const { db, calls } = fakeDb();
  assert((await call({ action: "select", table: "huur_woningen" }, good, db)).status === 200, "select");
  assert((await call({ action: "upsert", table: "huur_bronnen", rows: [{ id: "funda" }] }, good, db)).status === 200, "upsert");
  assert((await call({ action: "delete_older", table: "huur_woningen", column: "gesynchroniseerd", stamp: "2026-10-21T20:00:00+00:00" }, good, db)).status === 200, "delete");
  assert((await call({ action: "settings", fields: { bijgewerkt: null, regio: {}, code_hash: "x" } }, good, db)).status === 200, "settings");
  const settings = calls.find((c) => c[0] === "settings")![1] as Record<string, unknown>;
  assert(!("code_hash" in settings), "code_hash mag nooit via de functie veranderen");
  assert(calls.length === 4, "4 aanroepen");
});

Deno.test("foute verzoeken", async () => {
  const good = await token(GOOD);
  const { db, calls } = fakeDb();
  assert((await call({ action: "select", table: "huur_woningen" }, null, db)).status === 401, "zonder token");
  assert((await call({ action: "select", table: "huur_instellingen" }, good, db)).status === 400, "instellingen niet leesbaar");
  assert((await call({ action: "upsert", table: "huur_woningen", rows: [{ geen_id: 1 }] }, good, db)).status === 400, "rij zonder id");
  assert((await call({ action: "upsert", table: "huur_woningen", rows: Array.from({ length: 1001 }, (_, i) => ({ id: String(i) })) }, good, db)).status === 400, "te veel rijen");
  assert((await call({ action: "delete_older", table: "huur_bronnen", column: "gesynchroniseerd", stamp: "2026-10-21" }, good, db)).status === 400, "delete op andere tabel");
  assert((await call({ action: "delete_older", table: "huur_woningen", column: "id", stamp: "2026-10-21" }, good, db)).status === 400, "delete op andere kolom");
  assert((await call({ action: "drop" }, good, db)).status === 400, "onbekende actie");
  assert((await call(null, good, db, "GET")).status === 405, "GET");
  assert(calls.length === 0, "niets uitgevoerd");
});
