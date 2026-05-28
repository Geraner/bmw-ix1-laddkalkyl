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

const LIMITS = {
  pricePerKwh: { min: 0, max: 100, fallback: DEFAULTS.pricePerKwh },
  fromSoc: { min: 0, max: 100, fallback: DEFAULTS.fromSoc },
  toSoc: { min: 0, max: 100, fallback: DEFAULTS.toSoc },
  usableBatteryKwh: { min: 1, max: 200, fallback: DEFAULTS.usableBatteryKwh },
  consumptionKwh100: { min: 1, max: 100, fallback: DEFAULTS.consumptionKwh100 },
  rate: { min: 0.000001, max: 1000, fallback: 1 }
};

const INITIAL_RATES = Object.fromEntries(EUROPEAN_CURRENCIES.map((c) => [c.code, c.sek]));
const STORAGE_SETTINGS = "bmw-ix1-europe-charge-settings-v2";
const STORAGE_RATES = "bmw-ix1-europe-charge-rates-v2";
const API_TIMEOUT_MS = 8000;
const MAX_API_PARSE_NODES = 5000;
const MAX_API_PARSE_DEPTH = 20;

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : { ...fallback };
  } catch {
    return { ...fallback };
  }
}

let settings = sanitizeSettings(loadJson(STORAGE_SETTINGS, DEFAULTS));
let rates = sanitizeRates(loadJson(STORAGE_RATES, INITIAL_RATES));

function save() {
  localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));
  localStorage.setItem(STORAGE_RATES, JSON.stringify(rates));
}

