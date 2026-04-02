// DOM Elements
const datePickerContainer = document.getElementById("date-picker-container");
const exploreBtn = document.getElementById("explore-btn");
const homePage = document.querySelector(".home-page");
const planPage = document.querySelector(".planning-page");
const logo = document.querySelector(".logo-container");
const backBtn = document.getElementById("back-btn");
const searchInput = document.getElementById("search-input");
const errorContainer = document.getElementById("error-container");
const planningPage = document.querySelector(".planning-page");
const destinationBanner = document.querySelector(".destination-banner");
const categoryTabs = document.querySelectorAll(".category-tabs button");
const exploreResult = document.querySelector(".explore-result");
const addBtn = document.getElementById("add-btn");
const detailsOverlay = document.getElementById("details-overlay");
const detailsModal = detailsOverlay.querySelector(".details-modal");
const unassignedPlaces = document.getElementById("unassigned-places");
const daysPlan = document.getElementById("days-plan");

// URLs
const UNSPLASH_URL = "https://api.unsplash.com/search/photos?orientation=landscape&per_page=1&query=";
const OPENSTREETMAP_URL = "https://nominatim.openstreetmap.org/search?q=";
const OPENWEATHERMAP_URL = "https://api.openweathermap.org/data/2.5/weather?q=";
const OPENTRIPMAP_URL = "https://api.opentripmap.com/0.1/en/places/";
const PLACE_INFO_URL = `https://api.opentripmap.com/0.1/en/places/xid/`;

let currentBBox = null;
let currentRequest = 0;
const addedPlaces = new Set();

const EMPTY_UNASSIGNED = "No places added yet";
const EMPTY_DAY = "Drop places here to schedule";

const datePicker = flatpickr("#date-range", {
    mode: "range",
    minDate: "today",
    dateFormat: "M d",
    locale: { rangeSeparator: " – "}
});

datePickerContainer.addEventListener("click", () => datePicker.open());

exploreBtn.addEventListener("click", searchDestination);
searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchDestination();
})

logo.addEventListener("click", backHome);
backBtn.addEventListener("click", backHome);

categoryTabs.forEach(tab => {
    tab.addEventListener("click", () => {
        categoryTabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        const kind = tab.dataset.kind;
        displayPlaces(currentBBox, kind);
    })
})

detailsOverlay.addEventListener("click", (event) => {
    if (event.target === detailsOverlay) {
        detailsOverlay.classList.add("hidden");
    }
})

function backHome() {
    homePage.classList.remove("hidden");
    planPage.classList.add("hidden");
    backBtn.classList.add("hidden");
    document.body.classList.remove('solid-bg');

    // reset tabs to default (Attractions)
    categoryTabs.forEach(t => t.classList.remove("active"));
    categoryTabs[0].classList.add("active"); 

    planningPage.innerHTML = "";
}

function getTripDates() {
    const dates = datePicker.selectedDates;

    if (dates.length < 2) {
        return null;
    }

    const [startDate, endDate] = dates;
    const totalDays = ((endDate - startDate) / 1000 / 60 / 60 / 24) + 1;
    return { startDate, endDate, totalDays };
}

function validateInputs(searchTerm, tripDates) {
    if (!searchTerm || !tripDates) {
        if (!searchTerm && !tripDates) {
            return "Please enter a destination and select dates.";
        } else if (!searchTerm) {
            return "Please enter a destination.";
        } else {
            return "Please select the trip dates.";
        }
    }
    return null;
}

