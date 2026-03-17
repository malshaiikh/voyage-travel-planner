const exploreBtn = document.getElementById("explore-btn");
const homePage = document.querySelector(".home-page");
const planPage = document.querySelector(".planning-page");
const backBtn = document.getElementById("back-btn");
const homeBtn = document.getElementById("home-btn");
const searchInput = document.getElementById("search-input");
const errorContainer = document.getElementById("error-container");
const planningPage = document.querySelector(".planning-page");
const destinationBanner = document.querySelector(".destination-banner");

// click on explore
exploreBtn.addEventListener("click", searchDestination);

// click on back
backBtn.addEventListener("click", () => {
    homePage.classList.remove("hidden");
    planPage.classList.add("hidden");
    backBtn.classList.add("hidden");

    document.body.classList.remove('solid-bg')
})

const UNSPLASH_URL = "https://api.unsplash.com/search/photos?query="

async function searchDestination() {
    const searchTerm = searchInput.value.trim();

    // empty input case
    if (!searchTerm) {
        errorContainer.textContent = "Please enter a destination.";
        errorContainer.classList.remove("hidden");
        return;
    }

    try {
        errorContainer.classList.add("hidden");

        // fetch country pic from unsplash api
        const response = await fetch(`${UNSPLASH_URL}${searchTerm}&client_id=${UNSPLASH_ACCESS_KEY}`);
        const data = await response.json();

        if (data.total === 0 ) {
            errorContainer.textContent = `No result found for "${searchTerm}". Try another search term.`;
            errorContainer.classList.remove("hidden");
        } else {
            homePage.classList.add("hidden");
            planPage.classList.remove("hidden");
            backBtn.classList.remove("hidden");
            document.body.classList.add('solid-bg');
            searchInput.value = "";

            destinationBanner.innerHTML = `
                <h1 id="destination">${searchTerm}</h1>
                <div class="weather">weather</div>
            `;
            destinationBanner.style.backgroundImage = `url(${data.results[0].urls.regular})`;
        }
    } catch (error) {
        errorContainer.textContent = "Something went wrong. Please try again later.";
        errorContainer.classList.remove("hidden");
    }
}