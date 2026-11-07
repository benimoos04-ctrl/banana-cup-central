# 🍌 Banana Cup — EA FC Community-Turnier von Banana United

**Live-Deployment:** https://br-still-star-b99xns2r-bananacup.compute.c-7.eu-central-1.aws.neon.tech/

**Hosting:** Neon Functions + Neon PostgreSQL im bestehenden Gratisprojekt (keine neue Domain, keine Zahlungsmethode).

## Branding (7. November 2026)

Die Website wurde anhand der vom Verein gelieferten Banana-Cup-Designvorlage neu gestaltet:
- Originalgetreues, aus der Designvorlage ausgeschnittenes Wappen als WebP mit transparenten Rändern
- Stadion-Navy, Banana Yellow (`#FFD400`), Deep Black und Royal Blue
- Markante Überschriften, Flutlichtatmosphäre, Cup-Hero und neue Turnierkarten
- Desktop- und mobiloptimierte Oberfläche
- Interaktiver 8er-K.-o.-Turnierbaum (4 Viertelfinals / 2 Halbfinals / 1 Finale), auch vor Auslosung als Vorschau

## Anmeldung & Schutz

Die **gesamte Website und die API** sind durch eine vorgeschaltete gemeinsame Passwortabfrage geschützt (wie vom Veranstalter gewünscht). Team-Accounts melden sich zusätzlich mit Teamname und eigenem Passwort an. Die Turnierleitung nutzt einen separaten Admin-Login.

- Start nur mit exakt 8 angemeldeten Teams
- Resultate dürfen die beteiligten Vereine und Admins eintragen
- Sieger rücken automatisch ins Halbfinale bzw. Finale auf
- Spieltermine, Kader und Vereinsfarben sind optional
- Das gemeinsame Cup-Passwort ist bewusst ein einfacher Zugangsschutz für eine kleine eingeladene Gruppe und **kein Ersatz für individuelle Accounts**

## Dateien

- `static/index.html`: Website-Markup
- `static/style.css`: Banana-Cup-Branddesign
- `static/app.js`: UI für Home, Turnierbaum, Spielplan, Vereine und Verwaltung
- `static/banana-cup-crest.webp`: aus der gelieferten Designvorlage abgeleitetes Wappen
- `static/banana-cup-crest-mini.webp`: kompakte Wappenversion
- `neon-function.js`: serverseitige Passwortsperre, Neon-DB-Anbindung und Cup-API
- `app.py`: historische FastAPI-Version für alternatives Hosting, nicht die live genutzte Laufzeit

**Hinweis:** Im Neon-Deployment sind HTML, CSS, JS und die Wappen-Dateien in das Serverbundle eingebettet. Die `DATABASE_URL` und das administrative Passwort liegen nur als private Server-Umgebungsvariablen vor und gehören nicht in GitHub.

## Verifikation

Die Oberfläche wurde lokal in Chromium auf Desktop und Handy überprüft, einschließlich sichtbarem 7-Partien-Bracket. Die serverseitige Zugangssperre (richtiges/falsches Passwort, geschützte API, Bildausgabe) wurde lokal getestet. Neon bestätigt das aktive Deployment. Ein vollständiger externer HTTP-End-to-End-Test ist über den aktuellen Entwicklungszugriff nicht möglich.
