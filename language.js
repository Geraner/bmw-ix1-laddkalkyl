const LANGUAGE_STORAGE_KEY = "bmw-i-europe-charge-language-v1";

const TRANSLATIONS = {
  sv: {
    pageTitle: "BMW laddkostnadskalkylator",
    badge: "BMW i-modeller • Laddkalkyl Europa",
    title: "BMW laddkostnadskalkylator",
    subtitle: "Välj BMW i-modell, valuta, laddpris och SoC. Kalkylen visar total laddkostnad, pris per 100 km och pris per mil.",
    languageTitle: "Språk",
    languageLabel: "Välj språk",
    stepCar: "1. Välj din bilmodell",
    carModelLabel: "Bilmodell",
    carHint: "Batterivärdena är uppskattade användbara värden för laddberäkning. Standardförbrukning per modell baseras på EV Database där värde finns, men bör justeras efter faktisk körning.",
    stepPrice: "2. Vad kostar laddaren?",
    currencyLabel: "Valuta",
    priceLabel: "Pris per kWh",
    convertedPrice: "Omräknat laddpris",
    stepCharge: "3. Hur mycket ska du ladda?",
    fromSocLabel: "Nuvarande SoC",
    toSocLabel: "Ladda till",
    quickStart: "Snabbval – startnivå",
    quickTarget: "Snabbval – målnivå",
    stepBattery: "4. Batteri och förbrukning",
    batteryLabel: "Användbart batteri kWh",
    consumptionLabel: "Förbrukning kWh/100 km",
    resetCarValues: "Återställ värden från vald bilmodell",
    totalCost: "Total laddkostnad",
    energyToCharge: "Energi att ladda",
    addedRange: "Tillförd räckvidd",
    costPer100: "Kostnad per 100 km",
    costPer10: "Pris per mil",
    exchangeRates: "Valutakurser",
    exchangeRatesSmall: "Klicka för att visa eller dölja aktuella kurser",
    fetchRates: "Hämta kurser",
    resetAll: "Återställ allt",
    manualRates: "Manuella valutakurser",
    manualRatesSmall: "Klicka för att visa eller ändra sparade kurser",
    manualRatesHint: "Om automatisk hämtning inte fungerar kan du ändra kurserna här. Alla värden sparas lokalt i webbläsaren.",
    footer: "Beräkningarna är ungefärliga. Batterivärden, laddförluster, kortpåslag, parkeringsavgifter, blockeringstaxa och operatörernas prisändringar kan påverka slutkostnaden."
  },
  en: {
    pageTitle: "BMW charging cost calculator",
    badge: "BMW i models • Charging calculator Europe",
    title: "BMW charging cost calculator",
    subtitle: "Select BMW i model, currency, charging price and SoC. The calculator shows total charging cost, cost per 100 km and cost per 10 km.",
    languageTitle: "Language",
    languageLabel: "Select language",
    stepCar: "1. Select your car model",
    carModelLabel: "Car model",
    carHint: "Battery values are estimated usable values for charging calculations. The default consumption per model is based on EV Database where available, but should be adjusted to your actual driving.",
    stepPrice: "2. What does the charger cost?",
    currencyLabel: "Currency",
    priceLabel: "Price per kWh",
    convertedPrice: "Converted charging price",
    stepCharge: "3. How much do you want to charge?",
    fromSocLabel: "Current SoC",
    toSocLabel: "Charge to",
    quickStart: "Quick choices – start level",
    quickTarget: "Quick choices – target level",
    stepBattery: "4. Battery and consumption",
    batteryLabel: "Usable battery kWh",
    consumptionLabel: "Consumption kWh/100 km",
    resetCarValues: "Reset values from selected car model",
    totalCost: "Total charging cost",
    energyToCharge: "Energy to charge",
    addedRange: "Added range",
    costPer100: "Cost per 100 km",
    costPer10: "Cost per 10 km",
    exchangeRates: "Exchange rates",
    exchangeRatesSmall: "Click to show or hide current rates",
    fetchRates: "Fetch rates",
    resetAll: "Reset all",
    manualRates: "Manual exchange rates",
    manualRatesSmall: "Click to show or edit saved rates",
    manualRatesHint: "If automatic fetching does not work, you can edit the rates here. All values are saved locally in the browser.",
    footer: "The calculations are approximate. Battery values, charging losses, card fees, parking fees, idle fees and operator price changes can affect the final cost."
  }
};

function getLanguage() {
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return saved === "en" ? "en" : "sv";
}

function setLanguage(language) {
  const selected = language === "en" ? "en" : "sv";
  localStorage.setItem(LANGUAGE_STORAGE_KEY, selected);
  document.documentElement.lang = selected === "en" ? "en" : "sv";
  document.title = TRANSLATIONS[selected].pageTitle;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    if (TRANSLATIONS[selected][key]) {
      element.textContent = TRANSLATIONS[selected][key];
    }
  });

  const select = document.getElementById("languageSelect");
  if (select) select.value = selected;
}

document.addEventListener("DOMContentLoaded", () => {
  const languageSelect = document.getElementById("languageSelect");
  setLanguage(getLanguage());

  if (languageSelect) {
    languageSelect.addEventListener("change", () => {
      setLanguage(languageSelect.value);
    });
  }
});
