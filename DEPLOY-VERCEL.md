# Kostenloses Deployment: Vercel Hobby + Neon Free

Für die Banana-United-Cup-Website **ohne Zahlungsmittel und ohne kostenpflichtigen Tarif**.

## Bereits erledigt
- Website und FastAPI-Backend befinden sich in diesem GitHub-Repository.
- Neon-Projekt `banana-cup-central` in Frankfurt (`aws-eu-central-1`) ist angelegt.
- `requirements.txt` enthält `fastapi`, `uvicorn` und `psycopg[binary]`. Vercel erkennt `app.py` automatisch als FastAPI-App.

## Veröffentlichen
1. Auf [Vercel](https://vercel.com/new) anmelden / GitHub mit Vercel verknüpfen.
2. Dieses Repository `benimoos04-ctrl/banana-cup-central` importieren.
3. **Hobby (kostenlos)** wählen; keinen Pro-Trial, kein Upgrade, keine Zahlungsmethode.
4. Als Umgebungsvariablen (alle **privat** in Vercel) hinterlegen:
   - `DATABASE_URL`: **pooled** PostgreSQL-Verbindungsadresse aus Neon, mit `sslmode=require`.
   - `REQUIRE_PERSISTENT_DB`: `1`.
   - `ADMIN_PASSWORD`: neu gewähltes starkes Kennwort für die Cup-Leitung.
5. Deployment starten. Für das Python-FastAPI-Projekt sind auf Vercel üblicherweise **kein Build Command und keine Start Command** nötig.
6. Die tatsächliche von Vercel bestätigte `*.vercel.app`-Adresse öffnen und `/healthz`, `/api/state`, Vereinsregistrierung und Admin-Login prüfen.

## Sicherheit / Daten
- **Niemals** die `DATABASE_URL` oder das Adminpasswort in GitHub hochladen.
- Die Datenbank wird beim ersten Serverstart angelegt. Ohne Datenbank-URL blockiert `REQUIRE_PERSISTENT_DB=1` den Start.
- Private Vereinspasswörter werden gesalzen und gehasht; Sessions liegen in Neon.
- Für längeren Betrieb: regelmässige eigene Datenbanksicherungen.
- Bei unerwarteter Aufforderung zur Zahlungsmethode: **abbrechen**, nicht fortfahren.
- Verfügbare kostenlose Ressourcen und Drittanbieterbedingungen können sich ändern.

## Nutzungsbedingungen
Vercel Hobby ist **ausschliesslich für persönliche, nicht kommerzielle Nutzung** zugelassen. Ein unentgeltliches Amateur-/Charity-Turnier ohne Verkauf, Werbung oder entgeltlichen Betrieb kann darunter fallen. Sponsorenwerbung, Produkte, bezahlte Auftragsentwicklung oder sonstige Gewinnerzielungsabsicht können diese Einordnung ändern. Im Zweifel Vercel um Bestätigung bitten.

Quellen:
- https://vercel.com/docs/frameworks/backend/fastapi
- https://vercel.com/docs/plans/hobby
- https://vercel.com/docs/limits/fair-use-guidelines

## Eigene Subdomain
Für `cup.bananaunited.ch` später in Vercel die Domain verknüpfen und bei Hostpoint den **von Vercel angezeigten** DNS-Eintrag setzen. Die bestehende Domain wird dadurch nicht automatisch umgestellt.
