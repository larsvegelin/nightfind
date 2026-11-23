#!/usr/bin/env python3
"""Kort rapport kennisbank-gebruik in de huisstijl van De Waerdse.

Twee samenvattende pagina's A4 plus twee bijlagen: ingelogde gebruikers (met
weergaven, pagina's en zoekopdrachten) en niet-ingelogde gebruikers, per categorie.

Gebruik:
    python3 rapport_kort.py       # na etl.py; schrijft rapport_kort.html

Open het HTML-bestand in de browser en kies Afdrukken → Opslaan als PDF
(papierformaat A4, marges «Geen», achtergrondafbeeldingen aan).
Het logo wordt gelezen uit input/brand/logo-dewaerdse.png (optioneel).
"""
import base64
import collections
import json
from datetime import datetime

import rapport
from rapport import TZ, esc, n, pct

OUT = rapport.etl.BASE / "rapport_kort.html"
LOGO = rapport.etl.BASE / "input" / "brand" / "logo-dewaerdse.png"

# Technische Atlassian-groepen die geen klant of afdeling zijn.
TECHNICAL_GROUPS = {"Confluence", "Test groep IT", "Totale Lijst"}
NO_CATEGORY = "Zonder categorie"

MONTHS = rapport.MONTHS_NL
GROEN, GROEN40, GOUD = "#00441D", "#99B4A5", "#FFC000"


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


def categories(person) -> list:
    return sorted((g for g in person["groups"] if g not in TECHNICAL_GROUPS), key=str.lower) or [NO_CATEGORY]


# ---------------------------------------------------------------------------
# Grafieken
# ---------------------------------------------------------------------------
def month_chart(months) -> str:
    W, H, pl, pr, pt, pb = 640, 132, 10, 10, 22, 40
    top = max(m["users"] for m in months) * 1.15
    slot = (W - pl - pr) / len(months)
    bw = min(96, slot * 0.56)
    y0 = H - pb
    out = [f'<svg viewBox="0 0 {W} {H}" class="chart" role="img" aria-label="Ingelogde gebruikers per maand">']
    out.append(f'<line x1="{pl}" x2="{W - pr}" y1="{y0}" y2="{y0}" stroke="#B4B4B4" stroke-width="1"/>')
    for i, m in enumerate(months):
        cx = pl + slot * i + slot / 2
        h = (H - pt - pb) * m["users"] / top
        fill = GROEN40 if m["partial"] else GROEN
        out.append(f'<rect x="{cx - bw / 2:.1f}" y="{y0 - h:.1f}" width="{bw:.1f}" height="{h:.1f}" fill="{fill}"/>')
        out.append(f'<text x="{cx:.1f}" y="{y0 - h - 8:.1f}" text-anchor="middle" class="val">{m["users"]}</text>')
        out.append(f'<text x="{cx:.1f}" y="{y0 + 18}" text-anchor="middle" class="lbl">{m["label"].split()[0].capitalize()}</text>')
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


def minibar(p) -> str:
    return f'<div class="mini"><div style="width:{p}%"></div></div>'


