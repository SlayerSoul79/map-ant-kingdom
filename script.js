// ======================================================
// CARTE INTERACTIVE - BASE PROPRE
// PARTIE 1/4
// ======================================================

// ==============================
// MAP
// ==============================

const map = L.map("map", {
    crs: L.CRS.Simple,
    minZoom: -1.55,
    maxZoom: 2,
    tap: true,
    touchZoom: true,
    bounceAtZoomLimits: false
});

// ==============================
// IMAGE CARTE
// ==============================

const MAP_WIDTH = 2560;
const MAP_HEIGHT = 1920;

const bounds = [
    [0, 0],
    [MAP_HEIGHT, MAP_WIDTH]
];

L.imageOverlay("map.png", bounds).addTo(map);

map.fitBounds(bounds);
map.setMaxBounds(bounds);

// vue initiale
const initialCenter = map.getCenter();
const initialZoom = map.getZoom();

// ==============================
// CLUSTER MARKERS
// ==============================

const markerCluster = L.markerClusterGroup({
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
    iconUrl: "marker.png",
    iconSize: [30, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
});

// ==============================
// SIDEBAR ELEMENTS
// ==============================

const topList = document.getElementById("topList");
const bottomList = document.getElementById("bottomList");
const leftList = document.getElementById("leftList");
const rightList = document.getElementById("rightList");

const searchInput = document.getElementById("searchInput");

// ==============================
// MODAL ELEMENTS
// ==============================

const markerModal = document.getElementById("markerModal");

const markerName = document.getElementById("markerName");
const markerX = document.getElementById("markerX");
const markerY = document.getElementById("markerY");

const generatedCode = document.getElementById("generatedCode");

const addMarkerBtn = document.getElementById("addMarkerBtn");
const cancelMarkerBtn = document.getElementById("cancelMarkerBtn");
const copyCodeBtn = document.getElementById("copyCodeBtn");

// ==============================
// STOCKAGE GLOBAL
// ==============================

const allMarkers = [];

const categoryMarkers = {
    top: [],
    bottom: [],
    left: [],
    right: []
};

let tempMarker = null;

// ==============================
// COORDONNÉES VIRTUELLES
// ==============================

const VIRTUAL_SIZE = 1200;

// coins du losange (repère carte)
const topPoint = { x: 1280, y: 25 };
const rightPoint = { x: 2420, y: 960 };
const bottomPoint = { x: 1285, y: 1885 };
const leftPoint = { x: 140, y: 960 };

// centre logique
const centerX = 1280;
const centerY = 960;

// ==============================
// ZONE JOUABLE
// ==============================

const playableZone = [
    [25, 1280],
    [960, 2420],
    [1885, 1285],
    [960, 140]
];

// ==============================
// VIRTUAL -> MAP
// ==============================

function virtualToMap(x, y) {

    const u = y / VIRTUAL_SIZE;
    const v = x / VIRTUAL_SIZE;

    return {
        x:
            topPoint.x +
            u * (rightPoint.x - topPoint.x) +
            v * (leftPoint.x - topPoint.x),

        y:
            topPoint.y +
            u * (rightPoint.y - topPoint.y) +
            v * (leftPoint.y - topPoint.y)
    };
}

// ==============================
// MAP -> VIRTUAL
// ==============================

function mapToVirtual(mapX, mapY) {

    const ax = rightPoint.x - topPoint.x;
    const ay = rightPoint.y - topPoint.y;

    const bx = leftPoint.x - topPoint.x;
    const by = leftPoint.y - topPoint.y;

    const det = ax * by - ay * bx;

    const dx = mapX - topPoint.x;
    const dy = mapY - topPoint.y;

    const u = (dx * by - dy * bx) / det;
    const v = (ax * dy - ay * dx) / det;

    return {
        x: Math.round(v * VIRTUAL_SIZE),
        y: Math.round(u * VIRTUAL_SIZE)
    };
}

// ==============================
// DANS ZONE
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
// CATEGORIE
// ==============================

function getCategory(x, y) {

    const dx = x - centerX;
    const dy = y - centerY;

    if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? "right" : "left";
    }

    return dy > 0 ? "bottom" : "top";
}
// ======================================================
// PARTIE 2/4
// MARKERS EXISTANTS + UI + RECHERCHE + CATEGORIES
// ======================================================

// ==============================
// DONNÉES DE BASE
// ==============================