async function searchDestination() {
    const searchTerm = searchInput.value.trim();
    const tripDates = getTripDates();

    // check if destintaion or dates is empty
    const error = validateInputs(searchTerm, tripDates);
    if (error) {
        errorContainer.textContent = error;
        errorContainer.classList.remove("hidden");
        return;
    }

    // validate destination
    try {
        const geoResponse = await fetch(`${OPENSTREETMAP_URL}${searchTerm}&format=json`, {
            headers: { "Accept-Language": "en"}
        });        
        const geoData = await geoResponse.json();
        console.log("All destinations", geoData);

        const validPlace = geoData
            .filter(place => place.type === "administrative" || place.type === "city")
            .find(place => place.name.toLowerCase() === searchTerm.toLowerCase());

        if (geoData.length === 0 || !validPlace) {
            errorContainer.textContent = `"${searchTerm}" is not a valid destination. Try another.`;
            errorContainer.classList.remove("hidden");
            return;
        } else {
            console.log("valid place", validPlace);
            homePage.classList.add("hidden");
            planPage.classList.remove("hidden");
            backBtn.classList.remove("hidden");
            document.body.classList.add('solid-bg');
            errorContainer.classList.add("hidden");
            searchInput.value = "";

            currentBBox = validPlace.boundingbox;
            displayBanner(validPlace.name);
            displayPlaces(currentBBox, "interesting_places");
            generateDaysCards(tripDates.startDate, tripDates.totalDays);
        }
    } catch (error) {
        errorContainer.textContent = "Something went wrong. Please try again later.";
        errorContainer.classList.remove("hidden");
    }
}

