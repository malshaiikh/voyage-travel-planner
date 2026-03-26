// DOM Elements
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
const addBtn = document.querySelector("add-btn");

// URLs
const UNSPLASH_URL = "https://api.unsplash.com/search/photos?orientation=landscape&per_page=1&query=";
const OPENSTREETMAP_URL = "https://nominatim.openstreetmap.org/search?q=";
const OPENWEATHERMAP_URL = "https://api.openweathermap.org/data/2.5/weather?q=";
const OPENTRIPMAP_URL = "https://api.opentripmap.com/0.1/en/places/";
const PLACE_INFO_URL = `https://api.opentripmap.com/0.1/en/places/xid/`;

let currentBBox = null;
let currentRequest = 0;

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

function backHome() {
    homePage.classList.remove("hidden");
    planPage.classList.add("hidden");
    backBtn.classList.add("hidden");
    document.body.classList.remove('solid-bg');

    // reset tabs to default (Attractions)
    categoryTabs.forEach(t => t.classList.remove("active"));
    categoryTabs[0].classList.add("active"); 
}

async function searchDestination() {
    const searchTerm = searchInput.value.trim();

    // empty input case
    if (!searchTerm) {
        errorContainer.textContent = "Please enter a destination.";
        errorContainer.classList.remove("hidden");
        return;
    }

    try {
        // validate destination
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

            // fetch all places details
            const placesDetails = [];
            for (const place of places.features) {

                // if a newer request started, stop this loop
                if (thisRequest !== currentRequest) return;

                const xid = place.id;
                const detailsResponse = await fetch(`${PLACE_INFO_URL}${xid}?apikey=${OPENTRIPMAP_KEY}`);
                const details = await detailsResponse.json();

                placesDetails.push({place, details});
                await delay(50);
            }

            // check request again
            if (thisRequest !== currentRequest) return;

            // remove duplicate places using wikidata ID
            const seen = new Set();
            const uniquePlaces = placesDetails.filter(({place, details}) => {
                const key = details.wikidata;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })

            uniquePlaces.forEach(({place, details}) => displayPlaceCard(place, details));  
        }
    } catch (error) {
        console.error("Places error:", error);
    }
}

function displayPlaceCard(place, details) {
    const placeName = place.properties.name;
    const rating = place.properties.rate;
    const placePicUrl = details.preview?.source || 'assets/image-placeholder.svg';
    const descriptionHTML = details.wikipedia_extracts.html ?? '';

    exploreResult.innerHTML += `
        <div class="place-card glass">
            <img src="${placePicUrl}" alt="place picture" onerror="this.src='assets/image-placeholder.svg'">            <div class="place-info">
                <div class="title-rating-container">
                    <h3>${placeName}</h3>
                    <div class="rating"><i class="fa-regular fa-star"></i>${rating}</div>
                </div>
                <button class="add-btn"><i class="fa fa-circle-plus"></i>Add to Trip</button>
            </div>
        </div>
    `;
}