# ---------------------------------------------------------------------------
# Opmaak
# ---------------------------------------------------------------------------
CSS = """
@page{size:A4;margin:0}
:root{--groen:#00441D;--groen40:#99B4A5;--groen20:#CCDAD2;--goud:#FFC000;--grijs:#E6E6E6;--wit:#F8F8F8;
--ink:#000;--ink2:#3c3c3c}
*{box-sizing:border-box}
html,body{margin:0;background:#d9d9d9}
body{font-family:Arial,"Liberation Sans",Helvetica,sans-serif;color:var(--ink);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:210mm;height:297mm;margin:12mm auto;background:var(--wit);position:relative;overflow:hidden;break-after:page}
.content{position:absolute;top:15mm;left:16mm;right:16mm;bottom:19mm;overflow:hidden}
.flow{display:none}
.page:last-child{break-after:auto}
@media print{html,body{background:var(--wit)}.page{margin:0}}
.band{position:absolute;left:0;right:0;bottom:0;height:13mm;background:var(--groen);color:#fff;
font-size:8.5pt;display:flex;align-items:center;justify-content:space-between;padding:0 16mm}
.head{display:flex;align-items:center;gap:7mm;margin-bottom:5mm}
.head img{width:24mm;height:auto}
.mega{font-size:40pt;color:var(--groen);line-height:1;margin:0;font-weight:500}
.kop{font-size:24pt;color:var(--groen);line-height:1.1;margin:0 0 5mm;font-weight:500}
.pre{font-size:13pt;margin:2mm 0 0}
.intro{font-size:11.5pt;line-height:1.45;text-align:justify;margin:0 0 5mm}
h2{font-size:13pt;font-weight:700;margin:0 0 1.5mm}
.note{font-size:8.5pt;color:var(--ink2);margin:1.5mm 0 0;line-height:1.35}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm;margin:0 0 5mm}
.kpi{text-align:center}
.circle{width:26mm;height:26mm;border-radius:50%;margin:0 auto 2.5mm;display:flex;align-items:center;justify-content:center;
font-size:19pt;font-weight:700}
.c-groen{background:var(--groen);color:#fff}
.c-goud{background:var(--goud);color:#000}
.c-rand{border:2.5px solid var(--groen);color:var(--groen)}
.c-rand-goud{border:2.5px solid var(--goud);color:#000}
.kpi .t{font-size:10pt;font-weight:700;line-height:1.25}
.kpi .s{font-size:8.5pt;color:var(--ink2);line-height:1.3;margin-top:.5mm}
.box{background:#fff;border:1px solid var(--grijs);padding:4.5mm 6mm;margin:0 0 4.5mm}
.chart{display:block;width:100%;height:auto}
.chart .val{font:700 11pt Arial,"Liberation Sans",sans-serif;fill:#000}
.chart .lbl{font:10pt Arial,"Liberation Sans",sans-serif;fill:#000}
.chart .sub{font:8.5pt Arial,"Liberation Sans",sans-serif;fill:#6b6b6b}
.hbars{display:flex;flex-direction:column;gap:1.7mm;margin-top:2.5mm}
.hrow{display:grid;grid-template-columns:50mm 1fr 34mm;gap:3mm;align-items:center;font-size:9.5pt}
.hname{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.htrack{height:3.6mm;background:var(--grijs)}
.hfill{height:100%}
.hval{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.two{display:grid;grid-template-columns:1fr 1fr;gap:6mm}
ul.dash{list-style:none;padding:0;margin:1.5mm 0 0}
ul.dash li{position:relative;padding-left:6mm;margin:1.3mm 0;font-size:10pt;line-height:1.38}
ul.dash li::before{content:"-";position:absolute;left:0}
.legend{font-size:8.5pt;color:var(--ink2);display:flex;gap:5mm;margin-top:1mm}
.sw{display:inline-block;width:3mm;height:3mm;margin-right:1.5mm;vertical-align:-0.3mm}
table.tbl{width:100%;border-collapse:collapse;font-size:9pt}
.tbl th{text-align:left;font-weight:700;font-size:8.5pt;padding:1.6mm 2mm;border-bottom:1.5px solid var(--groen);white-space:nowrap}
.tbl td{padding:1.25mm 2mm;border-bottom:1px solid var(--grijs);vertical-align:middle}
.tbl.people{table-layout:fixed}
.tbl.people td{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tbl.people td.cat{white-space:normal;line-height:1.25}
.tbl.people th:nth-child(1){width:44mm}.tbl.people th:nth-child(2){width:46mm}.tbl.people th:nth-child(3){width:19mm}
.tbl.people th:nth-child(4){width:16mm}.tbl.people th:nth-child(5){width:24mm}.tbl.people th:nth-child(6){width:29mm}
.tbl .r{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.tbl .cat{color:var(--ink2);font-size:8.5pt}
.tbl tr.total td{font-weight:700;border-top:1.5px solid var(--groen);border-bottom:none}
.tbl tr.zc td{color:var(--ink2)}
.mini{width:15mm;height:3mm;background:var(--grijs);display:inline-block;vertical-align:-0.4mm;margin-right:2mm}
.mini div{height:100%;background:var(--groen)}
.nb{display:inline-block;min-width:7mm}
.nw{white-space:nowrap}
.namegroup{margin:0 0 3.5mm}
.namegroup h3{font-size:10pt;margin:0 0 1.2mm;padding-bottom:1mm;border-bottom:1.5px solid var(--groen)}
.names{display:grid;grid-template-columns:repeat(3,1fr);gap:0 6mm;font-size:9pt;line-height:1.55}
.names span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
"""