async function displayBanner(countryName) {
    // fetch destination pic 
    try {
        const unsplashResponse = await fetch(`${UNSPLASH_URL}${countryName} city&client_id=${UNSPLASH_ACCESS_KEY}`);
        const unsplashData = await unsplashResponse.json();
        const pic = unsplashData.results[0].urls.regular;
        console.log("banner pic", unsplashData);

        destinationBanner.style.backgroundImage = `url(${pic})`;
    } catch (error) {
        console.error("Banner photo error:", error);
    }

    // fetch destination weather 
    try {
        const weatherResponse = await fetch(`${OPENWEATHERMAP_URL}${countryName}&appid=${OPENWEATHERMAP_KEY}&units=metric`);
        const weatherData = await weatherResponse.json();

        const temp = weatherData.main.temp;
        const description = weatherData.weather[0].main;
        const weatherIcon = weatherData.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${weatherIcon}@2x.png`;
        const humidity = weatherData.main.humidity;
        const wind = weatherData.wind.speed;

        console.log("weather data", weatherData);

        destinationBanner.innerHTML = `
            <p class="country-name">${countryName}</p>
            <div class="weather-container glass">
                <div class="weather-temp">
                    <div class="weather-info">
                        <h1>${temp}°C</h1>
                        <p>${description}</p>
                    </div>
                    <img src="${iconUrl}" alt="weather-icon">
                </div>
                <div class="humidity-wind-info">
                    <div><i class="fa fa-droplet"></i></i>${humidity}%</div>
                    <div><i class="fa fa-wind"></i>${wind}km/h</div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error("Weather error:", error);
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function displayPlaces(bbox, kind) {
    currentRequest++;
    const thisRequest = currentRequest;

    try {
        const response = await fetch(`${OPENTRIPMAP_URL}bbox?lon_min=${bbox[2]}&lat_min=${bbox[0]}&lon_max=${bbox[3]}&lat_max=${bbox[1]}&kinds=${kind}&limit=20&apikey=${OPENTRIPMAP_KEY}`);
        const places = await response.json();
        console.log("places data", places);

        if (places) {
            exploreResult.innerHTML = "";

            // remove duplicate places using wikidata ID
            const seen = new Set();
            const uniquePlaces = places.features.filter((place) => {
                const key =  place.properties.wikidata || place.properties.xid;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })

            // fetch all places details
            const placesDetails = [];
            for (const place of uniquePlaces) {
                // if a newer request started, stop this loop
                if (thisRequest !== currentRequest) return;

                const xid = place.properties.xid;
                const detailsResponse = await fetch(`${PLACE_INFO_URL}${xid}?apikey=${OPENTRIPMAP_KEY}`);
                const details = await detailsResponse.json();

                placesDetails.push({ place, details });
                await delay(60);
            }
            console.log(placesDetails);

            placesDetails.forEach(({place, details}) => displayPlaceCard(place, details));  
        }
    } catch (error) {
        console.error("Places error:", error);
    }
}

function displayPlaceCard(place, details) {
    const xid = place.properties.xid;
    const placeName = place.properties.name;
    const rating = place.properties.rate;
    const placePicUrl = details.preview?.source || 'assets/image-placeholder.svg';
    const descriptionHTML = details.wikipedia_extracts?.html ?? "No details available.";

    const placeCard = document.createElement("div");
    placeCard.classList.add("place-card", "glass");
    placeCard.id = `${xid}-resultCard`; 
    placeCard.dataset.xid = xid;
    placeCard.dataset.img = placePicUrl;
    placeCard.dataset.name = placeName;
    placeCard.dataset.rating = rating;
    placeCard.dataset.address = `${details.address?.city || ''}, ${details.address?.country || ''}`;
    placeCard.dataset.kinds = details.kinds;
    placeCard.dataset.description = descriptionHTML;

    placeCard.innerHTML = `
        <img src="${placePicUrl}" alt="place picture" onerror="this.src='assets/image-placeholder.svg'">            
        <div class="place-info">
            <div class="title-rating-container">
                <h3>${placeName}</h3>
                <div class="rating"><i class="fa-regular fa-star"></i>${rating}</div>
            </div>
            <button class="add-btn"><i class="fa fa-circle-plus"></i>Add to Trip</button>
        </div>
    `;
    exploreResult.appendChild(placeCard);

    const addButton = placeCard.querySelector(".add-btn");
    addButton.addEventListener("click", (event) => {
        event.stopPropagation(); 
        addPlace(xid, placePicUrl, placeName); 
    });

    placeCard.addEventListener("click", () => showDetails(xid));
}

function showDetails(xid) {
    detailsOverlay.classList.remove("hidden");

    const card = document.getElementById(`${xid}-resultCard`);
    const img = card.dataset.img;
    const name = card.dataset.name;
    const rating = card.dataset.rating;
    const address = card.dataset.address;
    const description = card.dataset.description;
    const kinds = card.dataset.kinds;
    const kindsBadges = generateKindsBadges(kinds);

    detailsModal.innerHTML = `
        <div class="place-pic">
            <button id="close-btn"><i class="fa-solid fa-xmark"></i></i></button>
            <img src="${img}" alt="place picture" onerror="this.src='assets/image-placeholder.svg'">
        </div>
        <div class="place-info">
            <div class="title-rating-container">
                <h4>${name}</h4>
                <div class="rating"><i class="fa-regular fa-star"></i>${rating}</div>
            </div>
            <div class="address"><i class="fas fa-location-dot"></i>${address}</div>
            <div class="kinds">${kindsBadges}</div>
            <p class="desc">${description}</p>
        </div>
        <button class="add-btn"><p>Add to Trip </p><i class="fa-solid fa-arrow-right"></i></button>
    `;

    document.getElementById("close-btn").addEventListener("click", () => {
        detailsOverlay.classList.add("hidden");
    });

    const addButton = detailsModal.querySelector(".add-btn");
    addButton.addEventListener("click", () => {
        addPlace(xid, img, name);
        detailsOverlay.classList.add("hidden");
    });

    // disable add button if added
    const isAdded = addedPlaces.has(xid);
    if (isAdded) {
        addButton.innerHTML = `<i class="fa fa-check"></i> Added`;
        addButton.disabled = true;
        addButton.style.opacity = "0.5";
    } 
}

function generateKindsBadges(kinds) {
    const kindsArray = kinds.split(",");
    const selectedKind = document.querySelector(".category-tabs .active").dataset.label;

    return kindsArray.map(kind => {
        const isActive = kind === selectedKind;

        if (kind === "interesting_places") {
            kind = "attractions";
        }

        if (kind.includes("_")) {
            kind = kind.replaceAll("_", " ");
        }

        return `
            <span class="kind-badge ${isActive ? "active-kind" : ""}">
                ${kind.toUpperCase()}
            </span>
        `;
    }).join("");
}

function addPlace(xid, placePicUrl, placeName) {
    // create new card
    const planCard = document.createElement("div");
    planCard.classList.add("plan-card");
    planCard.id = xid; 
    planCard.draggable = true;
    planCard.addEventListener("dragstart", dragstartHandler);
    planCard.addEventListener("click", () => showDetails(xid))
    
    planCard.innerHTML = `
        <button class="drag-btn"><i class="fa-solid fa-grip-vertical"></i></button>
        <img src="${placePicUrl}" alt="place image" onerror="this.src='assets/image-placeholder.svg'">
        <p class="place-name">${placeName}</p>
        <button class="delete-place-btn"><i class="fa-regular fa-trash-can"></i></button>
    `;
    unassignedPlaces.appendChild(planCard);

    // remove empty message if it exists
    updateEmptyState(unassignedPlaces, EMPTY_UNASSIGNED);

    // mark place card as added
    addedPlaces.add(xid);
    updateAddButton(xid);

    // handle delete 
    const deleteBtn = planCard.querySelector(".delete-place-btn");
    deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();

        const parent = planCard.parentElement;

        planCard.remove();
        addedPlaces.delete(xid);
        updateAddButton(xid);

        // if no more cards, add empty msg
        updateEmptyState(parent, EMPTY_DAY);
        updateEmptyState(unassignedPlaces, EMPTY_UNASSIGNED);
    });
}

