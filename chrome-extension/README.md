# Reels Dashboard Chrome Extension

## Installation (einmalig)

1. Chrome öffnen → `chrome://extensions/` eingeben
2. Oben rechts **"Entwicklermodus"** aktivieren
3. **"Entpackte Erweiterung laden"** klicken
4. Diesen Ordner `chrome-extension/` auswählen
5. Fertig — das Extension-Icon erscheint in der Toolbar

## Nutzung

**Option A — Popup:**
1. Einen Reel auf Instagram öffnen
2. Extension-Icon in der Chrome-Toolbar klicken
3. "Diesen Reel speichern" klicken

**Option B — Button auf Instagram:**
Der Button "Zum Dashboard" erscheint direkt auf Instagram-Reels.

## Wichtig
- Das Dashboard muss laufen (`npm run dev`)
- Du musst im Dashboard eingeloggt sein
- Bei Deployment: `DASHBOARD_URL` in `content.js` und `popup.js` ändern