# ---------------------------------------------------------------------------
# Inhoud
# ---------------------------------------------------------------------------
def category_rows(people):
    rows = collections.OrderedDict()
    for p in people:
        for c in categories(p):
            rw = rows.setdefault(c, {"cat": c, "total": 0, "in": 0, "out": 0, "views": 0})
            rw["total"] += 1
            rw["in" if p["active"] else "out"] += 1
            rw["views"] += p["views"]
    out = sorted((r for r in rows.values() if r["cat"] != NO_CATEGORY), key=lambda r: (-r["total"], r["cat"].lower()))
    if NO_CATEGORY in rows:
        out.append(rows[NO_CATEGORY])
    return out


def category_table(people) -> str:
    rows = category_rows(people)
    tot_in = sum(p["active"] for p in people)
    tot = {"cat": "Totaal", "total": len(people), "in": tot_in,
           "out": len(people) - tot_in, "views": sum(p["views"] for p in people)}

    def tr(r, cls=""):
        share = pct(r["in"], r["total"])
        per = round(r["views"] / r["in"]) if r["in"] else 0
        return (f'<tr class="{cls}"><td class="nw">{esc(r["cat"])}</td><td class="r">{n(r["total"])}</td>'
                f'<td class="r">{n(r["in"])}</td><td class="r">{n(r["out"])}</td>'
                f'<td class="r">{minibar(share)}<span class="nb">{share}%</span></td>'
                f'<td class="r">{n(r["views"])}</td><td class="r">{n(per) if r["in"] else "-"}</td></tr>')

    return ('<table class="tbl"><thead><tr><th>Categorie</th><th class="r">Accounts</th><th class="r">Ingelogd</th>'
            '<th class="r">Niet ingelogd</th><th class="r">Aandeel ingelogd</th><th class="r">Weergaven</th>'
            '<th class="r">Per ingelogde</th></tr></thead><tbody>'
            + "".join(tr(r, "zc" if r["cat"] == NO_CATEGORY else "") for r in rows)
            + tr(tot, "total") + "</tbody></table>")


def flow_logged_in(people) -> str:
    """Bijlage A als «flow»: de paginaverdeling gebeurt in de browser (zie PAGINATE_JS)."""
    act = sorted((p for p in people if p["active"]), key=lambda p: (-p["views"], p["name"].lower()))
    first = (f'<h1 class="kop">Bijlage A · Ingelogde gebruikers</h1>'
             f'<p class="intro" style="font-size:10pt">{n(len(act))} personen openden in de periode minimaal één pagina. '
             'Weergaven: het aantal keer dat een pagina is geopend (elke klik op een pagina telt als één weergave). '
             'Pagina\'s: het aantal verschillende pagina\'s. Gesorteerd op het aantal weergaven.</p>')
    cont = '<h1 class="kop" style="font-size:16pt">Bijlage A · Ingelogde gebruikers (vervolg)</h1>'
    thead = ('<thead><tr><th>Naam</th><th>Categorie</th><th class="r">Weergaven</th>'
             '<th class="r">Pagina\'s</th><th class="r">Zoekopdrachten</th><th class="r">Laatst ingelogd</th></tr></thead>')
    rows = "".join(
        f'<tr class="unit"><td>{esc(p["name"])}</td><td class="cat">{esc(", ".join(categories(p)))}</td>'
        f'<td class="r">{n(p["views"])}</td><td class="r">{n(p["pages"])}</td><td class="r">{n(p["searches"])}</td>'
        f'<td class="r">{d_day_month(p["last"])}</td></tr>' for p in act)
    return (f'<div class="flow" data-kind="table"><div class="first-head">{first}</div><div class="cont-head">{cont}</div>'
            f'<table class="tbl people">{thead}<tbody>{rows}</tbody></table></div>')


