#!/usr/bin/env python3
"""Managementrapport kennisbank-gebruik (HTML, printbaar naar PDF).

Gebruik:
    python3 rapport.py            # na etl.py; schrijft rapport.html (printbaar naar A4-PDF)

Leest dezelfde bronnen als etl.py (input/ + data/). Het rapport beslaat de
volledige periode waarvoor paginaweergaven beschikbaar zijn.
"""
import collections
import html
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import etl

TZ = ZoneInfo("Europe/Amsterdam")
OUT = etl.BASE / "rapport.html"
MONTHS_NL = ["januari", "februari", "maart", "april", "mei", "juni", "juli",
             "augustus", "september", "oktober", "november", "december"]
MONTHS_NL_SHORT = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"]
NO_GROUP = "(geen groep)"
RECENT_DAYS = 30


def esc(s) -> str:
    return html.escape(str(s if s is not None else ""))


def n(x) -> str:
    return f"{x:,}".replace(",", ".")


def nl_join(items) -> str:
    items = list(items)
    return items[0] if len(items) == 1 else ", ".join(items[:-1]) + " en " + items[-1]


def pct(a, b) -> int:
    return round(100 * a / b) if b else 0


def d_long(dt: datetime) -> str:
    return f"{dt.day} {MONTHS_NL[dt.month - 1]} {dt.year}"


def d_short(dt: datetime) -> str:
    return f"{dt.day} {MONTHS_NL_SHORT[dt.month - 1]}"


def local(ts: str) -> datetime:
    return datetime.fromtimestamp(etl.ts_to_epoch_sec(ts), timezone.utc).astimezone(TZ)


