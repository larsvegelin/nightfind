"""Parse-hulpjes: bedragen, oppervlaktes, datums, statussen en generieke HTML/JSON-extractie.

De functies zijn bewust tolerant: sites veranderen hun opmaak regelmatig, dus we
lezen waar mogelijk gestructureerde data (JSON, JSON-LD, label/waarde-paren) en
vallen terug op tekstpatronen.
"""
from __future__ import annotations

import json
import re
from datetime import date, timedelta
from typing import Any, Iterable
from urllib.parse import urljoin

from bs4 import BeautifulSoup, Tag

from . import config

MAANDEN = {
    "jan": 1, "januari": 1, "january": 1,
    "feb": 2, "februari": 2, "february": 2,
    "mrt": 3, "maart": 3, "mar": 3, "march": 3,
    "apr": 4, "april": 4,
    "mei": 5, "may": 5,
    "jun": 6, "juni": 6, "june": 6,
    "jul": 7, "juli": 7, "july": 7,
    "aug": 8, "augustus": 8, "august": 8,
    "sep": 9, "sept": 9, "september": 9,
    "okt": 10, "oktober": 10, "oct": 10, "october": 10,
    "nov": 11, "november": 11,
    "dec": 12, "december": 12,
}

STATUS_LABELS = {
    "beschikbaar": "Beschikbaar",
    "binnenkort": "Binnenkort beschikbaar",
    "onder_optie": "Onder optie",
    "verhuurd_ovb": "Verhuurd o.v.b.",
    "verhuurd": "Verhuurd",
    "gesloten": "Reageren gesloten",
    "offline": "Offline",
}

WONINGTYPES = [
    "eengezinswoning", "tussenwoning", "hoekwoning", "twee-onder-een-kapwoning", "vrijstaande woning",
    "benedenwoning", "bovenwoning", "maisonnette", "penthouse", "portiekwoning", "portiekflat",
    "galerijwoning", "galerijflat", "seniorenwoning", "appartement", "studio", "kamer", "woning",
    "huis", "flat", "woonhuis", "eenkamerappartement", "parkeerplaats",
]


# ---------------------------------------------------------------------------
# Tekst & getallen
# ---------------------------------------------------------------------------
def clean(value: Any) -> str | None:
    if value is None:
        return None
    s = re.sub(r"\s+", " ", str(value)).strip()
    return s or None


def parse_money(value: Any) -> float | None:
    """'€ 1.234,56 p/m' -> 1234.56, '€950,-' -> 950.0, 1234 -> 1234.0"""
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value)
    m = re.search(r"€\s*([\d][\d.,]*)", s) or re.search(r"(\d[\d.,]*)", s)
    if not m:
        return None
    num = m.group(1).rstrip(".,")
    if "," in num and "." in num:
        if num.rfind(",") > num.rfind("."):
            num = num.replace(".", "").replace(",", ".")
        else:
            num = num.replace(",", "")
    elif "," in num:
        num = num.replace(",", ".") if len(num.split(",")[-1]) <= 2 else num.replace(",", "")
    elif "." in num:
        if len(num.split(".")[-1]) == 3:
            num = num.replace(".", "")
    try:
        return round(float(num), 2)
    except ValueError:
        return None


def parse_number(value: Any) -> float | None:
    if value is None or value == "" or isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    m = re.search(r"(\d+(?:[.,]\d+)?)", str(value))
    if not m:
        return None
    return float(m.group(1).replace(",", "."))


def parse_int(value: Any) -> int | None:
    n = parse_number(value)
    return int(n) if n is not None else None


def parse_area(value: Any) -> int | None:
    if value is None:
        return None
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return int(round(value)) if value > 0 else None
    m = re.search(r"(\d+(?:[.,]\d+)?)\s*(?:m²|m2|m\^2|vierkante meter)", str(value), re.I)
    if m:
        return int(round(float(m.group(1).replace(",", "."))))
    return parse_int(value)


def parse_energy_label(value: Any) -> str | None:
    if value is None:
        return None
    s = str(value).strip()
    m = re.match(r"^([A-Ga-g])(\+{0,5})(?![a-z])", s)
    if m:
        return m.group(1).upper() + m.group(2)
    m = re.search(r"(?:energie(?:label|klasse)|label)\s*[:\-]?\s*([A-G])(\+{0,5})(?![a-z])", s, re.I)
    if m:
        return m.group(1).upper() + m.group(2)
    return None


def parse_year(value: Any) -> int | None:
    if value is None:
        return None
    m = re.search(r"\b(1[5-9]\d\d|20\d\d)\b", str(value))
    return int(m.group(1)) if m else None


def parse_postcode(value: Any) -> str | None:
    if value is None:
        return None
    m = re.search(r"\b(\d{4})\s?([A-Z]{2})\b", str(value))
    return f"{m.group(1)} {m.group(2)}" if m else None