const locations = [
    { name: "Centre", x: 600, y: 600 },
    { name: "Coin haut", x: 0, y: 0 },
    { name: "Coin droit", x: 0, y: 1200 },
    { name: "Coin bas", x: 1200, y: 1200 },
    { name: "Coin gauche", x: 1200, y: 0 }
];

locations.sort((a, b) => a.name.localeCompare(b.name));

// ==============================
// STOCKAGE GLOBAL MARKERS
// ==============================

const allMarkersData = [];

// ==============================
// CRÉATION D'UN MARKER UNIQUE
// ==============================

function createMarker(loc) {

    const mapPos = virtualToMap(loc.x, loc.y);
    const coords = [mapPos.y, mapPos.x];

    if (!isInsideZone(mapPos.x, mapPos.y)) return;

    const marker = L.marker(coords, { icon: customIcon });

    marker.bindPopup(`
        <div class="popup">
            <h3>${loc.name}</h3>
            <p>X : ${loc.x}</p>
            <p>Y : ${loc.y}</p>
        </div>
    `);

    markerCluster.addLayer(marker);

    function focus() {
        map.flyTo(coords, 1, { duration: 1.5 });
        setTimeout(() => marker.openPopup(), 700);
    }

    marker.on("click", focus);

    const li = document.createElement("li");
    li.textContent = loc.name;

    li.dataset.name = loc.name.toLowerCase();
    li.onclick = focus;

    const category = getCategory(mapPos.x, mapPos.y);

    if (category === "top") topList.appendChild(li);
    if (category === "bottom") bottomList.appendChild(li);
    if (category === "left") leftList.appendChild(li);
    if (category === "right") rightList.appendChild(li);

    categoryMarkers[category].push(marker);

    allMarkersData.push({
        name: loc.name.toLowerCase(),
        marker,
        li,
        category
    });
}

// ==============================
// INIT MARKERS
// ==============================

locations.forEach(createMarker);

// ==============================
// RECHERCHE
// ==============================

searchInput.addEventListener("input", () => {

    const value = searchInput.value.toLowerCase();

    allMarkersData.forEach(item => {

        const match = item.name.includes(value);

        item.li.style.display = match ? "block" : "none";

        if (match) {
            markerCluster.addLayer(item.marker);
        } else {
            markerCluster.removeLayer(item.marker);
        }
    });
});

// ==============================
// CATÉGORIES REPLIABLES
// ==============================

document.querySelectorAll(".categoryTitle").forEach(title => {

    title.dataset.open = "true";

    title.addEventListener("click", () => {

        const ul = title.nextElementSibling;
        const category = ul.id.replace("List", "");

        const isOpen = title.dataset.open === "true";

        if (isOpen) {

            ul.style.display = "none";
            title.dataset.open = "false";

            categoryMarkers[category].forEach(m => {
                markerCluster.removeLayer(m);
            });

        } else {

            ul.style.display = "block";
            title.dataset.open = "true";

            categoryMarkers[category].forEach(m => {
                markerCluster.addLayer(m);
            });
        }
    });
});

// ==============================
// RESET VIEW
// ==============================

const resetControl = L.control({ position: "topleft" });

resetControl.onAdd = function () {

    const div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
    const a = L.DomUtil.create("a", "", div);

    a.innerHTML = "⦿";
    a.title = "Vue initiale";

    a.style.width = "30px";
    a.style.height = "30px";
    a.style.display = "flex";
    a.style.alignItems = "center";
    a.style.justifyContent = "center";

    L.DomEvent.disableClickPropagation(div);

    L.DomEvent.on(a, "click", function (e) {
        L.DomEvent.preventDefault(e);

        map.flyTo(initialCenter, initialZoom, {
            duration: 1.5
        });
    });

    return div;
};

resetControl.addTo(map);

// ======================================================
// PARTIE 3/4
// AJOUT MARKER + MODAL + INTERACTION CARTE
// ======================================================

// ==============================
// BOUTON + (LEAFLET CONTROL)
// ==============================

const addMarkerControl = L.control({
    position: "bottomright"
});

addMarkerControl.onAdd = function () {

    const div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
    const a = L.DomUtil.create("a", "", div);

    a.href = "#";
    a.title = "Ajouter un marker";
    a.innerHTML = "+";

    a.style.width = "60px";
    a.style.height = "60px";
    a.style.fontSize = "34px";
    a.style.fontWeight = "bold";

    a.style.display = "flex";
    a.style.alignItems = "center";
    a.style.justifyContent = "center";

    L.DomEvent.disableClickPropagation(div);

    L.DomEvent.on(a, "click", function (e) {
        L.DomEvent.preventDefault(e);

        markerModal.classList.add("active");
    });

    return div;
};

