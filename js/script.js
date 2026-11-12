
"use strict";

/* =========================================
   1. TIMELINE FILTERS
========================================= */

function initializeTimeline() {
  const timeline = document.getElementById("timeline-list");

  if (!timeline) return;

  const buttons = document.querySelectorAll(
    ".timeline-filters .filter-btn"
  );

  const items = timeline.querySelectorAll(".timeline-item");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      filterTimeline(button.dataset.btn, button);
    });
  });

  // Set the initial timeline layout.
  items.forEach((item, index) => {
    item.dataset.side = index % 2 === 0 ? "left" : "right";
  });
}

function filterTimeline(category, button) {
  const buttons = document.querySelectorAll(
    ".timeline-filters .filter-btn"
  );

  const items = document.querySelectorAll(
    "#timeline-list .timeline-item"
  );

  buttons.forEach(btn => {
    const isActive = btn === button;

    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });

  items.forEach(item => {
    const matches =
      category === "all" ||
      item.dataset.category === category;

    item.classList.toggle("hidden", !matches);
  });
}


/* =========================================
   2. COMMUNITY GARDEN DATA
========================================= */

const gardenData = [
  {
    id: 1,
    name: "Nightingale Community Garden",
    zip: "02124",
    lat: 42.2901,
    lng: -71.0768,
    address: "55 Park St, Dorchester, MA 02124",
    description: "130+ garden plots, rainwater harvesters, and a compost area.",
    plots: "130 Plots",
    access: "Wheelchair Accessible"
  },

  {
    id: 2,
    name: "Fenway Victory Gardens",
    zip: "02215",
    lat: 42.3442,
    lng: -71.0926,
    address: "73 Park Dr, Boston, MA 02215",
    description: "Historic 7-acre community garden with over 500 plots.",
    plots: "500 Plots",
    access: "Water Spigots"
  },

  {
    id: 3,
    name: "Garrison Trotter Farm",
    zip: "02119",
    lat: 42.3185,
    lng: -71.0820,
    address: "4 Garrison St, Roxbury, MA 02119",
    description: "Urban agriculture site producing crops for local food pantries.",
    plots: "Community Shared",
    access: "Tool Shed"
  },

  {
    id: 4,
    name: "East Boston Community Garden",
    zip: "02128",
    lat: 42.3732,
    lng: -71.0361,
    address: "Central Sq, East Boston, MA 02128",
    description: "Neighborhood growing space managed by local residents.",
    plots: "35 Plots",
    access: "Raised Beds"
  }
];


/* =========================================
   3. MAP VARIABLES
========================================= */

let gardenMap = null;

let gardenMarkers = [];

let gardenMarkerById = new Map();


/* =========================================
   4. GARDEN MAP INITIALIZATION
========================================= */

function initializeGardenMap() {
  const mapElement = document.getElementById("garden-map");

  // Only run on the gardens page.
  if (!mapElement) return;

  // Check whether Leaflet loaded.
  if (typeof L === "undefined") {
    mapElement.textContent =
      "The map could not load. Please check your internet connection.";

    return;
  }

  // Prevent duplicate initialization.
  if (gardenMap) return;

  gardenMap = L.map(mapElement, {
    scrollWheelZoom: false
  }).setView(
    [42.32, -71.07],
    11
  );

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }
  ).addTo(gardenMap);

  renderGardenList(gardenData);

  // Make Leaflet recalculate its dimensions after rendering.
  requestAnimationFrame(() => {
    gardenMap.invalidateSize();
  });

  // Additional resize handling.
  window.addEventListener("resize", () => {
    if (gardenMap) {
      gardenMap.invalidateSize();
    }
  });
}


/* =========================================
   5. DISPLAY GARDEN DIRECTORY
========================================= */

