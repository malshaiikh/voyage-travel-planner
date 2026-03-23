const exploreBtn = document.getElementById("explore-btn");
const homePage = document.querySelector(".home-page");
const planPage = document.querySelector(".planning-page");
const backBtn = document.getElementById("back-btn");
const searchInput = document.getElementById("search-input");
const errorContainer = document.getElementById("error-container");
const planningPage = document.querySelector(".planning-page");
const destinationBanner = document.querySelector(".destination-banner");

exploreBtn.addEventListener("click", searchDestination);
searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchDestination();
})

backBtn.addEventListener("click", () => {
    homePage.classList.remove("hidden");
    planPage.classList.add("hidden");
    backBtn.classList.add("hidden");
    document.body.classList.remove('solid-bg')
})

const UNSPLASH_URL = "https://api.unsplash.com/search/photos?orientation=landscape&per_page=1&query=";
const OPENSTREETMAP_URL = "https://nominatim.openstreetmap.org/search?q=";
const OPENWEATHERMAP_URL = "https://api.openweathermap.org/data/2.5/weather?q=";

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
            .filter(place => place.type === "administrative" || "city")
            .find(place => place.name.toLowerCase() === searchTerm.toLowerCase());

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
    const unsplashResponse = await fetch(`${UNSPLASH_URL}${countryName} ${addressType}&client_id=${UNSPLASH_ACCESS_KEY}`);
    const unsplashData = await unsplashResponse.json();

    // fetch current weather of the destination
    const weatherResponse = await fetch(`${OPENWEATHERMAP_URL}${countryName}&appid=${OPENWEATHERMAP_KEY}&units=metric`);
    const weatherData = await weatherResponse.json();

    const temp = weatherData.main.temp;
    const description = weatherData.weather[0].main;
    const weatherIcon = weatherData.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${weatherIcon}@2x.png`;
    const humidity = weatherData.main.humidity;
    const wind = weatherData.wind.speed;

    console.log(weatherData);

    destinationBanner.innerHTML = `
        <h1>${countryName}</h1>
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
    destinationBanner.style.backgroundImage = `url(${unsplashData.results[0].urls.regular})`;
}


