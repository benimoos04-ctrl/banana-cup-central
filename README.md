# Banana United | Cup Central

Website für einen laufenden EA-FC-Pro-Clubs-Cup: **Vereinsanmeldung nur mit Namen und Passwort**, optionaler Kader, Spielplan, Tabellen, Resultatmeldungen und automatische K.-o.-Phase.

## Online bringen: kostenlos und ohne Zahlungsmittel

**[Anleitung für Vercel Hobby + Neon Free](DEPLOY-VERCEL.md)**

Die bisherige Render-Free-Variante kann eine Zahlungsmethode verlangen und kommt deshalb für den ausdrücklich gewünschten Betrieb ohne Zahlungsdaten nicht infrage.

- Hosting: Vercel Hobby, nur für **nicht kommerzielle** Nutzung.
- Datenbank: bereits vorbereitetes Neon Free PostgreSQL.
- Geheimnisse: `DATABASE_URL`, `REQUIRE_PERSISTENT_DB=1` und `ADMIN_PASSWORD` **nur** in privaten Umgebungsvariablen.

**Ausführliche Website-Dokumentation:** [docs/README.md](docs/README.md).

## Lokal testen

```bash
pip install -r requirements.txt
ADMIN_PASSWORD='selbst-waehlen' uvicorn app:app --reload
```

Unter Windows PowerShell: zuerst `$env:ADMIN_PASSWORD='selbst-waehlen'`, dann `uvicorn app:app --reload`. Lokal wird SQLite verwendet; online ist Neon zwingend.

_Keine Verbindung oder ein Zahlungsauftrag wird durch das GitHub-Repository selbst angelegt._
