const EUROPEAN_CURRENCIES = [
  { code: "EUR", name: "Euro", country: "Euroområdet", sek: 10.8485 },
  { code: "DKK", name: "Dansk krona", country: "Danmark", sek: 1.45183 },
  { code: "NOK", name: "Norsk krona", country: "Norge", sek: 0.94 },
  { code: "GBP", name: "Brittiskt pund", country: "Storbritannien", sek: 12.75 },
  { code: "CHF", name: "Schweizisk franc", country: "Schweiz", sek: 11.55 },
  { code: "PLN", name: "Zloty", country: "Polen", sek: 2.55 },
  { code: "CZK", name: "Tjeckisk krona", country: "Tjeckien", sek: 0.44 },
  { code: "HUF", name: "Forint", country: "Ungern", sek: 0.028 },
  { code: "RON", name: "Rumänsk leu", country: "Rumänien", sek: 2.18 },
  { code: "BGN", name: "Bulgarisk lev", country: "Bulgarien", sek: 5.55 },
  { code: "ISK", name: "Isländsk krona", country: "Island", sek: 0.078 },
  { code: "TRY", name: "Turkisk lira", country: "Turkiet", sek: 0.34 },
  { code: "RSD", name: "Serbisk dinar", country: "Serbien", sek: 0.093 },
  { code: "BAM", name: "Konvertibel mark", country: "Bosnien och Hercegovina", sek: 5.55 },
  { code: "MKD", name: "Makedonisk denar", country: "Nordmakedonien", sek: 0.176 },
  { code: "ALL", name: "Albansk lek", country: "Albanien", sek: 0.11 },
  { code: "MDL", name: "Moldavisk leu", country: "Moldavien", sek: 0.60 },
  { code: "UAH", name: "Ukrainsk hryvnia", country: "Ukraina", sek: 0.26 },
  { code: "SEK", name: "Svensk krona", country: "Sverige", sek: 1 }
];

const RIKSBANK_SERIES = {
  EUR: "sekeurpmi",
  DKK: "sekdkkpmi",
  NOK: "seknokpmi",
  GBP: "sekgbppmi",
  CHF: "sekchfpmi",
  PLN: "sekplnpmi",
  CZK: "sekczkpmi",
  HUF: "sekhufpmi"
};

const DEFAULTS = {
  currency: "EUR",
  pricePerKwh: 0.49,
  fromSoc: 20,
  toSoc: 80,
  usableBatteryKwh: 64.7,
  consumptionKwh100: 20,
  rateSource: "Standardvärden, kan uppdateras manuellt",
  rateDate: "",
  lastRateFetch: ""
};

const INITIAL_RATES = Object.fromEntries(EUROPEAN_CURRENCIES.map((c) => [c.code, c.sek]));
const STORAGE_SETTINGS = "bmw-ix1-europe-charge-settings-v1";
const STORAGE_RATES = "bmw-ix1-europe-charge-rates-v1";

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

let settings = loadJson(STORAGE_SETTINGS, DEFAULTS);
let rates = loadJson(STORAGE_RATES, INITIAL_RATES);

function save() {
  localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));
  localStorage.setItem(STORAGE_RATES, JSON.stringify(rates));
}

function parseNumber(value, fallback = 0) {
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sek(value, decimals = 2) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  }).format(value);
}

function num(value, decimals = 2) {
  return new Intl.NumberFormat("sv-SE", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  }).format(value);
}

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function bindInput(id, key) {
  const el = document.getElementById(id);
  el.value = settings[key];
  el.addEventListener("input", () => {
    settings[key] = parseNumber(el.value, settings[key]);
    save();
    calculate();
  });
}

function setupCurrencySelect() {
  const select = document.getElementById("currency");
  select.innerHTML = "";

  for (const c of EUROPEAN_CURRENCIES) {
    const option = document.createElement("option");
    option.value = c.code;
    option.textContent = `${c.code} – ${c.name}`;
    select.appendChild(option);
  }

  select.value = settings.currency;
  select.addEventListener("change", () => {
    settings.currency = select.value;
    save();
    calculate();
  });
}

function setupManualRates() {
  const container = document.getElementById("manualRates");
  container.innerHTML = "";

  for (const c of EUROPEAN_CURRENCIES) {
    const label = document.createElement("label");
    label.textContent = `${c.code} – ${c.name}`;

    const input = document.createElement("input");
    input.inputMode = "decimal";
    input.value = rates[c.code];
    input.disabled = c.code === "SEK";
    input.addEventListener("input", () => {
      rates[c.code] = parseNumber(input.value, rates[c.code]);
      settings.rateSource = "Manuellt ändrade kurser";
      save();
      calculate();
    });

    label.appendChild(input);
    container.appendChild(label);
  }
}

function findObservationValue(data) {
  const candidates = [];

  function walk(x) {
    if (!x || typeof x !== "object") return;
    if (Array.isArray(x)) {
      x.forEach(walk);
      return;
    }
    candidates.push(x);
    Object.values(x).forEach(walk);
  }

  walk(data);

  for (const obj of candidates) {
    const keys = Object.keys(obj);
    const valueKey = keys.find((k) => ["value", "Value", "observationValue", "ObservationValue"].includes(k));
    if (valueKey) {
      const value = parseNumber(obj[valueKey], NaN);
      if (Number.isFinite(value)) {
        const dateKey = keys.find((k) => ["date", "Date", "observationDate", "ObservationDate", "period", "Period"].includes(k));
        return { value, date: dateKey ? String(obj[dateKey]) : "" };
      }
    }
  }

  throw new Error("Kunde inte tolka API-svaret.");
}

