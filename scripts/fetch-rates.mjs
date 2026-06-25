import { writeFile, readFile } from "node:fs/promises";

const RIKSBANK_GROUP_URL = "https://api.riksbank.se/swea/v1/Observations/Latest/ByGroup/130";

const SERIES_TO_CURRENCY = {
  SEKEURPMI: "EUR",
  SEKDKKPMI: "DKK",
  SEKNOKPMI: "NOK",
  SEKGBPPMI: "GBP",
  SEKCHFPMI: "CHF",
  SEKPLNPMI: "PLN",
  SEKCZKPMI: "CZK",
  SEKHUFPMI: "HUF",
  SEKRONPMI: "RON",
  SEKBGNPMI: "BGN",
  SEKISKPMI: "ISK",
  SEKTRYPMI: "TRY"
};

const FALLBACK_RATES = {
  EUR: 10.8485,
  DKK: 1.45183,
  NOK: 0.94,
  GBP: 12.75,
  CHF: 11.55,
  PLN: 2.55,
  CZK: 0.44,
  HUF: 0.028,
  RON: 2.18,
  BGN: 5.55,
  ISK: 0.078,
  TRY: 0.34,
  RSD: 0.093,
  BAM: 5.55,
  MKD: 0.176,
  ALL: 0.11,
  MDL: 0.60,
  UAH: 0.26,
  SEK: 1
};

async function loadExistingRates() {
  try {
    const data = JSON.parse(await readFile("rates.json", "utf8"));
    return { ...FALLBACK_RATES, ...(data.rates || {}) };
  } catch {
    return { ...FALLBACK_RATES };
  }
}

function parseNumber(value) {
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : NaN;
}

async function fetchRiksbankGroup() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(RIKSBANK_GROUP_URL, {
      signal: controller.signal,
      headers: { Accept: "application/json" }
    });

    if (!response.ok) throw new Error(`Riksbanken API returned HTTP ${response.status}`);
    const data = await response.json();

    if (!Array.isArray(data)) throw new Error("Unexpected Riksbanken API response format.");
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

const rates = await loadExistingRates();
const observations = await fetchRiksbankGroup();

const updated = [];
const dates = [];

for (const observation of observations) {
  const seriesId = String(observation.seriesId || "").toUpperCase();
  const currency = SERIES_TO_CURRENCY[seriesId];
  if (!currency) continue;

  const value = parseNumber(observation.value);
  if (Number.isFinite(value) && value > 0 && value < 1000) {
    rates[currency] = value;
    updated.push(currency);
    if (observation.date) dates.push(String(observation.date).slice(0, 40));
  }
}

rates.SEK = 1;

const expected = Object.values(SERIES_TO_CURRENCY);
const failed = expected.filter((currency) => !updated.includes(currency));
const uniqueDates = [...new Set(dates)].filter(Boolean);

const payload = {
  source: "Riksbanken API via GitHub Actions. Övriga valutor använder manuella/sparade standardvärden.",
  date: uniqueDates.length === 1 ? uniqueDates[0] : uniqueDates.slice(0, 3).join(" / "),
  updatedAt: new Date().toISOString(),
  rates,
  failed
};

await writeFile("rates.json", JSON.stringify(payload, null, 2) + "\n", "utf8");

if (failed.length > 0) {
  console.warn(`Finished with fallback values for: ${failed.join(", ")}`);
}

console.log(`rates.json updated. Updated currencies: ${updated.join(", ")}`);
