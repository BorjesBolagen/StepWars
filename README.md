# Stega 👟

Tävla med dina steg — mot alla, mot din åldersgrupp eller genom att utmana
vänner: flest steg under en period, först till målet, längsta svit av
klarade dagsmål — eller en filmvandring, som Vägen till Mordor med filmens
platser som delmål.

**Status:** grundskelett. Alla fyra flikar och utmaningsvyn är byggda enligt
[designkonceptet](docs/design.md) och kör på mockdata. Nästa steg är
inloggning och steghämtning.

## Teknikval

| Del | Val | Varför |
| --- | --- | ------ |
| App | [Expo](https://expo.dev) (React Native + TypeScript) | En kodbas → riktig app på både iPhone och Android. Krävs för att läsa steg: webbläsare kommer inte åt Apple Hälsa/HealthKit. |
| Navigering | expo-router | Filbaserad routing, typade rutter |
| Backend | [Supabase](https://supabase.com) | Auth, Postgres med Row Level Security, realtid för topplistor, Edge Functions för t.ex. "avgör vinnare vid midnatt". EU-region (GDPR — hälsodata). |
| Stegdata | HealthKit (iOS) / Health Connect (Android) | Hämtas automatiskt — ingen manuell inmatning |
| Bygge & distribution | EAS Build | App Store / Google Play utan egen Mac/byggserver |

## Kom igång

```bash
npm install
npx expo start
```

Skanna QR-koden med [Expo Go](https://expo.dev/go) på din telefon, eller
tryck `w` för webbläsarversionen (utan stegdata). Appen kör på mockdata
(`src/lib/mock.ts`) tills Supabase är konfigurerat.

### Koppla Supabase (när det är dags)

1. Skapa ett Supabase-projekt i EU-region.
2. Kör `supabase/migrations/00001_init.sql` (via `supabase db push` eller
   SQL-editorn i Studio).
3. Kopiera `.env.example` till `.env` och fyll i URL + anon-nyckel.

### Utvecklingsbygge med EAS (för Android-steg och pushnotiser)

Expo Go räcker för det mesta, men två saker kräver ett riktigt
utvecklingsbygge: **Health Connect** (Android-steg, klockor) och
**pushnotiser**. Bygget görs i molnet med [EAS](https://expo.dev/eas) —
gratis konto räcker:

```bash
npm install -g eas-cli
eas login                # ditt Expo-konto
eas init                 # kopplar projektet (skriver projectId till app.json)
eas build --profile development --platform android
```

Installera .apk-filen från bygglänken på telefonen och kör sedan
`npx expo start` som vanligt — utvecklingsbygget ersätter Expo Go.
För iOS: `--platform ios` (kräver Apple Developer-konto, 99 USD/år).
På Android behöver telefonen appen
[Health Connect](https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata)
(inbyggd i Android 14+).

## Projektstruktur

```
src/
  app/                 Skärmar (expo-router)
    (tabs)/            Idag · Tävla · Utmana · Profil
    utmaning/[id].tsx  Pågående utmaning (banor mot mållinjen)
  components/          Progressring, topplisterader, kort, segmentväljare …
  constants/theme.ts   Designtokens — palett, typografi, spacing
  hooks/               useTheme (ljust/mörkt läge)
  lib/                 mock-data, formatering, Supabase-klient
supabase/
  migrations/          Datamodell + Row Level Security + fuskskydd
docs/
  design.md            Designkoncept och principer
```

## Datamodell (kort)

`profiles` (namn, födelseår → åldersgrupp, dagsmål) · `friendships`
(förfrågan → accepterad) · `daily_steps` (en rad per användare och dag,
flaggas automatiskt vid orimliga värden) · `challenges` +
`challenge_participants` (de tre utmaningstyperna; en duell och en gruppliga
är samma sak med olika antal deltagare). Publika topplistor exponeras enbart
aggregerat via vyn `leaderboard_weekly` — aldrig rådata per dag.

## Vägkarta

- [x] Designkoncept och tokens
- [x] App-skelett: fyra flikar + utmaningsvy på mockdata
- [x] Datamodell med RLS och fuskskydd
- [x] Filmvandringar med delmål (Mordor, Caminon, PCT, Stand by Me, Forrest Gump)
- [x] Inloggning (Supabase Auth): konto med namn + födelseår, utloggning, demoläge utan nycklar
- [x] Steghämtning v1: telefonens stegräknare (iOS, fungerar i Expo Go) + synk av senaste 7 dagarna
- [x] Topplistor mot riktig data: Alla + åldersgrupp läser leaderboard_weekly
- [x] Vänsystem: sök på namn, skicka/acceptera förfrågningar, Vänner-liga i Tävla
- [x] Utmaningar end-to-end: skapa i Utmana, bjud in vänner, anta/tacka nej, ställning på riktiga steg
- [x] Vinnaravgörande: pg_cron avgör utmaningar var 15:e minut, vinnaren visas i appen
- [x] Pushnotiser via pg_net + Expo push: utmanad, vänförfrågan, accepterad vän, pepp, vinst
- [x] Health Connect på Android + EAS-byggkonfiguration (kör `eas init` + `eas build`, se ovan)
- [ ] HealthKit på iOS (steg från Apple Watch — pedometern tar bara telefonens egna)
- [ ] Bakgrundssynk av steg (idag synkas de när appen öppnas)
- [ ] App-ikon, splash, TestFlight / intern testning
