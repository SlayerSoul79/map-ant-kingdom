// ======================================================
// CARTE INTERACTIVE - VERSION PROPRE STABLE
// ======================================================

// ==============================
// MAP INIT
// ==============================

const map = L.map("map", {
    crs: L.CRS.Simple,
    minZoom: -1.55,
    maxZoom: 2
});

const MAP_WIDTH = 2560;
const MAP_HEIGHT = 1920;

const bounds = [[0, 0], [MAP_HEIGHT, MAP_WIDTH]];

L.imageOverlay("map.png", bounds).addTo(map);

map.fitBounds(bounds);
map.setMaxBounds(bounds);

const initialCenter = map.getCenter();
const initialZoom = map.getZoom();

// ==============================
// CLUSTER
// ==============================

const markerCluster = L.markerClusterGroup({
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
// DOM
// ==============================

const topList = document.getElementById("topList");
const bottomList = document.getElementById("bottomList");
const leftList = document.getElementById("leftList");
const rightList = document.getElementById("rightList");

const searchInput = document.getElementById("searchInput");

const markerModal = document.getElementById("markerModal");
const markerName = document.getElementById("markerName");
const markerX = document.getElementById("markerX");
const markerY = document.getElementById("markerY");
const generatedCode = document.getElementById("generatedCode");

const addMarkerBtn = document.getElementById("addMarkerBtn");
const cancelMarkerBtn = document.getElementById("cancelMarkerBtn");
const copyCodeBtn = document.getElementById("copyCodeBtn");

// ==============================
// DATA
// ==============================

const VIRTUAL = 1200;

const topPoint = { x: 1280, y: 25 };
const rightPoint = { x: 2420, y: 960 };
const bottomPoint = { x: 1285, y: 1885 };
const leftPoint = { x: 140, y: 960 };

const centerX = 1280;
const centerY = 960;

const categoryMarkers = {
    top: [],
    bottom: [],
    left: [],
    right: []
};

const allMarkers = [];

let tempCircle = null;

// ==============================
// CONVERSIONS
// ==============================

function virtualToMap(x, y) {

    const u = y / VIRTUAL;
    const v = x / VIRTUAL;

    return {
        x: topPoint.x + u * (rightPoint.x - topPoint.x) + v * (leftPoint.x - topPoint.x),
        y: topPoint.y + u * (rightPoint.y - topPoint.y) + v * (leftPoint.y - topPoint.y)
    };
}

function mapToVirtual(x, y) {

    const ax = rightPoint.x - topPoint.x;
    const ay = rightPoint.y - topPoint.y;

    const bx = leftPoint.x - topPoint.x;
    const by = leftPoint.y - topPoint.y;

    const det = ax * by - ay * bx;

    const dx = x - topPoint.x;
    const dy = y - topPoint.y;

    const u = (dx * by - dy * bx) / det;
    const v = (ax * dy - ay * dx) / det;

    return {
        x: Math.round(v * VIRTUAL),
        y: Math.round(u * VIRTUAL)
    };
}

// ==============================
// CATEGORY
// ==============================

function getCategory(x, y) {

    const dx = x - centerX;
    const dy = y - centerY;

    if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? "right" : "left";
    }

    return dy > 0 ? "bottom" : "top";
}

// ==============================
// CREATE MARKER (UNIQUE SYSTEM)
// ==============================

function createMarker(name, x, y) {

    const mapPos = virtualToMap(x, y);
    const coords = [mapPos.y, mapPos.x];

    const marker = L.marker(coords, { icon: customIcon });

    marker.bindPopup(`
        <div>
            <h3>${name}</h3>
            <p>X: ${x}</p>
            <p>Y: ${y}</p>
        </div>
    `);

    markerCluster.addLayer(marker);

    function focus() {
        map.flyTo(coords, 1, { duration: 1.5 });
        setTimeout(() => marker.openPopup(), 600);
    }

    marker.on("click", focus);

    const li = document.createElement("li");
    li.textContent = name;
    li.onclick = focus;

    const cat = getCategory(mapPos.x, mapPos.y);

    if (cat === "top") topList.appendChild(li);
    if (cat === "bottom") bottomList.appendChild(li);
    if (cat === "left") leftList.appendChild(li);
    if (cat === "right") rightList.appendChild(li);

    categoryMarkers[cat].push(marker);

    allMarkers.push({ name: name.toLowerCase(), marker, li });
}

// ==============================
// DEFAULT MARKERS
// ==============================

[
    ["Centre", 600, 600],
    ["Coin haut", 0, 0],
    ["Coin droit", 0, 1200],
    ["Coin bas", 1200, 1200],
    ["Coin gauche", 1200, 0]
].forEach(m => createMarker(m[0], m[1], m[2]));

// ==============================
// SEARCH
// ==============================

searchInput.addEventListener("input", () => {

    const v = searchInput.value.toLowerCase();

    allMarkers.forEach(m => {

        const match = m.name.includes(v);

        m.li.style.display = match ? "block" : "none";

        if (match) markerCluster.addLayer(m.marker);
        else markerCluster.removeLayer(m.marker);
    });
});

// ==============================
// MODAL OPEN
// ==============================

document.querySelector(".leaflet-control a[title='Ajouter un marker']")
?.addEventListener("click", () => {
    markerModal.classList.add("active");
});

// ==============================
// CLICK MAP
// ==============================

map.on("click", e => {

    const v = mapToVirtual(e.latlng.lng, e.latlng.lat);

    markerX.value = v.x;
    markerY.value = v.y;

    if (tempCircle) map.removeLayer(tempCircle);

    tempCircle = L.circleMarker(e.latlng, {
        radius: 8,
        color: "red",
        fillColor: "red",
        fillOpacity: 1
    }).addTo(map);

    updateCode();
});

// ==============================
// ADD MARKER
// ==============================

function addMarker() {

    const name = markerName.value.trim();
    const x = +markerX.value;
    const y = +markerY.value;

    if (!name) return;

    createMarker(name, x, y);

    markerModal.classList.remove("active");

    markerName.value = "";
    markerX.value = "";
    markerY.value = "";
}

addMarkerBtn.addEventListener("click", addMarker);

// ==============================
// CODE GEN
// ==============================

function updateCode() {

    const n = markerName.value;
    const x = markerX.value;
    const y = markerY.value;

    if (!n || !x || !y) {
        generatedCode.textContent = "";
        return;
    }

    generatedCode.textContent = `{ name: "${n}", x: ${x}, y: ${y} },`;
}

// ==============================
// COPY
// ==============================

copyCodeBtn.addEventListener("click", async () => {

    await navigator.clipboard.writeText(generatedCode.textContent);

    copyCodeBtn.textContent = "Copié ✔";

    setTimeout(() => {
        copyCodeBtn.textContent = "📋 Copier le code";
    }, 1500);
});

// ==============================
// CLOSE MODAL
// ==============================

cancelMarkerBtn.addEventListener("click", () => {

    markerModal.classList.remove("active");

    markerName.value = "";
    markerX.value = "";
    markerY.value = "";

    if (tempCircle) {
        map.removeLayer(tempCircle);
        tempCircle = null;
    }
});