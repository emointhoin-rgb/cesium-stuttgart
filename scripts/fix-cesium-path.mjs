// Korrigiert einen Pfad-Fehler von vite-plugin-cesium 1.2.x:
// Bei gesetztem 'base' kopiert das Plugin die Cesium-Engine faelschlich nach
// dist/<base>/cesium/, waehrend die HTML-Referenz nur /<base>/cesium/ erwartet.
// Auf GitHub Pages ist dist/ die Wurzel von /<base>/, also muss die Engine in
// dist/cesium/ liegen. Dieses Skript verschiebt sie dorthin.
//
// Laeuft automatisch nach 'vite build' (siehe package.json -> "build").

import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');

// base aus vite.config.js lesen (einfacher Regex-Griff, reicht hier)
const cfg = fs.readFileSync('vite.config.js', 'utf8');
const m = cfg.match(/base:\s*['"]([^'"]+)['"]/);
const base = m ? m[1].replace(/^\/|\/$/g, '') : '';

if (!base) {
  console.log('[fix-cesium-path] Kein base gesetzt, nichts zu tun.');
  process.exit(0);
}

const wrong = path.join(DIST, base, 'cesium');
const right = path.join(DIST, 'cesium');

if (fs.existsSync(wrong)) {
  // Falls right schon existiert, vorher entfernen
  if (fs.existsSync(right)) {
    fs.rmSync(right, { recursive: true, force: true });
  }
  fs.renameSync(wrong, right);
  console.log(`[fix-cesium-path] Engine verschoben: ${wrong}  ->  ${right}`);

  // verwaisten dist/<base>/-Ordner aufraeumen, falls jetzt leer
  const orphan = path.join(DIST, base);
  if (fs.existsSync(orphan) && fs.readdirSync(orphan).length === 0) {
    fs.rmdirSync(orphan);
    console.log(`[fix-cesium-path] Leeren Ordner entfernt: ${orphan}`);
  }
} else if (fs.existsSync(right)) {
  console.log('[fix-cesium-path] Engine liegt bereits korrekt in dist/cesium/.');
} else {
  console.warn('[fix-cesium-path] WARNUNG: Cesium-Engine im Build nicht gefunden.');
}
