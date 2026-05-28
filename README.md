# BMW iX1 laddkalkyl Europa

En enkel laddkalkyl för BMW iX1-ägare i Sverige som kör i Europa.

Appen räknar om laddpris från europeiska valutor till SEK och visar:

- total laddkostnad
- pris per kWh i SEK
- kostnad per 100 km
- pris per mil
- energi att ladda utifrån SoC
- ungefärlig körsträcka utifrån aktuell förbrukning

## Publicering på GitHub Pages

1. Lägg filerna `index.html`, `style.css` och `app.js` i repositoryts root.
2. Gå till **Settings → Pages**.
3. Välj **Deploy from a branch**.
4. Välj branch **main** och folder **/root**.
5. Klicka **Save**.

Sidan publiceras normalt efter någon minut på:

`https://<github-användare>.github.io/bmw-ix1-laddkalkyl/`

## Valutakurser

Appen försöker hämta vanliga valutor från Riksbankens öppna API. Om hämtning inte fungerar används sparade eller manuellt angivna kurser i webbläsarens localStorage.

## Begränsningar

Beräkningarna är ungefärliga. Laddförluster, kortpåslag, parkeringsavgifter, blockeringstaxa och operatörernas prisändringar kan påverka slutkostnaden.
