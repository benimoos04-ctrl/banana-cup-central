# Banana United Cup Central

Ein öffentlich erreichbarer EA-FC-Pro-Clubs-Cup für Banana United. Vereinsanmeldung mit Name und gemeinsamem Passwort, optionaler Kader, Spielplan, Resultatmeldung, Tabellen und automatischer K.-o.-Baum.

## Aktuelle Veröffentlichung

- **Cup-URL:** https://br-still-star-b99xns2r-bananacup.compute.c-7.eu-central-1.aws.neon.tech/
- **Server:** Neon Functions (Node.js 24) – kostenlose Infrastruktur
- **Datenbank:** Neon PostgreSQL `banana_cup`, Projekt `gentle-pond-89083797`, Region Frankfurt
- **Status (7. November 2026):** Deployment 4 erfolgreich; Datenbankschema und Default-Cup angelegt. Externer HTTP-Funktionstest war über den verwendeten Zugriffskanal nicht möglich; die Erreichbarkeit im Browser ist noch zu bestätigen.

**Keine Zahlungsmethode und kein kostenpflichtiger Hostingtarif verwendet.**

## Code und Architektur

- `neon-function.js`: produktiv deployter Node-Server, parallel zum ursprünglichen Python-Backend
- `static/`: HTML/CSS/JavaScript der Website (beim Neon-Deployment in die Serverfunktion eingebettet)
- `app.py`: ursprünglicher FastAPI-Server für alternative Hosts
- `requirements.txt`: Python-Abhängigkeiten für alternative Hosts

Der Neon-Function-Server benötigt `DATABASE_URL` und `ADMIN_PASSWORD` als **private Umgebungsvariablen**. Keine Zugangsdaten in dieses Repository hochladen.

## Lokal testen (Python-Version)

```bash
pip install -r requirements.txt
uvicorn app:app --reload
```

## Hinweise

Ein kostenloser Tarif kann technische Limits und sich ändernde Nutzungsbedingungen haben. Vor einer öffentlichen Turnierankündigung Registrierung, Vereinslogin, Ergebnisübermittlung und Admin-Zugang in einem echten Browser testen. Persönliche Vereinspasswörter nicht wiederverwenden.
