(() => {
  const STORAGE_KEY = "bmw-i-europe-charge-language-v1";
  const saved = localStorage.getItem(STORAGE_KEY) || "sv";

  const staticMap = {
    "BMW i-modeller • Laddkalkyl Europa": "BMW i models • Charging calculator Europe",
    "BMW laddkostnadskalkylator": "BMW charging cost calculator",
    "Välj BMW i-modell, valuta, laddpris och SoC. Kalkylen visar total laddkostnad, pris per 100 km och pris per mil.": "Select BMW i model, currency, charging price and SoC. The calculator shows total charging cost, cost per 100 km and cost per 10 km.",
    "1. Välj din bilmodell": "1. Select your car model",
    "Bilmodell": "Car model",
    "Batterivärdena är uppskattade användbara värden för laddberäkning. Standardförbrukning per modell baseras på EV Database där värde finns, men bör justeras efter faktisk körning.": "Battery values are estimated usable values for charging calculations. Default consumption per model is based on EV Database where available, but should be adjusted to your actual driving.",
    "2. Vad kostar laddaren?": "2. What does the charger cost?",
    "Valuta": "Currency",
    "Pris per kWh": "Price per kWh",
    "Omräknat laddpris": "Converted charging price",
    "3. Hur mycket ska du ladda?": "3. How much do you want to charge?",
    "Nuvarande SoC": "Current SoC",
    "Ladda till": "Charge to",
    "Snabbval – startnivå": "Quick choices – start level",
    "Snabbval – målnivå": "Quick choices – target level",
    "4. Batteri och förbrukning": "4. Battery and consumption",
    "Användbart batteri kWh": "Usable battery kWh",
    "Förbrukning kWh/100 km": "Consumption kWh/100 km",
    "Återställ värden från vald bilmodell": "Reset values from selected car model",
    "Total laddkostnad": "Total charging cost",
    "Energi att ladda": "Energy to charge",
    "Tillförd räckvidd": "Added range",
    "Kostnad per 100 km": "Cost per 100 km",
    "Pris per mil": "Cost per 10 km",
    "Valutakurser": "Exchange rates",
    "Klicka för att visa eller dölja aktuella kurser": "Click to show or hide current rates",
    "Hämta kurser": "Fetch rates",
    "Återställ allt": "Reset all",
    "Manuella valutakurser": "Manual exchange rates",
    "Klicka för att visa eller ändra sparade kurser": "Click to show or edit saved rates",
    "Om automatisk hämtning inte fungerar kan du ändra kurserna här. Alla värden sparas lokalt i webbläsaren.": "If automatic fetching does not work, you can edit the rates here. All values are saved locally in the browser.",
    "Beräkningarna är ungefärliga. Batterivärden, laddförluster, kortpåslag, parkeringsavgifter, blockeringstaxa och operatörernas prisändringar kan påverka slutkostnaden.": "The calculations are approximate. Battery values, charging losses, card fees, parking fees, idle fees and operator price changes can affect the final cost."
  };

  function insertLanguageSelector() {
    if (document.getElementById("languageSelect")) return;
    const hero = document.querySelector(".hero");
    if (!hero) return;

    const card = document.createElement("section");
    card.className = "card language-card";
    card.innerHTML = `
      <h2>${saved === "en" ? "Language" : "Språk"}</h2>
      <label>
        <span>${saved === "en" ? "Select language" : "Välj språk"}</span>
        <select id="languageSelect">
          <option value="sv">Svenska</option>
          <option value="en">English</option>
        </select>
      </label>`;
    hero.insertAdjacentElement("afterend", card);

    const select = document.getElementById("languageSelect");
    select.value = saved === "en" ? "en" : "sv";
    select.addEventListener("change", () => {
      localStorage.setItem(STORAGE_KEY, select.value === "en" ? "en" : "sv");
      location.reload();
    });
  }

  function translateStaticText() {
    if (saved !== "en") return;
    document.documentElement.lang = "en";
    document.title = "BMW charging cost calculator";
    document.querySelectorAll("h1,h2,p,span,small,button,label,footer,div.badge,div.quick-label").forEach((el) => {
      const text = el.textContent.trim();
      if (staticMap[text]) el.textContent = staticMap[text];
    });
  }

  function translateDynamicText() {
    if (saved !== "en") return;

    const meta = document.getElementById("selectedCarMeta");
    if (meta) {
      meta.textContent = meta.textContent
        .replace("Användbart batteri:", "Usable battery:")
        .replace("Föreslagen förbrukning:", "Suggested consumption:");
    }

    const source = document.getElementById("selectedCarSource");
    if (source) {
      source.textContent = source.textContent
        .replace("Källa för förbrukning:", "Consumption source:")
        .replace("eget/manuellt värde", "own/manual value");
    }

    const local = document.getElementById("totalCostLocal");
    if (local) local.textContent = local.textContent.replace("Lokalt: cirka", "Local: approx.");

    const rateMeta = document.getElementById("rateMeta");
    if (rateMeta) {
      rateMeta.textContent = rateMeta.textContent
        .replace("Källa:", "Source:")
        .replace("kursdatum:", "rate date:")
        .replace("hämtad:", "fetched:");
    }

    const rateStatus = document.getElementById("rateStatus");
    if (rateStatus) {
      rateStatus.textContent = rateStatus.textContent
        .replace("Valutakurser sparas lokalt i webbläsaren.", "Exchange rates are saved locally in the browser.")
        .replace("Hämtar valutakurser från webbplatsens rates.json...", "Fetching exchange rates from the website rates.json...")
        .replace("Valutakurser uppdaterade från rates.json.", "Exchange rates updated from rates.json.")
        .replace("Fil uppdaterad:", "File updated:")
        .replace("Saknade/ej uppdaterade:", "Missing/not updated:")
        .replace("Kunde inte hämta rates.json. Använder sparade/manuella kurser i denna webbläsare.", "Could not fetch rates.json. Using saved/manual rates in this browser.")
        .replace("Återställt till standardvärden.", "Reset to default values.");
    }

    const summary = document.getElementById("plainSummary");
    const car = document.getElementById("selectedCarLabel")?.textContent || "";
    const from = document.getElementById("fromSoc")?.value || "";
    const to = document.getElementById("toSoc")?.value || "";
    const cost = document.getElementById("totalCostSek")?.textContent || "";
    const range = document.getElementById("rangeAddedKm")?.textContent || "";
    const cons = document.getElementById("consumptionKwh100")?.value || "";
    if (summary && from && to && cost && range && cons) {
      const carText = car && car !== "Egen bil" ? `${car} ` : "";
      summary.textContent = `Charging ${carText}from ${from}% to ${to}% costs about ${cost} and adds around ${range} at ${cons} kWh/100 km.`;
    }
  }

  function applyLanguage() {
    insertLanguageSelector();
    translateStaticText();
    translateDynamicText();
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyLanguage();
    const observer = new MutationObserver(() => applyLanguage());
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    document.body.addEventListener("input", () => setTimeout(applyLanguage, 50), true);
    document.body.addEventListener("change", () => setTimeout(applyLanguage, 50), true);
    document.body.addEventListener("click", () => setTimeout(applyLanguage, 100), true);
  });
})();