def flow_not_logged_in(people) -> str:
    groups = collections.defaultdict(list)
    for p in people:
        if not p["active"]:
            groups[rapport.nl_join(categories(p))].append(p["name"])
    order = sorted(groups.items(), key=lambda kv: (kv[0] == NO_CATEGORY, -len(kv[1]), kv[0].lower()))
    total = sum(len(v) for v in groups.values())
    first = (f'<h1 class="kop">Bijlage B · Niet ingelogd</h1><p class="intro" style="font-size:10pt">'
             f'{n(total)} accounts met toegang hebben in de periode geen enkele pagina geopend. Iedere persoon staat '
             'één keer vermeld, bij de combinatie van categorieën waarin hij of zij zit.</p>')
    cont = '<h1 class="kop" style="font-size:16pt">Bijlage B · Niet ingelogd (vervolg)</h1>'
    blocks = "".join(
        f'<div class="unit namegroup" data-title="{esc(cat)} ({len(names)})"><h3>{esc(cat)} ({len(names)})</h3>'
        f'<div class="names">' + "".join(f"<span>{esc(x)}</span>" for x in sorted(names, key=str.lower)) + "</div></div>"
        for cat, names in order)
    return (f'<div class="flow" data-kind="blocks"><div class="first-head">{first}</div><div class="cont-head">{cont}</div>'
            f'<div class="blocks">{blocks}</div></div>')


BAND = '<div class="band"><span>De Waerdse Assuradeuren · Gebruik kennisbank</span><span class="pnum"></span></div>'

# Verdeelt de bijlagen over A4-pagina's op basis van de werkelijke hoogte en nummert daarna alle pagina's.
PAGINATE_JS = """
(function(){
  const BAND = %s;
  function newPage(headHTML){
    const s = document.createElement('section'); s.className = 'page';
    s.innerHTML = '<div class="content">' + headHTML + '</div>' + BAND;
    document.body.appendChild(s);
    return s.querySelector('.content');
  }
  const over = c => c.scrollHeight > c.clientHeight + 1;
  document.querySelectorAll('.flow').forEach(flow => {
    const first = flow.querySelector('.first-head').innerHTML;
    const cont = flow.querySelector('.cont-head').innerHTML;
    if (flow.dataset.kind === 'table') {
      const thead = flow.querySelector('thead').outerHTML, cls = flow.querySelector('table').className;
      const rows = [...flow.querySelectorAll('tr.unit')];
      let c = newPage(first), tb = null;
      const startTable = () => { c.insertAdjacentHTML('beforeend', '<table class="' + cls + '">' + thead + '<tbody></tbody></table>');
                                 tb = c.querySelector('table:last-of-type tbody'); };
      startTable();
      rows.forEach(r => { tb.appendChild(r); if (over(c)) { tb.removeChild(r); c = newPage(cont); startTable(); tb.appendChild(r); } });
    } else {
      const blocks = [...flow.querySelectorAll('.unit')];
      let c = newPage(first);
      blocks.forEach(b => {
        c.appendChild(b);
        if (!over(c)) return;
        c.removeChild(b);
        const title = b.dataset.title, names = [...b.querySelectorAll('.names span')];
        let blk = null, box = null;
        const startBlock = (suffix) => {
          c.insertAdjacentHTML('beforeend', '<div class="namegroup"><h3>' + title + suffix + '</h3><div class="names"></div></div>');
          blk = c.lastElementChild; box = blk.querySelector('.names');
        };
        startBlock('');
        if (over(c)) { c.removeChild(blk); c = newPage(cont); startBlock(''); }
        names.forEach(nm => { box.appendChild(nm); if (over(c)) { box.removeChild(nm); c = newPage(cont); startBlock(' (vervolg)'); box.appendChild(nm); } });
      });
    }
    flow.remove();
  });
  const pages = document.querySelectorAll('section.page');
  pages.forEach((p, i) => { p.querySelector('.pnum').textContent = (i + 1) + ' / ' + pages.length; });
})();
"""


