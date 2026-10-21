"""Tests voor het wegschrijven naar Supabase, tegen een lokale nep-server (er gaat niets naar de echte database)."""
from __future__ import annotations

import json
import os
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

from scraper import cli, config, model, supabase_sync
from scraper.sources import REGISTRY
from scraper.sources.base import Source, SourceResult


class FakePostgrest(BaseHTTPRequestHandler):
    """Minimale PostgREST-nabootsing voor huur_woningen / huur_bronnen / huur_instellingen."""

    tables: dict = {}
    log: list = []

    def log_message(self, *a):  # stil
        pass

    def _send(self, code, body=None):
        data = json.dumps(body).encode() if body is not None else b""
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _parts(self):
        u = urlparse(self.path)
        return u.path.rsplit("/", 1)[-1], parse_qs(u.query)

    def _record(self, body=None):
        if not urlparse(self.path).path.startswith("/rest/v1/"):
            raise LookupError(self.path)
        table, query = self._parts()
        FakePostgrest.log.append({"method": self.command, "table": table, "query": query, "headers": dict(self.headers), "body": body})
        return table, query

    def do_GET(self):
        try:
            self._do_GET()
        except LookupError:
            self._send(404, {"message": "not found"})

    def _do_GET(self):
        table, query = self._record()
        rows = sorted(self.tables.get(table, {}).values(), key=lambda r: r["id"])
        offset, limit = int(query.get("offset", ["0"])[0]), int(query.get("limit", ["1000"])[0])
        self._send(200, rows[offset:offset + limit])

    def do_POST(self):
        try:
            self._do_POST()
        except LookupError:
            self._send(404, {"message": "not found"})

    def _do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        table, _ = self._record(body)
        for row in body:
            self.tables.setdefault(table, {})[row["id"]] = row
        self._send(201)

    def do_DELETE(self):
        try:
            self._do_DELETE()
        except LookupError:
            self._send(404, {"message": "not found"})

    def _do_DELETE(self):
        table, query = self._record()
        (col, cond), = query.items()
        op, value = cond[0].split(".", 1)
        assert op == "lt"
        value = unquote(value)
        rows = self.tables.get(table, {})
        for rid in [rid for rid, r in rows.items() if r[col] < value]:
            del rows[rid]
        self._send(204)

    def do_PATCH(self):
        try:
            self._do_PATCH()
        except LookupError:
            self._send(404, {"message": "not found"})

    def _do_PATCH(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        self._record(body)
        self.tables.setdefault("huur_instellingen", {})[True] = body
        self._send(204)


class ServerCase(unittest.TestCase):
    def setUp(self):
        FakePostgrest.tables = {}
        FakePostgrest.log = []
        self.server = HTTPServer(("127.0.0.1", 0), FakePostgrest)
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.url = f"http://127.0.0.1:{self.server.server_port}"
        self.client = supabase_sync.Supabase(self.url, "sb_secret_testsleutel")
        self.client.session.trust_env = False  # geen proxy voor localhost

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()


def _listing(sid, **kw):
    cfg = {"id": "funda", "naam": "Funda", "type": "platform"}
    return model.normalize(model.new_listing(sid, cfg, city="Alkmaar", street="Laat", house_number=sid, rent_total=1250, **kw))


class SyncTests(ServerCase):
    def test_headers_and_rows(self):
        data = {"generated_at": "2026-10-21T10:00:00+02:00", "region": {"plaatsen": {"Alkmaar": "Alkmaar"}},
                "sources": [{"id": "funda", "name": "Funda", "type": "platform", "status": "ok", "count": 1}],
                "listings": [_listing("1", published_at="2026-10-20", images=["https://x/1.jpg"])]}
        supabase_sync.sync(data, self.client, log=lambda *a: None)
        post = next(e for e in FakePostgrest.log if e["table"] == "huur_woningen" and e["method"] == "POST")
        self.assertEqual(post["headers"]["apikey"], "sb_secret_testsleutel")
        self.assertNotIn("Authorization", post["headers"])  # sb_secret-sleutels niet in Authorization
        self.assertIn("resolution=merge-duplicates", post["headers"]["Prefer"])
        row = post["body"][0]
        self.assertEqual(set(row), set(supabase_sync.LISTING_COLUMNS) | {"gesynchroniseerd"})
        self.assertEqual((row["id"], row["status"], row["rent_total"], row["images"], row["features"]), ("funda:1", "beschikbaar", 1250.0, ["https://x/1.jpg"], []))
        self.assertEqual(FakePostgrest.tables["huur_instellingen"][True]["bijgewerkt"], "2026-10-21T10:00:00+02:00")
        self.assertIn("funda", FakePostgrest.tables["huur_bronnen"])

    def test_jwt_key_also_in_authorization(self):
        c = supabase_sync.Supabase(self.url, "eyJhbGciOi.test.sig")
        self.assertEqual(c.session.headers["Authorization"], "Bearer eyJhbGciOi.test.sig")

    def test_removed_listings_are_deleted_but_empty_run_deletes_nothing(self):
        base = {"generated_at": None, "region": {}, "sources": []}
        supabase_sync.sync({**base, "listings": [_listing("1"), _listing("2")]}, self.client, log=lambda *a: None)
        self.assertEqual(set(FakePostgrest.tables["huur_woningen"]), {"funda:1", "funda:2"})
        supabase_sync.sync({**base, "listings": [_listing("2")]}, self.client, log=lambda *a: None)
        self.assertEqual(set(FakePostgrest.tables["huur_woningen"]), {"funda:2"})
        supabase_sync.sync({**base, "listings": []}, self.client, log=lambda *a: None)
        self.assertEqual(set(FakePostgrest.tables["huur_woningen"]), {"funda:2"})

    def test_load_previous_paginates(self):
        FakePostgrest.tables["huur_woningen"] = {f"funda:{i:04d}": {"id": f"funda:{i:04d}", "gesynchroniseerd": "x"} for i in range(1500)}
        prev = supabase_sync.load_previous(self.client)
        self.assertEqual(len(prev["listings"]), 1500)
        self.assertNotIn("gesynchroniseerd", prev["listings"][0])

    def test_http_error_is_reported(self):
        c = supabase_sync.Supabase(self.url + "/bestaat-niet", "sb_secret_x")
        c.session.trust_env = False
        with self.assertRaises(supabase_sync.SupabaseError):
            c.update_settings({"bijgewerkt": None})


class FakeSource(Source):
    listings: list = []
    fail = False

    def scrape(self):
        if FakeSource.fail:
            from scraper.fetch import FetchError
            raise FetchError("verbinding geweigerd", fatal=True)
        return SourceResult([dict(l) for l in FakeSource.listings])


class CliTests(ServerCase):
    def setUp(self):
        super().setUp()
        config.BRONNEN["testbron"] = {"naam": "Testbron", "type": "platform", "base": "https://test.invalid"}
        REGISTRY["testbron"] = FakeSource
        self.tmp = Path(tempfile.mkdtemp())
        self.env = {k: os.environ.get(k) for k in ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "NO_PROXY", "no_proxy")}
        os.environ.update({"SUPABASE_URL": self.url, "SUPABASE_SERVICE_ROLE_KEY": "sb_secret_testsleutel",
                           "NO_PROXY": "127.0.0.1,localhost", "no_proxy": "127.0.0.1,localhost"})

    def tearDown(self):
        super().tearDown()
        config.BRONNEN.pop("testbron", None)
        REGISTRY.pop("testbron", None)
        for k, v in self.env.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v

    def run_cli(self, out):
        return cli.main(["--bronnen", "testbron", "--uitvoer", str(out), "--vertraging", "0", "--supabase", "aan"])

    def test_failed_scrape_keeps_supabase_data_and_fresh_machine_resumes(self):
        cfg = {"id": "testbron", "naam": "Testbron", "type": "platform"}
        FakeSource.listings = [model.new_listing("a", cfg, url="https://test.invalid/a", city="Alkmaar", street="Laat", house_number="1", rent_total=1200, published_at="2026-10-20")]
        FakeSource.fail = False
        self.assertEqual(self.run_cli(self.tmp / "eerste.json"), 0)
        self.assertEqual(set(FakePostgrest.tables["huur_woningen"]), {"testbron:a"})
        first_seen = FakePostgrest.tables["huur_woningen"]["testbron:a"]["first_seen"]

        # Nieuwe machine (geen lokaal JSON-bestand) en de bron faalt: data in Supabase blijft staan
        FakeSource.fail = True
        self.assertEqual(self.run_cli(self.tmp / "tweede.json"), 1)  # alle bronnen fout -> exitcode 1
        self.assertEqual(set(FakePostgrest.tables["huur_woningen"]), {"testbron:a"})
        self.assertEqual(FakePostgrest.tables["huur_woningen"]["testbron:a"]["first_seen"], first_seen)
        self.assertEqual(FakePostgrest.tables["huur_woningen"]["testbron:a"]["status"], "beschikbaar")

        # Weer een nieuwe machine, bron werkt maar woning is weg: wordt 'offline', eerst gezien blijft gelijk
        FakeSource.fail = False
        FakeSource.listings = [model.new_listing("b", cfg, url="https://test.invalid/b", city="Alkmaar", street="Laat", house_number="2", rent_total=1300)]
        self.assertEqual(self.run_cli(self.tmp / "derde.json"), 0)
        rows = FakePostgrest.tables["huur_woningen"]
        self.assertEqual(rows["testbron:a"]["status"], "offline")
        self.assertEqual(rows["testbron:a"]["first_seen"], first_seen)
        self.assertEqual(rows["testbron:b"]["status"], "beschikbaar")

    def test_supabase_aan_without_key_stops(self):
        os.environ.pop("SUPABASE_SERVICE_ROLE_KEY")
        self.assertEqual(self.run_cli(self.tmp / "x.json"), 2)


if __name__ == "__main__":
    unittest.main()
