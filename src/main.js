import {
  Ion,
  Viewer,
  Cesium3DTileset,
  Terrain,
  Cartesian3,
  Math as CesiumMath,
  ScreenSpaceEventType,
  Color,
  Cesium3DTileStyle,
  defined,
  JulianDate,
  ShadowMode,
} from 'cesium';

import 'cesium/Build/Cesium/Widgets/widgets.css';
import './style.css';

// ---------------------------------------------------------------------------
// 1) Cesium-Ion-Zugang
//    Der Default-Token aus eurem Ion-Konto. Er gibt nur Lesezugriff auf eure
//    kostenlosen Assets. Nach der Abgabe in Ion loeschbar.
// ---------------------------------------------------------------------------
Ion.defaultAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwYzU3ZTMzZC1jZDkyLTRjMmQtYWI0ZS04NDg3N2MxNWNjZGEiLCJpZCI6NDQ1ODAwLCJpc3MiOiJodHRwczovL2FwaS5jZXNpdW0uY29tIiwiYXVkIjoidW5kZWZpbmVkX2RlZmF1bHQiLCJpYXQiOjE3ODE3MDkwMDZ9.9yrKgA2t2YBKFqDi8t6Wm7RbJwrkWE9r6QPyrbyZkqY';

// Die Asset-ID eures konvertierten LoD2-Datensatzes aus "My Assets".
const LOD2_ASSET_ID = 4952898;

// Startkamera: Zentrum der vier Kacheln (Stuttgart-Mitte/Sued), aus den
// UTM-Kachelnummern in WGS84 umgerechnet.
const HOME = {
  longitude: 9.190569,
  latitude: 48.779843,
  height: 1900, // Hoehe der Kamera ueber dem Boden in Metern
  heading: 20, // Blickrichtung in Grad (0 = Norden)
  pitch: -35, // Neigung nach unten in Grad
};

// ---------------------------------------------------------------------------
// 2) Viewer aufsetzen, inklusive Cesium World Terrain
//    (Aufgabe Punkt 4: Gebaeude gemeinsam mit dem Gelaende anzeigen)
// ---------------------------------------------------------------------------
const viewer = new Viewer('cesiumContainer', {
  terrain: Terrain.fromWorldTerrain(),
  // UI-Elemente, die fuer diese App nicht gebraucht werden, ausblenden
  timeline: false,
  animation: false,
  geocoder: false,
  homeButton: false,
  fullscreenButton: false,
  navigationHelpButton: false,
  sceneModePicker: false,
  baseLayerPicker: true, // erlaubt Wechsel der Hintergrundkarte
  shadows: true,
});

// Cesium-Kredit-Container dezenter; Wasserdarstellung am Terrain aktivieren
viewer.scene.globe.depthTestAgainstTerrain = true;

// ---------------------------------------------------------------------------
// 3) LoD2-Gebaeude als 3D Tiles laden und auf das Terrain setzen
// ---------------------------------------------------------------------------
let tileset;
try {
  tileset = await Cesium3DTileset.fromIonAssetId(LOD2_ASSET_ID, {
    shadows: ShadowMode.ENABLED,
  });
  viewer.scene.primitives.add(tileset);

  // Schlichtes, helles Gebaeudefarbschema, damit die Daecher lesbar bleiben
  tileset.style = new Cesium3DTileStyle({
    color: "color('#d8d4cc')",
  });
} catch (error) {
  console.error('LoD2-Tileset konnte nicht geladen werden:', error);
  showError(
    'Die Geb&auml;udedaten konnten nicht geladen werden. Pr&uuml;fen Sie Asset-ID und Token.'
  );
}

// ---------------------------------------------------------------------------
// 4) Kamera auf die Gebaeude fliegen
// ---------------------------------------------------------------------------
function flyHome() {
  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(HOME.longitude, HOME.latitude, HOME.height),
    orientation: {
      heading: CesiumMath.toRadians(HOME.heading),
      pitch: CesiumMath.toRadians(HOME.pitch),
      roll: 0,
    },
    duration: 2.5,
  });
}
flyHome();

// ---------------------------------------------------------------------------
// 5) Sandcastle-Feature: Gebaeude anklicken und Eigenschaften anzeigen
//    (Aufgabe Punkt 6: interaktives Element aus den Sandcastle-Demos)
// ---------------------------------------------------------------------------
const infoBox = document.createElement('div');
infoBox.id = 'feature-info';
infoBox.style.display = 'none';
document.body.appendChild(infoBox);

let highlighted = { feature: undefined, original: Color.WHITE.clone() };

viewer.screenSpaceEventHandler.setInputAction((movement) => {
  // vorheriges Highlight zuruecksetzen
  if (defined(highlighted.feature)) {
    try {
      highlighted.feature.color = highlighted.original;
    } catch (e) {
      /* Feature nicht mehr gueltig */
    }
    highlighted.feature = undefined;
  }

  const picked = viewer.scene.pick(movement.position);

  if (!defined(picked) || !defined(picked.getProperty)) {
    infoBox.style.display = 'none';
    return;
  }

  // angeklicktes Gebaeude hervorheben
  highlighted.feature = picked;
  highlighted.original = picked.color ? picked.color.clone() : Color.WHITE.clone();
  picked.color = Color.fromCssColorString('#e0a458');

  // verfuegbare Eigenschaften des Features auslesen
  const ids = picked.getPropertyIds ? picked.getPropertyIds() : [];
  let rows = '';
  for (const name of ids) {
    const value = picked.getProperty(name);
    if (value === undefined || value === null || value === '') continue;
    rows += `<tr><th>${escapeHtml(name)}</th><td>${escapeHtml(String(value))}</td></tr>`;
  }

  infoBox.innerHTML = `
    <div class="fi-head">
      <span class="fi-title">Geb&auml;ude</span>
      <button class="fi-close" type="button" aria-label="Schliessen">&times;</button>
    </div>
    <div class="fi-body">
      ${rows ? `<table>${rows}</table>` : '<p class="fi-empty">Keine Attribute in diesem Datensatz hinterlegt.</p>'}
    </div>`;
  infoBox.style.display = 'block';

  infoBox.querySelector('.fi-close').addEventListener('click', () => {
    infoBox.style.display = 'none';
    if (defined(highlighted.feature)) {
      try {
        highlighted.feature.color = highlighted.original;
      } catch (e) {
        /* ignorieren */
      }
      highlighted.feature = undefined;
    }
  });
}, ScreenSpaceEventType.LEFT_CLICK);

// ---------------------------------------------------------------------------
// 6) Tag-/Nacht-Beleuchtung umschalten (zweites kleines Sandcastle-Feature)
// ---------------------------------------------------------------------------
let lightingOn = false;
viewer.scene.globe.enableLighting = false;

document.getElementById('toggleTime').addEventListener('click', () => {
  lightingOn = !lightingOn;
  viewer.scene.globe.enableLighting = lightingOn;
  if (lightingOn) {
    // Uhrzeit auf Abend setzen, damit der Beleuchtungseffekt sichtbar ist
    const evening = JulianDate.fromIso8601('2026-06-21T18:30:00Z');
    viewer.clock.currentTime = evening;
  }
});

// ---------------------------------------------------------------------------
// 7) Steuerungs-Schaltflaechen verkabeln
// ---------------------------------------------------------------------------
document.getElementById('flyHome').addEventListener('click', flyHome);

// ---------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showError(message) {
  const box = document.createElement('div');
  box.id = 'load-error';
  box.innerHTML = message;
  document.body.appendChild(box);
}
