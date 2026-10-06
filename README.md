# SøknadsProfil

Bygg én god profil, og fyll ut jobbsøknader på alle plattformer med ett klikk.

```
apps/web/          Next.js 16: profilbyggeren (Supabase-auth, dashboard, redigering)
apps/extension/    Chrome MV3-extension (WXT): fyller ut søknadsskjemaer
packages/shared/   Profilskjema (zod), feltordbok, klassifiserer og verdioppslag
supabase/          SQL-migrasjoner (tabeller, RLS, get_full_profile(), lagringsbøtte)
```

## Kom i gang

### 1. Supabase
1. Lag et prosjekt på [supabase.com](https://supabase.com).
2. Kjør `supabase/migrations/20261006000000_init.sql` i SQL Editor, eller bruk `npx supabase db push`.
3. Under **Authentication → URL Configuration**: legg til `http://localhost:3000/auth/callback` som redirect-URL.
4. Valgfritt: slå på Google under **Authentication → Providers**.

### 2. Web-appen
```bash
cp apps/web/.env.example apps/web/.env.local   # fyll inn URL, publishable key og secret key
npm install
npm run dev:web                                # http://localhost:3000
```

### 3. Extensionen
```bash
cp apps/extension/.env.example apps/extension/.env   # samme URL og publishable key
npm run dev:ext                                      # åpner Chrome med extensionen lastet
```
Alternativt kjører du `npm run build -w @soknadsprofil/extension` og laster inn `apps/extension/.output/chrome-mv3` som upakket extension i `chrome://extensions`.

Logg inn i web-appen, gå til **Chrome-extension** og trykk **Koble til**.

## Slik virker det

- **Utfylling**: extensionen ber bare om `activeTab` + `scripting`. Når du klikker «Fyll ut» (eller trykker Alt+Shift+F), injiseres `filler.js` i alle rammer på fanen. Den skanner felt, også i shadow DOM, og bygger en beskrivelse av hvert felt fra label, aria, placeholder, name, id og nærliggende tekst. Beskrivelsen klassifiseres mot ordboken i `packages/shared/src/fieldDictionary.ts`. Verdiene settes via den native setteren, slik at React og andre rammeverk registrerer endringen. Felt som allerede har en verdi, røres ikke. Ingenting sendes inn.
- **Plattform-adaptere** (`apps/extension/lib/engine/adapters.ts`): selektorer som overstyrer klassifiseringen. Workday, Greenhouse og Lever har regler. Webcruiter, Jobylon, Teamtailor, ReachMee og Easycruit gjenkjennes, men bruker foreløpig den generiske motoren.
- **Tilkobling**: extensionen får sin egen Supabase-sesjon. Web-appen lager en engangskode (`/api/extension/token`), og extensionen bytter den med `verifyOtp`. Vi deler ikke tokens, fordi Supabase roterer refresh-tokens, og to klienter med samme token ville logget hverandre ut.

## Tester
```bash
npm test          # klassifiserer, verdioppslag og utfyllingsmotor (jsdom, inkl. React-kontrollerte felt)
npm run typecheck
```
Testskjemaer for manuell testing ligger i `apps/extension/fixtures/`.
