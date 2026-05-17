// ==============================
// MAP
// ==============================

const width = 2560;
const height = 1920;

const bounds = [
  [0, 0],
  [height, width]
];

const map = L.map('map', {

  crs: L.CRS.Simple,

  minZoom: -2,
  maxZoom: 2,

  maxBounds: bounds,
  maxBoundsViscosity: 1.0,

  bounceAtZoomLimits: false,
  inertia: false,

  tap: false

});

// image carte
L.imageOverlay('map.png', bounds).addTo(map);

// vue initiale
map.fitBounds(bounds);

// refresh taille
setTimeout(() => {

  map.invalidateSize();

}, 200);

window.addEventListener("resize", () => {

  map.invalidateSize();

});

// ==============================
// SIDEBAR MOBILE
// ==============================

const sidebar =
  document.getElementById("sidebar");

const sidebarHandle =
  document.getElementById("sidebarHandle");

// mobile uniquement
if (window.innerWidth <= 768) {

  sidebar.classList.add("collapsed");

}

sidebarHandle.addEventListener("click", () => {

  if (sidebar.classList.contains("collapsed")) {

    sidebar.classList.remove("collapsed");

    sidebar.classList.add("open");

  }

  else {

    sidebar.classList.remove("open");

    sidebar.classList.add("collapsed");

  }

});

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
// ICON
// ==============================

const customIcon = L.icon({

  iconUrl: 'marker.png',

  iconSize: [30, 40],

  iconAnchor: [20, 40],

  popupAnchor: [0, -40]

});

// ==============================
// LISTES
// ==============================

const topList =
  document.getElementById("topList");

const bottomList =
  document.getElementById("bottomList");

const leftList =
  document.getElementById("leftList");

const rightList =
  document.getElementById("rightList");

const searchInput =
  document.getElementById("searchInput");

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
// CATEGORY
// ==============================

function getCategory(x, y) {

  const centerX = 1280;
  const centerY = 960;

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
// MARKERS
// ==============================

const allMarkers = [];

locations.forEach(loc => {

  const leafletCoords = [
    loc.y,
    loc.x
  ];

  const marker = L.marker(
    leafletCoords,
    {
      icon: customIcon
    }
  );

  markerCluster.addLayer(marker);

  marker.bindPopup(`
    <div class="popup">
      <h3>${loc.name}</h3>
      <p>X : ${loc.x}</p>
      <p>Y : ${loc.y}</p>
    </div>
  `);

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

    }, 700);

  }

  marker.on("click", focusMarker);

  const li =
    document.createElement("li");

  li.textContent = loc.name;

  li.onclick = focusMarker;

  const category =
    getCategory(loc.x, loc.y);

  if (category === "top") {

    topList.appendChild(li);

  }

  else if (category === "bottom") {

    bottomList.appendChild(li);

  }

  else if (category === "left") {

    leftList.appendChild(li);

  }

  else {

    rightList.appendChild(li);

  }

  allMarkers.push({

    marker,
    li,

    name:
      loc.name.toLowerCase()

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

    item.li.style.display =
      match ? "block" : "none";

    if (match) {

      markerCluster.addLayer(
        item.marker
      );

    }

    else {

      markerCluster.removeLayer(
        item.marker
      );

    }

  });

});

// ==============================
// CATÉGORIES
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

    const isOpen =
      title.dataset.open === "true";

    if (isOpen) {

      ul.style.display = "none";

      title.innerHTML =
        `▶ ${title.innerText.replace("▼ ", "")}`;

      title.dataset.open = "false";

    }

    else {

      ul.style.display = "block";

      title.innerHTML =
        `▼ ${title.innerText.replace("▶ ", "")}`;

      title.dataset.open = "true";

    }

  });

});