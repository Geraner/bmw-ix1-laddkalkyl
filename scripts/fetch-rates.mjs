import { writeFile, readFile } from "node:fs/promises";

const SERIES = {
  EUR: "sekeurpmi",
  DKK: "sekdkkpmi",
  NOK: "seknokpmi",
  GBP: "sekgbppmi",
  CHF: "sekchfpmi",
  PLN: "sekplnpmi",
  CZK: "sekczkpmi",
  HUF: "sekhufpmi"
};

const DEFAULT_RATES = {
  EUR: 10.8485, DKK: 1.45183, NOK: 0.94, GBP: 12.75,
  CHF: 11.55, PLN: 2.55, CZK: 0.44, HUF: 0.028,
  RON: 2.18, BGN: 5.55, ISK: 0.078, TRY: 0.34,
  RSD: 0.093, BAM: 5.55, MKD: 0.176, ALL: 0.11,
  MDL: 0.60, UAH: 0.26, SEK: 1
};

async function loadExistingRates() {
  try {
    const data = JSON.parse(await readFile("rates.json", "utf8"));
    return { ...DEFAULT_RATES, ...(data.rates || {}) };
  } catch {
    return { ...DEFAULT_RATES };
  }
}

function parseNumber(value) {
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : NaN;
}

function findObservationValue(data) {
  const stack = [{ value: data, depth: 0 }];
  let visited = 0;

  while (stack.length > 0) {
    const { value, depth } = stack.pop();
    visited += 1;
    if (visited > 5000) throw new Error("API response too large");
    if (!value || typeof value !== "object" || depth > 20) continue;

    if (!Array.isArray(value)) {
      const keys = Object.keys(value);
      const valueKey = keys.find((k) => ["value", "Value", "observationValue", "ObservationValue"].includes(k));
      if (valueKey) {
        const observationValue = parseNumber(value[valueKey]);
        if (Number.isFinite(observationValue) && observationValue > 0 && observationValue < 1000) {
          const dateKey = keys.find((k) => ["date", "Date", "observationDate", "ObservationDate", "period", "Period"].includes(k));
          return { value: observationValue, date: dateKey ? String(value[dateKey]).slice(0, 40) : "" };
        }
      }
    }

    const children = Array.isArray(value) ? value : Object.values(value);
    for (const child of children) stack.push({ value: child, depth: depth + 1 });
  }
  throw new Error("Could not parse observation value");
}

async function fetchRate(seriesId) {
  const safeSeriesId = String(seriesId).toLowerCase().replace(/[^a-z0-9]/g, "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`https://api.riksbank.se/swea/v1/Observations/Latest/${safeSeriesId}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return findObservationValue(await response.json());
  } finally {
    clearTimeout(timeout);
  }
}

const rates = await loadExistingRates();
rates.SEK = 1;
const dates = [];
const failed = [];

await Promise.all(Object.entries(SERIES).map(async ([currency, seriesId]) => {
  try {
    const result = await fetchRate(seriesId);
    rates[currency] = result.value;
    if (result.date) dates.push(result.date);
  } catch (error) {
    failed.push(currency);
    console.warn(`Could not update ${currency}: ${error.message}`);
  }
}));

const uniqueDates = [...new Set(dates)].filter(Boolean);
const payload = {
  source: "Riksbanken API via GitHub Actions. Övriga valutor använder manuella/sparade standardvärden.",
  date: uniqueDates.length === 1 ? uniqueDates[0] : uniqueDates.slice(0, 3).join(" / "),
  updatedAt: new Date().toISOString(),
  rates,
  failed
};

await writeFile("rates.json", JSON.stringify(payload, null, 2) + "\n", "utf8");
console.log("rates.json updated");
