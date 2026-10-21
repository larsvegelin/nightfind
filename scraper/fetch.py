"""HTTP-laag: nette pauzes per site, herhaalpogingen en optioneel een echte browser (Playwright).

Funda en soms Pararius blokkeren gewone HTTP-verzoeken. Met `--browser` (of automatisch
als Playwright geïnstalleerd is en een site 403/429 geeft) halen we de pagina op met
Chromium, zodat ook door JavaScript gerenderde pagina's werken.
"""
from __future__ import annotations

import hashlib
import json
import random
import re
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import requests

from . import config


class FetchError(Exception):
    """Fout bij ophalen. `fatal=True` betekent dat de hele site onbereikbaar is (stop de bron)."""

    def __init__(self, message: str, fatal: bool = False) -> None:
        super().__init__(message)
        self.fatal = fatal


@dataclass
class Page:
    url: str
    status: int
    text: str
    via_browser: bool = False

    def json(self) -> Any:
        return json.loads(self.text)


class Fetcher:
    def __init__(
        self,
        *,
        browser: str = "auto",  # "auto" | "altijd" | "nooit"
        delay: float = config.VERTRAGING_SEC,
        timeout: float = config.TIMEOUT_SEC,
        dump_dir: Path | None = None,
        log=print,
    ) -> None:
        self.browser_mode = browser
        self.delay = delay
        self.timeout = timeout
        self.dump_dir = dump_dir
        self.log = log
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": config.USER_AGENT,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7",
                "Accept-Language": "nl-NL,nl;q=0.9,en;q=0.6",
            }
        )
        self._last_hit: dict[str, float] = {}
        self._pw = None
        self._browser = None
        self._context = None
        self._browser_failed = False
        self.requests_made = 0

    # ------------------------------------------------------------------
    def _wait_turn(self, url: str) -> None:
        host = urlparse(url).netloc
        last = self._last_hit.get(host)
        if last is not None:
            wait = self.delay + random.uniform(0, self.delay / 2) - (time.time() - last)
            if wait > 0:
                time.sleep(wait)
        self._last_hit[host] = time.time()

    def _dump(self, url: str, page: Page, source: str | None) -> None:
        if not self.dump_dir:
            return
        folder = self.dump_dir / (source or urlparse(url).netloc)
        folder.mkdir(parents=True, exist_ok=True)
        slug = re.sub(r"[^a-z0-9]+", "-", urlparse(url).path.lower()).strip("-")[:60] or "index"
        h = hashlib.sha1(url.encode()).hexdigest()[:8]
        ext = "json" if page.text.lstrip().startswith(("{", "[")) else "html"
        (folder / f"{slug}-{h}.{ext}").write_text(f"<!-- {url} ({page.status}) -->\n" + page.text if ext == "html" else page.text, encoding="utf-8")

    # ------------------------------------------------------------------
    def get(self, url: str, *, source: str | None = None, headers: dict | None = None, render: bool = False) -> Page:
        return self._request("GET", url, source=source, headers=headers, render=render)

    def post(self, url: str, *, data: Any = None, json_body: Any = None, source: str | None = None, headers: dict | None = None) -> Page:
        return self._request("POST", url, data=data, json_body=json_body, source=source, headers=headers)

    def _request(self, method: str, url: str, *, data=None, json_body=None, source=None, headers=None, render=False) -> Page:
        if self.browser_mode == "altijd" or (render and self._browser_available()):
            page = self._browser_request(method, url, data=data, json_body=json_body, headers=headers)
            self._dump(url, page, source)
            if page.status >= 400:
                raise FetchError(f"HTTP {page.status} (browser) bij {url}")
            return page

        last_error: str | None = None
        for attempt in range(3):
            self._wait_turn(url)
            self.requests_made += 1
            try:
                r = self.session.request(method, url, data=data, json=json_body, headers=headers, timeout=self.timeout, allow_redirects=True)
            except requests.exceptions.ProxyError as e:
                raise FetchError(f"verbinding geweigerd door proxy/firewall ({urlparse(url).netloc})", fatal=True) from e
            except requests.exceptions.SSLError as e:
                raise FetchError(f"SSL-fout bij {urlparse(url).netloc}: {e}", fatal=True) from e
            except requests.exceptions.ConnectionError as e:
                last_error = f"geen verbinding met {urlparse(url).netloc}"
                if attempt == 2:
                    raise FetchError(last_error, fatal=True) from e
                time.sleep(2 ** (attempt + 1))
                continue
            except requests.exceptions.Timeout as e:
                last_error = f"time-out bij {url}"
                if attempt == 2:
                    raise FetchError(last_error) from e
                continue

            page = Page(url=r.url, status=r.status_code, text=r.text)
            self._dump(url, page, source)
            if r.status_code in (403, 429, 503) and self.browser_mode == "auto" and self._browser_available():
                self.log(f"    {r.status_code} bij {urlparse(url).netloc} -> opnieuw via browser")
                page = self._browser_request(method, url, data=data, json_body=json_body, headers=headers)
                self._dump(url, page, source)
                if page.status >= 400:
                    raise FetchError(f"HTTP {page.status} (ook via browser) bij {url}")
                return page
            if r.status_code in (429, 500, 502, 503, 504) and attempt < 2:
                time.sleep(3 * (attempt + 1))
                last_error = f"HTTP {r.status_code} bij {url}"
                continue
            if r.status_code >= 400:
                hint = " (geblokkeerd; probeer --browser met Playwright)" if r.status_code in (403, 429) else ""
                raise FetchError(f"HTTP {r.status_code} bij {url}{hint}")
            return page
        raise FetchError(last_error or f"mislukt: {url}")

    # ------------------------------------------------------------------
    def _browser_available(self) -> bool:
        if self.browser_mode == "nooit" or self._browser_failed:
            return False
        if self._context is not None:
            return True
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            self._browser_failed = True
            return False
        try:
            self._pw = sync_playwright().start()
            self._browser = self._pw.chromium.launch(headless=True)
            self._context = self._browser.new_context(locale="nl-NL", user_agent=config.USER_AGENT, viewport={"width": 1366, "height": 900})
            return True
        except Exception as e:  # browser niet geïnstalleerd e.d.
            self.log(f"    Playwright kon niet starten: {e}")
            self._browser_failed = True
            return False

    def _browser_request(self, method, url, *, data=None, json_body=None, headers=None) -> Page:
        if not self._browser_available():
            raise FetchError("browser-modus gevraagd maar Playwright is niet beschikbaar (pip install playwright && playwright install chromium)")
        self._wait_turn(url)
        self.requests_made += 1
        if method != "GET":
            resp = self._context.request.fetch(url, method=method, data=json.dumps(json_body) if json_body is not None else data, headers=headers or ({"Content-Type": "application/json"} if json_body is not None else None), timeout=self.timeout * 1000)
            return Page(url=url, status=resp.status, text=resp.text(), via_browser=True)
        page = self._context.new_page()
        try:
            resp = page.goto(url, wait_until="domcontentloaded", timeout=self.timeout * 1000)
            try:
                page.wait_for_load_state("networkidle", timeout=8000)
            except Exception:
                pass
            ctype = (resp.headers.get("content-type", "") if resp else "")
            text = resp.text() if resp and "json" in ctype else page.content()
            return Page(url=page.url, status=resp.status if resp else 0, text=text, via_browser=True)
        except Exception as e:
            raise FetchError(f"browser kon {url} niet laden: {e}") from e
        finally:
            page.close()

    def close(self) -> None:
        try:
            if self._context is not None:
                self._context.close()
            if self._browser is not None:
                self._browser.close()
            if self._pw is not None:
                self._pw.stop()
        except Exception:
            pass
