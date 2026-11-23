#!/usr/bin/env python3
"""Kort rapport kennisbank-gebruik in de huisstijl van De Waerdse (2 pagina's A4).

Gebruik:
    python3 rapport_kort.py       # na etl.py; schrijft rapport_kort.html

Open het HTML-bestand in de browser en kies Afdrukken → Opslaan als PDF
(papierformaat A4, marges «Geen», achtergrondafbeeldingen aan).
Het logo wordt gelezen uit input/brand/logo-dewaerdse.png (optioneel).
"""
import base64
from datetime import datetime

import rapport
from rapport import NO_GROUP, TZ, esc, n, pct

OUT = rapport.etl.BASE / "rapport_kort.html"
LOGO = rapport.etl.BASE / "input" / "brand" / "logo-dewaerdse.png"

# Technische Atlassian-groepen die geen klant of afdeling zijn.
TECHNICAL_GROUPS = {"Confluence", "Test groep IT", "Totale Lijst"}

MONTHS = rapport.MONTHS_NL


def d_long(dt) -> str:
    return f"{dt.day} {MONTHS[dt.month - 1]} {dt.year}"


def d_day_month(dt) -> str:
    return f"{dt.day} {MONTHS[dt.month - 1]}"


def nl_list(items: list) -> str:
    """Opsomming volgens de schrijfwijzer: streepjes, hoofdletter, «;» en «.» aan het eind."""
    out = []
    for i, it in enumerate(items):
        it = it[0].upper() + it[1:]
        out.append(f"<li>{it}{'.' if i == len(items) - 1 else ';'}</li>")
    return '<ul class="dash">' + "".join(out) + "</ul>"


# ---------------------------------------------------------------------------
# Grafieken
# ---------------------------------------------------------------------------
def month_chart(months) -> str:
    W, H, pl, pr, pt, pb = 640, 170, 10, 10, 24, 42
    top = max(m["users"] for m in months) * 1.15
    slot = (W - pl - pr) / len(months)
    bw = min(96, slot * 0.56)
    y0 = H - pb
    out = [f'<svg viewBox="0 0 {W} {H}" class="chart" role="img" aria-label="Actieve gebruikers per maand">']
    out.append(f'<line x1="{pl}" x2="{W - pr}" y1="{y0}" y2="{y0}" stroke="#B4B4B4" stroke-width="1"/>')
    for i, m in enumerate(months):
        cx = pl + slot * i + slot / 2
        h = (H - pt - pb) * m["users"] / top
        x = cx - bw / 2
        fill = "#99B4A5" if m["partial"] else "#00441D"
        r = 0
        out.append(f'<path d="M{x:.1f},{y0} V{y0 - h + r:.1f} Q{x:.1f},{y0 - h:.1f} {x + r:.1f},{y0 - h:.1f} '
                   f'H{x + bw - r:.1f} Q{x + bw:.1f},{y0 - h:.1f} {x + bw:.1f},{y0 - h + r:.1f} V{y0} Z" fill="{fill}"/>')
        out.append(f'<text x="{cx:.1f}" y="{y0 - h - 8:.1f}" text-anchor="middle" class="val">{m["users"]}</text>')
        name = m["label"].split()[0].capitalize()
        out.append(f'<text x="{cx:.1f}" y="{y0 + 18}" text-anchor="middle" class="lbl">{name}</text>')
        if m["partial"]:
            out.append(f'<text x="{cx:.1f}" y="{y0 + 33}" text-anchor="middle" class="sub">{m["span"]} dagen</text>')
    out.append("</svg>")
    return "".join(out)


def hbars(rows, value_key, label_fn, color, max_value=None, value_fmt=None) -> str:
    mx = max_value or max(r[value_key] for r in rows) or 1
    out = ['<div class="hbars">']
    for r in rows:
        w = 100 * r[value_key] / mx
        out.append(f'<div class="hrow"><div class="hname">{label_fn(r)}</div>'
                   f'<div class="htrack"><div class="hfill" style="width:{w:.1f}%;background:{color}"></div></div>'
                   f'<div class="hval">{value_fmt(r) if value_fmt else n(r[value_key])}</div></div>')
    out.append("</div>")
    return "".join(out)


