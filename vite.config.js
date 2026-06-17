import { defineConfig } from 'vite';
import cesium from 'vite-plugin-cesium';

// WICHTIG fuer GitHub Pages:
// 'base' MUSS exakt dem Repository-Namen entsprechen, mit Schraegstrichen davor und danach.
// Beispiel: Repo heisst "cesium-stuttgart"  ->  base: '/cesium-stuttgart/'
// Wenn euer Repo anders heisst, hier den Namen aendern, sonst bleibt die Seite auf Pages weiss.
// Lokal (npm run dev) ist der base-Pfad egal, er wirkt nur im Production-Build.
export default defineConfig({
  base: '/cesium-stuttgart/',
  plugins: [cesium()],
  build: {
    // Quellcode-Maps aus, kleineres Bundle fuer die Abgabe
    sourcemap: false,
  },
});
