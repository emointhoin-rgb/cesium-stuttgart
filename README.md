# Stuttgart in 3D — Cesium + Vite

Eine 3D-Webkarten-Anwendung, die LoD2-Gebäudemodelle des Landes Baden-Württemberg
(Datensatz LoD2_32_513_5402, vier Kacheln, Raum Stuttgart-Mitte/Süd) gemeinsam mit
dem Cesium World Terrain darstellt. Gebaut mit Vite und CesiumJS.

**Funktionen**

- 3D-Gebäude (3D Tiles) auf realem Geländemodell
- Gebäude anklicken zeigt die hinterlegten Attribute (Klick-Picking aus Cesium Sandcastle)
- Umschaltbare Tag-/Nacht-Beleuchtung
- Kamera-Schaltfläche, die zurück auf die Gebäude fliegt
- Wechselbare Hintergrundkarte (BaseLayerPicker)

---

## Lokal starten

```bash
npm install
npm run dev
```

Die App läuft dann unter der Adresse, die im Terminal steht (meist `http://localhost:5173`).

## Produktions-Build

```bash
npm run build
npm run preview
```

`npm run build` erzeugt den Ordner `dist/`. Der enthält einen Korrekturschritt
(`scripts/fix-cesium-path.mjs`), der die Cesium-Engine an den Pfad legt, den
GitHub Pages erwartet. Das passiert automatisch, ihr müsst nichts von Hand machen.

---

## Auf GitHub Pages veröffentlichen

Es gibt zwei Wege. **Weg A (empfohlen)** macht alles automatisch über GitHub Actions.

### Vorbereitung: base-Pfad prüfen

Öffnet `vite.config.js`. Dort steht:

```js
base: '/cesium-stuttgart/',
```

Dieser Wert **muss exakt eurem Repository-Namen entsprechen**, mit Schrägstrich davor
und danach. Wenn euer Repo z. B. `vr-stuttgart` heißt, ändert ihr die Zeile zu
`base: '/vr-stuttgart/'`. Ist der Wert falsch, bleibt die Seite auf Pages weiß.

### Weg A: Automatisch über GitHub Actions

1. Repository auf GitHub anlegen (ohne README/`.gitignore`, das bringt ihr selbst mit).

2. Im Projektordner die folgenden Befehle ausführen. Ersetzt `EUER-NAME` und
   `REPO-NAME` durch eure Werte:

   ```bash
   git init
   git add .
   git commit -m "Cesium 3D Stuttgart"
   git branch -M main
   git remote add origin https://github.com/EUER-NAME/REPO-NAME.git
   git push -u origin main
   ```

3. Auf GitHub: **Settings → Pages → Build and deployment → Source** auf
   **"GitHub Actions"** stellen.

4. Fertig. Der Workflow `.github/workflows/deploy.yml` baut und veröffentlicht
   automatisch. Unter **Actions** seht ihr den Fortschritt. Nach ein bis zwei Minuten
   ist die Seite live unter:

   ```
   https://EUER-NAME.github.io/REPO-NAME/
   ```

   Bei jedem weiteren `git push` wird automatisch neu deployt.

### Weg B: Manuell (ohne Actions)

Falls Actions nicht gewünscht ist:

```bash
npm run build
```

Dann den **Inhalt** des `dist/`-Ordners in den `gh-pages`-Branch des Repos schieben
und unter Settings → Pages diesen Branch als Quelle wählen.

---

## Technischer Hinweis zum Cesium-Token

Der Cesium-Ion-Access-Token steht in `src/main.js`. Bei Cesium ist es normal und
unvermeidlich, dass dieser Token im ausgelieferten JavaScript sichtbar ist, da der
Browser ihn zum Laden der Assets braucht. Der Default-Token gibt nur Lesezugriff auf
die kostenlosen Assets des Kontos. Nach der Abgabe kann er in Cesium Ion unter
"Access Tokens" gelöscht oder neu erzeugt werden.

---

## Projektstruktur

```
cesium-stuttgart/
├─ index.html              Einstiegspunkt, UI-Grundgerüst
├─ vite.config.js          Vite + Cesium-Plugin, base-Pfad für Pages
├─ package.json            Abhängigkeiten und Scripts
├─ src/
│  ├─ main.js              Viewer, Terrain, Tileset, Klick-Picking, Beleuchtung
│  └─ style.css            UI-Gestaltung
├─ scripts/
│  └─ fix-cesium-path.mjs  Post-Build-Korrektur der Engine-Pfade
└─ .github/workflows/
   └─ deploy.yml           Automatisches Deployment auf GitHub Pages
```
