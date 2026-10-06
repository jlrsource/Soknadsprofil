# SøknadsProfil

Jobbsøkere må legge inn de samme opplysningene på nytt i hver søknadsportal: navn, kontaktinfo, erfaring, utdanning og CV. SøknadsProfil samler alt dette på ett sted og fyller det ut for deg.

Løsningen har to deler:

- **Web-appen** er stedet der du bygger og pleier profilen din. Her legger du inn personalia, erfaring, verv, utdanning, ferdigheter, dokumenter og standardsvar. En «profilstyrke» viser hvor komplett profilen er og hva du bør gjøre neste gang.
- **Chrome-extensionen** henter profilen og fyller ut søknadsskjemaet på siden du står på. Du trykker én knapp (eller Alt+Shift+F), ser over resultatet og sender inn selv.

## Oppbygging

Prosjektet er et monorepo med npm workspaces:

```
SøknadsProfil/
├─ apps/
│  ├─ web/          Web-appen (Next.js 16, React 19, Tailwind 4)
│  └─ extension/    Chrome-extensionen (WXT, Manifest V3, React)
├─ packages/
│  └─ shared/       Felles kode for web-appen og extensionen
└─ supabase/
   └─ migrations/   Databaseskjema (SQL)
```

```
            ┌──────────────┐                 ┌───────────────────┐
            │   Web-app    │                 │ Chrome-extension  │
            │  (Next.js)   │                 │      (WXT)        │
            └──────┬───────┘                 └─────────┬─────────┘
  leser og skriver │                                   │ get_full_profile()
     profilen      │       ┌───────────────────┐       │ + nedlasting av CV
                   └──────►│     Supabase      │◄──────┘
                           │ Auth · Postgres · │
                           │     Storage       │
                           └───────────────────┘
       Begge bruker packages/shared for profilformat og feltgjenkjenning
```

### `packages/shared`: felles kjerne

Det eneste stedet profilformatet er definert. Begge appene importerer herfra, så de kan aldri komme ut av takt.

| Fil | Innhold |
|---|---|
| [schema.ts](packages/shared/src/schema.ts) | Zod-skjemaer og typer for hele profilen (`FullProfile`) og hver seksjon |
| [fields.ts](packages/shared/src/fields.ts) | Felttypene extensionen kan gjenkjenne (`firstName`, `email`, `cvFile` …) |
| [fieldDictionary.ts](packages/shared/src/fieldDictionary.ts) | Nøkkelord på norsk og engelsk per felttype, og ord som utelukker en type |
| [classify.ts](packages/shared/src/classify.ts) | Bestemmer hvilken felttype et skjemafelt er, med en konfidens fra 0 til 1 |
| [resolve.ts](packages/shared/src/resolve.ts) | Henter riktig verdi fra profilen for en felttype |
| [completeness.ts](packages/shared/src/completeness.ts) | Beregner profilstyrken og foreslår neste steg |
| [bridge.ts](packages/shared/src/bridge.ts) | Meldingsformatet mellom web-appen og extensionen |

### `apps/web`: web-appen

| Rute | Funksjon |
|---|---|
| `/` | Forside med en animert demo av utfyllingen |
| `/login` | Innlogging med e-postlenke eller Google (Supabase Auth) |
| `/app` | Oversikt med profilstyrke, sjekkliste og nøkkeltall |
| `/app/kom-i-gang` | Veiviser i tre steg for nye brukere |
| `/app/personalia` | Navn, kontaktinfo og lenker (lagres automatisk) |
| `/app/erfaring` | Arbeidserfaring, verv og frivillig arbeid, utdanning og kurs |
| `/app/ferdigheter` | Ferdigheter med nivå, språk og referanser |
| `/app/dokumenter` | Opplasting av CV, søknadsbrev og vitnemål, og valg av standard-CV |
| `/app/svar` | Bibliotek med standardsvar («Lønnskrav», «Når kan du begynne?» …) |
| `/app/extension` | Kobler extensionen til kontoen |

Viktige filer:

- [proxy.ts](apps/web/src/proxy.ts) fornyer innloggingen ved hver forespørsel og sender brukere som ikke er innlogget, fra `/app` til `/login`.
- [profile-store.tsx](apps/web/src/lib/profile-store.tsx) laster hele profilen én gang og lagrer endringer optimistisk, altså med en gang i grensesnittet før serveren har svart. Alle sidene under `/app` bruker den.
- [list-section.tsx](apps/web/src/components/app/list-section.tsx) er en gjenbrukbar listeseksjon med legg til, rediger, slett og dra-og-slipp. Erfaring, verv, utdanning, kurs, språk og referanser bruker den.
- [api/extension/token](apps/web/src/app/api/extension/token/route.ts) lager engangskoden som brukes når extensionen kobles til (se under).

### `apps/extension`: Chrome-extensionen