# ---------------------------------------------------------------------------
# Datums
# ---------------------------------------------------------------------------
def _infer_year(month: int, day: int, today: date, past: bool | None) -> date | None:
    try:
        d = date(today.year, month, day)
    except ValueError:
        return None
    if past is True and d > today + timedelta(days=2):
        d = d.replace(year=today.year - 1)
    elif past is False and d < today - timedelta(days=2):
        d = d.replace(year=today.year + 1)
    elif past is None:
        if (d - today).days > 180:
            d = d.replace(year=today.year - 1)
        elif (today - d).days > 180:
            d = d.replace(year=today.year + 1)
    return d


def parse_date(value: Any, today: date | None = None, past: bool | None = None) -> str | None:
    """Herkent ISO, dd-mm-jjjj, '18 okt 2026', 'vrijdag 18 oktober', 'vandaag', '3 dagen geleden'.

    `past=True` voor plaatsingsdatums (jaar zonder jaartal ligt in het verleden),
    `past=False` voor sluit-/beschikbaarheidsdatums. Geeft 'YYYY-MM-DD' terug.
    """
    if value is None or value == "":
        return None
    today = today or date.today()
    s = str(value).strip().lower()

    m = re.search(r"(\d{4})-(\d{2})-(\d{2})", s)
    if m:
        try:
            return date(int(m.group(1)), int(m.group(2)), int(m.group(3))).isoformat()
        except ValueError:
            return None

    m = re.search(r"\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b", s)
    if m:
        y = int(m.group(3))
        y = y + 2000 if y < 100 else y
        try:
            return date(y, int(m.group(2)), int(m.group(1))).isoformat()
        except ValueError:
            return None

    m = re.search(r"\b(\d{1,2})\s+([a-z]{3,9})\.?(?:\s+(\d{4}))?", s)
    if m and m.group(2) in MAANDEN:
        month, day = MAANDEN[m.group(2)], int(m.group(1))
        if m.group(3):
            try:
                return date(int(m.group(3)), month, day).isoformat()
            except ValueError:
                return None
        d = _infer_year(month, day, today, past)
        return d.isoformat() if d else None

    if "vandaag" in s or "today" in s:
        return today.isoformat()
    if "eergisteren" in s:
        return (today - timedelta(days=2)).isoformat()
    if "gisteren" in s or "yesterday" in s:
        return (today - timedelta(days=1)).isoformat()
    if "morgen" in s and "overmorgen" not in s:
        return (today + timedelta(days=1)).isoformat()

    m = re.search(r"(\d+)\+?\s*(dag|dagen|day|days|week|weken|weeks|maand|maanden|month|months)", s)
    if m:
        n = int(m.group(1))
        unit = m.group(2)
        days = n * (7 if unit.startswith("we") else 30 if unit.startswith(("ma", "mo")) else 1)
        sign = 1 if past is False else -1
        return (today + timedelta(days=sign * days)).isoformat()

    m = re.search(r"\b(\d{1,2})[/-](\d{1,2})\b", s)
    if m and 1 <= int(m.group(2)) <= 12:
        d = _infer_year(int(m.group(2)), int(m.group(1)), today, past)
        return d.isoformat() if d else None
    return None


# ---------------------------------------------------------------------------
# Status
# ---------------------------------------------------------------------------
def detect_status(text: Any) -> str | None:
    """Status uit een label of korte kaarttekst. Niet gebruiken op lange omschrijvingen."""
    if not text:
        return None
    t = str(text).lower()
    if re.search(r"verhuurd\s*(onder voorbehoud|o\.?\s?v\.?\s?b?)", t) or "under offer" in t:
        return "verhuurd_ovb"
    if re.search(r"onder optie|in optie|in onderhandeling|onder bod|optie genomen|reserved|gereserveerd", t):
        return "onder_optie"
    if re.search(r"\bverhuurd\b|\brented\b|\bnot available\b", t):
        return "verhuurd"
    if re.search(
        r"geadverteerd geweest|niet meer (?:mogelijk|beschikbaar)|reactietermijn (?:is )?(?:verlopen|gesloten)"
        r"|reageren (?:is )?gesloten|advertentie is verlopen|in behandeling|wordt toegewezen"
        r"|kan niet meer (?:inschrijven|reageren)|inschrijving (?:is )?gesloten|no longer available",
        t,
    ):
        return "gesloten"
    if re.search(r"binnenkort (?:beschikbaar|in (?:de )?verhuur|te huur|online)|coming soon|in voorbereiding", t):
        return "binnenkort"
    if re.search(r"\bbeschikbaar\b|\bavailable\b|direct te huur|nu te huur|reageer nu|reageren kan", t):
        return "beschikbaar"
    return None


def detect_new_label(text: Any) -> bool:
    return bool(text) and bool(re.search(r"(^|[\s|•·,])nieuw($|[\s|•·,!])|\bnew\b", str(text).lower()))