function updateAddButton(xid) {
    const isAdded = addedPlaces.has(xid);

    const placeCard = document.querySelector(`.place-card[data-xid="${xid}"]`);
    const cardBtn = placeCard?.querySelector(".add-btn");
    if (cardBtn) {
        cardBtn.innerHTML = isAdded ? `<i class="fa fa-check"></i> Added` : `<i class="fa fa-circle-plus"></i> Add to Trip`;
        cardBtn.disabled = isAdded;
    }
}

function generateDaysCards(startDate, totalDays) {
    daysPlan.innerHTML = "";

    for (let i = 0; i < totalDays; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dayDate = date.toLocaleDateString('en-US', {
            month: 'short', 
            day: 'numeric' 
        });

        const dayContainer = document.createElement("div");
        dayContainer.classList.add("day-container");

        const dayHeader = document.createElement("div");
        dayHeader.classList.add("day-header", "closed");
        dayHeader.innerHTML = `
            <h3>Day ${i + 1}</h3>
            <span>${dayDate}</span>
            <button class="day-toggle"><i class="fa-solid fa-chevron-up"></i></button>
        `;

        const dayPlacesContainer = document.createElement("div");
        dayPlacesContainer.classList.add("day-places-container", "hidden");
        updateEmptyState(dayPlacesContainer, EMPTY_DAY);

        setupDropZone(dayPlacesContainer);

        daysPlan.appendChild(dayContainer);
        dayContainer.appendChild(dayHeader);
        dayContainer.appendChild(dayPlacesContainer);

        const dayToggle = dayHeader.querySelector(".day-toggle");
        dayToggle.addEventListener("click", function () {
            const icon = this.querySelector("i");
            icon.classList.toggle("fa-chevron-down");
            icon.classList.toggle("fa-chevron-up");
            dayPlacesContainer.classList.toggle("hidden");
            dayHeader.classList.toggle("closed");
        });
    }
}

setupDropZone(unassignedPlaces);

function setupDropZone(container) {
    container.addEventListener("dragover", (e) => {
        e.preventDefault();
    });

    container.addEventListener("drop", (e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/plain");
        const card = document.getElementById(id);

        moveCard(card, container);
    });
}

function moveCard(card, newContainer) {
    const oldContainer = card.parentElement;

    newContainer.appendChild(card);

    // update both containers
    updateEmptyState(oldContainer, EMPTY_DAY);
    updateEmptyState(newContainer,
        newContainer === unassignedPlaces ? EMPTY_UNASSIGNED : EMPTY_DAY
    );
}

function dragstartHandler(e) {
    e.dataTransfer.setData("text/plain", e.target.id);
}

function updateEmptyState(container, text) {
    const emptyMsg = container.querySelector(".empty-msg");
    const hasCards = container.querySelectorAll(".plan-card").length > 0;

    if (!hasCards) {
        if (!emptyMsg) {
            const msg = document.createElement("p");
            msg.classList.add("empty-msg");
            msg.textContent = text;
            container.appendChild(msg);
        }
    } else {
        if (emptyMsg) emptyMsg.remove();
    }
}