# ---------------------------------------------------------------------------
# Pagina
# ---------------------------------------------------------------------------
CSS = """
@page{size:A4;margin:0}
:root{--groen:#00441D;--groen80:#316648;--groen60:#628C74;--groen40:#99B4A5;--groen20:#CCDAD2;
--goud:#FFC000;--goud60:#FBD663;--grijs:#E6E6E6;--wit:#F8F8F8;--ink:#000;--ink2:#3c3c3c}
*{box-sizing:border-box}
html,body{margin:0;background:#d9d9d9}
body{font-family:Arial,"Liberation Sans",Helvetica,sans-serif;color:var(--ink);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:210mm;height:297mm;margin:12mm auto;background:var(--wit);position:relative;overflow:hidden;
padding:16mm 16mm 0;break-after:page}
.page:last-child{break-after:auto}
@media print{html,body{background:var(--wit)}.page{margin:0}}
.band{position:absolute;left:0;right:0;bottom:0;height:13mm;background:var(--groen);color:#fff;
font-size:8.5pt;display:flex;align-items:center;justify-content:space-between;padding:0 16mm}
.head{display:flex;align-items:center;gap:7mm;margin-bottom:5mm}
.head img{width:24mm;height:auto}
.mega{font-size:40pt;color:var(--groen);line-height:1;margin:0;font-weight:500}
.pre{font-size:13pt;margin:2mm 0 0}
.intro{font-size:12pt;line-height:1.45;text-align:justify;margin:0 0 6mm}
h2{font-size:13pt;font-weight:700;margin:0 0 1.5mm}
.note{font-size:8.5pt;color:var(--ink2);margin:1.5mm 0 0;line-height:1.35}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm;margin:0 0 6mm}
.kpi{text-align:center}
.circle{width:27mm;height:27mm;border-radius:50%;margin:0 auto 2.5mm;display:flex;align-items:center;justify-content:center;
font-size:20pt;font-weight:700}
.c-groen{background:var(--groen);color:#fff}
.c-goud{background:var(--goud);color:#000}
.c-rand{border:2.5px solid var(--groen);color:var(--groen)}
.c-rand-goud{border:2.5px solid var(--goud);color:#000}
.kpi .t{font-size:10pt;font-weight:700;line-height:1.25}
.kpi .s{font-size:8.5pt;color:var(--ink2);line-height:1.3;margin-top:.5mm}
.box{background:#fff;border:1px solid var(--grijs);padding:4.5mm 6mm;margin:0 0 5mm}
.chart{display:block;width:100%;height:auto}
.chart .val{font:700 11pt Arial,"Liberation Sans",sans-serif;fill:#000}
.chart .lbl{font:10pt Arial,"Liberation Sans",sans-serif;fill:#000}
.chart .sub{font:8.5pt Arial,"Liberation Sans",sans-serif;fill:#6b6b6b}
.hbars{display:flex;flex-direction:column;gap:1.8mm;margin-top:2.5mm}
.hrow{display:grid;grid-template-columns:50mm 1fr 34mm;gap:3mm;align-items:center;font-size:9.5pt}
.hname{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.htrack{height:3.8mm;background:var(--grijs)}
.hfill{height:100%}
.hval{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.two{display:grid;grid-template-columns:1fr 1fr;gap:6mm}
.two .hrow{grid-template-columns:30mm 1fr 15mm}
ul.dash{list-style:none;padding:0;margin:2mm 0 0}
ul.dash li{position:relative;padding-left:6mm;margin:1.6mm 0;font-size:10.5pt;line-height:1.4}
ul.dash li::before{content:"-";position:absolute;left:0}
.legend{font-size:8.5pt;color:var(--ink2);display:flex;gap:5mm;margin-top:1mm}
.sw{display:inline-block;width:3mm;height:3mm;margin-right:1.5mm;vertical-align:-0.3mm}
"""


