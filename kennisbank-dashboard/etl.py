#!/usr/bin/env python3
"""ETL voor het kennisbank-analytics dashboard (Confluence + Refined).

Gebruik:
    python3 etl.py

Leest alle CSV's uit:
    input/pageviews/   Refined-exports "Page views events" (mogen overlappen; dedupliceren op event-id)
    input/users/       Atlassian org-export "export users" (rij per groep-lidmaatschap; nieuwste bestand wint)
    input/accounts/    Atlassian "managed accounts" export (aanvullend; nieuwste bestand wint)
    input/groups/      (optioneel) extra groepslidmaatschap: account_id,group_name

Schrijft:
    data/events.csv    append-only historie van alle ooit geziene events (gededupliceerd)
    dashboard.html     zelfstandig dashboard met de data ingebed (template.html + data)

Herhaalde imports zijn veilig: bestaande events worden niet dubbel geteld.
"""
import csv
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

BASE = Path(__file__).resolve().parent
INPUT_VIEWS = BASE / "input" / "pageviews"
INPUT_USERS = BASE / "input" / "users"
INPUT_ACCOUNTS = BASE / "input" / "accounts"
INPUT_GROUPS = BASE / "input" / "groups"
INPUT_PAGES = BASE / "input" / "pages"
STORE = BASE / "data" / "events.csv"
TEMPLATE = BASE / "template.html"
OUTPUT = BASE / "dashboard.html"

# Atlassian-systeemgroepen; alles wat hierop matcht is geen klant-/teamgroep
# en blijft buiten de groepsfilter van het dashboard.
FUNCTIONAL_GROUPS = {"org-admins"}
FUNCTIONAL_GROUP_SUFFIX = "-dewaerdse"