def detect_allocation(text: Any) -> str | None:
    if not text:
        return None
    t = str(text).lower()
    for pattern, label in [
        (r"loting|geloot|lotingwoning", "Loting"),
        (r"direct te huur|eerst reageert|wie het eerst komt|eerste reageerder", "Direct te huur"),
        (r"inschrijfduur|woonduur|zoekduur|zoekrechtpunten|wachttijd", "Inschrijfduur"),
        (r"urgentie", "Urgentie"),
        (r"middenhuur", "Middenhuur"),
        (r"vrije sector", "Vrije sector"),
    ]:
        if re.search(pattern, t):
            return label
    return None


def detect_target_group(text: Any) -> str | None:
    if not text:
        return None
    t = str(text).lower()
    groups = []
    for pattern, label in [
        (r"\b(55|60|65|70)\s*\+|\bsenior", "Senioren"),
        (r"jongeren|jongerenwoning|\b(18|23)\s*(t/m|-|tot)\s*(23|27|28)\b", "Jongeren"),
        (r"\bstarter", "Starters"),
        (r"student", "Studenten"),
        (r"\bzorg|rolstoel|mindervalide|aangepaste woning", "Zorg / aangepast"),
        (r"gezin(nen)? met kinderen|huishoudens met kinderen", "Gezinnen"),
    ]:
        if re.search(pattern, t):
            groups.append(label)
    return ", ".join(dict.fromkeys(groups)) or None


def detect_landlord(text: Any) -> str | None:
    if not text:
        return None
    t = str(text)
    for name in config.CORPORATIES:
        if re.search(r"\b" + re.escape(name) + r"\b", t, re.I):
            return "Woonwaard" if name == "Stichting Woonwaard" else name
    return None


def detect_property_type(text: Any) -> str | None:
    if not text:
        return None
    t = str(text).lower()
    for w in WONINGTYPES:
        if re.search(r"\b" + re.escape(w) + r"\b", t):
            return w.capitalize()
    return None


# ---------------------------------------------------------------------------
# Adressen & plaatsen
# ---------------------------------------------------------------------------
def _key(s: str) -> str:
    return re.sub(r"[^a-z0-9' ]", " ", s.lower().replace("-", " ")).strip()


_PLACE_LOOKUP: dict[str, str] = {}


def _build_lookup() -> dict[str, str]:
    if not _PLACE_LOOKUP:
        for p in config.PLAATSEN:
            _PLACE_LOOKUP[re.sub(r"\s+", " ", _key(p))] = p
        for alias, p in config.PLAATS_ALIASSEN.items():
            _PLACE_LOOKUP[re.sub(r"\s+", " ", _key(alias))] = p
    return _PLACE_LOOKUP


def canonical_place(name: Any) -> str | None:
    """Geeft de officiële plaatsnaam uit config.PLAATSEN, of None buiten de regio."""
    if not name:
        return None
    lookup = _build_lookup()
    k = re.sub(r"\s+", " ", _key(re.sub(r"\s*\(.*$", "", str(name)))).strip()
    k = re.sub(r"^gemeente ", "", k)
    if k in lookup:
        return lookup[k]
    return None


def find_place_in_text(text: Any) -> str | None:
    """Zoekt de eerste regioplaats in een tekst (langste namen eerst)."""
    if not text:
        return None
    lookup = _build_lookup()
    t = " " + re.sub(r"\s+", " ", _key(str(text))) + " "
    for k in sorted(lookup, key=len, reverse=True):
        if f" {k} " in t:
            return lookup[k]
    return None


def municipality_of(place: str | None) -> str | None:
    return config.PLAATSEN.get(place) if place else None


def parse_address(text: Any) -> dict:
    """'Appartement Keizerstraat 12 A te Alkmaar' -> straat, huisnummer, toevoeging, plaats, type."""
    out: dict[str, Any] = {}
    s = clean(text)
    if not s:
        return out
    m = re.match(r"^(.*?)\s+(?:te|in)\s+([A-Z'][\w' .-]+)$", s)
    if m:
        s, out["city"] = m.group(1).strip(), m.group(2).strip()
    s = re.sub(r"\s*,\s*\d{4}\s?[A-Z]{2}.*$", "", s)
    s = re.sub(r"\s*,.*$", "", s)
    first = s.split(" ", 1)
    if len(first) == 2 and first[0].lower().rstrip(":") in WONINGTYPES:
        out["property_type"] = first[0].capitalize()
        s = first[1]
    s = re.sub(r"^te huur:?\s*", "", s, flags=re.I)
    m = re.match(r"^(?P<street>[^\d]+?)\s+(?P<num>\d+)\s*[-\s]?(?P<add>[A-Za-z]{1,3}|\d{1,4}(?:[-\s]?[A-Za-z])?|[A-Za-z]?\d{0,3})?\s*$", s)
    if m:
        out["street"] = m.group("street").strip()
        out["house_number"] = m.group("num")
        add = (m.group("add") or "").strip(" -")
        if add:
            out["house_number_addition"] = add.upper()
    elif s and not re.search(r"\d", s):
        out["street"] = s
    return out


