# Meine Aufgaben

Persönliche Alltags- und Aufgaben-App (React, TypeScript, Vite).

## App starten

1. Terminal in diesem Ordner öffnen.
2. Beim ersten Mal (oder nach neuen Paketen): `npm install`
3. `npm run dev`
4. Im Browser die angezeigte Adresse öffnen, meist http://localhost:5173
5. Beenden: im Terminal `Strg + C` drücken.

## Weitere Befehle

- `npm run build` prüft die Typen und baut die fertige App in den Ordner `dist`.
- `npm run lint` sucht nach typischen Code-Fehlern.
- `npm test` führt die automatischen Tests aus (Aufgaben-Aktionen und Datumslogik).

## Als App installieren (PWA)

Die Installation und der Offline-Start funktionieren nur mit der fertig gebauten App, nicht mit `npm run dev`:

1. `npm run build`
2. `npm run preview` und die angezeigte Adresse öffnen, meist http://localhost:4173
3. In Chrome oder Edge in der Adressleiste auf „App installieren“ klicken.

Die App-Symbole in `public/` entstehen aus `scripts/icon-template.svg`.