function parseNumber(value, fallback = 0) {
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function boundedNumber(value, limit) {
  const parsed = parseNumber(value, limit.fallback);
  return clamp(parsed, limit.min, limit.max);
}

function sanitizeSettings(input) {
  const allowedCurrencies = new Set(EUROPEAN_CURRENCIES.map((c) => c.code));
  return {
    ...DEFAULTS,
    ...input,
    currency: allowedCurrencies.has(input.currency) ? input.currency : DEFAULTS.currency,
    pricePerKwh: boundedNumber(input.pricePerKwh, LIMITS.pricePerKwh),
    fromSoc: boundedNumber(input.fromSoc, LIMITS.fromSoc),
    toSoc: boundedNumber(input.toSoc, LIMITS.toSoc),
    usableBatteryKwh: boundedNumber(input.usableBatteryKwh, LIMITS.usableBatteryKwh),
    consumptionKwh100: boundedNumber(input.consumptionKwh100, LIMITS.consumptionKwh100),
    rateSource: String(input.rateSource || DEFAULTS.rateSource).slice(0, 120),
    rateDate: String(input.rateDate || "").slice(0, 80),
    lastRateFetch: String(input.lastRateFetch || "").slice(0, 80)
  };
}

function sanitizeRates(input) {
  const output = { ...INITIAL_RATES };
  for (const c of EUROPEAN_CURRENCIES) {
    output[c.code] = c.code === "SEK" ? 1 : boundedNumber(input[c.code], { ...LIMITS.rate, fallback: INITIAL_RATES[c.code] });
  }
  return output;
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

function bindInput(id, key, limit) {
  const el = document.getElementById(id);
  el.value = settings[key];

  el.addEventListener("input", () => {
    const rawValue = parseNumber(el.value, settings[key]);
    settings[key] = rawValue;
    save();
    calculate();
  });

  el.addEventListener("blur", () => {
    settings[key] = boundedNumber(el.value, limit);
    el.value = settings[key];
    save();
    calculate();
  });
}

function setupCurrencySelect() {
  const select = document.getElementById("currency");
  select.replaceChildren();

  for (const c of EUROPEAN_CURRENCIES) {
    const option = document.createElement("option");
    option.value = c.code;
    option.textContent = `${c.code} – ${c.name}`;
    select.appendChild(option);
  }

  select.value = settings.currency;
  select.addEventListener("change", () => {
    const allowedCurrencies = new Set(EUROPEAN_CURRENCIES.map((c) => c.code));
    settings.currency = allowedCurrencies.has(select.value) ? select.value : DEFAULTS.currency;
    save();
    calculate();
  });
}

function setupManualRates() {
  const container = document.getElementById("manualRates");
  container.replaceChildren();

  for (const c of EUROPEAN_CURRENCIES) {
    const label = document.createElement("label");
    label.textContent = `${c.code} – ${c.name}`;

    const input = document.createElement("input");
    input.type = "number";
    input.min = "0.000001";
    input.max = "1000";
    input.step = "0.000001";
    input.inputMode = "decimal";
    input.value = rates[c.code];
    input.disabled = c.code === "SEK";

    input.addEventListener("input", () => {
      rates[c.code] = parseNumber(input.value, rates[c.code]);
      settings.rateSource = "Manuellt ändrade kurser";
      save();
      calculate();
    });

    input.addEventListener("blur", () => {
      rates[c.code] = c.code === "SEK" ? 1 : boundedNumber(input.value, { ...LIMITS.rate, fallback: INITIAL_RATES[c.code] });
      input.value = rates[c.code];
      save();
      calculate();
    });

    label.appendChild(input);
    container.appendChild(label);
  }
}

function findObservationValue(data) {
  const stack = [{ value: data, depth: 0 }];
  let visited = 0;

  while (stack.length > 0) {
    const { value, depth } = stack.pop();
    visited += 1;

    if (visited > MAX_API_PARSE_NODES) {
      throw new Error("API-svaret var för stort.");
    }

    if (!value || typeof value !== "object" || depth > MAX_API_PARSE_DEPTH) {
      continue;
    }

    if (!Array.isArray(value)) {
      const keys = Object.keys(value);
      const valueKey = keys.find((k) => ["value", "Value", "observationValue", "ObservationValue"].includes(k));

      if (valueKey) {
        const observationValue = parseNumber(value[valueKey], NaN);
        if (Number.isFinite(observationValue) && observationValue > 0 && observationValue < 1000) {
          const dateKey = keys.find((k) => ["date", "Date", "observationDate", "ObservationDate", "period", "Period"].includes(k));
          return { value: observationValue, date: dateKey ? String(value[dateKey]).slice(0, 40) : "" };
        }
      }
    }

    const children = Array.isArray(value) ? value : Object.values(value);
    for (const child of children) {
      stack.push({ value: child, depth: depth + 1 });
    }
  }

  throw new Error("Kunde inte tolka API-svaret.");
}

async function fetchWithTimeout(url, options = {}, timeoutMs = API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(options.headers || {})
      }
    });
    return response;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function fetchRiksbankRate(seriesId) {
  const safeSeriesId = String(seriesId).toLowerCase().replace(/[^a-z0-9]/g, "");
  const url = `https://api.riksbank.se/swea/v1/Observations/Latest/${safeSeriesId}`;
  const response = await fetchWithTimeout(url);
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
      updated[currency] = boundedNumber(result.value, { ...LIMITS.rate, fallback: rates[currency] || INITIAL_RATES[currency] });
      if (result.date) dates.push(result.date);
    } catch {
      failed.push(currency);
    }
  }));

  if (Object.keys(updated).length > 0) {
    rates = sanitizeRates({ ...rates, ...updated, SEK: 1 });
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
  settings = sanitizeSettings(settings);
  rates = sanitizeRates(rates);

  const currency = settings.currency;
  const currencyRate = rates[currency] || 1;
  const pricePerKwh = boundedNumber(settings.pricePerKwh, LIMITS.pricePerKwh);
  const sekPerKwh = pricePerKwh * currencyRate;

  const from = boundedNumber(settings.fromSoc, LIMITS.fromSoc);
  const to = boundedNumber(settings.toSoc, LIMITS.toSoc);
  const delta = Math.max(0, to - from);
  const battery = boundedNumber(settings.usableBatteryKwh, LIMITS.usableBatteryKwh);
  const consumption = boundedNumber(settings.consumptionKwh100, LIMITS.consumptionKwh100);

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

  bindInput("pricePerKwh", "pricePerKwh", LIMITS.pricePerKwh);
  bindInput("fromSoc", "fromSoc", LIMITS.fromSoc);
  bindInput("toSoc", "toSoc", LIMITS.toSoc);
  bindInput("usableBatteryKwh", "usableBatteryKwh", LIMITS.usableBatteryKwh);
  bindInput("consumptionKwh100", "consumptionKwh100", LIMITS.consumptionKwh100);

  document.getElementById("fetchRatesBtn").addEventListener("click", fetchRates);
  document.getElementById("resetBtn").addEventListener("click", resetAll);

  calculate();
}

init();