def address_from_segments(text: str) -> dict:
    """Kaarttekst 'Laat 12 | 1811 EK Alkmaar (Centrum) | € 1.450' -> adres, postcode, plaats, wijk."""
    segs = [s.strip() for s in str(text or "").split("|") if s.strip()]
    for i, seg in enumerate(segs):
        m = re.match(r"^(\d{4}\s?[A-Z]{2})\s+([A-Z'][\w' .-]+?)(?:\s*\((.+?)\))?$", seg)
        if not m:
            continue
        out: dict[str, Any] = {"postcode": parse_postcode(m.group(1)), "city": m.group(2).strip()}
        if m.group(3):
            out["neighbourhood"] = m.group(3).strip()
        if i > 0 and re.search(r"\d", segs[i - 1]) and "€" not in segs[i - 1]:
            out.update({k: v for k, v in parse_address(segs[i - 1]).items() if k != "city"})
        return out
    return {}


def address_key(street: Any, number: Any, addition: Any, city: Any) -> str | None:
    if not street or not number or not city:
        return None
    norm = lambda v: re.sub(r"[^a-z0-9]", "", str(v or "").lower())  # noqa: E731
    return f"{norm(street)}|{norm(number)}{norm(addition)}|{norm(city)}"


# ---------------------------------------------------------------------------
# HTML-extractie
# ---------------------------------------------------------------------------
def soup_of(html: str) -> BeautifulSoup:
    try:
        return BeautifulSoup(html, "lxml")
    except Exception:  # lxml niet geïnstalleerd
        return BeautifulSoup(html, "html.parser")


def text_of(node: Tag | None, sep: str = " ") -> str:
    if node is None:
        return ""
    return re.sub(r"[ \t\r\f\v]+", " ", node.get_text(sep, strip=True))


def image_of(node: Tag, base_url: str) -> list[str]:
    urls: list[str] = []
    for img in node.find_all(["img", "source"]):
        cand = img.get("data-src") or img.get("data-lazy") or img.get("src")
        if not cand and img.get("srcset"):
            cand = img["srcset"].split(",")[-1].strip().split(" ")[0]
        if not cand and img.get("data-srcset"):
            cand = img["data-srcset"].split(",")[-1].strip().split(" ")[0]
        if not cand or cand.startswith("data:") or re.search(r"logo|icon|sprite|placeholder|\.svg", cand, re.I):
            continue
        u = urljoin(base_url, cand)
        if u not in urls:
            urls.append(u)
    return urls


def kv_pairs(soup: BeautifulSoup | Tag) -> dict[str, str]:
    """Verzamelt label/waarde-paren uit <dl>, tabellen en 'label: waarde'-lijstjes."""
    pairs: dict[str, str] = {}

    def add(label: str, value: str) -> None:
        label = clean(label)
        value = clean(value)
        if not label or not value or len(label) > 60 or len(value) > 400:
            return
        key = label.lower().rstrip(":").strip()
        pairs.setdefault(key, value)

    for dt in soup.find_all("dt"):
        dd = dt.find_next_sibling("dd")
        if dd is not None:
            add(text_of(dt), text_of(dd))
    for tr in soup.find_all("tr"):
        cells = tr.find_all(["th", "td"], recursive=False)
        if len(cells) == 2:
            add(text_of(cells[0]), text_of(cells[1]))
    for el in soup.find_all(["li", "div", "p"]):
        children = [c for c in el.find_all(recursive=False) if isinstance(c, Tag)]
        if len(children) == 2 and not children[0].find(["div", "li", "dl"]):
            a, b = text_of(children[0]), text_of(children[1])
            if a and b and len(a) <= 40 and not re.search(r"\d{3,}", a):
                add(a, b)
        elif not children:
            t = text_of(el)
            m = re.match(r"^([A-Za-zÀ-ÿ /()'.-]{3,40}):\s+(.{1,120})$", t)
            if m:
                add(m.group(1), m.group(2))
    return pairs


