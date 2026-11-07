# Banana United Cup Central

Eine eigenständige, responsive EA-FC-Cup-Website. **Genau ein aktiver Cup**, keine Event-Historie und keine Pflicht, Spieler einzutragen.

## Funktionen

- Öffentliche Übersicht des aktuell laufenden Cups; keine kommenden oder vergangenen Events.
- Verein registrieren **nur mit Vereinsnamen und gemeinsamem Passwort** (keine E-Mail).
- Vereinsprofile mit Kürzel, Farbe und **freiwilliger** Spieler-/Kaderliste.
- Vereinslogin für die ganze Mannschaft, Resultate **nur eigener Spiele** melden.
- Automatische Berechnung von Punkten, Siegen, Unentschieden, Niederlagen, Tordifferenz und Gruppentabellen (3/1/0 Punkte).
- Turnierarten: Gruppenphase mit automatisch startbarer K.-o.-Runde; Jeder-gegen-jeden; reines K.-o.-Turnier.
- Automatische Aufstellung des Spielplans; Hin-/Rückrunde optional bei Gruppen- und Ligamodus.
- Automatisches Weiterkommen im K.-o.-Baum, mit Auswahl des Siegers nach Penaltyschiessen bei Remis.
- Admin: Cup verwalten, Anmeldungen öffnen/schliessen, Vereinszuordnung, Termine, Resultate, Passwort-Reset.
- **Neuer Cup** löscht alte Resultate und Spielpaarungen; bestehende Vereinsaccounts bleiben erhalten und können sich erneut anmelden.

## Lokal starten

Voraussetzung: Python 3.10+.

```bash
cd banana-cup-central
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
export ADMIN_PASSWORD='EIN_LANGES_ZUFAELLIGES_ADMIN_PASSWORT'
uvicorn app:app --host 0.0.0.0 --port 8000
```

Aufrufen: **http://localhost:8000**. Admin-Login: Im Vereinslogin unten auf **Turnierleitung** klicken. Das Admin-Passwort ist `ADMIN_PASSWORD`.

Windows PowerShell: `$env:ADMIN_PASSWORD='...'` statt `export`.

In der ZIP-Datei werden **keine Demo-Vereine mitgeliefert**. Sie startet mit einem leeren Cup. Die separat gelieferte HTML-Vorschau enthält nur künstliche Testdaten und ist ausdrücklich **kein gemeinsamer Online-Server**.

## Kostenlos öffentlich bereitstellen (Render + Neon)

Eine **vollständig kostenlose** Hosting-Option ist vorbereitet. Die Website läuft
auf Render Free und speichert Vereine, Sessions, Spielplan und Resultate in
Neon Free PostgreSQL. Anders als die lokale SQLite-Datei bleibt der Datenstand
damit erhalten, wenn der kostenlose Render-Server einschläft oder neustartet.

**[Genaue Anleitung: DEPLOY-KOSTENLOS.md](DEPLOY-KOSTENLOS.md)**

Die `render.yaml` enthält bereits **Plan `free`** und fordert die geheimen
Umgebungsvariablen `DATABASE_URL` sowie `ADMIN_PASSWORD` beim Einrichten an.
Sie richtet ausdrücklich keine kostenpflichtige Disk ein.

Ohne `DATABASE_URL` verweigert das öffentliche Deployment den Start, damit
Accountdaten nicht aus Versehen im flüchtigen Render-Speicher abgelegt werden.

## Bedienung

1. Turnierleitung meldet sich an und gibt Cup-Namen sowie Format an.
2. Anmeldungsphase: Clubs registrieren sich mit Namen und Passwort. Bereits bestehende Vereinsaccounts können dem neuen Cup beitreten.
3. Turnierleitung generiert Spielplan; danach ist die Teilnahme fixiert.
4. Vereinsmitglieder melden sich mit **demselben Vereinslogin** an und erfassen die Resultate ihrer Spiele. Das andere Team bzw. der Admin kann ein fehlerhaftes Resultat korrigieren.
5. Bei Gruppenmodus startet der Admin nach Abschluss **aller Gruppenspiele** die K.-o.-Phase.
6. Im Adminbereich beginnt man später einen neuen Cup. Es wird keine Cup-Historie angezeigt.

## Wichtige Hinweise

- Ohne E-Mail ist ein automatischer Passwort-Reset unmöglich. **Die Turnierleitung kann vergessene Passwörter zurücksetzen** und alte Sessions abmelden.
- Bereits abgegebene Resultate sind sofort wirksam; für strittige Ergebnisse entscheidet die Turnierleitung. Es gibt kein obligatorisches Gegenbestätigungsverfahren.
- Bei gleichen Punkten sortiert das System nach Tordifferenz, erzielten Toren, danach Vereinsname. Keine Direktbegegnungs-Tiebreaker.
- Das ist ein eigenständiges Community-Projekt, keine offizielle EA SPORTS FC-Plattform.
- Als kleines Community-Tool ausgelegt; vor grossem öffentlichen Einsatz sollten zusätzlicher Abuse-Schutz, Backups und Monitoring eingerichtet werden.