# ---------------------------------------------------------------------------
# Analyse
# ---------------------------------------------------------------------------
def analyse():
    events, searches, accounts, groups, inventory, _ = etl.load_all()
    if not events:
        sys.exit("Geen paginaweergaven gevonden — draai eerst etl.py met een Refined-export in input/pageviews/.")
    acc = {a["id"]: a for a in accounts}
    ev = sorted(events.values(), key=lambda e: e["timestamp_origin"])
    for e in ev:
        e["dt"] = local(e["timestamp_origin"])
    start, end = ev[0]["dt"], ev[-1]["dt"]
    recent_cut = end - timedelta(days=RECENT_DAYS)

    def name(aid):
        return (acc.get(aid) or {}).get("name") or f"onbekend ({aid[-8:]})"

    def groups_of(aid):
        return groups.get(aid, [])

    active = collections.Counter(e["account_id"] for e in ev)
    last_seen = {}
    for e in ev:
        last_seen[e["account_id"]] = e["dt"]

    # Doelgroep: iedereen met Confluence-toegang, plus wie aantoonbaar actief was.
    target = {a["id"] for a in accounts if a["confluenceAccess"] and a["status"] == "Active"} | set(active)

    # --- per week ----------------------------------------------------------
    weeks = collections.OrderedDict()
    wk = (start - timedelta(days=start.weekday())).date()
    while wk <= end.date():
        weeks[wk] = {"views": 0, "users": set()}
        wk += timedelta(days=7)
    for e in ev:
        k = (e["dt"] - timedelta(days=e["dt"].weekday())).date()
        weeks[k]["views"] += 1
        weeks[k]["users"].add(e["account_id"])
    week_rows = []
    for k, w in weeks.items():
        days_in = sum(1 for i in range(7) if start.date() <= k + timedelta(days=i) <= end.date())
        week_rows.append({"start": k, "views": w["views"], "users": len(w["users"]), "partial": days_in < 7})

    # --- per maand ---------------------------------------------------------
    months = collections.OrderedDict()
    for e in ev:
        k = (e["dt"].year, e["dt"].month)
        months.setdefault(k, {"views": 0, "users": set(), "days": set()})
        months[k]["views"] += 1
        months[k]["users"].add(e["account_id"])
    month_rows = []
    for (y, m), v in months.items():
        first = datetime(y, m, 1, tzinfo=TZ).date()
        nxt = datetime(y + (m == 12), m % 12 + 1, 1, tzinfo=TZ).date()
        span = (min(nxt - timedelta(days=1), end.date()) - max(first, start.date())).days + 1
        full = (nxt - first).days
        month_rows.append({"label": f"{MONTHS_NL[m - 1]} {y}", "views": v["views"], "users": len(v["users"]),
                           "partial": span < full, "span": span})

    # --- per groep ---------------------------------------------------------
    group_names = sorted({g for gs in groups.values() for g in gs}, key=str.lower)
    group_rows = []
    for g in group_names + [NO_GROUP]:
        members = {a for a in target if (g in groups_of(a)) or (g == NO_GROUP and not groups_of(a))}
        act = {a for a in members if a in active}
        recent = {a for a in act if last_seen[a] >= recent_cut}
        views = sum(active[a] for a in act)
        group_rows.append({"group": g, "members": len(members), "active": len(act), "recent": len(recent),
                           "views": views, "per_user": round(views / len(act)) if act else 0})
    group_rows = [r for r in group_rows if r["members"]]
    group_rows.sort(key=lambda r: (r["group"] == NO_GROUP, -r["members"], r["group"].lower()))

    # --- pagina's ----------------------------------------------------------
    page_views = collections.Counter(e["page_id"] for e in ev)
    page_users = collections.defaultdict(set)
    titles = {}
    for e in ev:
        page_users[e["page_id"]].add(e["account_id"])
        titles[e["page_id"]] = e["page_title"]
    top_pages = [{"title": titles[p], "views": v, "users": len(page_users[p])}
                 for p, v in page_views.most_common(15)]
    inv_ids = {p["id"] for p in inventory}
    orphans = sorted((p for p in inventory if p["id"] not in page_views),
                     key=lambda p: (p["lastModified"] or "", p["title"].lower()))

    # --- zoeken ------------------------------------------------------------
    s_all = list(searches.values())
    partial = etl.mark_partial_searches(s_all)
    real = [s for s in s_all if s["id"] not in partial]
    term_n, term_zero = collections.Counter(), collections.Counter()
    term_users, zero_users = collections.defaultdict(set), collections.defaultdict(set)
    for s in real:
        t = " ".join(s["search_term"].lower().split())
        term_n[t] += 1
        term_users[t].add(s["account_id"])
        if s["search_results"] == "0":
            term_zero[t] += 1
            zero_users[t].add(s["account_id"])
    zero_total = sum(term_zero.values())
    top_terms = [{"term": t, "n": c, "users": len(term_users[t]), "zero": term_zero[t]}
                 for t, c in term_n.most_common(15)]
    zero_terms = [{"term": t, "n": c, "users": len(zero_users[t])}
                  for t, c in sorted(term_zero.items(), key=lambda x: (-len(zero_users[x[0]]), -x[1], x[0]))[:20]]

    # --- personen ----------------------------------------------------------
    early = {a for a in active if last_seen[a] < recent_cut}
    first_seen = {}
    for e in reversed(ev):
        first_seen[e["account_id"]] = e["dt"]
    dropouts = sorted(early, key=lambda a: last_seen[a])
    newcomers = [a for a in active if first_seen[a] >= recent_cut]
    never = sorted((a for a in target if a not in active),
                   key=lambda a: ((groups_of(a) or [NO_GROUP])[0].lower(), name(a).lower()))
    top_users = active.most_common(5)

    admin_views = sum(1 for e in ev if e["user_type"] == "GLOBAL_ADMIN")
    admin_accounts = {e["account_id"] for e in ev if e["user_type"] == "GLOBAL_ADMIN"}

    return {
        "start": start, "end": end, "days": (end.date() - start.date()).days + 1,
        "views": len(ev), "active": len(active), "target": len(target),
        "recent_active": sum(1 for a in active if last_seen[a] >= recent_cut),
        "weeks": week_rows, "months": month_rows, "groups": group_rows,
        "top_pages": top_pages, "inventory": len(inv_ids), "orphans": orphans,
        "searches": len(real), "searchers": len({s["account_id"] for s in real}), "zero_total": zero_total,
        "top_terms": top_terms, "zero_terms": zero_terms, "partial_searches": len(partial),
        "dropouts": [{"name": name(a), "groups": groups_of(a), "last": last_seen[a], "views": active[a]} for a in dropouts],
        "newcomers": len(newcomers),
        "never": [{"name": name(a), "groups": groups_of(a), "email": (acc.get(a) or {}).get("email", "")} for a in never],
        "top5_share": pct(sum(v for _, v in top_users), len(ev)),
        "admin_views": admin_views, "admin_names": [name(a) for a in admin_accounts],
        "no_group_active": next((r["active"] for r in group_rows if r["group"] == NO_GROUP), 0),
        "no_group_members": next((r["members"] for r in group_rows if r["group"] == NO_GROUP), 0),
    }