KV_MAP: list[tuple[str, str]] = [
    (r"kale huur|netto huur|basishuur|kale huurprijs|huur excl", "rent_net"),
    (r"servicekosten|service kosten", "service_costs"),
    (r"stookkosten|voorschot energie|energiekosten", "energy_costs"),
    (r"totale huur|bruto huur|huur incl|totaal per maand|totale woonlasten", "rent_total"),
    (r"^huur(prijs)?( per maand)?$|^prijs$|^huurprijs|^te huur voor", "rent_total"),
    (r"borg|waarborgsom", "deposit"),
    (r"woonoppervlakte|^oppervlakte|gebruiksoppervlakte( wonen)?|woonruimte|^m2|vloeroppervlakte", "area_m2"),
    (r"slaapkamers", "bedrooms"),
    (r"aantal kamers|^kamers$|^kamers \(|^aantal vertrekken", "rooms"),
    (r"energie ?(label|klasse|index)", "energy_label"),
    (r"bouwjaar|bouwperiode", "build_year"),
    (r"verdieping|woonlaag|etage|gelegen op", "floor"),
    (r"interieur|oplevering|gestoffeerd|gemeubileerd", "interior"),
    (r"aangeboden sinds|geplaatst|publicatiedatum|online sinds|datum plaatsing|gepubliceerd|aangeboden op|advertentiedatum", "published_at"),
    (r"reageren (kan )?(tot|voor|uiterlijk)|reactiedatum|sluitingsdatum|reageren t/m|einddatum|reactietermijn", "closing_date"),
    (r"beschikbaar (per|vanaf)|aanvaarding|ingangsdatum|huuringangsdatum|beschikbaarheid|^beschikbaar$|per datum", "available_from"),
    (r"^status", "status_text"),
    (r"soort (woning|appartement|woonhuis|object)|woningtype|type woning|^type$|soort$|^woonvorm", "property_type"),
    (r"^postcode", "postcode"),
    (r"inkomen", "income_text"),
    (r"leeftijd", "age_text"),
    (r"huishoud", "household_text"),
    (r"doelgroep|bestemd voor|geschikt voor", "target_group"),
    (r"toewijzing|selectiemodel|verdeelmodel|woonruimteverdeling|wijze van|verdeling|advertentiemodel", "allocation_model"),
    (r"verhuurder|corporatie|aangeboden door|makelaar|eigenaar|woningcorporatie", "landlord"),
    (r"^wijk|^buurt", "neighbourhood"),
    (r"^(woon)?plaats$|^stad$|^gemeente$", "city"),
    (r"^adres$|^straat( en huisnummer)?$", "street_raw"),
    (r"aantal reacties|^reacties", "reactions"),
    (r"minimale huurperiode|huurperiode|contractduur|looptijd", "contract"),
]


def map_kv(pairs: dict[str, str], today: date | None = None) -> dict:
    """Zet label/waarde-paren om naar listingvelden."""
    out: dict[str, Any] = {}
    extras: dict[str, str] = {}
    for label, value in pairs.items():
        field = None
        for pattern, f in KV_MAP:
            if re.search(pattern, label):
                field = f
                break
        if field is None:
            extras[label] = value
            continue
        if field in out:
            continue
        if field in ("rent_total", "rent_net", "service_costs", "energy_costs", "deposit"):
            v = parse_money(value)
        elif field == "area_m2":
            v = parse_area(value)
        elif field in ("rooms", "bedrooms", "reactions"):
            v = parse_int(value)
        elif field == "energy_label":
            v = parse_energy_label(value)
        elif field == "build_year":
            v = parse_year(value)
        elif field == "published_at":
            v = parse_date(value, today, past=True)
        elif field in ("closing_date",):
            v = parse_date(value, today, past=False)
        elif field == "available_from":
            v = parse_date(value, today, past=False) or (value if re.search(r"direct|in overleg|per direct", value, re.I) else None)
            if v and not re.match(r"\d{4}-", str(v)):
                out["available_text"] = value
                v = None
        elif field == "postcode":
            v = parse_postcode(value)
        else:
            v = clean(value)
        if v not in (None, ""):
            out[field] = v
    if extras:
        out["_extras"] = extras
    return out


