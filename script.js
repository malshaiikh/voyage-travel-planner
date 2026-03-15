const exploreBtn = document.getElementById("explore-btn");
const homePage = document.querySelector(".home-page");
const planPage = document.querySelector(".planning-page");
const backBtn = document.getElementById("back-btn");
const homeBtn = document.getElementById("home-btn");

// click on explore
exploreBtn.addEventListener("click", () => {
    homePage.classList.add("hidden");
    planPage.classList.remove("hidden");
    backBtn.classList.remove("hidden");

    document.body.classList.add('solid-bg')
})

// click on back
backBtn.addEventListener("click", () => {
    homePage.classList.remove("hidden");
    planPage.classList.add("hidden");
    backBtn.classList.add("hidden");

    document.body.classList.remove('solid-bg')
})