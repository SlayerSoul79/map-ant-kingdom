
// ==============================
// SCALE (carte uniquement)
// ==============================
const SCALE = 1.5;

// ==============================
// MAP
// ==============================
const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -3,
  maxZoom: 1
});

// base size
const baseWidth = 2560;
const baseHeight = 1920;

// scaled size (carte seulement)
const imageWidth = baseWidth * SCALE;
const imageHeight = baseHeight * SCALE;

const bounds = [[0, 0], [imageHeight, imageWidth]];

L.imageOverlay('map.png', bounds).addTo(map);

map.setMaxBounds(bounds);
map.fitBounds(bounds);


// ==============================
// ZONE ORANGE VISUELLE (LOSANGE)
// ==============================

// centre de la carte (BASE coords)
const centerX = baseWidth / 2;
const centerY = baseHeight / 2;

// taille zone
const diamondWidth = 1180;
const diamondHeight = 900;

// points du losange
const zonePolygon = [
  [centerY - diamondHeight / 2, centerX], // haut
  [centerY, centerX + diamondWidth / 2],   // droite
  [centerY + diamondHeight / 2, centerX],  // bas
  [centerY, centerX - diamondWidth / 2]    // gauche
];

// affichage sur la carte (IMPORTANT : SCALE appliqué)
L.polygon(zonePolygon.map(p => [p[0] * SCALE, p[1] * SCALE]), {
  color: "orange",
  weight: 2,
  fillColor: "orange",
  fillOpacity: 0.2
}).addTo(map);

// ==============================
// ICON
// ==============================
const customIcon = L.icon({
  iconUrl: 'marker.png',
  iconSize: [25, 30],
  iconAnchor: [12, 30]
});

// ==============================
// LISTE
// ==============================
const list = document.getElementById("locationList");
list.innerHTML = "";

// ==============================
// ZONE ORANGE (LOSANGE)
// ==============================
const centerX = baseWidth / 2;
const centerY = baseHeight / 2;

const diamondWidth = 1180;
const diamondHeight = 900;

function isInsideDiamond(x, y) {
  const dx = Math.abs(x - centerX);
  const dy = Math.abs(y - centerY);

  return ((dx / (diamondWidth / 2)) + (dy / (diamondHeight / 2))) <= 1;
}

// ==============================
// LIEUX (BASE COORDS)
// ==============================
const locations = [
  { name: "Fourmilière Alpha", coords: [480, 640], description: "Alliance FR01" },
  { name: "Base Beta", coords: [350, 450], description: "Zone Nord" },
  { name: "Camp Gamma", coords: [700, 800], description: "Zone Sud" }
];

// ==============================
// MARKERS + LISTE (ZONE BLOQUÉE)
// ==============================
locations.forEach(loc => {

  const x = loc.coords[1];
  const y = loc.coords[0];

  // ❌ SI HORS ZONE → ON IGNORE COMPLETEMENT
  if (!isInsideDiamond(x, y)) {
    console.log("REFUS (hors zone) :", loc.name);
    return;
  }

  // SCALE affichage
  const coords = [y * SCALE, x * SCALE];

  const marker = L.marker(coords, {
    icon: customIcon
  }).addTo(map);

  marker.bindPopup(`
    <b>${loc.name}</b><br>
    ${loc.description}
  `);

  const li = document.createElement("li");
  li.textContent = loc.name;

  li.onclick = () => {
    map.setView(coords, 1);
    marker.openPopup();
  };

  list.appendChild(li);
});