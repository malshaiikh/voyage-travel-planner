const exploreBtn = document.getElementById("explore-btn");
const homePage = document.querySelector(".home-page");
const planPage = document.querySelector(".planning-page");
const backBtn = document.getElementById("back-btn");
const searchInput = document.getElementById("search-input");
const errorContainer = document.getElementById("error-container");
const planningPage = document.querySelector(".planning-page");
const destinationBanner = document.querySelector(".destination-banner");

// click on explore
exploreBtn.addEventListener("click", searchDestination);
searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchDestination();
})

// click on back
backBtn.addEventListener("click", () => {
    homePage.classList.remove("hidden");
    planPage.classList.add("hidden");
    backBtn.classList.add("hidden");

    document.body.classList.remove('solid-bg')
})

const UNSPLASH_URL = "https://api.unsplash.com/search/photos?orientation=landscape&per_page=1&query=";
const OPENSTREETMAP_URL = "https://nominatim.openstreetmap.org/search?q=";

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
        
        const validPlace = geoData
            .filter(place => place.type === "administrative")
            .find(place => place.name.toLowerCase() === searchTerm.toLowerCase());

        console.log(validPlace);

        if (geoData.length === 0 || !validPlace) {
            errorContainer.textContent = `"${searchTerm}" is not a valid destination. Try another.`;
            errorContainer.classList.remove("hidden");
            return;
        } else {
            homePage.classList.add("hidden");
            planPage.classList.remove("hidden");
            backBtn.classList.remove("hidden");
            document.body.classList.add('solid-bg');
            searchInput.value = "";

            displayBanner(validPlace.name, validPlace.addresstype);
        }
    } catch (error) {
        errorContainer.textContent = "Something went wrong. Please try again later.";
        errorContainer.classList.remove("hidden");
    }
}

async function displayBanner(countryName, addressType) {
    // fetch destination pic from unsplash api
    const response = await fetch(`${UNSPLASH_URL}${countryName} ${addressType}&client_id=${UNSPLASH_ACCESS_KEY}`);
    const data = await response.json();

    destinationBanner.innerHTML = `
        <h1>${countryName}</h1>
        <div class="weather">weather</div>
    `;
    destinationBanner.style.backgroundImage = `url(${data.results[0].urls.regular})`;
}