def build(r) -> str:
    s, e = r["start"], r["end"]
    period = f"{d_day_month(s)} tot en met {d_long(e)}"
    people = r["people"]
    n_in = sum(p["active"] for p in people)
    n_out = len(people) - n_in
    zero_pct = pct(r["zero_total"], r["searches"])
    full = [m for m in r["months"] if not m["partial"]]
    last = r["months"][-1]
    logo = ""
    if LOGO.exists():
        logo = f'<img src="data:image/png;base64,{base64.b64encode(LOGO.read_bytes()).decode()}" alt="Logo De Waerdse Assuradeuren">'

    cats = [c for c in category_rows(people) if c["cat"] != NO_CATEGORY and c["total"] >= 5]
    low = sorted(cats, key=lambda c: pct(c["in"], c["total"]))[:2]
    no_cat = next((c for c in category_rows(people) if c["cat"] == NO_CATEGORY), None)
    gap_terms = [z["term"] for z in r["zero_terms"][:3]]

    # ---------------- pagina 1 ----------------
    p1 = [f'<div class="head">{logo}<div><h1 class="mega">Kennisbank</h1>'
          f'<p class="pre">Rapportage gebruik · {period}</p></div></div>']
    p1.append(f'<p class="intro">Van de {n(len(people))} accounts met toegang hebben er {n(n_in)} ingelogd en minimaal '
              f'één pagina geopend; {n(n_out)} accounts hebben in deze periode niet ingelogd. Samen bekeken de ingelogde '
              f'gebruikers {n(r["views"])} keer een pagina.</p>')
    kp = [
        ("c-groen", n(n_in), "Ingelogd", f"{pct(n_in, len(people))}% van {n(len(people))} accounts"),
        ("c-goud", n(n_out), "Niet ingelogd", f"{pct(n_out, len(people))}% van {n(len(people))} accounts"),
        ("c-rand", n(r["views"]), "Paginaweergaven", f"Gemiddeld {round(r['views'] / n_in)} per ingelogde gebruiker"),
        ("c-rand-goud", f"{zero_pct}%", "Zoeken zonder resultaat", f"{n(r['zero_total'])} van {n(r['searches'])} zoekopdrachten"),
    ]
    p1.append('<div class="kpis">' + "".join(
        f'<div class="kpi"><div class="circle {c}">{v}</div><div class="t">{t}</div><div class="s">{sub}</div></div>'
        for c, v, t, sub in kp) + "</div>")
    p1.append('<div class="box"><h2>Ingelogd en niet ingelogd per categorie</h2>'
              + category_table(people)
              + '<div class="note">Ingelogd betekent: minimaal één pagina geopend in de periode. Wie in meerdere categorieën '
                'zit, telt bij elke categorie mee; de totaalregel telt iedere persoon één keer. «Per ingelogde» is het '
                'gemiddeld aantal weergaven per ingelogde gebruiker. Namen staan in bijlage A en B.</div></div>')
    p1.append(f'<p class="note" style="margin-top:0">Bron: Refined (paginaweergaven en zoekopdrachten) en Atlassian '
              f'(gebruikers en categorieën), {period}. Technische groepen ({rapport.nl_join(sorted(TECHNICAL_GROUPS))}) '
              f'tellen niet als categorie. Refined registreert het openen van pagina\'s; andere klikken worden niet '
              f'vastgelegd. Opgesteld op {d_long(datetime.now(TZ))}. Vertrouwelijk: bijlage A en B bevatten namen.</p>')

    # ---------------- pagina 2 ----------------
    p2 = ['<h1 class="kop">Trend, inhoud en zoekgedrag</h1>']
    p2.append('<div class="box"><h2>Ingelogde gebruikers per maand</h2>' + month_chart(r["months"])
              + f'<div class="legend"><span><span class="sw" style="background:{GROEN}"></span>Volledige maand</span>'
                f'<span><span class="sw" style="background:{GROEN40}"></span>Deel van de maand in de meetperiode</span></div></div>')
    p2.append('<div class="box"><h2>Meest gelezen pagina\'s</h2>'
              + hbars(r["top_pages"][:7], "views", lambda p: esc(p["title"]), GROEN,
                      value_fmt=lambda p: f'<b>{n(p["views"])}</b> &nbsp;{p["users"]} personen')
              + "</div>")
    p2.append('<div class="box"><h2>Zoekopdrachten zonder resultaat</h2>'
              '<div class="note" style="margin:0">Aantal verschillende gebruikers dat op deze term zocht en niets vond.</div>'
              + hbars(r["zero_terms"][:7], "users", lambda z: esc(z["term"]), GOUD,
                      value_fmt=lambda z: f'<b>{z["users"]}</b> {"persoon" if z["users"] == 1 else "personen"}')
              + "</div>")
    conclusions = []
    if len(full) >= 2:
        conclusions.append(f"het gebruik groeit: van {full[0]['users']} ingelogde gebruikers in {full[0]['label'].split()[0]} "
                           f"naar {full[-1]['users']} in {full[-1]['label'].split()[0]}"
                           + (f"; in {last['label'].split()[0]} na {last['span']} dagen al {last['users']}"
                              if last["partial"] and last["span"] >= 7 else ""))
    conclusions.append(f"{n(n_out)} van de {n(len(people))} accounts hebben niet ingelogd"
                       + (", relatief het meest bij " + rapport.nl_join(
                           [f"{esc(c['cat'])} ({c['out']} van {c['total']})" for c in low]) if low else ""))
    conclusions.append("één op de zes zoekopdrachten levert niets op, onder andere bij "
                       + rapport.nl_join([f"«{esc(t)}»" for t in gap_terms]))
    actions = [
        "de niet-ingelogde accounts per categorie benaderen (bijlage B)",
        "pagina's aanvullen of synoniemen toevoegen voor de zoektermen zonder resultaat",
    ]
    if no_cat and no_cat["total"]:
        actions.append(f"de {n(no_cat['total'])} accounts zonder categorie indelen")
    p2.append('<div class="two"><div><h2>Conclusies</h2>' + nl_list(conclusions) + "</div>"
              '<div><h2>Aanbevelingen</h2>' + nl_list(actions) + "</div></div>")

    body = "".join(f'<section class="page"><div class="content">{p}</div>{BAND}</section>' for p in ("".join(p1), "".join(p2)))
    body += flow_logged_in(people) + flow_not_logged_in(people)
    script = PAGINATE_JS % json.dumps(BAND)
    return (f'<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8">'
            f'<meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<title>Kennisbank – rapportage {d_day_month(s)} tot en met {d_long(e)}</title>'
            f'<style>{CSS}</style></head><body>{body}<script>{script}</script></body></html>')


def main():
    r = rapport.analyse()
    OUT.write_text(build(r), encoding="utf-8")
    print(f"Kort rapport: {OUT}")


if __name__ == "__main__":
    main()