async function fetchRiksbankRate(seriesId) {
  const url = `https://api.riksbank.se/swea/v1/Observations/Latest/${seriesId}`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`API-svar ${response.status}`);
  const data = await response.json();
  return findObservationValue(data);
}

async function fetchRates() {
  const button = document.getElementById("fetchRatesBtn");
  button.disabled = true;
  setText("rateStatus", "Hämtar senaste publicerade kurser från Riksbanken...");

  const updated = {};
  const dates = [];
  const failed = [];

  await Promise.all(Object.entries(RIKSBANK_SERIES).map(async ([currency, series]) => {
    try {
      const result = await fetchRiksbankRate(series);
      updated[currency] = result.value;
      if (result.date) dates.push(result.date);
    } catch {
      failed.push(currency);
    }
  }));

  if (Object.keys(updated).length > 0) {
    rates = { ...rates, ...updated, SEK: 1 };
    const uniqueDates = [...new Set(dates)].filter(Boolean);
    settings.rateSource = "Riksbanken API för vanliga valutor, övriga manuella/sparade";
    settings.rateDate = uniqueDates.length === 1 ? uniqueDates[0] : uniqueDates.slice(0, 3).join(" / ");
    settings.lastRateFetch = new Date().toLocaleString("sv-SE");
    setText("rateStatus", failed.length ? `Kurser uppdaterade delvis. Kunde inte hämta: ${failed.join(", ")}.` : "Kurser uppdaterade och sparade lokalt.");
  } else {
    setText("rateStatus", "Kunde inte hämta kurser. Använder sparade/manuella kurser.");
  }

  save();
  setupManualRates();
  calculate();
  button.disabled = false;
}

function resetAll() {
  settings = { ...DEFAULTS };
  rates = { ...INITIAL_RATES };
  save();
  setupCurrencySelect();
  setupManualRates();
  hydrateInputs();
  setText("rateStatus", "Återställt till standardvärden.");
  calculate();
}

function hydrateInputs() {
  for (const key of ["pricePerKwh", "fromSoc", "toSoc", "usableBatteryKwh", "consumptionKwh100"]) {
    document.getElementById(key).value = settings[key];
  }
  document.getElementById("currency").value = settings.currency;
}

function calculate() {
  const currency = settings.currency;
  const currencyRate = parseNumber(rates[currency], 1);
  const pricePerKwh = parseNumber(settings.pricePerKwh, 0);
  const sekPerKwh = pricePerKwh * currencyRate;

  const from = Math.min(100, Math.max(0, parseNumber(settings.fromSoc, 0)));
  const to = Math.min(100, Math.max(0, parseNumber(settings.toSoc, 0)));
  const delta = Math.max(0, to - from);
  const battery = parseNumber(settings.usableBatteryKwh, 64.7);
  const consumption = parseNumber(settings.consumptionKwh100, 20);

  const chargeKwh = battery * (delta / 100);
  const totalCostSek = chargeKwh * sekPerKwh;
  const totalCostLocal = chargeKwh * pricePerKwh;
  const costPer100KmSek = sekPerKwh * consumption;
  const costPer10KmSek = costPer100KmSek / 10;
  const rangeAddedKm = consumption ? (chargeKwh / consumption) * 100 : 0;

  setText("eurMini", `${num(rates.EUR, 4)} kr`);
  setText("dkkMini", `${num(rates.DKK, 5)} kr`);
  setText("nokMini", `${num(rates.NOK, 4)} kr`);
  setText("gbpMini", `${num(rates.GBP, 4)} kr`);

  setText("rateMeta", `Källa: ${settings.rateSource}${settings.rateDate ? " · kursdatum: " + settings.rateDate : ""}${settings.lastRateFetch ? " · hämtad: " + settings.lastRateFetch : ""}`);
  setText("sekPerKwh", `${sek(sekPerKwh, 2)}/kWh`);
  setText("currencyRateText", `1 ${currency} = ${num(currencyRate, 5)} SEK`);
  setText("totalCostSek", sek(totalCostSek, 0));
  setText("totalCostDetail", `${num(chargeKwh, 1)} kWh × ${sek(sekPerKwh, 2)}/kWh`);
  setText("totalCostLocal", currency === "SEK" ? "" : `Lokalt: cirka ${num(totalCostLocal, 2)} ${currency}`);
  setText("costPer100KmSek", sek(costPer100KmSek, 0));
  setText("costPer100Detail", `${num(consumption, 1)} kWh/100 km × ${sek(sekPerKwh, 2)}/kWh`);
  setText("chargeKwh", `${num(chargeKwh, 1)} kWh`);
  setText("rangeAddedKm", `${num(rangeAddedKm, 0)} km`);
  setText("costPer10KmSek", sek(costPer10KmSek, 2));
}

function init() {
  setupCurrencySelect();
  setupManualRates();
  hydrateInputs();

  bindInput("pricePerKwh", "pricePerKwh");
  bindInput("fromSoc", "fromSoc");
  bindInput("toSoc", "toSoc");
  bindInput("usableBatteryKwh", "usableBatteryKwh");
  bindInput("consumptionKwh100", "consumptionKwh100");

  document.getElementById("fetchRatesBtn").addEventListener("click", fetchRates);
  document.getElementById("resetBtn").addEventListener("click", resetAll);

  calculate();
}

init();