def fields_from_text(text: str, today: date | None = None) -> dict:
    """Tekstpatronen voor kaarten/detailpagina's zonder nette structuur."""
    out: dict[str, Any] = {}
    if not text:
        return out
    t = re.sub(r"\s+", " ", text)

    prices = [parse_money(m.group(0)) for m in re.finditer(r"€\s*\d[\d.,]*(?:,-)?", t)]
    prices = [p for p in prices if p and 100 <= p <= 15000]
    if prices:
        out["rent_total"] = prices[0]
    m = re.search(r"kale huur[^€\d]{0,20}(€\s*\d[\d.,]*)", t, re.I)
    if m:
        out["rent_net"] = parse_money(m.group(1))
    m = re.search(r"servicekosten[^€\d]{0,20}(€\s*\d[\d.,]*)", t, re.I)
    if m:
        out["service_costs"] = parse_money(m.group(1))
    m = re.search(r"(\d+(?:[.,]\d+)?)\s*(?:m²|m2)\b", t, re.I)
    if m:
        out["area_m2"] = int(round(float(m.group(1).replace(",", "."))))
    m = re.search(r"(\d+)\s*slaapkamers?", t, re.I)
    if m:
        out["bedrooms"] = int(m.group(1))
    m = re.search(r"(\d+)\s*(?:kamers?|kamerwoning|-kamer)", t, re.I)
    if m:
        out["rooms"] = int(m.group(1))
    lbl = parse_energy_label(t) if re.search(r"energie(label|klasse)|label\s*[A-G]", t, re.I) else None
    if lbl:
        out["energy_label"] = lbl
    m = re.search(r"bouwjaar\s*:?\s*(1[5-9]\d\d|20\d\d)", t, re.I)
    if m:
        out["build_year"] = int(m.group(1))
    pc = parse_postcode(t)
    if pc:
        out["postcode"] = pc

    date_tail = r"((?:[a-z]+dag\s+)?\d{1,2}[\s/.-]+(?:[a-z]{3,9}\.?|\d{1,2})(?:[\s/.-]+\d{2,4})?|vandaag|gisteren|today|yesterday|\d+\+?\s*(?:dagen|dag|weken|week|maanden|maand|days|day|weeks|week|months|month))"
    m = re.search(r"geadverteerd(?: geweest)? van\s+" + date_tail + r"\s+(?:tot(?: en met)?|t/m)\s+" + date_tail, t, re.I)
    if m:
        out["published_at"] = parse_date(m.group(1), today, past=True)
        out["closing_date"] = parse_date(m.group(2), today, past=None)
    if "published_at" not in out:
        m = re.search(r"(?:geplaatst|aangeboden sinds|gepubliceerd|online sinds|publicatiedatum|datum plaatsing|aangeboden op|posted|listed|placed|offered since)\s*(?:op|on)?\s*:?\s*" + date_tail, t, re.I)
        if m:
            out["published_at"] = parse_date(m.group(1), today, past=True)
    if "closing_date" not in out:
        m = re.search(r"(?:reageren (?:kan |is mogelijk )?(?:tot|t/m|voor|uiterlijk)(?: en met)?|reactietermijn(?: sluit| tot)?|sluitingsdatum|reageer voor)\s*:?\s*" + date_tail, t, re.I)
        if m:
            out["closing_date"] = parse_date(m.group(1), today, past=False)
    m = re.search(r"(?:beschikbaar (?:per|vanaf)|ingangsdatum|aanvaarding|huuringangsdatum)\s*:?\s*" + date_tail, t, re.I)
    if m:
        out["available_from"] = parse_date(m.group(1), today, past=False)
    elif re.search(r"\bper\s+(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{1,2}\s+[a-z]{3,9}\.?(?:\s+\d{4})?)\s+beschikbaar", t, re.I):
        m = re.search(r"\bper\s+(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{1,2}\s+[a-z]{3,9}\.?(?:\s+\d{4})?)\s+beschikbaar", t, re.I)
        out["available_from"] = parse_date(m.group(1), today, past=False)
    elif re.search(r"beschikbaar per direct|direct beschikbaar|aanvaarding:? direct|available (?:immediately|directly)", t, re.I):
        out["available_text"] = "Direct"
    m = re.search(r"(\d+)\s*reacties", t, re.I)
    if m:
        out["reactions"] = int(m.group(1))
    alloc = detect_allocation(t)
    if alloc:
        out["allocation_model"] = alloc
    m = re.search(r"\b(gestoffeerd|gemeubileerd|kaal opgeleverd|kaal)\b", t, re.I)
    if m:
        out["interior"] = m.group(1).capitalize()
    return {k: v for k, v in out.items() if v not in (None, "")}


def cards_from_links(soup: BeautifulSoup, base_url: str, link_pattern: str) -> list[tuple[str, Tag]]:
    """Vindt per detail-link de grootste omliggende 'kaart' die alleen die woning bevat."""
    rx = re.compile(link_pattern, re.I)
    results: list[tuple[str, Tag]] = []
    seen: set[str] = set()
    for a in soup.find_all("a", href=True):
        href = urljoin(base_url, a["href"]).split("#")[0]
        if not rx.search(href) or href in seen:
            continue
        seen.add(href)
        card: Tag = a
        node: Tag = a
        for _ in range(10):
            parent = node.parent
            if parent is None or parent.name in ("body", "html", "main"):
                break
            links = {
                urljoin(base_url, x["href"]).split("#")[0]
                for x in parent.find_all("a", href=True)
                if rx.search(urljoin(base_url, x["href"]))
            }
            if len(links) > 1:
                break
            node = parent
            card = parent
        results.append((href, card))
    return results


def find_links(html: str, base_url: str, link_pattern: str) -> list[str]:
    rx = re.compile(link_pattern, re.I)
    found: list[str] = []
    for m in re.finditer(r"""(?:href|url|"link"|"uri")\s*[=:]\s*["']([^"'<>\s]+)["']""", html):
        u = urljoin(base_url, m.group(1).replace("\\/", "/")).split("#")[0]
        if rx.search(u) and u not in found:
            found.append(u)
    return found


