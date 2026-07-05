# Stega — designkoncept

Tävla med dina steg: mot alla, mot din åldersgrupp eller genom att utmana
vänner. Det interaktiva designkonceptet med skärmmockups finns som artefakt:
<https://claude.ai/code/artifact/0d9c9983-652c-4ed2-8f21-b231a9b960da>

## Designprinciper

1. **Siffran först.** Dagens steg är alltid störst på skärmen. Allt annat —
   ligor, utmaningar, streaks — är sekundärt och nås på ett tryck.
2. **Tävling i tre lägen.** Alla, åldersgrupp och vänner är samma lista med
   ett filter, inte tre vyer att lära sig.
3. **Positiv rivalitet.** Visa alltid avståndet till nästa placering
   ("2 293 steg från förstaplatsen") — ett mål man kan gå ikapp ikväll,
   inte en förlust.

## Palett — "granskog och ledmarkering"

Grundtonen är gran: lugn och naturlig. Signalfärgen är samma orange som
märker vandringsleder i svenska skogar — den betyder alltid "här händer
tävlingen". Medaljfärgerna används enbart för placering 1–3.

| Token     | Ljust läge | Mörkt läge | Roll |
| --------- | ---------- | ---------- | ---- |
| Gran      | `#1E4D3B`  | `#5E9A7C`  | Primär — rubriker, motståndarens bana |
| Ledorange | `#E8590F`  | `#F0692B`  | Accent — din progress, aktiv flik, streak |
| Björk     | `#F7F8F5`  | —          | Ljus bakgrund |
| Skymning  | —          | `#131D17`  | Mörk bakgrund |
| Mossa     | `#6B8F71`  | `#7BA183`  | Sekundär — avatarer, stödfärg |
| Pallen    | guld `#C99A2C` · silver `#9AA5A0` · brons `#B0713E` | | Endast rank 1–3 |

Alla tokens bor i `src/constants/theme.ts` och konsumeras via
`useTheme()` — inga hårdkodade färger i skärmarna.

## Typografi

Plattformens systemtypsnitt (SF Pro på iOS, Roboto på Android): appen känns
hemma på båda, laddar inget och följer användarens textstorlek. Rubriker i
vikt 800. Alla stegtal sätts med tabulära siffror (`tabular-nums`) och tunt
mellanslag som tusentalsavgränsare — "8 432" — via `formatSteps()` i
`src/lib/format.ts`.

## Informationsarkitektur

Fyra flikar, fyra jobb:

| Flik | Jobb |
| ---- | ---- |
| **Idag** | Hur går det idag? Dagsring, statistik, aktiva utmaningar |
| **Tävla** | Topplistorna — Alla / åldersgrupp / Vänner × Idag / Vecka / Månad |
| **Utmana** | Skapa utmaning: Flest steg · Först till målet · Dagligt mål |
| **Profil** | Dagsmål, datakällor, konto |

Pågående utmaningar öppnas som egen skärm (`utmaning/[id]`) med
banor-mot-mållinjen-visualisering och prognos ("framme om ca 3 dagar").

## Kvar att designa

- Onboarding — behörighet till hälsodata är det kritiska ögonblicket
- Tomma tillstånd ("inga vänner ännu", "inga utmaningar")
- Notisdesign (pepp, "Erik gick om dig", vunnen utmaning)
- App-ikon och splash (nuvarande är Expo-mallens platshållare)
