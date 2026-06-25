# BMW laddkostnadskalkylator

Statisk GitHub Pages-app för att räkna laddkostnad för BMW i-modeller i Europa.

## Filer i repositoryt

- `index.html` – sidans HTML
- `style.css` – design
- `app.js` – kalkylen och app-logiken
- `cars.json` – BMW-modeller, batteristorlek och EVDB-baserad standardförbrukning
- `rates.json` – valutakurser som appen läser
- `manifest.json` – PWA-inställningar
- `sw.js` – service worker / offline-cache
- `icon-192.png` och `icon-512.png` – PWA-ikoner
- `scripts/fetch-rates.mjs` – hämtar valutakurser från Riksbankens API
- `.github/workflows/update-rates.yml` – GitHub Actions-workflow som uppdaterar `rates.json`

## Valutakurser

Appen hämtar inte Riksbanken direkt i användarens webbläsare. I stället uppdaterar GitHub Actions `rates.json` från Riksbanken. Knappen **Hämta kurser** i appen läser sedan publicerad `rates.json`.

För att köra manuellt:

1. Gå till **Actions**
2. Välj **Update exchange rates**
3. Klicka **Run workflow**

## Förbrukningsvärden

Standardförbrukning per BMW-modell baseras på EV Database där värde finns. Användaren kan alltid ändra förbrukningen manuellt.
