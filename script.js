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

const markerCluster = L.markerClusterGroup({
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
// DOM SAFE ACCESS
// ==============================

const topList = document.getElementById("topList");
const bottomList = document.getElementById("bottomList");
const leftList = document.getElementById("leftList");
const rightList = document.getElementById("rightList");

const searchInput = document.getElementById("searchInput");

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
// SAFE ZONE CHECK
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
      ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}

// ==============================
// CATEGORY
// ==============================

const centerX = 1280;
const centerY = 960;

function getCategory(x, y) {

  const dx = x - centerX;
  const dy = y - centerY;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "right" : "left";
  }

  return dy > 0 ? "bottom" : "top";
}

// ==============================
// DATA
// ==============================

const categoryMarkers = {
  top: [],
  bottom: [],
  left: [],
  right: []
};

const allMarkers = [];

// ==============================
// LOCATIONS
// ==============================

const locations = [
  { name: "Alpha", x: 1280, y: 960 },
  { name: "Beta", x: 1000, y: 700 },
  { name: "Gamma", x: 1600, y: 1200 },
  { name: "Delta", x: 1400, y: 900 }
];

locations.sort((a, b) => a.name.localeCompare(b.name));

// ==============================
// MARKERS
// ==============================

locations.forEach(loc => {

  const x = loc.x;
  const y = loc.y;

  if (!isInsideZone(x, y)) return;

  const leafletCoords = [y, x];

  const marker = L.marker(leafletCoords, {
    icon: customIcon
  });

  markerCluster.addLayer(marker);

  marker.bindPopup(`
    <div class="popup">
      <h3>${loc.name}</h3>
      <p>X : ${x}</p>
      <p>Y : ${y}</p>
    </div>
  `);

  function focusMarker() {
    map.flyTo(leafletCoords, 1, { duration: 1.5 });

    setTimeout(() => {
      marker.openPopup();
    }, 800);
  }

  marker.on('click', focusMarker);

  const li = document.createElement("li");
  li.textContent = loc.name;
  li.dataset.name = loc.name.toLowerCase();
  li.onclick = focusMarker;

  const category = getCategory(x, y);

  if (topList && category === "top") topList.appendChild(li);
  if (bottomList && category === "bottom") bottomList.appendChild(li);
  if (leftList && category === "left") leftList.appendChild(li);
  if (rightList && category === "right") rightList.appendChild(li);

  categoryMarkers[category].push(marker);

  allMarkers.push({
    marker,
    li,
    name: loc.name.toLowerCase(),
    category
  });
});

// ==============================
// SEARCH SAFE
// ==============================

if (searchInput) {
  searchInput.addEventListener("input", () => {

    const value = searchInput.value.toLowerCase();

    allMarkers.forEach(item => {

      const match = item.name.includes(value);

      item.li.style.display = match ? "block" : "none";

      if (match) markerCluster.addLayer(item.marker);
      else markerCluster.removeLayer(item.marker);

    });

  });
}

// ==============================
// CATEGORY TOGGLE SAFE
// ==============================

const categoryTitles = document.querySelectorAll(".categoryTitle");

categoryTitles.forEach(title => {

  title.innerHTML = `▼ ${title.innerText}`;
  title.dataset.open = "true";

  title.addEventListener("click", () => {

    const ul = title.nextElementSibling;
    const category = ul.id.replace("List", "");
    const isOpen = title.dataset.open === "true";

    if (isOpen) {

      ul.style.display = "none";
      title.innerHTML = `▶ ${title.innerText.replace("▼ ", "")}`;
      title.dataset.open = "false";

      categoryMarkers[category].forEach(m => markerCluster.removeLayer(m));

    } else {

      ul.style.display = "block";
      title.innerHTML = `▼ ${title.innerText.replace("▶ ", "")}`;
      title.dataset.open = "true";

      categoryMarkers[category].forEach(m => markerCluster.addLayer(m));
    }

  });

});

// ==============================
// RESET BUTTON
// ==============================

const resetControl = L.control({ position: 'topleft' });

resetControl.onAdd = function () {

  const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
  const button = L.DomUtil.create('a', '', div);

  button.innerHTML = "⟳";
  button.href = "#";
  button.title = "Vue initiale";

  L.DomEvent.disableClickPropagation(div);

  L.DomEvent.on(button, 'click', function (e) {
    L.DomEvent.preventDefault(e);

    map.flyTo(initialCenter, initialZoom, { duration: 1.5 });
  });

  return div;
};

resetControl.addTo(map);

// ==============================
// CLICK MAP (FIX FINAL)
// ==============================

map.on('click', function (e) {

  if (!e.latlng) return;

  const x = Math.round(e.latlng.lng);
  const y = Math.round(e.latlng.lat);

  console.log("X:", x, "Y:", y);

  const xInput = document.getElementById("coordX");
  const yInput = document.getElementById("coordY");

  if (xInput) xInput.value = x;
  if (yInput) yInput.value = y;
});

// ==============================
// SIDEBAR SAFE
// ==============================

const sidebar = document.getElementById("sidebar");
const sidebarHandle = document.getElementById("sidebarHandle");

if (sidebar && sidebarHandle) {

  sidebarHandle.addEventListener("click", () => {

    if (sidebar.classList.contains("collapsed")) {
      sidebar.classList.remove("collapsed");
      sidebar.classList.add("open");
    } else {
      sidebar.classList.remove("open");
      sidebar.classList.add("collapsed");
    }

  });

}

// ==============================
// MODAL
// ==============================

function addMarker() {

  const name = document.getElementById("markerName").value;
  const x = parseInt(document.getElementById("coordX").value);
  const y = parseInt(document.getElementById("coordY").value);

  if (!name || isNaN(x) || isNaN(y)) {
    alert("Remplis tous les champs !");
    return;
  }

  const leafletCoords = [y, x];

  const marker = L.marker(leafletCoords, {
    icon: customIcon
  });

  marker.bindPopup(`
    <div class="popup">
      <h3>${name}</h3>
      <p>X : ${x}</p>
      <p>Y : ${y}</p>
    </div>
  `);

  markerCluster.addLayer(marker);

  closeModal();

  // reset champs
  document.getElementById("markerName").value = "";
  document.getElementById("coordX").value = "";
  document.getElementById("coordY").value = "";
}