MONTHS_EN = {m: i + 1 for i, m in enumerate(
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"])}

EVENT_FIELDS = [
    "id", "timestamp_origin", "event_name", "visitor_id",
    "page_id", "page_title", "page_type", "account_id", "user_type", "site_id",
]


def parse_en_date(s: str) -> str:
    """'16 Dec 2025' → '2025-12-16'; 'Never accessed'/'None'/leeg → ''."""
    parts = (s or "").strip().split()
    if len(parts) != 3 or parts[1] not in MONTHS_EN:
        return ""
    return f"{parts[2]}-{MONTHS_EN[parts[1]]:02d}-{int(parts[0]):02d}"


def parse_pageviews_csv(path: Path) -> dict:
    """Parse één Refined-export. Robuust tegen twee bekende exportfouten:
    - losse ';' in kolomnamen en in timestamps (datum;tijd)
    - paginatitels met een komma die niet goed ge-escaped zijn (rij krijgt extra velden)
    """
    events = {}
    with open(path, newline="", encoding="utf-8-sig") as f:
        rows = list(csv.reader(f))
    if not rows:
        return events
    hdr = [h.replace(";", "").strip() for h in rows[0]]
    ncols = len(hdr)
    title_idx = hdr.index("page_title")
    for raw in rows[1:]:
        if not raw or not raw[0].strip():
            continue
        row = list(raw)
        if len(row) > ncols:
            extra = len(row) - ncols
            row[title_idx:title_idx + 1 + extra] = [",".join(row[title_idx:title_idx + 1 + extra])]
        rec = dict(zip(hdr, row))
        rec = {k: v.strip().strip('"').strip() for k, v in rec.items()}
        rec["timestamp_origin"] = rec.get("timestamp_origin", "").replace(";", " ")
        if rec.get("event_name") != "PageView":
            continue
        events[rec["id"]] = {k: rec.get(k, "") for k in EVENT_FIELDS}
    return events


def load_store() -> dict:
    if not STORE.exists():
        return {}
    with open(STORE, newline="", encoding="utf-8") as f:
        return {r["id"]: r for r in csv.DictReader(f)}


def save_store(events: dict) -> None:
    STORE.parent.mkdir(parents=True, exist_ok=True)
    ordered = sorted(events.values(), key=lambda e: e["timestamp_origin"])
    with open(STORE, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=EVENT_FIELDS)
        w.writeheader()
        w.writerows(ordered)


def load_org_users() -> tuple:
    """Nieuwste org-export "export users" (rij per groep-lidmaatschap).

    Geeft (users, memberships): users als lijst accounts, memberships als
    account_id → [groepsnamen] (zonder Atlassian-systeemgroepen).
    """
    files = sorted(INPUT_USERS.glob("*.csv")) if INPUT_USERS.exists() else []
    if not files:
        return [], {}
    with open(files[-1], newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    users, memberships = {}, {}
    for r in rows:
        uid = (r.get("User id") or "").strip()
        if not uid:
            continue
        conf_role = next((v.strip() for k, v in r.items() if k.startswith("Confluence -")), "")
        last_seen = next((v.strip() for k, v in r.items() if k.startswith("Last seen in Confluence -")), "")
        users.setdefault(uid, {
            "id": uid,
            "name": (r.get("User name") or "").strip(),
            "email": (r.get("email") or "").strip(),
            "status": (r.get("User status") or "").strip(),
            "confluenceAccess": conf_role not in ("", "None"),
            "atlassianLastActive": parse_en_date(last_seen),
        })
        g = (r.get("Group name") or "").strip()
        if g and g not in FUNCTIONAL_GROUPS and not g.endswith(FUNCTIONAL_GROUP_SUFFIX):
            memberships.setdefault(uid, [])
            if g not in memberships[uid]:
                memberships[uid].append(g)
    return list(users.values()), memberships


def load_accounts() -> list:
    """Nieuwste managed-accounts export (op bestandsnaam gesorteerd)."""
    files = sorted(INPUT_ACCOUNTS.glob("*.csv")) if INPUT_ACCOUNTS.exists() else []
    if not files:
        return []
    with open(files[-1], newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    conf_col = next((c for c in rows[0] if c.startswith("Last active on Confluence")), None) if rows else None
    out = []
    for r in rows:
        out.append({
            "id": r["Atlassian ID"].strip(),
            "name": r["Name"].strip(),
            "email": r["Email"].strip(),
            "status": r["Status"].strip(),
            "confluenceAccess": bool(r.get("Confluence", "").strip() or r.get("Confluence Guest", "").strip()),
            "atlassianLastActive": (r.get(conf_col, "") or "").strip() if conf_col else "",
        })
    return out


def load_groups() -> dict:
    """Optioneel: account_id → [groepsnamen]. CSV met kolommen account_id,group_name."""
    groups = {}
    if not INPUT_GROUPS.exists():
        return groups
    for path in sorted(INPUT_GROUPS.glob("*.csv")):
        with open(path, newline="", encoding="utf-8-sig") as f:
            for r in csv.DictReader(f):
                aid = (r.get("account_id") or "").strip()
                g = (r.get("group_name") or "").strip()
                if aid and g:
                    groups.setdefault(aid, []).append(g)
    return groups


def load_page_inventory() -> list:
    """Optioneel: volledige pagina-inventaris (voor verweesde pagina's).
    CSV met kolommen page_id,title,space,url,last_modified,status —
    aan te maken met fetch_atlassian.py of handmatig.
    """
    if not INPUT_PAGES.exists():
        return []
    out = {}
    for path in sorted(INPUT_PAGES.glob("*.csv")):
        with open(path, newline="", encoding="utf-8-sig") as f:
            for r in csv.DictReader(f):
                pid = (r.get("page_id") or "").strip()
                if pid:
                    out[pid] = {
                        "id": pid,
                        "title": (r.get("title") or "").strip(),
                        "space": (r.get("space") or "").strip(),
                        "url": (r.get("url") or "").strip(),
                        "lastModified": (r.get("last_modified") or "").strip()[:10],
                        "status": (r.get("status") or "").strip(),
                    }
    return list(out.values())


def merge_users(org_users: list, managed: list) -> list:
    """Org-export is leidend; managed-accounts vult ontbrekende accounts aan."""
    by_id = {u["id"]: dict(u) for u in org_users}
    for m in managed:
        if m["id"] in by_id:
            u = by_id[m["id"]]
            if not u["atlassianLastActive"]:
                u["atlassianLastActive"] = m["atlassianLastActive"]
        else:
            by_id[m["id"]] = dict(m)
    return list(by_id.values())


def ts_to_epoch_min(ts: str) -> int:
    # "2026-06-29 06:28:28.891+00" (milliseconden optioneel) → epoch-minuten UTC
    if ts.endswith("+00"):
        ts = ts + ":00"
    dt = datetime.fromisoformat(ts)
    return int(dt.timestamp() // 60)


def build_data(events: dict, accounts: list, groups: dict, inventory: list) -> dict:
    account_ids, page_keys = [], []
    account_index, page_index = {}, {}

    for acc in accounts:
        account_index[acc["id"]] = len(account_ids)
        account_ids.append(acc["id"])

    compact_events = []
    for e in sorted(events.values(), key=lambda e: e["timestamp_origin"]):
        aid = e["account_id"]
        if aid not in account_index:
            account_index[aid] = len(account_ids)
            account_ids.append(aid)
        pkey = (e["page_id"], e["page_title"], e["page_type"])
        if pkey not in page_index:
            page_index[pkey] = len(page_keys)
            page_keys.append(pkey)
        compact_events.append([ts_to_epoch_min(e["timestamp_origin"]), account_index[aid], page_index[pkey]])

    managed = {a["id"]: a for a in accounts}
    accounts_out = []
    for aid in account_ids:
        m = managed.get(aid)
        accounts_out.append({
            "id": aid,
            "name": m["name"] if m else None,
            "email": m["email"] if m else None,
            "managed": bool(m),
            "confluenceAccess": m["confluenceAccess"] if m else None,
            "status": m["status"] if m else None,
            "atlassianLastActive": (m["atlassianLastActive"] or None) if m else None,
            "groups": groups.get(aid, []),
        })

    group_names = sorted({g for gs in groups.values() for g in gs}, key=str.lower)
    return {
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        "hasGroups": bool(groups),
        "groupNames": group_names,
        "accounts": accounts_out,
        "pages": [{"id": p[0], "title": p[1], "type": p[2]} for p in page_keys],
        "events": compact_events,
        "inventory": inventory,
    }


def render(data: dict) -> None:
    template = TEMPLATE.read_text(encoding="utf-8")
    marker = "/*__DATA__*/null"
    if marker not in template:
        sys.exit("template.html mist de /*__DATA__*/null placeholder")
    html = template.replace(marker, json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    OUTPUT.write_text(html, encoding="utf-8")


def main() -> None:
    events = load_store()
    before = len(events)
    view_files = sorted(INPUT_VIEWS.glob("*.csv")) if INPUT_VIEWS.exists() else []
    for path in view_files:
        events.update(parse_pageviews_csv(path))
    save_store(events)

    org_users, memberships = load_org_users()
    accounts = merge_users(org_users, load_accounts())
    groups = load_groups()
    for aid, gs in memberships.items():
        merged = groups.get(aid, [])
        groups[aid] = merged + [g for g in gs if g not in merged]
    inventory = load_page_inventory()
    data = build_data(events, accounts, groups, inventory)
    render(data)

    view_accounts = {e["account_id"] for e in events.values()}
    known = {a["id"] for a in accounts if a["name"]}
    print(f"Events in historie : {len(events)} ({len(events) - before} nieuw uit {len(view_files)} bestand(en))")
    print(f"Gebruikers bekend  : {len(accounts)} (org-export: {len(org_users)})")
    print(f"Accounts in views  : {len(view_accounts)}, waarvan herleidbaar: {len(view_accounts & known)}")
    print(f"Groepen            : {len(data['groupNames'])} → {', '.join(data['groupNames']) or '-'}")
    print(f"Pagina-inventaris  : {len(inventory)} pagina's")
    print(f"Pagina's gezien    : {len(data['pages'])}")
    print(f"Dashboard          : {OUTPUT}")


if __name__ == "__main__":
    main()
