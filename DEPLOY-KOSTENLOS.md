# Banana United Cup Central – kostenlos online stellen

Diese Version läuft mit **Render Free + Neon Free** für 0 CHF. Vereinsaccounts,
Resultate und Anmeldungen liegen in einer externen PostgreSQL-Datenbank und
bleiben bei einem Render-Neustart erhalten. Hosting-Limits können dennoch zu
Unterbrüchen führen; regelmässige eigene Datenbanksicherungen sind sinnvoll.

## Voraussetzungen

- Ein **eigenes, leeres GitHub-Repository** `banana-cup-central`
- Ein **kostenloses Neon-Projekt** mit PostgreSQL (https://console.neon.tech/)
- Ein verbundenes Render-Konto

## Schritt 1: Code auf GitHub

Ein neues GitHub-Repository **mit README** erstellen (https://github.com/new).
Danach alle Dateien dieses Projektordners in die Wurzel des Repositories legen.
**Nicht** hochladen: `data/`, `.env`, `__pycache__/` oder echte Passwörter.

## Schritt 2: Gratis-Datenbank

Bei Neon im kostenlosen Plan ein Projekt `banana-cup-central` anlegen.
Auf **Connect** gehen und den `postgresql://...`-Connection-String kopieren.
`sslmode=require` sollte enthalten sein. Die URL ist geheim und gehört nie in
GitHub oder in öffentliche Chats.

## Schritt 3: Kostenlosen Web-Service bei Render anlegen

Render -> New -> Web Service -> GitHub-Repository auswählen:

- Plan: **Free** (keine kostenpflichtige Instanz aktivieren)
- Region: Frankfurt
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app:app --host 0.0.0.0 --port $PORT --proxy-headers`
- Umgebungsvariable `DATABASE_URL`: der geheime Neon-Connection-String
- Umgebungsvariable `ADMIN_PASSWORD`: ein neues, starkes Passwort für die Turnierleitung
- Umgebungsvariable `REQUIRE_PERSISTENT_DB`: `1`

Render erzeugt eine öffentliche HTTPS-Adresse, z. B. nach dem Muster
`https://banana-cup-central.onrender.com` (erst nach erfolgreichem Deployment
ist diese Adresse tatsächlich erreichbar). `render.yaml` enthält die Free-Konfiguration.

## Eigene Domain, falls gewünscht

In Render: Web Service -> Settings -> Custom Domains -> `cup.bananaunited.ch` hinzufügen.
Den dort gezeigten DNS-Eintrag anschliessend bei Hostpoint setzen.
Diesen Hostname nicht vorher als funktionierende URL betrachten.

## Kosten und Einschränkungen

- **0 CHF** innerhalb der Gratislimits von Render und Neon.
- Render Free schläft nach rund 15 Minuten ohne Aufrufe ein. Der erste Zugriff
  danach kann bis zu einer Minute dauern.
- Die SQLite-Datei ist nur für den lokalen Betrieb. Im öffentlichen Betrieb ist
  `DATABASE_URL` zwingend – ohne diese startet die Seite absichtlich nicht,
  damit keine Vereinsdaten verloren gehen.
- Bei einer Überschreitung von Free-Quoten können Dienste pausieren; bei
  Render können bei hinterlegtem Zahlungsmittel unter bestimmten Umständen
  zusätzliche Nutzungsgebühren entstehen. Kosten-/Ausgabenlimit im Render-Konto
  prüfen und **keine kostenpflichtige Upgrade-Option auswählen**.
- Ein Neon-Free-Projekt behält Daten, aber hat Obergrenzen für Datenbankgrösse,
  Rechenzeit und Datentransfer. Bei Quotenüberschreitung kann die Datenbank
  zeitweilig nicht erreichbar sein.

**Sicherheit:** API-URL mit Passwort nie im Code ablegen; `ADMIN_PASSWORD` nicht
mit einem Clubpasswort teilen. Als öffentlicher Community-Cup sind zusätzlich
gelegentliche Backups und Kontrolle der Resultate durch Admins sinnvoll.