function renderGardenList(items) {
  const listContainer = document.getElementById("garden-list");

  const resultCount = document.getElementById(
    "garden-result-count"
  );

  if (!listContainer || !gardenMap) return;

  // Remove old directory entries.
  listContainer.replaceChildren();

  // Remove old map markers.
  gardenMarkers.forEach(marker => {
    gardenMap.removeLayer(marker);
  });

  gardenMarkers = [];
  gardenMarkerById.clear();

  // Update result count.
  if (resultCount) {
    resultCount.textContent =
      `Showing ${items.length} ${items.length === 1 ? "garden" : "gardens"}.`;
  }

  // Display an empty search result.
  if (items.length === 0) {
    const message = document.createElement("p");

    message.className = "small-note";
    message.style.padding = "20px 12px";

    message.textContent =
      "No gardens were found for this ZIP code. Try another Massachusetts ZIP code or select Show All.";

    listContainer.appendChild(message);

    gardenMap.setView([42.32, -71.07], 11);

    return;
  }

  // Generate directory entries and markers.
  items.forEach(garden => {

    // Create marker.
    const marker = L.marker([
      garden.lat,
      garden.lng
    ]).addTo(gardenMap);

    // Create safe popup content.
    const popup = document.createElement("div");

    const popupTitle = document.createElement("strong");
    popupTitle.textContent = garden.name;

    const popupAddress = document.createElement("div");
    popupAddress.textContent = garden.address;

    popup.appendChild(popupTitle);
    popup.appendChild(popupAddress);

    marker.bindPopup(popup);

    gardenMarkers.push(marker);
    gardenMarkerById.set(garden.id, marker);

    // Create directory row.
    const row = document.createElement("article");

    row.className = "directory-row";
    row.tabIndex = 0;

    row.setAttribute("role", "button");

    row.setAttribute(
      "aria-label",
      `Show ${garden.name} on map`
    );

    row.setAttribute("aria-pressed", "false");

    row.dataset.gardenId = garden.id;

    // Garden name.
    const title = document.createElement("h3");
    title.textContent = garden.name;

    // Address.
    const address = document.createElement("div");
    address.className = "row-address";
    address.textContent = garden.address;

    // Description.
    const description = document.createElement("p");
    description.textContent = garden.description;

    // Additional information.
    const metadata = document.createElement("div");
    metadata.className = "row-meta";

    metadata.textContent =
      `${garden.plots} · ${garden.access}`;

    row.appendChild(title);
    row.appendChild(address);
    row.appendChild(description);
    row.appendChild(metadata);

    // Select garden.
    const selectGarden = () => {
      selectGardenOnMap(garden.id);
    };

    row.addEventListener("click", selectGarden);

    row.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectGarden();
      }
    });

    listContainer.appendChild(row);
  });

  // Zoom map to display all visible markers.
  if (items.length === 1) {
    gardenMap.setView(
      [items[0].lat, items[0].lng],
      14
    );
  } else {
    const bounds = L.latLngBounds(
      items.map(item => [item.lat, item.lng])
    );

    gardenMap.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 12
    });
  }

  requestAnimationFrame(() => {
    gardenMap.invalidateSize();
  });
}


/* =========================================
   6. SELECT GARDEN ON MAP
========================================= */

function selectGardenOnMap(gardenId) {
  const garden = gardenData.find(
    item => item.id === gardenId
  );

  const marker = gardenMarkerById.get(gardenId);

  if (!garden || !marker || !gardenMap) return;

  // Highlight selected directory entry.
  document.querySelectorAll(
    "#garden-list .directory-row"
  ).forEach(row => {

    const isSelected =
      Number(row.dataset.gardenId) === gardenId;

    row.classList.toggle("selected", isSelected);

    row.setAttribute(
      "aria-pressed",
      String(isSelected)
    );
  });

  // Zoom into selected garden.
  gardenMap.flyTo(
    [garden.lat, garden.lng],
    15,
    {
      duration: 0.8
    }
  );

  // Open map popup.
  marker.openPopup();
}


/* =========================================
   7. ZIP CODE SEARCH
========================================= */

function searchGardens() {
  const zipInput = document.getElementById(
    "garden-zip-input"
  );

  if (!zipInput) return;

  const zip = zipInput.value.trim();

  // Empty search displays all gardens.
  if (zip === "") {
    renderGardenList(gardenData);
    return;
  }

  // Validate ZIP code.
  if (!/^\d{5}$/.test(zip) || !zip.startsWith("0")) {
    const resultCount = document.getElementById(
      "garden-result-count"
    );

    if (resultCount) {
      resultCount.textContent =
        "Please enter a valid five-digit Massachusetts ZIP code.";
    }

    return;
  }

  // Filter garden data.
  const filteredGardens = gardenData.filter(
    garden => garden.zip === zip
  );

  renderGardenList(filteredGardens);
}


/* =========================================
   8. RESET GARDEN SEARCH
========================================= */

function resetGardens() {
  const zipInput = document.getElementById(
    "garden-zip-input"
  );

  if (zipInput) {
    zipInput.value = "";
  }

  renderGardenList(gardenData);

  if (gardenMap) {
    gardenMap.setView(
      [42.32, -71.07],
      11
    );
  }
}


/* =========================================
   9. CONNECT GARDEN SEARCH BUTTONS
========================================= */

function initializeGardenSearch() {
  const searchButton = document.getElementById(
    "garden-search-btn"
  );

  const resetButton = document.getElementById(
    "garden-reset-btn"
  );

  const zipInput = document.getElementById(
    "garden-zip-input"
  );

  if (searchButton) {
    searchButton.addEventListener(
      "click",
      searchGardens
    );
  }

  if (resetButton) {
    resetButton.addEventListener(
      "click",
      resetGardens
    );
  }

  if (zipInput) {
    zipInput.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        searchGardens();
      }
    });
  }
}


/* =========================================
   10. INITIALIZE WEBSITE
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  // Homepage.
  initializeTimeline();

  // Community gardens page.
  initializeGardenSearch();
  initializeGardenMap();

});