def build(r) -> str:
    s, e = r["start"], r["end"]
    period = f"{d_day_month(s)} tot en met {d_long(e)}"
    adoption = pct(r["active"], r["target"])
    zero_pct = pct(r["zero_total"], r["searches"])
    full = [m for m in r["months"] if not m["partial"]]
    logo = ""
    if LOGO.exists():
        logo = f'<img src="data:image/png;base64,{base64.b64encode(LOGO.read_bytes()).decode()}" alt="Logo De Waerdse Assuradeuren">'

    groups = [dict(g, adoption=pct(g["active"], g["members"])) for g in r["groups"]
              if g["group"] not in TECHNICAL_GROUPS and g["group"] != NO_GROUP]
    groups.sort(key=lambda g: (-g["adoption"], -g["members"]))
    no_group = next((g for g in r["groups"] if g["group"] == NO_GROUP), None)
    low = sorted((g for g in groups if g["members"] >= 5), key=lambda g: pct(g["active"], g["members"]))[:2]

    growth = ""
    if len(full) >= 2:
        growth = (f"van {full[0]['users']} actieve gebruikers in {full[0]['label'].split()[0]} "
                  f"naar {full[-1]['users']} in {full[-1]['label'].split()[0]}")
    last = r["months"][-1]
    gap_terms = [z["term"] for z in r["zero_terms"][:3]]

    band = (f'<div class="band"><span>De Waerdse Assuradeuren · Gebruik kennisbank</span>'
            f'<span>{{page}} / 2</span></div>')

    # ---------------- pagina 1 ----------------
    p1 = [f'<div class="head">{logo}<div><h1 class="mega">Kennisbank</h1>'
          f'<p class="pre">Rapportage gebruik · {period}</p></div></div>']
    p1.append(f'<p class="intro">In deze periode openden {n(r["active"])} gebruikers de kennisbank, samen '
              f'{n(r["views"])} keer. Het gebruik groeit maand op maand. Wel levert één op de zes zoekopdrachten '
              f'niets op, en ruim zes op de tien accounts gebruiken de kennisbank nog niet.</p>')
    kp = [
        ("c-groen", n(r["active"]), "Actieve gebruikers", "Opende minimaal één pagina"),
        ("c-goud", f"{adoption}%", "Van alle accounts", f"{n(r['active'])} van de {n(r['target'])} accounts"),
        ("c-rand", n(r["views"]), "Paginaweergaven", f"Gemiddeld {round(r['views'] / r['active'])} per gebruiker"),
        ("c-rand-goud", f"{zero_pct}%", "Zoeken zonder resultaat", f"{n(r['zero_total'])} van {n(r['searches'])} zoekopdrachten"),
    ]
    p1.append('<div class="kpis">' + "".join(
        f'<div class="kpi"><div class="circle {c}">{v}</div><div class="t">{t}</div><div class="s">{sub}</div></div>'
        for c, v, t, sub in kp) + "</div>")
    p1.append('<div class="box"><h2>Actieve gebruikers per maand</h2>'
              + month_chart(r["months"])
              + '<div class="legend"><span><span class="sw" style="background:#00441D"></span>Volledige maand</span>'
                '<span><span class="sw" style="background:#99B4A5"></span>Deel van de maand in de meetperiode</span></div></div>')
    p1.append('<div class="box"><h2>Gebruik per groep</h2>'
              '<div class="note" style="margin:0">Aandeel van de leden dat de kennisbank minimaal één keer opende.</div>'
              + hbars(groups, "adoption",
                      lambda g: esc(g["group"]), "#00441D", max_value=100,
                      value_fmt=lambda g: f'<b>{g["adoption"]}%</b> &nbsp;{g["active"]} van {g["members"]}')
              + "</div>")
    p1_html = "".join(p1)

    # ---------------- pagina 2 ----------------
    top_pages = r["top_pages"][:10]
    zero = r["zero_terms"][:10]
    p2 = ['<h1 class="mega" style="font-size:28pt;margin-bottom:6mm">Wat er gelezen en gezocht wordt</h1>']
    p2.append('<div class="box"><h2>Meest gelezen pagina\'s</h2>'
              + hbars(top_pages, "views", lambda p: esc(p["title"]), "#00441D",
                      value_fmt=lambda p: f'<b>{n(p["views"])}</b> &nbsp;{p["users"]} personen')
              + "</div>")
    p2.append('<div class="box"><h2>Zoekopdrachten zonder resultaat</h2>'
              '<div class="note" style="margin:0">Aantal verschillende gebruikers dat op deze term zocht en niets vond.</div>'
              + hbars(zero, "users", lambda z: esc(z["term"]), "#FFC000",
                      value_fmt=lambda z: f'<b>{z["users"]}</b> {"persoon" if z["users"] == 1 else "personen"}')
              + "</div>")

    conclusions = []
    if growth:
        conclusions.append(f"het gebruik groeit: {growth}"
                           + (f"; in {last['label'].split()[0]} waren dat er na {last['span']} dagen al {last['users']}"
                              if last["partial"] and last["span"] >= 7 else ""))
    conclusions.append(f"{adoption}% van de accounts gebruikt de kennisbank"
                       + (", het minst bij " + rapport.nl_join([f"{esc(g['group'])} ({pct(g['active'], g['members'])}%)" for g in low]) if low else ""))
    conclusions.append(f"één op de zes zoekopdrachten levert niets op; onderwerpen als "
                       + rapport.nl_join([f"«{esc(t)}»" for t in gap_terms]) + " ontbreken of zijn slecht vindbaar")
    conclusions.append(f"{n(len(r['orphans']))} van de {n(r['inventory'])} pagina's zijn in deze periode door niemand geopend")
    actions = [
        "pagina's aanvullen of synoniemen toevoegen voor de zoektermen zonder resultaat",
        "groepen met een laag gebruik gericht informeren over de kennisbank",
        "ongelezen pagina's laten controleren: actueel houden, beter vindbaar maken of verwijderen",
    ]
    if no_group and no_group["members"]:
        actions.append(f"de {n(no_group['members'])} accounts zonder groep indelen, zodat het gebruik per klant volledig zichtbaar wordt")
    p2.append('<div class="two"><div><h2>Conclusies</h2>' + nl_list(conclusions) + "</div>"
              '<div><h2>Aanbevelingen</h2>' + nl_list(actions) + "</div></div>")
    p2.append(f'<p class="note" style="margin-top:6mm">Bron: Refined (paginaweergaven en zoekopdrachten) en Atlassian '
              f'(gebruikers en groepen), {period}. Een gebruiker telt als actief zodra hij of zij minimaal één pagina opende. '
              f'Technische groepen ({rapport.nl_join(sorted(TECHNICAL_GROUPS))}) zijn weggelaten'
              + (f"; {n(no_group['members'])} accounts zijn nog niet aan een groep gekoppeld" if no_group else "")
              + f'. Opgesteld op {d_long(datetime.now(TZ))}.</p>')

    pages = [p1_html, "".join(p2)]
    body = "".join(f'<section class="page">{p}{band.replace("{page}", str(i + 1))}</section>'
                   for i, p in enumerate(pages))
    return (f'<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8">'
            f'<meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<title>Kennisbank – rapportage {d_day_month(s)} tot en met {d_long(e)}</title>'
            f'<style>{CSS}</style></head><body>{body}</body></html>')


def main():
    r = rapport.analyse()
    OUT.write_text(build(r), encoding="utf-8")
    print(f"Kort rapport: {OUT}")


if __name__ == "__main__":
    main()
