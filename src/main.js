import {
  Ion,
  Viewer,
  Cesium3DTileset,
  Terrain,
  Cartesian3,
  Cartographic,
  Matrix4,
  Math as CesiumMath,
  ScreenSpaceEventType,
  Color,
  Cesium3DTileStyle,
  defined,
  JulianDate,
  ShadowMode,
  HeadingPitchRange,
} from 'cesium';

import 'cesium/Build/Cesium/Widgets/widgets.css';
import './style.css';

// ---------------------------------------------------------------------------
// 1) Cesium-Ion-Zugang
// ---------------------------------------------------------------------------
Ion.defaultAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwYzU3ZTMzZC1jZDkyLTRjMmQtYWI0ZS04NDg3N2MxNWNjZGEiLCJpZCI6NDQ1ODAwLCJpc3MiOiJodHRwczovL2FwaS5jZXNpdW0uY29tIiwiYXVkIjoidW5kZWZpbmVkX2RlZmF1bHQiLCJpYXQiOjE3ODE3MDkwMDZ9.9yrKgA2t2YBKFqDi8t6Wm7RbJwrkWE9r6QPyrbyZkqY';

const LOD2_ASSET_ID = 4952898;

// Hoehenkorrektur in Metern. Die LoD2-Daten sassen nach dem Ion-Upload
// ("Clamp to terrain") zu tief und verschwanden im Gelaende. Dieser Wert hebt
// das Tileset an. Bei Bedarf live anpassbar: im Browser F12 -> Console ->
//   setBuildingHeight(40)
// und den Wert variieren, bis die Gebaeude sauber auf dem Boden stehen.
let HEIGHT_OFFSET = 0;

// ---------------------------------------------------------------------------
// 2) Viewer mit Cesium World Terrain
// ---------------------------------------------------------------------------
const viewer = new Viewer('cesiumContainer', {
  terrain: Terrain.fromWorldTerrain(),
  timeline: false,
  animation: false,
  geocoder: false,
  homeButton: false,
  fullscreenButton: false,
  navigationHelpButton: false,
  sceneModePicker: false,
  baseLayerPicker: true,
  shadows: true,
});

// Fuer Diagnose im Browser zugaenglich machen
window.cesiumViewer = viewer;

// depthTestAgainstTerrain bewusst AUS: sonst koennen Gebaeude, die minimal im
// Gelaende stecken, faelschlich verdeckt werden.
viewer.scene.globe.depthTestAgainstTerrain = false;

// ---------------------------------------------------------------------------
// 3) LoD2-Gebaeude laden, anheben, Kamera darauf richten
// ---------------------------------------------------------------------------
let tileset;

// Hebt das Tileset entlang der lokalen Hochachse um "offset" Meter an.
function applyHeightOffset(ts, offset) {
  const boundingCenter = ts.boundingSphere.center;
  const carto = Cartographic.fromCartesian(boundingCenter);
  const surface = Cartesian3.fromRadians(carto.longitude, carto.latitude, 0.0);
  const target = Cartesian3.fromRadians(carto.longitude, carto.latitude, offset);
  const translation = Cartesian3.subtract(target, surface, new Cartesian3());
  ts.modelMatrix = Matrix4.fromTranslation(translation);
}

// Global verfuegbare Funktion zum Live-Justieren der Hoehe
window.setBuildingHeight = (meters) => {
  HEIGHT_OFFSET = meters;
  if (tileset) {
    applyHeightOffset(tileset, meters);
    console.log('Gebaeudehoehe gesetzt auf', meters, 'm');
  }
};

try {
  tileset = await Cesium3DTileset.fromIonAssetId(LOD2_ASSET_ID, {
    shadows: ShadowMode.ENABLED,
  });
  viewer.scene.primitives.add(tileset);

  tileset.style = new Cesium3DTileStyle({
    color: "color('#d8d4cc')",
  });

  applyHeightOffset(tileset, HEIGHT_OFFSET);

  // Kamera automatisch auf die tatsaechliche Tileset-Position fliegen
  await viewer.zoomTo(
    tileset,
    new HeadingPitchRange(
      CesiumMath.toRadians(20),
      CesiumMath.toRadians(-35),
      1600
    )
  );
} catch (error) {
  console.error('LoD2-Tileset konnte nicht geladen werden:', error);
  showError(
    'Die Geb&auml;udedaten konnten nicht geladen werden. Pr&uuml;fen Sie Asset-ID und Token.'
  );
}

// ---------------------------------------------------------------------------
// 4) Kamera zurueck auf die Gebaeude
// ---------------------------------------------------------------------------
function flyHome() {
  if (tileset) {
    viewer.zoomTo(
      tileset,
      new HeadingPitchRange(
        CesiumMath.toRadians(20),
        CesiumMath.toRadians(-35),
        1600
      )
    );
  }
}

// ---------------------------------------------------------------------------
// 5) Sandcastle-Feature: Gebaeude anklicken und Eigenschaften anzeigen
// ---------------------------------------------------------------------------
const infoBox = document.createElement('div');
infoBox.id = 'feature-info';
infoBox.style.display = 'none';
document.body.appendChild(infoBox);

let highlighted = { feature: undefined, original: Color.WHITE.clone() };

viewer.screenSpaceEventHandler.setInputAction((movement) => {
  if (defined(highlighted.feature)) {
    try {
      highlighted.feature.color = highlighted.original;
    } catch (e) {}
    highlighted.feature = undefined;
  }

  const picked = viewer.scene.pick(movement.position);

  if (!defined(picked) || !defined(picked.getProperty)) {
    infoBox.style.display = 'none';
    return;
  }

  highlighted.feature = picked;
  highlighted.original = picked.color ? picked.color.clone() : Color.WHITE.clone();
  picked.color = Color.fromCssColorString('#e0a458');

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
      } catch (e) {}
      highlighted.feature = undefined;
    }
  });
}, ScreenSpaceEventType.LEFT_CLICK);

// ---------------------------------------------------------------------------
// 6) Tag-/Nacht-Beleuchtung
// ---------------------------------------------------------------------------
let lightingOn = false;
viewer.scene.globe.enableLighting = false;

document.getElementById('toggleTime').addEventListener('click', () => {
  lightingOn = !lightingOn;
  viewer.scene.globe.enableLighting = lightingOn;
  if (lightingOn) {
    const evening = JulianDate.fromIso8601('2026-06-21T18:30:00Z');
    viewer.clock.currentTime = evening;
  }
});

// ---------------------------------------------------------------------------
// 7) Schaltflaechen
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
