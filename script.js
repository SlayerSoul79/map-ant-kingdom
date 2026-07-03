// ==============================
// MAP
// ==============================

const map = L.map('map', {

  crs: L.CRS.Simple,

  minZoom: -1.55,
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
// CLUSTER
// ==============================

const markerCluster =
  L.markerClusterGroup({

    showCoverageOnHover: false,

    spiderfyOnMaxZoom: true,

    zoomToBoundsOnClick: true,

    maxClusterRadius: 60

  });

map.addLayer(markerCluster);

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
// LISTES CATÉGORIES
// ==============================

const topList =
  document.getElementById("topList");

const bottomList =
  document.getElementById("bottomList");

const leftList =
  document.getElementById("leftList");

const rightList =
  document.getElementById("rightList");

// ==============================
// SEARCH
// ==============================

const searchInput =
  document.getElementById("searchInput");

// ==============================
// ZONE JOUABLE
// ==============================

const playableZone = [

  [25, 1280],
  [960, 2420],
  [1885, 1285],
  [960, 140],

];

// ==============================
// SYSTÈME DE COORDONNÉES 1200x1200
// ==============================
//
// Haut     = X:0    Y:0
// Droite   = X:0    Y:1200
// Bas      = X:1200 Y:1200
// Gauche   = X:1200 Y:0
//

const virtualSize = 1200;

const topPoint = {
  x: 1280,
  y: 25
};

const rightPoint = {
  x: 2420,
  y: 960
};

const bottomPoint = {
  x: 1285,
  y: 1885
};

const leftPoint = {
  x: 140,
  y: 960
};

// ==============================
// CONVERSION COORDONNÉES
// ==============================

function virtualToMap(x, y) {

  const u = y / virtualSize;
  const v = x / virtualSize;

  const mapX =
      topPoint.x
    + u * (rightPoint.x - topPoint.x)
    + v * (leftPoint.x - topPoint.x);

  const mapY =
      topPoint.y
    + u * (rightPoint.y - topPoint.y)
    + v * (leftPoint.y - topPoint.y);

  return {
    x: mapX,
    y: mapY
  };

}

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
// CATÉGORIES
// ==============================

const centerX = 1280;
const centerY = 960;

function getCategory(x, y) {

  const dx = x - centerX;
  const dy = y - centerY;

  if (Math.abs(dx) > Math.abs(dy)) {

    return dx > 0
      ? "right"
      : "left";

  }

  return dy > 0
    ? "bottom"
    : "top";

}
// ==============================
// TABLEAU MARKERS PAR CATÉGORIE
// ==============================

const categoryMarkers = {

  top: [],
  bottom: [],
  left: [],
  right: []

};

// ==============================
// LOCATIONS
// ==============================
//
// Les coordonnées sont maintenant
// dans le repère virtuel 1200x1200.
//
// Haut     = X:0    Y:0
// Droite   = X:0    Y:1200
// Bas      = X:1200 Y:1200
// Gauche   = X:1200 Y:0
//

const locations = [

  {
    name: "Centre",
    x: 600,
    y: 600
  },

  {
    name: "Coin haut",
    x: 0,
    y: 0
  },

  {
    name: "Coin droit",
    x: 0,
    y: 1200
  },

  {
    name: "Coin bas",
    x: 1200,
    y: 1200
  },

  {
    name: "Coin gauche",
    x: 1200,
    y: 0
  }

];

// ==============================
// TRI ALPHABETIQUE
// ==============================

locations.sort((a, b) =>
  a.name.localeCompare(b.name)
);

// ==============================
// TABLEAU DES MARKERS
// ==============================

const allMarkers = [];

// ==============================
// MARKERS
// ==============================

locations.forEach(loc => {

  // coordonnées virtuelles
  const virtualX = loc.x;
  const virtualY = loc.y;

  // conversion vers la carte
  const mapPos =
    virtualToMap(virtualX, virtualY);

  const x = mapPos.x;
  const y = mapPos.y;

  // filtre zone
  if (!isInsideZone(x, y))
    return;

  // coordonnées leaflet
  const leafletCoords = [y, x];

  // création marker
  const marker = L.marker(
    leafletCoords,
    {
      icon: customIcon
    }
  );

  markerCluster.addLayer(marker);

  // popup
  marker.bindPopup(`
    <div class="popup">
      <h3>${loc.name}</h3>
      <p>X : ${virtualX}</p>
      <p>Y : ${virtualY}</p>
    </div>
  `);

  // focus marker
  function focusMarker() {

    map.flyTo(
      leafletCoords,
      1,
      {
        duration: 1.5
      }
    );

    setTimeout(() => {

      marker.openPopup();

    }, 800);

  }

  // clic marker
  marker.on(
    'click',
    focusMarker
  );

  // élément liste
  const li =
    document.createElement("li");

  li.textContent = loc.name;

  li.dataset.name =
    loc.name.toLowerCase();

  // clic liste
  li.onclick = focusMarker;

  // catégorie
  const category =
    getCategory(x, y);

  // ajout liste catégorie

  if (category === "top") {

    topList.appendChild(li);

  }

  else if (category === "bottom") {

    bottomList.appendChild(li);

  }

  else if (category === "left") {

    leftList.appendChild(li);

  }

  else if (category === "right") {

    rightList.appendChild(li);

  }

  // sauvegarde catégorie
  categoryMarkers[category]
    .push(marker);

  // sauvegarde globale
  allMarkers.push({

    marker,
    li,

    name:
      loc.name.toLowerCase(),

    category

  });

});
// ==============================
// SEARCH
// ==============================

searchInput.addEventListener("input", () => {

  const value =
    searchInput.value.toLowerCase();

  allMarkers.forEach(item => {

    const match =
      item.name.includes(value);

    // afficher / cacher liste
    item.li.style.display =
      match ? "block" : "none";

    // afficher / cacher marker
    if (match) {

      markerCluster
        .addLayer(item.marker);

    }

    else {

      markerCluster
        .removeLayer(item.marker);

    }

  });

});

// ==============================
// CATÉGORIES REPLIABLES
// ==============================

const categoryTitles =
  document.querySelectorAll(".categoryTitle");

categoryTitles.forEach(title => {

  title.innerHTML =
    `▼ ${title.innerText}`;

  title.dataset.open = "true";

  title.addEventListener("click", () => {

    const ul =
      title.nextElementSibling;

    const category =
      ul.id.replace("List", "");

    const isOpen =
      title.dataset.open === "true";

    // fermer
    if (isOpen) {

      ul.style.display = "none";

      title.innerHTML =
        `▶ ${title.innerText.replace("▼ ", "")}`;

      title.dataset.open = "false";

      // cacher markers
      categoryMarkers[category]
        .forEach(marker => {

          markerCluster
            .removeLayer(marker);

        });

    }

    // ouvrir
    else {

      ul.style.display = "block";

      title.innerHTML =
        `▼ ${title.innerText.replace("▶ ", "")}`;

      title.dataset.open = "true";

      // afficher markers
      categoryMarkers[category]
        .forEach(marker => {

          markerCluster
            .addLayer(marker);

        });

    }

  });

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

  const button =
    L.DomUtil.create('a', '', div);

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
  L.DomEvent
    .disableClickPropagation(div);

  // clic bouton
  L.DomEvent.on(
    button,
    'click',
    function (e) {

      L.DomEvent.preventDefault(e);

      map.flyTo(
        initialCenter,
        initialZoom,
        {
          duration: 1.5
        }
      );

    }
  );

  return div;
};

resetControl.addTo(map);
// ==============================
// CONVERSION CARTE -> COORDONNÉES VIRTUELLES
// ==============================

function mapToVirtual(mapX, mapY) {

  // Vecteurs du losange
  const ax = rightPoint.x - topPoint.x;
  const ay = rightPoint.y - topPoint.y;

  const bx = leftPoint.x - topPoint.x;
  const by = leftPoint.y - topPoint.y;

  // Résolution du système
  const det = ax * by - ay * bx;

  const dx = mapX - topPoint.x;
  const dy = mapY - topPoint.y;

  const u = (dx * by - dy * bx) / det;
  const v = (ax * dy - ay * dx) / det;

  return {

    x: Math.round(v * virtualSize),
    y: Math.round(u * virtualSize)

  };

}

// ==============================
// DEBUG COORDONNÉES
// ==============================

map.on('click', function(e) {

  const coords = mapToVirtual(
    e.latlng.lng,
    e.latlng.lat
  );

  console.clear();

  console.log("----------------------------");
  console.log("Coordonnées virtuelles");
  console.log("X :", coords.x);
  console.log("Y :", coords.y);
  console.log("----------------------------");

});

// ==============================
// SIDEBAR MOBILE SLIDE
// ==============================

const sidebar =
  document.getElementById("sidebar");

const sidebarHandle =
  document.getElementById("sidebarHandle");

sidebarHandle.addEventListener("click", () => {

  // ouvrir
  if (sidebar.classList.contains("collapsed")) {

    sidebar.classList.remove("collapsed");

    sidebar.classList.add("open");

  }

  // fermer
  else {

    sidebar.classList.remove("open");

    sidebar.classList.add("collapsed");

  }

});