# BMW laddkostnadskalkylator

En enkel laddkalkyl för BMW i-modeller för svenska förare som kör i Europa.

## Nytt i denna version

- Dropdown för BMW i-modeller
- Lokal `cars.json` med batteristorlek och föreslagen förbrukning
- Standardförbrukning baserad på EV Database där referensvärde finns
- Källa för förbrukning visas i modellinformationen i appen
- Stöd för modeller med olika batteristorlekar genom separata varianter i listan
- Egen bil / eget batteri för manuella värden
- Uppdaterad PWA-cache som även hanterar `cars.json`

## Valutakurser

Webbappen hämtar kurser från `rates.json`, inte direkt från Riksbanken i användarens webbläsare. GitHub Actions kan uppdatera `rates.json` via Riksbankens API.

## Begränsningar

Batterivärden är praktiska startvärden för laddberäkning. Föreslagen förbrukning baseras på EV Database där referensvärde finns, men verklig förbrukning varierar med hastighet, däck, väder, last och körstil.