# ---------------------------------------------------------------------------
# JSON / JSON-LD
# ---------------------------------------------------------------------------
def json_ld(soup: BeautifulSoup) -> list[dict]:
    out: list[dict] = []
    for s in soup.find_all("script", type=re.compile("ld\\+json", re.I)):
        raw = s.string or s.get_text()
        if not raw:
            continue
        try:
            data = json.loads(raw.strip(), strict=False)
        except ValueError:
            continue
        stack = [data]
        while stack:
            d = stack.pop()
            if isinstance(d, list):
                stack.extend(d)
            elif isinstance(d, dict):
                out.append(d)
                if "@graph" in d:
                    stack.append(d["@graph"])
    return out


def _first(d: Any, *keys: str) -> Any:
    for k in keys:
        cur = d
        for part in k.split("."):
            if isinstance(cur, dict) and part in cur:
                cur = cur[part]
            else:
                cur = None
                break
        if cur not in (None, "", [], {}):
            return cur
    return None


def name_of(v: Any) -> str | None:
    if isinstance(v, dict):
        return clean(_first(v, "localizedName", "name", "label", "title", "value", "code"))
    if isinstance(v, list):
        return ", ".join(filter(None, (name_of(x) for x in v))) or None
    return clean(v)


def fields_from_json_ld(objs: list[dict], today: date | None = None) -> dict:
    out: dict[str, Any] = {}
    for o in objs:
        types = o.get("@type")
        types = types if isinstance(types, list) else [types]
        types = [str(t) for t in types if t]
        if any(t in ("BreadcrumbList", "Organization", "WebSite", "WebPage", "ItemList", "SearchResultsPage") for t in types):
            continue
        addr = o.get("address") or _first(o, "itemOffered.address", "mainEntity.address")
        if isinstance(addr, dict):
            out.setdefault("street_raw", clean(addr.get("streetAddress")))
            out.setdefault("postcode", parse_postcode(addr.get("postalCode")))
            out.setdefault("city", clean(addr.get("addressLocality")))
        offers = o.get("offers")
        if isinstance(offers, list) and offers:
            offers = offers[0]
        if isinstance(offers, dict):
            price = offers.get("price") or _first(offers, "priceSpecification.price")
            if price:
                out.setdefault("rent_total", parse_money(price))
            if offers.get("availability"):
                out.setdefault("status_text", str(offers["availability"]).rsplit("/", 1)[-1])
            if offers.get("availabilityStarts"):
                out.setdefault("available_from", parse_date(offers["availabilityStarts"], today))
        if o.get("name"):
            out.setdefault("title", clean(o["name"]))
        if o.get("description"):
            out.setdefault("description", clean(o["description"]))
        fs = o.get("floorSize")
        if fs:
            out.setdefault("area_m2", parse_area(fs.get("value") if isinstance(fs, dict) else fs))
        if o.get("numberOfRooms"):
            out.setdefault("rooms", parse_int(o["numberOfRooms"]))
        if o.get("numberOfBedrooms"):
            out.setdefault("bedrooms", parse_int(o["numberOfBedrooms"]))
        geo = o.get("geo")
        if isinstance(geo, dict):
            out.setdefault("lat", parse_number(geo.get("latitude")))
            out.setdefault("lon", parse_number(geo.get("longitude")))
        for k in ("datePosted", "datePublished", "dateCreated"):
            if o.get(k):
                out.setdefault("published_at", parse_date(o[k], today, past=True))
        img = o.get("image") or o.get("photo")
        imgs = img if isinstance(img, list) else [img] if img else []
        urls = [i.get("url") or i.get("contentUrl") if isinstance(i, dict) else i for i in imgs]
        urls = [u for u in urls if isinstance(u, str)]
        if urls:
            out.setdefault("images", urls[:20])
        if o.get("yearBuilt"):
            out.setdefault("build_year", parse_year(o["yearBuilt"]))
    return {k: v for k, v in out.items() if v not in (None, "", [])}


def embedded_json(html: str) -> list[Any]:
    """__NEXT_DATA__, window.__INITIAL_STATE__ en andere JSON-blokken in de pagina."""
    found: list[Any] = []
    soup = soup_of(html)
    for s in soup.find_all("script"):
        raw = (s.string or "").strip()
        if not raw:
            continue
        if s.get("type") in ("application/json",) or s.get("id") in ("__NEXT_DATA__",):
            try:
                found.append(json.loads(raw))
            except ValueError:
                pass
            continue
        m = re.search(r"(?:window\.)?__(?:INITIAL_STATE|PRELOADED_STATE|APP_STATE|DATA)__\s*=\s*(\{.*\})\s*;?\s*$", raw, re.S)
        if m:
            try:
                found.append(json.loads(m.group(1)))
            except ValueError:
                pass
    return found


_STREET_KEYS = ("street", "streetName", "straat", "straatnaam", "streetAddress", "address", "adres")
_PRICE_KEYS = ("totalRent", "totalRentalPrice", "rent", "rentPrice", "price", "prijs", "huur", "huurprijs", "monthlyRent", "totalPrice")


