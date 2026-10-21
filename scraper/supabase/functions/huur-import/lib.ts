// Logica van de Edge Function "huur-import" (los van Supabase/netwerk, zodat hij te testen is).
//
// Alleen de GitHub Actions-workflow .github/workflows/huurwoningen.yml in larsvegelin/nightfind mag schrijven.
// Die stuurt een kortlevend OIDC-token van GitHub mee (header x-github-oidc); daar zit geen opgeslagen sleutel achter.
import { jwtVerify, type JWTPayload, type JWTVerifyGetKey } from "npm:jose@5.9.6";

export const ISSUER = "https://token.actions.githubusercontent.com";
export const AUDIENCE = "nightfind-huurwoningen";
export const REPOSITORY = "larsvegelin/nightfind";
export const WORKFLOW_PATH = ".github/workflows/huurwoningen.yml";
export const ALLOWED_REFS = ["refs/heads/main", "refs/heads/claude/loving-cerf-3no2e2"];
export const TABLES = ["huur_woningen", "huur_bronnen"] as const;
export const MAX_ROWS = 1000;

export type Table = (typeof TABLES)[number];

export interface Db {
  select(table: Table): Promise<unknown[]>;
  upsert(table: Table, rows: Record<string, unknown>[]): Promise<void>;
  deleteOlder(table: "huur_woningen", stamp: string): Promise<void>;
  updateSettings(fields: { bijgewerkt?: string | null; regio?: unknown }): Promise<void>;
}

export class AuthError extends Error {}
export class BadRequest extends Error {}

export async function verifyGithubToken(token: string, keys: JWTVerifyGetKey): Promise<JWTPayload> {
  if (!token) throw new AuthError("geen GitHub-token");
  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(token, keys, { issuer: ISSUER, audience: AUDIENCE }));
  } catch (e) {
    throw new AuthError(`ongeldig GitHub-token: ${(e as Error).message}`);
  }
  if (payload.repository !== REPOSITORY) throw new AuthError("verkeerde repository");
  const workflowRef = String(payload.workflow_ref ?? "");
  const [workflow, ref] = workflowRef.split("@");
  if (workflow !== `${REPOSITORY}/${WORKFLOW_PATH}`) throw new AuthError("verkeerde workflow");
  if (!ALLOWED_REFS.includes(ref)) throw new AuthError("branch niet toegestaan");
  if (String(payload.event_name ?? "").startsWith("pull_request")) throw new AuthError("pull requests mogen niet schrijven");
  return payload;
}

function table(value: unknown): Table {
  if (typeof value === "string" && (TABLES as readonly string[]).includes(value)) return value as Table;
  throw new BadRequest("onbekende tabel");
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

export async function handle(
  req: Request,
  deps: { verify: (token: string) => Promise<JWTPayload>; db: Db },
): Promise<Response> {
  if (req.method !== "POST") return json(405, { error: "alleen POST" });
  try {
    await deps.verify(req.headers.get("x-github-oidc") ?? "");
    const body = await req.json().catch(() => {
      throw new BadRequest("geen geldige JSON");
    });
    switch (body?.action) {
      case "select":
        return json(200, { rows: await deps.db.select(table(body.table)) });
      case "upsert": {
        const rows = body.rows;
        if (!Array.isArray(rows) || rows.length > MAX_ROWS || rows.some((r) => !r || typeof r !== "object" || typeof r.id !== "string")) {
          throw new BadRequest(`rows moet een lijst van max. ${MAX_ROWS} objecten met een id zijn`);
        }
        await deps.db.upsert(table(body.table), rows);
        return json(200, { ok: true, count: rows.length });
      }
      case "delete_older": {
        if (body.table !== "huur_woningen" || body.column !== "gesynchroniseerd") throw new BadRequest("alleen huur_woningen.gesynchroniseerd");
        if (typeof body.stamp !== "string" || Number.isNaN(Date.parse(body.stamp))) throw new BadRequest("ongeldig tijdstip");
        await deps.db.deleteOlder("huur_woningen", body.stamp);
        return json(200, { ok: true });
      }
      case "settings": {
        const fields: { bijgewerkt?: string | null; regio?: unknown } = {};
        if ("bijgewerkt" in (body.fields ?? {})) fields.bijgewerkt = body.fields.bijgewerkt;
        if ("regio" in (body.fields ?? {})) fields.regio = body.fields.regio;
        await deps.db.updateSettings(fields);
        return json(200, { ok: true });
      }
      default:
        throw new BadRequest("onbekende actie");
    }
  } catch (e) {
    if (e instanceof AuthError) return json(401, { error: e.message });
    if (e instanceof BadRequest) return json(400, { error: e.message });
    console.error(e);
    return json(500, { error: (e as Error).message ?? "onbekende fout" });
  }
}
