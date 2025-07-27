let BASE_URL = "https://api.frankfurter.app/latest"; // New API endpoint

const dropdowns = document.querySelectorAll(".dropdown select");
const btn = document.querySelector("form .get-rate-btn");
const resetBtn = document.querySelector("form .reset-btn");
const fromCurr = document.querySelector(".from select");
const toCurr = document.querySelector(".to select");
const msg = document.querySelector(".msg");
const exchangeIcon = document.querySelector(".dropdown i");

const fromSearchInput = document.querySelector(".from .search-currency");
const toSearchInput = document.querySelector(".to .search-currency");

// Store original options to reset search filters
let allCurrencyCodes = []; // To store all available currency codes
let originalFromOptions = [];
let originalToOptions = [];

// Fetch currencies and populate dropdowns on load
window.addEventListener("load", async () => {
    await fetchAndPopulateCurrencies();
    msg.innerText = "Enter amount and select currencies to get exchange rate."; // Initial message
});

async function fetchAndPopulateCurrencies() {
    try {
        // Fetch available currencies from the API
        const response = await fetch("https://api.frankfurter.app/currencies");
        if (!response.ok) {
            throw new Error(`Failed to fetch currency list: HTTP error! status: ${response.status}`);
        }
        const currencies = await response.json();
        allCurrencyCodes = Object.keys(currencies); // Store all codes

        for (let select of dropdowns) {
            select.innerHTML = ''; // Clear existing options
            let currentOptions = [];

            for (const currCode of allCurrencyCodes) {
                let newOption = document.createElement("Option");
                newOption.innerText = currCode;
                newOption.value = currCode;

                if (select.name === "from" && currCode === "USD") {
                    newOption.selected = "selected";
                } else if (select.name === "to" && currCode === "INR") {
                    newOption.selected = "selected";
                }
                select.append(newOption);
                currentOptions.push({ code: currCode, option: newOption });
            }

            if (select.name === "from") {
                originalFromOptions = currentOptions;
            } else {
                originalToOptions = currentOptions;
            }

            select.addEventListener("change", (evt) => {
                updateFlag(evt.target);
                const searchInput = evt.target.nextElementSibling;
                if (searchInput && searchInput.classList.contains('search-currency')) {
                    searchInput.value = '';
                }
            });
        }

        // Initial flag updates
        updateFlag(fromCurr);
        updateFlag(toCurr);

    } catch (error) {
        console.error("Error fetching currencies:", error);
        msg.innerText = `Error loading currencies: ${error.message}`;
    }
}


const updateFlag = (element) => {
    let currCode = element.value;
    // Fallback if countryList doesn't have the currency, though it should with the new API
    let countryCode = countryList[currCode] || "US"; // Default to US flag if not found
    let newSrc = `https://flagsapi.com/${countryCode}/flat/64.png`;
    let img = element.parentElement.querySelector("img");
    img.src = newSrc;
}

btn.addEventListener("click", (evt) => {
    evt.preventDefault();
    updateExchangeRate();
});

exchangeIcon.addEventListener("click", () => {
    let tempValue = fromCurr.value;
    fromCurr.value = toCurr.value;
    toCurr.value = tempValue;
    updateFlag(fromCurr);
    updateFlag(toCurr);
    updateExchangeRate();
});

resetBtn.addEventListener("click", () => {
    // Reset amount input
    document.querySelector(".amount input").value = "1";

    // Reset dropdowns to default (USD and INR)
    fromCurr.value = "USD";
    toCurr.value = "INR";

    // Reset flags
    updateFlag(fromCurr);
    updateFlag(toCurr);

    // Reset search inputs
    fromSearchInput.value = '';
    toSearchInput.value = '';

    // Re-populate dropdowns with all options
    populateDropdownsWithFiltered(fromCurr, originalFromOptions); // Use a helper for re-populating
    populateDropdownsWithFiltered(toCurr, originalToOptions);

    msg.innerText = "Enter amount and select currencies to get exchange rate."; // Reset message on clear
});

const updateExchangeRate = async () => {
    let amount = document.querySelector(".amount input");
    let amtVal = amount.value;
    if (amtVal === "" || isNaN(amtVal) || amtVal < 1) {
        amtVal = 1;
        amount.value = "1";
    }

    msg.innerText = "Getting exchange rate...";

    try {
        // Construct the URL for Frankfurter API
        // Example: https://api.frankfurter.app/latest?from=USD&to=INR
        const URL = `${BASE_URL}?from=${fromCurr.value}&to=${toCurr.value}`;
        let response = await fetch(URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let data = await response.json();

        // Frankfurter API returns rates as data.rates.INR
        let rate = data.rates[toCurr.value];

        if (rate === undefined) {
             throw new Error(`Exchange rate data not found for ${fromCurr.value} to ${toCurr.value}. Check currency codes.`);
        }

        let finalAmount = amtVal * rate;
        msg.innerText = `${amtVal} ${fromCurr.value} = ${finalAmount.toFixed(2)} ${toCurr.value}`;
    } catch (error) {
        console.error("Error fetching exchange rate:", error);
        msg.innerText = `Could not get exchange rate. Please try again later. (${error.message})`;
    }
}

// Helper function to populate dropdowns based on filtered options
function populateDropdownsWithFiltered(selectElement, optionsList) {
    selectElement.innerHTML = '';
    optionsList.forEach(item => {
        selectElement.appendChild(item.option.cloneNode(true));
    });
}


// Search functionality for 'from' dropdown
fromSearchInput.addEventListener("input", (evt) => {
    const searchTerm = evt.target.value.toLowerCase();
    const filteredOptions = originalFromOptions.filter(item =>
        item.code.toLowerCase().includes(searchTerm)
    );
    
    populateDropdownsWithFiltered(fromCurr, filteredOptions);

    if (filteredOptions.length > 0) {
        fromCurr.value = filteredOptions[0].code;
    } else {
        fromCurr.value = ""; // Clear selected value
    }
    updateFlag(fromCurr); // Update flag based on potentially new selection
});

// Search functionality for 'to' dropdown
toSearchInput.addEventListener("input", (evt) => {
    const searchTerm = evt.target.value.toLowerCase();
    const filteredOptions = originalToOptions.filter(item =>
        item.code.toLowerCase().includes(searchTerm)
    );

    populateDropdownsWithFiltered(toCurr, filteredOptions);

    if (filteredOptions.length > 0) {
        toCurr.value = filteredOptions[0].code;
    } else {
        toCurr.value = ""; // Clear selected value
    }
    updateFlag(toCurr); // Update flag based on potentially new selection
});