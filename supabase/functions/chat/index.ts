// NightFind chat + route Edge Function.
// Deploy:  supabase functions deploy chat
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
import Anthropic from "npm:@anthropic-ai/sdk";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });
const MODEL = "claude-opus-5";

const SYSTEM = `Je bent de NightFind-assistent: een vriendelijke, kundige uitgaans- en reisplanner.
NightFind helpt mensen wereldwijd met restaurants, bars, clubs, activiteiten en hotels, en bouwt routes voor een avond, dag of weekend.
Regels:
- Antwoord in de taal van de gebruiker (standaard Nederlands), kort en concreet.
- Gebruik het profiel en de bestaande route als context. Stel hooguit één verduidelijkende vraag.
- Verzin geen exacte prijzen, openingstijden of adressen. Verwijs voor boeken naar Booking.com (hotels), Viator (activiteiten) en TripAdvisor (restaurants, bars, clubs).
- Geef bij vragen om aanpassing een concreet voorstel per stop.`;

const ROUTE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "intro", "stops"],
  properties: {
    title: { type: "string" },
    intro: { type: "string" },
    stops: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["time", "type", "name", "description", "keyword"],
        properties: {
          time: { type: "string" },
          type: { type: "string", enum: ["hotel", "activity", "restaurant", "bar", "club"] },
          name: { type: "string" },
          description: { type: "string" },
          keyword: { type: "string", description: "Korte zoekterm voor de affiliate-partner, bv. 'boat tour' of 'tapas'" },
        },
      },
    },
  },
};

function textOf(res: Anthropic.Message): string {
  return res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const body = await req.json();
    const json = (data: unknown, status = 200) =>
      new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

    if (body.mode === "route") {
      const { profile, venues } = body;
      const res = await client.messages.create({
        model: MODEL,
        max_tokens: 4000,
        system: SYSTEM,
        output_config: { format: { type: "json_schema", schema: ROUTE_SCHEMA } },
        messages: [{
          role: "user",
          content: `Maak een route in het Nederlands.
Profiel: ${JSON.stringify(profile)}
Bekende bars in deze stad (uit onze database, gebruik bij voorkeur deze namen): ${JSON.stringify(venues?.bars ?? [])}
Bekende clubs: ${JSON.stringify(venues?.clubs ?? [])}
Geef 4 tot 7 stops in chronologische volgorde met tijdstip. Neem alleen types op die in profile.interests staan. Voor restaurants, activiteiten en hotels: geef een beschrijvende naam (geen verzonnen bedrijfsnaam) en een goede zoekterm.`,
        }],
      });
      if (res.stop_reason === "refusal") return json({ error: "refused" }, 422);
      return json(JSON.parse(textOf(res)));
    }

    // mode === "chat"
    const { messages = [], profile, route } = body;
    const context = `Profiel: ${JSON.stringify(profile ?? {})}\nHuidige route: ${JSON.stringify(route ?? null)}`;
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }, { type: "text", text: context }],
      messages: messages.map((m: { role: "user" | "assistant"; content: string }) => ({ role: m.role, content: m.content })),
    });
    if (res.stop_reason === "refusal") return json({ reply: "Daar kan ik je helaas niet mee helpen. Vraag me gerust iets over je route." });
    return json({ reply: textOf(res) });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