| Fil | Funksjon |
|---|---|
| [popup/App.tsx](apps/extension/entrypoints/popup/App.tsx) | Popupen: innloggingsstatus, «Fyll ut denne siden» og resultat |
| [background.ts](apps/extension/entrypoints/background.ts) og [background-logic.ts](apps/extension/lib/background-logic.ts) | Supabase-sesjon, profil-cache, nedlasting av filer og styring av utfyllingen |
| [filler.ts](apps/extension/entrypoints/filler.ts) | Utfyllingsmotoren som injiseres i søknadssiden |
| [engine/dom.ts](apps/extension/lib/engine/dom.ts) | Skanner, beskriver, fyller ut og markerer skjemafelt |
| [engine/engine.ts](apps/extension/lib/engine/engine.ts) | Kobler skanning, gjenkjenning og utfylling sammen |
| [engine/adapters.ts](apps/extension/lib/engine/adapters.ts) | Egne regler for kjente søknadsplattformer |
| [bridge.content.ts](apps/extension/entrypoints/bridge.content.ts) | Kjører bare på web-appen og videresender meldinger til bakgrunnsscriptet |

### `supabase/migrations`: databasen

- Én tabell per seksjon: `profiles`, `experiences`, `volunteering`, `educations`, `certifications`, `skills`, `languages`, `references`, `saved_answers` og `documents`.
- Alle tabeller har tilgangsregler (RLS), så hver bruker bare kan lese og endre sine egne rader.
- Funksjonen `get_full_profile()` returnerer hele profilen som én JSON. Extensionen henter alt med ett kall.
- Dokumentene ligger i den private lagringsbøtta `documents`, under `{bruker-id}/…`.

## Slik fungerer utfyllingen

1. Du klikker «Fyll ut denne siden» i popupen eller trykker Alt+Shift+F.
2. Bakgrunnsscriptet henter den nyeste profilen. Er du uten nett, brukes siste lagrede versjon.
3. `filler.js` injiseres i alle rammer på fanen. Extensionen ber bare om `activeTab` og `scripting`, så den har ingen tilgang til sider før du selv klikker.
4. **Skanning:** motoren finner alle `input`-, `textarea`-, `select`- og redigerbare felt, også inne i shadow DOM.
5. **Beskrivelse:** for hvert felt samles label, `aria-label`, placeholder, `name`, `id`, `autocomplete` og tekst like ved.
6. **Gjenkjenning:** beskrivelsen sammenlignes med ordboken. `autocomplete`-attributter gir sikrest treff, deretter label, placeholder og attributter. Er siden en kjent plattform, går plattformens egne regler foran.
7. **Filer:** hvis siden har et felt for CV eller søknadsbrev, lastes standarddokumentet ned fra Supabase og legges ved.
8. **Utfylling:** verdiene settes på en måte som React, Angular og Vue registrerer. Felt som allerede har en verdi, endres ikke, med mindre du krysser av for «Overskriv».
9. **Markering:** sikre felt får grønn ramme og usikre gul. Popupen viser hva som ble fylt ut.

Skjemaet sendes aldri inn automatisk.

## Tilkobling mellom web-appen og extensionen

Extensionen får sin egen Supabase-sesjon i stedet for å dele web-appens. Supabase bytter ut refresh-tokenet hver gang en sesjon fornyes, så to klienter med samme token ville logget hverandre ut.

1. Du trykker «Koble til» på `/app/extension`.
2. Serveren lager en engangskode for brukeren din med `admin.generateLink`. Det sendes ingen e-post.
3. Web-appen sender koden til extensionen med `window.postMessage`, via content scriptet som kjører på web-appens domene.
4. Extensionen bytter koden mot en egen sesjon med `verifyOtp` og lagrer den i `chrome.storage`.

Når du endrer profilen i web-appen, får extensionen beskjed om å hente den på nytt.

## Kjøre prosjektet

Du trenger Node.js og et Supabase-prosjekt.

1. Kjør SQL-filene i `supabase/migrations/` i rekkefølge i Supabase sin SQL Editor, eller bruk `npx supabase db push`.
2. Under **Authentication → URL Configuration** i Supabase: sett Site URL til `http://localhost:3000` og legg til `http://localhost:3000/**` som redirect-URL.
3. Kopier `apps/web/.env.example` til `apps/web/.env.local`, og `apps/extension/.env.example` til `apps/extension/.env`. Fyll inn nøklene fra **Project Settings → API Keys**.
4. Start:

```bash
npm install
npm run dev:web    # web-appen på http://localhost:3000
npm run dev:ext    # åpner Chrome med extensionen lastet
```

Logg inn i web-appen, bygg profilen, gå til **Chrome-extension** og trykk **Koble til**.

## Tester

```bash
npm test           # feltgjenkjenning, verdioppslag og utfyllingsmotoren (jsdom)
npm run typecheck
```

Testene for utfyllingsmotoren kjører blant annet mot et ekte React-skjema, for å sjekke at React registrerer verdiene. Testsider for manuell testing ligger i [apps/extension/fixtures/](apps/extension/fixtures/).

## Status og begrensninger

- Workday, Greenhouse og Lever har egne regler. Webcruiter, Jobylon, Teamtailor, ReachMee og Easycruit gjenkjennes, men bruker foreløpig den generelle gjenkjenningen.
- Extensionen fyller ut én oppføring per seksjon. Den klikker ikke på «Legg til» for flere jobber eller utdanninger.
- Egendefinerte nedtrekkslister (som ikke er vanlige `<select>`) fylles ikke ut.
- Skjemaer som ligger innebygd fra et annet domene enn siden du står på, nås ikke, fordi extensionen bare har tilgang til selve fanen.
- Planlagt: AI-hjelp for usikre felt og fritekstsvar, og import av profil fra CV.