addMarkerControl.addTo(map);

// ==============================
// MARKER TEMPORAIRE
// ==============================

let tempCircle = null;
let currentVirtualX = null;
let currentVirtualY = null;

// ==============================
// CLIC SUR CARTE
// ==============================

map.on("click", function (e) {

    const coords = mapToVirtual(e.latlng.lng, e.latlng.lat);

    currentVirtualX = coords.x;
    currentVirtualY = coords.y;

    markerX.value = coords.x;
    markerY.value = coords.y;

    if (tempCircle) {
        map.removeLayer(tempCircle);
    }

    tempCircle = L.circleMarker(e.latlng, {
        radius: 8,
        color: "red",
        fillColor: "red",
        fillOpacity: 0.8
    }).addTo(map);

    updateGeneratedCode();
});

// ==============================
// FERMETURE MODAL
// ==============================

cancelMarkerBtn.addEventListener("click", () => {

    markerModal.classList.remove("active");

    markerName.value = "";
    markerX.value = "";
    markerY.value = "";
    generatedCode.textContent = "";

    if (tempCircle) {
        map.removeLayer(tempCircle);
        tempCircle = null;
    }

    currentVirtualX = null;
    currentVirtualY = null;
});

// ======================================================
// PARTIE 4/4
// AJOUT FINAL MARKER + CODE + COPY + CLEAN
// ======================================================

// ==============================
// GENERATION CODE
// ==============================

function updateGeneratedCode() {

    const name = markerName.value.trim();
    const x = markerX.value;
    const y = markerY.value;

    if (!name || !x || !y) {
        generatedCode.textContent = "";
        return;
    }

    generatedCode.textContent = `{
    name: "${name}",
    x: ${x},
    y: ${y}
},`;
}

// update live
markerName.addEventListener("input", updateGeneratedCode);
markerX.addEventListener("input", updateGeneratedCode);
markerY.addEventListener("input", updateGeneratedCode);

// ==============================
// AJOUT FINAL MARKER
// ==============================

function addFinalMarker() {

    const name = markerName.value.trim();
    const x = parseInt(markerX.value);
    const y = parseInt(markerY.value);

    if (!name || isNaN(x) || isNaN(y)) return;

    const mapPos = virtualToMap(x, y);
    const coords = [mapPos.y, mapPos.x];

    const marker = L.marker(coords, { icon: customIcon });

    marker.bindPopup(`
        <div class="popup">
            <h3>${name}</h3>
            <p>X : ${x}</p>
            <p>Y : ${y}</p>
        </div>
    `);

    markerCluster.addLayer(marker);

    const focus = () => {
        map.flyTo(coords, 1, { duration: 1.5 });
        setTimeout(() => marker.openPopup(), 700);
    };

    marker.on("click", focus);

    const category = getCategory(mapPos.x, mapPos.y);

    const li = document.createElement("li");
    li.textContent = name;
    li.onclick = focus;

    if (category === "top") topList.appendChild(li);
    if (category === "bottom") bottomList.appendChild(li);
    if (category === "left") leftList.appendChild(li);
    if (category === "right") rightList.appendChild(li);

    categoryMarkers[category].push(marker);

    allMarkersData.push({
        name: name.toLowerCase(),
        marker,
        li,
        category
    });

    // cleanup temp marker
    if (tempCircle) {
        map.removeLayer(tempCircle);
        tempCircle = null;
    }

    markerModal.classList.remove("active");

    markerName.value = "";
    markerX.value = "";
    markerY.value = "";
    generatedCode.textContent = "";
}

// bouton add
addMarkerBtn.addEventListener("click", addFinalMarker);

// ==============================
// COPIER CODE
// ==============================

copyCodeBtn.addEventListener("click", async () => {

    const text = generatedCode.textContent;

    if (!text) return;

    try {
        await navigator.clipboard.writeText(text);

        copyCodeBtn.innerText = "Copié ✔";

        setTimeout(() => {
            copyCodeBtn.innerText = "📋 Copier le code";
        }, 1500);

    } catch (err) {
        console.log("Erreur copie :", err);
    }
});

// ==============================
// INPUT LIMITS
// ==============================

markerX.addEventListener("input", () => {
    if (markerX.value > 1200) markerX.value = 1200;
    if (markerX.value < 0) markerX.value = 0;
});

markerY.addEventListener("input", () => {
    if (markerY.value > 1200) markerY.value = 1200;
    if (markerY.value < 0) markerY.value = 0;
});