# ---------------------------------------------------------------------------
# Grafieken (inline SVG)
# ---------------------------------------------------------------------------
def nice_scale(v: int) -> tuple:
    """(bovenkant, aantal intervallen) met ronde stappen (1/2/2,5/5 × 10^k) en hooguit 5 intervallen."""
    v = max(v, 1)
    k = 0
    while True:
        for m in (1, 2, 2.5, 5):
            step = m * 10 ** k
            if step != int(step):
                continue
            intervals = -(-v // int(step))
            if intervals <= 5:
                return int(step) * intervals, intervals
        k += 1


def column_chart(rows, key, color_var, label):
    W, H, pl, pr, pt, pb = 760, 210, 44, 8, 14, 34
    vals = [r[key] for r in rows]
    top, intervals = nice_scale(max(vals) if vals else 1)
    n_ = len(rows)
    slot = (W - pl - pr) / max(n_, 1)
    bw = max(4, slot - 2 * max(2, slot * 0.18))
    y = lambda v: pt + (H - pt - pb) * (1 - v / top)
    out = [f'<svg viewBox="0 0 {W} {H}" role="img" aria-label="{esc(label)}" class="chart">']
    for g in range(intervals + 1):
        v = top * g / intervals
        yy = y(v)
        out.append(f'<line x1="{pl}" x2="{W - pr}" y1="{yy:.1f}" y2="{yy:.1f}" class="grid"/>')
        out.append(f'<text x="{pl - 6}" y="{yy + 3.5:.1f}" text-anchor="end" class="tick">{n(int(v))}</text>')
    every = max(1, round(n_ / 7))
    for i, r in enumerate(rows):
        x = pl + i * slot + (slot - bw) / 2
        v = r[key]
        h = (H - pt - pb) - (y(v) - pt)
        y0 = H - pb
        rad = min(4, bw / 2, h)
        cls = "bar partial" if r.get("partial") else "bar"
        if v > 0:
            out.append(
                f'<path class="{cls}" style="fill:var({color_var})" d="M{x:.1f},{y0} V{y0 - h + rad:.1f} '
                f'Q{x:.1f},{y0 - h:.1f} {x + rad:.1f},{y0 - h:.1f} H{x + bw - rad:.1f} '
                f'Q{x + bw:.1f},{y0 - h:.1f} {x + bw:.1f},{y0 - h + rad:.1f} V{y0} Z">'
                f'<title>week van {d_short(r["start"])}: {n(v)} {esc(label)}{" (deels)" if r.get("partial") else ""}</title></path>')
        if i % every == 0 or i == n_ - 1:
            out.append(f'<text x="{x + bw / 2:.1f}" y="{H - pb + 15}" text-anchor="middle" class="tick">{d_short(r["start"])}</text>')
    out.append(f'<line x1="{pl}" x2="{W - pr}" y1="{H - pb}" y2="{H - pb}" class="axis"/>')
    peak = max(range(n_), key=lambda i: vals[i]) if n_ else None
    if peak is not None:
        x = pl + peak * slot + slot / 2
        out.append(f'<text x="{x:.1f}" y="{y(vals[peak]) - 5:.1f}" text-anchor="middle" class="vlabel">{n(vals[peak])}</text>')
    out.append("</svg>")
    return "".join(out)


def hbar(value, maximum, color_var="--series-1"):
    w = 100 * value / maximum if maximum else 0
    return (f'<div class="hbar"><div class="hbar-fill" style="width:{w:.1f}%;background:var({color_var})"></div></div>')


# ---------------------------------------------------------------------------
# HTML
# ---------------------------------------------------------------------------
CSS = """
:root{color-scheme:light;--page:#f9f9f7;--surface:#fcfcfb;--ink:#0b0b0b;--ink-2:#52514e;--muted:#898781;
--grid:#e1e0d9;--baseline:#c3c2b7;--border:rgba(11,11,11,.10);--series-1:#2a78d6;--series-2:#eb6834;
--track:#f0efec;--critical:#d03b3b;--good:#006300;--warn-bg:#fff6e5}
*{box-sizing:border-box}
body{margin:0;background:var(--page);color:var(--ink);font:14px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}
.wrap{max-width:900px;margin:0 auto;padding:36px 24px 64px}
header{border-bottom:2px solid var(--ink);padding-bottom:14px;margin-bottom:26px}
.eyebrow{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
h1{font-size:28px;margin:4px 0 4px;line-height:1.2}
.meta{color:var(--ink-2);font-size:13px}
h2{font-size:18px;margin:38px 0 4px;padding-top:6px}
h2 .num{color:var(--muted);font-weight:500;margin-right:6px}
.lead{color:var(--ink-2);margin:0 0 14px;font-size:13.5px}
.summary{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:18px 22px}
.summary ul{margin:6px 0 0;padding-left:20px}.summary li{margin:6px 0}
.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:18px 0 0}
.kpi{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px 14px}
.kpi .l{font-size:12px;color:var(--ink-2)}.kpi .v{font-size:26px;font-weight:650;line-height:1.2}
.kpi .s{font-size:11.5px;color:var(--muted)}
.card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin:10px 0}
.card h3{font-size:13.5px;margin:0 0 8px;color:var(--ink-2);font-weight:600}
.chart{display:block;width:100%;height:auto}
.chart .grid{stroke:var(--grid);stroke-width:1}.chart .axis{stroke:var(--baseline);stroke-width:1}
.chart .tick{font-size:10.5px;fill:var(--muted);font-variant-numeric:tabular-nums}
.chart .vlabel{font-size:11px;fill:var(--ink-2);font-weight:600}
.chart .bar.partial{opacity:.45}
.note{font-size:12px;color:var(--muted);margin-top:4px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);font-weight:600;
padding:6px 8px;border-bottom:1px solid var(--grid)}
td{padding:6px 8px;border-bottom:1px solid var(--grid);vertical-align:middle}
tr:last-child td{border-bottom:none}
.r{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.hbar{height:10px;background:var(--track);border-radius:0 4px 4px 0;min-width:60px}
.hbar-fill{height:100%;border-radius:0 4px 4px 0}
.muted{color:var(--muted)}
.nw{white-space:nowrap}
.tag{display:inline-block;font-size:11px;border:1px solid var(--border);border-radius:999px;padding:0 7px;color:var(--ink-2);margin:1px 2px 1px 0;white-space:nowrap}
.tag.crit{color:var(--critical);border-color:currentColor}
.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.recs{counter-reset:r;list-style:none;padding:0;margin:8px 0}
.recs li{counter-increment:r;background:var(--surface);border:1px solid var(--border);border-radius:12px;
padding:12px 16px 12px 50px;margin:8px 0;position:relative}
.recs li::before{content:counter(r);position:absolute;left:16px;top:11px;width:22px;height:22px;border-radius:50%;
background:var(--ink);color:var(--surface);font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center}
.recs b{display:block;margin-bottom:2px}
.grp{margin:0 0 12px;font-size:12.5px}
.grp b{display:block;font-size:12px;border-bottom:1px solid var(--grid);margin-bottom:4px;padding-bottom:2px}
.names{display:grid;grid-template-columns:repeat(3,1fr);gap:1px 18px}
.names span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.privacy{background:var(--warn-bg);border:1px solid #f0d9a8;border-radius:10px;padding:10px 14px;font-size:12.5px;color:#5c4a1f}
footer{margin-top:40px;font-size:12px;color:var(--muted);border-top:1px solid var(--grid);padding-top:12px}
@media (max-width:700px){.kpis{grid-template-columns:repeat(2,1fr)}.two{grid-template-columns:1fr}.names{grid-template-columns:1fr 1fr}}
@media print{body{background:#fff;font-size:12px}.wrap{padding:0;max-width:none}.card,.summary,.kpi,.recs li{break-inside:avoid}
.card.flow{break-inside:auto}tr{break-inside:avoid}.grp b{break-after:avoid}
h2,.lead{break-after:avoid}.pb{break-before:page}@page{size:A4;margin:16mm 14mm}}
"""


def build_html(r) -> str:
    s, e = r["start"], r["end"]
    adoption = pct(r["active"], r["target"])
    zero_pct = pct(r["zero_total"], r["searches"])
    full_months = [m for m in r["months"] if not m["partial"]]
    last_m = r["months"][-1]
    groups_sorted = [g for g in r["groups"] if g["group"] != NO_GROUP]
    low = sorted((g for g in groups_sorted if g["members"] >= 5), key=lambda g: pct(g["active"], g["members"]))[:3]
    high = sorted((g for g in groups_sorted if g["members"] >= 5), key=lambda g: -pct(g["active"], g["members"]))[:2]
    zero_list = ", ".join(f"«{esc(z['term'])}»" for z in r["zero_terms"][:6])

    trend_txt = ""
    if len(full_months) >= 2:
        trend_txt = (f"Het aantal unieke gebruikers per maand groeide van {full_months[0]['users']} "
                     f"({full_months[0]['label'].split()[0]}) naar {full_months[-1]['users']} "
                     f"({full_months[-1]['label'].split()[0]}).")
    if last_m["partial"] and last_m["span"] >= 7:
        trend_txt += (f" In {last_m['label'].split()[0]} waren in de eerste {last_m['span']} dagen al "
                      f"{last_m['users']} gebruikers actief.")

    # --- samenvatting ---
    bullets = [
        f"<b>{n(r['active'])} van de {n(r['target'])} accounts ({adoption}%)</b> gebruikten de kennisbank in deze periode, "
        f"samen goed voor {n(r['views'])} paginaweergaven. {trend_txt}",
        f"<b>Het gebruik is geconcentreerd:</b> de vijf meest actieve accounts zijn samen goed voor {r['top5_share']}% van alle weergaven.",
        f"<b>{zero_pct}% van de zoekopdrachten levert niets op</b> ({n(r['zero_total'])} van {n(r['searches'])}). "
        f"Termen waarbij de meeste verschillende gebruikers niets vonden: {zero_list}.",
        f"<b>{n(len(r['orphans']))} van de {n(r['inventory'])} Confluence-pagina's</b> zijn in deze periode door niemand geopend.",
        f"<b>{n(len(r['dropouts']))} gebruikers zijn afgehaakt:</b> wel actief in de periode, maar niet meer in de laatste {RECENT_DAYS} dagen. "
        f"Daar staan {n(r['newcomers'])} nieuwe gebruikers in diezelfde {RECENT_DAYS} dagen tegenover.",
    ]
    if low:
        bullets.append("<b>Laagste adoptie</b> (groepen vanaf 5 leden): " + ", ".join(
            f"{esc(g['group'])} ({pct(g['active'], g['members'])}%)" for g in low)
            + ("; hoogste: " + ", ".join(f"{esc(g['group'])} ({pct(g['active'], g['members'])}%)" for g in high) if high else "") + ".")

    kpis = [
        ("Actieve gebruikers", n(r["active"]), f"{adoption}% van {n(r['target'])} accounts"),
        (f"Actief laatste {RECENT_DAYS} dagen", n(r["recent_active"]), f"t/m {d_long(e)}"),
        ("Paginaweergaven", n(r["views"]), f"gem. {round(r['views'] / r['active'])} per actieve gebruiker"),
        ("Zoekopdrachten", n(r["searches"]), f"door {n(r['searchers'])} gebruikers"),
        ("Zonder zoekresultaat", f"{zero_pct}%", f"{n(r['zero_total'])} zoekopdrachten"),
        ("Pagina's niet bekeken", n(len(r["orphans"])), f"van {n(r['inventory'])} Confluence-pagina's"),
    ]

    P = []
    P.append(f"""<header><div class="eyebrow">De Waerdse · Kennisbank-analytics</div>
<h1>Gebruik van de kennisbank</h1>
<div class="meta">Rapportageperiode {d_long(s)} – {d_long(e)} ({r['days']} dagen) · opgesteld {d_long(datetime.now(TZ))}</div></header>""")

    P.append('<h2><span class="num">1</span>Samenvatting</h2><div class="summary"><ul>'
             + "".join(f"<li>{b}</li>" for b in bullets) + "</ul></div>")
    P.append('<div class="kpis">' + "".join(
        f'<div class="kpi"><div class="l">{esc(l)}</div><div class="v">{v}</div><div class="s">{esc(sub)}</div></div>'
        for l, v, sub in kpis) + "</div>")

    # --- trend ---
    P.append('<h2 class="pb"><span class="num">2</span>Ontwikkeling van het gebruik</h2>'
             '<p class="lead">Per week (maandag t/m zondag). Lichtere staven zijn weken die maar deels in de periode vallen.</p>')
    P.append('<div class="card"><h3>Paginaweergaven per week</h3>'
             + column_chart(r["weeks"], "views", "--series-1", "paginaweergaven") + "</div>")
    P.append('<div class="card"><h3>Unieke gebruikers per week</h3>'
             + column_chart(r["weeks"], "users", "--series-2", "unieke gebruikers") + "</div>")
    P.append('<div class="card"><h3>Per maand</h3><table><thead><tr><th>Maand</th><th class="r">Weergaven</th>'
             '<th class="r">Unieke gebruikers</th><th class="r">Weergaven per gebruiker</th></tr></thead><tbody>'
             + "".join(f'<tr><td>{esc(m["label"])}{" <span class=muted>(" + str(m["span"]) + " dagen)</span>" if m["partial"] else ""}</td>'
                       f'<td class="r">{n(m["views"])}</td><td class="r">{n(m["users"])}</td>'
                       f'<td class="r">{round(m["views"] / m["users"]) if m["users"] else 0}</td></tr>' for m in r["months"])
             + "</tbody></table></div>")

    # --- groepen ---
    P.append('<h2 class="pb"><span class="num">3</span>Gebruik per groep</h2>'
             '<p class="lead">Adoptie = aandeel leden dat de kennisbank minstens één keer opende in de periode. '
             'Leden = accounts met Confluence-toegang, plus wie aantoonbaar actief was. Wie in meerdere groepen zit, telt in elke groep mee.</p>')
    P.append('<div class="card"><table><thead><tr><th class="nw">Groep</th><th class="r">Leden</th><th class="r">Actief</th>'
             '<th style="width:22%">Adoptie</th><th class="r"></th><th class="r">Actief laatste 30 d.</th>'
             '<th class="r">Weergaven</th></tr></thead><tbody>'
             + "".join(
                 f'<tr><td class="nw">{esc(g["group"])}</td><td class="r">{n(g["members"])}</td><td class="r">{n(g["active"])}</td>'
                 f'<td>{hbar(g["active"], g["members"])}</td><td class="r">{pct(g["active"], g["members"])}%</td>'
                 f'<td class="r">{n(g["recent"])}</td><td class="r">{n(g["views"])}</td></tr>'
                 for g in r["groups"])
             + "</tbody></table>"
             + (f'<div class="note">{n(r["no_group_members"])} accounts zitten nog in geen enkele groep, '
                f'van wie {n(r["no_group_active"])} actief. Zolang die niet zijn ingedeeld, onderschatten de groepscijfers het werkelijke gebruik.</div>'
                if r["no_group_members"] else "")
             + "</div>")

    # --- pagina's ---
    tp = r["top_pages"]
    mx = tp[0]["views"] if tp else 1
    P.append('<h2><span class="num">4</span>Wat wordt er gelezen</h2>'
             '<p class="lead">De 15 meest bekeken pagina\'s. Unieke gebruikers laten zien of een pagina breed gelezen wordt of door een paar mensen vaak.</p>')
    P.append('<div class="card"><table><thead><tr><th>Pagina</th><th style="width:34%"></th><th class="r">Weergaven</th>'
             '<th class="r">Gebruikers</th></tr></thead><tbody>'
             + "".join(f'<tr><td>{esc(p["title"])}</td><td>{hbar(p["views"], mx)}</td><td class="r">{n(p["views"])}</td>'
                       f'<td class="r">{n(p["users"])}</td></tr>' for p in tp)
             + "</tbody></table></div>")

    # --- zoeken ---
    P.append('<h2 class="pb"><span class="num">5</span>Zoekgedrag</h2>'
             f'<p class="lead">{n(r["searches"])} zoekopdrachten door {n(r["searchers"])} gebruikers. '
             f'{n(r["partial_searches"])} tussentijdse toetsaanslagen (bijv. «woon» vlak voor «woonunit») zijn niet meegeteld.</p>')
    zt = r["zero_terms"]
    tt = r["top_terms"]
    for t in tt:
        t["zero_cell"] = (f'<span class="tag crit">{pct(t["zero"], t["n"])}%</span>' if t["zero"]
                          else '<span class="muted">—</span>')
    P.append('<div class="two"><div class="card"><h3>Meest gezocht</h3><table><thead><tr><th>Zoekterm</th>'
             '<th class="r">Keer</th><th class="r">Gebr.</th><th class="r">Zonder resultaat</th></tr></thead><tbody>'
             + "".join(f'<tr><td>{esc(t["term"])}</td><td class="r">{t["n"]}</td><td class="r">{t["users"]}</td>'
                       f'<td class="r">{t["zero_cell"]}</td></tr>'
                       for t in tt)
             + '</tbody></table></div><div class="card"><h3>Zoekopdrachten zonder resultaat</h3><table><thead><tr>'
             '<th>Zoekterm</th><th class="r">Gebr. zonder resultaat</th><th class="r">Keer</th></tr></thead><tbody>'
             + "".join(f'<tr><td>{esc(z["term"])}</td><td class="r">{z["users"]}</td><td class="r">{z["n"]}</td></tr>' for z in zt)
             + '</tbody></table><div class="note">Gesorteerd op het aantal verschillende gebruikers dat niets vond; '
               'één persoon die tien keer hetzelfde zoekt, is minder een contentgat dan vier mensen die elk één keer zoeken.</div>'
             + "</div></div>")

    # --- aanbevelingen ---
    recs = []
    if zt:
        recs.append(("Vul de contentgaten uit de zoekdata",
                     f"Maak of verrijk pagina's voor de termen waarbij de meeste gebruikers niets vonden ({zero_list}). "
                     "Bij spellingsvarianten (zoals «eigenaarsbelang» naast «eigenarenbelang», of «een dag kenteken» naast "
                     "«eendagskenteken») is een label, synoniem of aanbevolen link vaak genoeg."))
    if low:
        recs.append(("Activeer de groepen met lage adoptie",
                     "Bij " + nl_join([esc(g["group"]) for g in low]) + " opende minder dan de helft van de leden de kennisbank. "
                     "Een korte introductie of een direct linkje naar de drie meest gelezen pagina's helpt vaak. "
                     "De namen staan in bijlage A."))
    if r["dropouts"]:
        recs.append(("Benader de afhakers", f"{n(len(r['dropouts']))} gebruikers waren eerder actief, maar niet meer in de laatste "
                     f"{RECENT_DAYS} dagen (bijlage B). Vraag of ze vonden wat ze zochten."))
    if r["orphans"]:
        recs.append(("Ruim ongelezen pagina's op", f"{n(len(r['orphans']))} Confluence-pagina's zijn in {r['days']} dagen niet geopend "
                     "(bijlage C, oudste eerst). Controleer of ze nog kloppen, beter vindbaar moeten worden, of weg kunnen."))
    if r["no_group_members"]:
        recs.append(("Rond de groepsindeling af", f"{n(r['no_group_members'])} accounts hebben nog geen groep. Pas na indeling "
                     "is per klant te zien wie achterblijft."))
    recs.append(("Exporteer de Refined-data elke maand",
                 f"Deze export begint op {d_long(s)}; vermoedelijk is 90 dagen het maximum per export. Een maandelijkse export, "
                 "met overlap, bouwt een doorlopende historie op. De periode vóór deze export kan nog apart worden opgehaald, "
                 "want Refined bewaart analytics tot twee jaar."))
    P.append('<h2><span class="num">6</span>Aanbevelingen</h2><ol class="recs">'
             + "".join(f"<li><b>{esc(t)}</b>{d}</li>" for t, d in recs) + "</ol>")

    # --- bijlagen ---
    def tags(gs):
        return "".join(f'<span class="tag">{esc(g)}</span>' for g in gs) or '<span class="muted">geen groep</span>'

    by_group = collections.OrderedDict()
    for p in r["never"]:
        by_group.setdefault((p["groups"] or [NO_GROUP])[0], []).append(p["name"])
    P.append('<h2 class="pb"><span class="num">A</span>Bijlage: nog niet gebruikt</h2>'
             f'<p class="lead">{n(len(r["never"]))} accounts met toegang die de kennisbank in de periode niet hebben geopend, '
             'gegroepeerd op hun eerste groep.</p><div class="card flow">'
             + "".join(f'<div class="grp"><b>{esc(g)} ({len(ns)})</b><div class="names">'
                       + "".join(f"<span>{esc(x)}</span>" for x in ns) + "</div></div>"
                       for g, ns in sorted(by_group.items(), key=lambda kv: (kv[0] == NO_GROUP, kv[0].lower())))
             + "</div>")
    P.append(f'<h2><span class="num">B</span>Bijlage: afgehaakt (niet actief laatste {RECENT_DAYS} dagen)</h2>'
             '<div class="card flow"><table><thead><tr><th>Naam</th><th>Groep</th><th class="r">Weergaven</th>'
             '<th class="r">Laatst actief</th></tr></thead><tbody>'
             + "".join(f'<tr><td>{esc(d["name"])}</td><td>{tags(d["groups"])}</td><td class="r">{n(d["views"])}</td>'
                       f'<td class="r">{d_long(d["last"])}</td></tr>' for d in r["dropouts"])
             + "</tbody></table></div>")
    P.append(f'<h2><span class="num">C</span>Bijlage: niet bekeken pagina\'s</h2>'
             '<div class="card flow"><table><thead><tr><th>Pagina</th><th>Space</th><th class="r">Laatst gewijzigd</th></tr></thead><tbody>'
             + "".join(f'<tr><td>{esc(p["title"])}</td><td>{esc(p["space"])}</td><td class="r">{esc(p["lastModified"] or "—")}</td></tr>'
                       for p in r["orphans"])
             + "</tbody></table></div>")

    # --- verantwoording ---
    P.append('<h2><span class="num">D</span>Bronnen en kanttekeningen</h2><div class="card" style="font-size:12.5px"><ul style="margin:0;padding-left:18px">'
             f'<li>Paginaweergaven en zoekopdrachten: Refined-exports «Page views events» en «Search events» (site 1564), {d_long(s)} – {d_long(e)}. '
             'Gebruikers en groepen: Atlassian-gebruikersexport. Pagina-inventaris: Confluence (spaces Helpdesk en Test Space IT).</li>'
             '<li>«Actief» betekent: minstens één pagina geopend. Wie inlogt maar niets opent, telt niet mee. '
             'Atlassian\'s eigen «laatst actief» mist bezoeken via de Refined-site en is daarom niet gebruikt.</li>'
             + (f'<li>Het gedeelde beheerdersaccount {", ".join(esc(x) for x in r["admin_names"])} is goed voor {n(r["admin_views"])} weergaven. '
                'Die tellen mee in de totalen, maar zeggen weinig over individueel gebruik.</li>' if r["admin_views"] else "")
             + '<li>«Niet bekeken pagina\'s» vergelijkt alleen Confluence-pagina\'s; de landingspagina\'s van de Refined-site zelf staan niet in de inventaris.</li>'
             '<li>Downloads van bijlagen zitten niet in deze exports.</li></ul></div>')
    P.append('<div class="privacy" style="margin-top:14px"><b>Vertrouwelijk.</b> Dit rapport bevat namen en leesgedrag van '
             'individuele gebruikers. Gebruik het alleen voor contentverbetering en adoptie, niet voor beoordeling van personen, '
             'en deel de bijlagen alleen met wie ermee aan de slag gaat.</div>')
    P.append(f'<footer>Gegenereerd met rapport.py uit de kennisbank-analytics-pijplijn · {d_long(datetime.now(TZ))}</footer>')

    return (f'<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8">'
            f'<meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<title>Kennisbank-rapport {d_short(s)} – {d_short(e)} {e.year}</title><style>{CSS}</style></head>'
            f'<body><div class="wrap">{"".join(P)}</div></body></html>')


def main():
    r = analyse()
    OUT.write_text(build_html(r), encoding="utf-8")
    print(f"Rapport: {OUT}  (openen in de browser; Ctrl+P → Opslaan als PDF)")


if __name__ == "__main__":
    main()
