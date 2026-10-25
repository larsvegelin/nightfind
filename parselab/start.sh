#!/bin/sh
# ParseLab starten: dashboard + server voor Website uitlezen op http://localhost:8080
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then echo "Node.js is niet gevonden. Installeer het via https://nodejs.org en probeer opnieuw."; exit 1; fi
if [ ! -d server/node_modules ] && ! node -e "require('playwright')" >/dev/null 2>&1; then echo "Eerste keer: Playwright installeren…"; (cd server && npm install); fi
echo "ParseLab start op http://localhost:8080 (sluit dit venster om te stoppen)"
node server/server.js
