import { LANGUAGE_LEVELS, SKILL_LEVELS } from "./schema";
import { z } from "zod";

/**
 * Det Claude skal trekke ut av en CV. Alle felt er nullable: modellen skal
 * returnere null i stedet for å gjette når noe ikke står i CV-en.
 * Feltnavnene følger databasekolonnene, så forslagene kan lagres direkte.
 */
const text = (description: string) => z.string().nullable().describe(description);
const date = (description: string) =>
  z.string().nullable().describe(`${description} Format YYYY-MM-DD. Bruk 01 for ukjent dag og 01-01 for ukjent måned. null hvis ukjent.`);

export const cvExtractionSchema = z.object({
  personal: z.object({
    first_name: text("Fornavn (inkludert mellomnavn)."),
    last_name: text("Etternavn."),
    email: text("E-postadresse."),
    phone: text("Telefonnummer slik det står, med landskode hvis oppgitt."),
    address: text("Gateadresse uten postnummer og sted."),
    postal_code: text("Postnummer."),
    city: text("Poststed eller by."),
    country: text("Land, på norsk (f.eks. «Norge»)."),
    birth_date: date("Fødselsdato."),
    linkedin_url: text("Full LinkedIn-URL."),
    website_url: text("Personlig nettside eller portefølje."),
    github_url: text("Full GitHub-URL."),
    headline: text("Kort profesjonell tittel, f.eks. «Frontend-utvikler». Bare hvis CV-en angir en tittel eller rolle tydelig."),
    summary: text("Profil- eller sammendragstekst fra CV-en, ordrett eller lett redigert. null hvis CV-en ikke har en."),
  }),
  experiences: z
    .array(
      z.object({
        title: z.string().describe("Stillingstittel."),
        employer: z.string().describe("Arbeidsgiver."),
        location: text("Sted."),
        start_date: date("Startdato."),
        end_date: date("Sluttdato. null hvis pågående."),
        is_current: z.boolean().describe("true hvis stillingen er pågående (f.eks. «nå», «d.d.», «present»)."),
        description: text("Ansvar og oppgaver, kort og på originalspråket."),
      }),
    )
    .describe("Arbeidserfaring, nyeste først. Ikke ta med verv eller frivillig arbeid her."),
  volunteering: z
    .array(
      z.object({
        role: z.string().describe("Rolle eller verv."),
        organization: z.string().describe("Organisasjon."),
        location: text("Sted."),
        start_date: date("Startdato."),
        end_date: date("Sluttdato. null hvis pågående."),
        is_current: z.boolean(),
        description: text("Kort beskrivelse."),
      }),
    )
    .describe("Verv, tillitsverv, styreverv og frivillig arbeid."),
  educations: z
    .array(
      z.object({
        school: z.string().describe("Skole eller lærested."),
        degree: text("Grad eller nivå, f.eks. «Bachelor», «Master», «Vitnemål videregående»."),
        field_of_study: text("Fagfelt eller studieretning."),
        start_date: date("Startdato."),
        end_date: date("Sluttdato eller forventet ferdig."),
        grade: text("Karaktersnitt hvis oppgitt."),
        description: text("Kort beskrivelse, f.eks. oppgave eller fordypning."),
      }),
    )
    .describe("Formell utdanning, nyeste først."),
  certifications: z
    .array(
      z.object({
        name: z.string().describe("Navn på kurs eller sertifisering."),
        issuer: text("Utsteder."),
        issued_date: date("Dato."),
        url: text("Lenke hvis oppgitt."),
      }),
    )
    .describe("Kurs, sertifiseringer og sertifikater (f.eks. førerkort)."),
  skills: z
    .array(
      z.object({
        name: z.string().describe("Ferdighet, kort (1–3 ord)."),
        level: z.enum(SKILL_LEVELS).nullable().describe("Nivå bare hvis CV-en sier det."),
      }),
    )
    .describe("Faglige ferdigheter, verktøy og teknologier. Ikke språk."),
  languages: z
    .array(
      z.object({
        language: z.string().describe("Språk, på norsk (f.eks. «Engelsk»)."),
        spoken_level: z.enum(LANGUAGE_LEVELS).nullable(),
        written_level: z.enum(LANGUAGE_LEVELS).nullable(),
      }),
    )
    .describe("Språkferdigheter. native = morsmål, fluent = flytende, conversational = godt, basic = grunnleggende."),
});

export type CvExtraction = z.infer<typeof cvExtractionSchema>;

export const SUPPORTED_CV_TYPES = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;