def find_listing_dicts(data: Any, limit: int = 2000) -> list[dict]:
    """Zoekt recursief naar dicts die op een woning lijken (adres + prijs)."""
    out: list[dict] = []
    stack = [data]
    while stack and len(out) < limit:
        d = stack.pop()
        if isinstance(d, list):
            stack.extend(d)
        elif isinstance(d, dict):
            keys = set(d)
            if keys & set(_STREET_KEYS) and keys & set(_PRICE_KEYS):
                out.append(d)
                continue
            stack.extend(v for v in d.values() if isinstance(v, (dict, list)))
    return out


def fields_from_dict(d: dict, base_url: str, today: date | None = None) -> dict:
    """Generieke mapping van een JSON-object naar listingvelden (op basis van sleutelnamen)."""
    city = _first(d, "city.name", "city", "cityName", "plaats", "woonplaats", "town", "place", "address.city", "address.addressLocality", "location.city")
    street = _first(d, "street", "streetName", "straat", "straatnaam", "address.street", "address.streetName")
    out: dict[str, Any] = {
        "street": name_of(street) if not isinstance(street, dict) else name_of(street),
        "house_number": clean(_first(d, "houseNumber", "huisnummer", "number", "address.houseNumber")),
        "house_number_addition": clean(_first(d, "houseNumberAddition", "houseNumberSuffix", "toevoeging", "address.houseNumberAddition")),
        "postcode": parse_postcode(_first(d, "postalcode", "postalCode", "postcode", "zipCode", "zip", "address.postalCode")),
        "city": name_of(city),
        "neighbourhood": name_of(_first(d, "quarter", "neighbourhood", "neighborhood", "wijk", "buurt", "district")),
        "rent_total": parse_money(_first(d, "totalRent", "totalRentalPrice", "rentTotal", "huurTotaal", "totalPrice", "rent", "rentPrice", "price", "prijs", "huur", "huurprijs", "monthlyRent")),
        "rent_net": parse_money(_first(d, "netRent", "kaleHuur", "basicRent", "rentExcl", "netRentPrice")),
        "service_costs": parse_money(_first(d, "serviceCosts", "servicekosten", "serviceCharges")),
        "area_m2": parse_area(_first(d, "areaDwelling", "surfaceArea", "surface", "livingArea", "floorArea", "area", "size", "woonoppervlakte", "oppervlakte")),
        "rooms": parse_int(name_of(_first(d, "numberOfRooms", "rooms", "aantalKamers", "roomCount"))),
        "bedrooms": parse_int(name_of(_first(d, "sleepingRoom.amountOfRooms", "numberOfBedrooms", "bedrooms", "slaapkamers"))),
        "energy_label": parse_energy_label(name_of(_first(d, "energyLabel", "energielabel", "energyClass"))),
        "build_year": parse_year(_first(d, "constructionYear", "buildYear", "bouwjaar", "yearBuilt")),
        "property_type": name_of(_first(d, "dwellingType", "propertyType", "woningtype", "type", "objectType", "listingType")),
        "floor": name_of(_first(d, "floor", "verdieping", "etage")),
        "interior": name_of(_first(d, "interior", "furnishing", "interieur", "furnished")),
        "published_at": parse_date(_first(d, "publicationDate", "publishDate", "publishedAt", "datePublished", "createdAt", "publicatiedatum", "listedSince", "publishedDate", "startDate"), today, past=True),
        "closing_date": parse_date(_first(d, "closingDate", "endDate", "reactionDeadline", "sluitingsdatum", "closeDate"), today, past=False),
        "available_from": parse_date(_first(d, "availableFromDate", "availableFrom", "availabilityDate", "beschikbaarPer", "availableDate"), today, past=False),
        "landlord": name_of(_first(d, "corporation", "landlord", "owner", "verhuurder", "agent", "makelaar")),
        "description": clean(_first(d, "description", "omschrijving", "descriptionNl")),
        "lat": parse_number(_first(d, "latitude", "lat", "location.lat", "geo.latitude")),
        "lon": parse_number(_first(d, "longitude", "lon", "lng", "location.lng", "geo.longitude")),
        "status_text": name_of(_first(d, "status", "availabilityStatus", "state")),
    }
    pics = _first(d, "pictures", "images", "photos", "media", "fotos")
    urls: list[str] = []
    if isinstance(pics, list):
        for p in pics:
            u = p if isinstance(p, str) else _first(p, "uri", "url", "src", "large", "medium", "path") if isinstance(p, dict) else None
            if isinstance(u, str):
                urls.append(urljoin(base_url, u))
    if urls:
        out["images"] = urls[:20]
    if isinstance(out.get("street"), str) and not out.get("house_number"):
        out.update({k: v for k, v in parse_address(out["street"]).items() if k in ("street", "house_number", "house_number_addition")})
    return {k: v for k, v in out.items() if v not in (None, "", [])}


def iter_unique(items: Iterable[str]) -> list[str]:
    return list(dict.fromkeys(i for i in items if i))
