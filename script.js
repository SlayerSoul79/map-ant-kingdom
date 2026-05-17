// ==============================
// MAP
// ==============================

const map = L.map('map', {

  crs: L.CRS.Simple,

  minZoom: -1.50,
  maxZoom: 2,

  tap: true,
  touchZoom: true,
  bounceAtZoomLimits: false

});

// taille réelle image
const width = 2560;
const height = 1920;

// limites
const bounds = [[0, 0], [height, width]];

// image carte
L.imageOverlay('map.png', bounds).addTo(map);

// vue initiale
map.fitBounds(bounds);
map.setMaxBounds(bounds);

// ==============================
// SAUVEGARDE VUE INITIALE
// ==============================

const initialCenter = map.getCenter();
const initialZoom = map.getZoom();

// ==============================
// ICON MARKER
// ==============================

const customIcon = L.icon({

  iconUrl: 'marker.png',

  iconSize: [30, 40],
  iconAnchor: [20, 40],

  popupAnchor: [0, -40]

});

// ==============================
// LISTE
// ==============================

const list = document.getElementById("locationList");

list.innerHTML = "";

// ==============================
// ZONE JOUABLE
// ==============================

// coordonnées du contour jouable
// format = [Y, X]

const playableZone = [

  [25, 1280],     // bas

  [960, 2420],    // droite

  [1885, 1285],   // haut

  [960, 140],    // gauche
]
// ==============================
// TEST SI POINT DANS ZONE
// ==============================

function isInsideZone(x, y) {

  let inside = false;

  for (
    let i = 0, j = playableZone.length - 1;
    i < playableZone.length;
    j = i++
  ) {

    const xi = playableZone[i][1];
    const yi = playableZone[i][0];

    const xj = playableZone[j][1];
    const yj = playableZone[j][0];

    const intersect =
      ((yi > y) !== (yj > y))
      &&
      (
        x <
        ((xj - xi) * (y - yi))
        / (yj - yi)
        + xi
      );

    if (intersect)
      inside = !inside;
  }

  return inside;
}

// ==============================
// LOCATIONS
// ==============================

const locations = [

  {
    name: "Alpha",
    x: 1280,
    y: 960
  },

  {
    name: "Beta",
    x: 1000,
    y: 700
  },

  {
    name: "Gamma",
    x: 1600,
    y: 1200
  },

  {
    name: "Delta",
    x: 1400,
    y: 900
  }

];

// ==============================
// TRI ALPHABETIQUE
// ==============================

locations.sort((a, b) =>
  a.name.localeCompare(b.name)
);

// ==============================
// MARKERS
// ==============================

locations.forEach(loc => {

  const x = loc.x;
  const y = loc.y;

  // filtre zone
  if (!isInsideZone(x, y)) return;

  // Leaflet = [Y, X]
  const leafletCoords = [y, x];

  // création marker
  const marker = L.marker(leafletCoords, {
    icon: customIcon
  }).addTo(map);

  // popup
  marker.bindPopup(`
    <div class="popup">
      <h3>${loc.name}</h3>
      <p>X : ${x}</p>
      <p>Y : ${y}</p>
    </div>
  `);

  // fonction focus
  function focusMarker() {

    map.flyTo(leafletCoords, 1, {
      duration: 1.5
    });

    setTimeout(() => {

      marker.openPopup();

    }, 800);

  }

  // clic marker
  marker.on('click', focusMarker);

  // élément liste
  const li = document.createElement("li");

  li.textContent = loc.name;

  // clic liste
  li.onclick = focusMarker;

  // ajout liste
  list.appendChild(li);

});

// ==============================
// BOUTON RESET VIEW
// ==============================

const resetControl = L.control({
  position: 'topleft'
});

resetControl.onAdd = function () {

  const div = L.DomUtil.create(
    'div',
    'leaflet-bar leaflet-control'
  );

  const button = L.DomUtil.create('a', '', div);

  // icône cible
  button.innerHTML = `
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#333"
      d="M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8zm9 3h-2.07A7.002 7.002 0 0 0 13 5.07V3h-2v2.07A7.002 7.002 0 0 0 5.07 11H3v2h2.07A7.002 7.002 0 0 0 11 18.93V21h2v-2.07A7.002 7.002 0 0 0 18.93 13H21v-2zM12 17a5 5 0 1 1 0-10a5 5 0 0 1 0 10z"/>
  </svg>
  `;

  button.href = "#";

  button.title = "Vue initiale";

  // taille
  button.style.width = "30px";
  button.style.height = "30px";

  // centrage
  button.style.display = "flex";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";

  button.style.padding = "0";
  button.style.margin = "0";

  // empêche propagation
  L.DomEvent.disableClickPropagation(div);

  // clic bouton
  L.DomEvent.on(button, 'click', function (e) {

    L.DomEvent.preventDefault(e);

    map.flyTo(initialCenter, initialZoom, {
      duration: 1.5
    });

  });

  return div;
};

resetControl.addTo(map);

// ==============================
// DEBUG COORDONNÉES
// ==============================

map.on('click', function(e) {

  console.log(
    "X :", Math.round(e.latlng.lng),
    "Y :", Math.round(e.latlng.lat)
  );

});