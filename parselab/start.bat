@echo off
rem ParseLab starten: dashboard + server voor Website uitlezen op http://localhost:8080
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is niet gevonden. Installeer het via https://nodejs.org en probeer opnieuw. & pause & exit /b 1)
if not exist server\node_modules (echo Eerste keer: Playwright installeren... & cd server & call npm install & cd ..)
echo ParseLab start op http://localhost:8080 (sluit dit venster om te stoppen)
start "" http://localhost:8080
node server\server.js
pause
