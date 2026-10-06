import { describe, expect, it } from "vitest";
import type { CvExtraction } from "./cvExtraction";
import { buildCvProposal, cleanDate, countSelected } from "./cvMerge";
import { emptyProfile, type FullProfile } from "./schema";

const emptyPersonal: CvExtraction["personal"] = {
  first_name: null, last_name: null, email: null, phone: null, address: null, postal_code: null, city: null,
  country: null, birth_date: null, linkedin_url: null, website_url: null, github_url: null, headline: null, summary: null,
};

const extraction: CvExtraction = {
  personal: { ...emptyPersonal, first_name: "Kari", last_name: "Nordmann", email: "kari@ny.no", city: "Bergen", birth_date: "1995-02-30" },
  experiences: [
    { title: "UX-designer", employer: "Fjord AS", location: "Oslo", start_date: "2021-03-01", end_date: "2023-01-01", is_current: true, description: null },
    { title: "Butikkmedarbeider", employer: "Rema 1000", location: null, start_date: "2016", end_date: null, is_current: false, description: "  " },
    { title: "Butikkmedarbeider", employer: "Rema 1000", location: null, start_date: null, end_date: null, is_current: false, description: null },
  ],
  volunteering: [{ role: "Trener", organization: "IL Brann", location: null, start_date: null, end_date: null, is_current: true, description: null }],
  educations: [],
  certifications: [],
  skills: [
    { name: "Figma", level: "expert" },
    { name: "figma ", level: null },
    { name: "React", level: null },
  ],
  languages: [{ language: "Engelsk", spoken_level: "fluent", written_level: "fluent" }],
};

const profile: FullProfile = {
  ...emptyProfile(),
  personal: { first_name: "Kari", email: "kari@gammel.no" },
  experiences: [{ title: "ux-designer", employer: "Fjord AS", is_current: true, sort_order: 0 }],
  skills: [{ name: "React", sort_order: 0 }],
};

describe("buildCvProposal", () => {
  const p = buildCvProposal(extraction, profile);

  it("foreslår bare personalia som er nye eller ulike", () => {
    const keys = p.personal.map((s) => s.key);
    expect(keys).not.toContain("first_name"); // likt
    expect(keys).toEqual(expect.arrayContaining(["last_name", "email", "city"]));
  });

  it("forhåndsvelger tomme felt, men ikke felt som ville blitt overskrevet", () => {
    expect(p.personal.find((s) => s.key === "last_name")?.selected).toBe(true);
    const email = p.personal.find((s) => s.key === "email")!;
    expect(email.selected).toBe(false);
    expect(email.current).toBe("kari@gammel.no");
  });

  it("forkaster ugyldige datoer", () => {
    expect(p.personal.find((s) => s.key === "birth_date")).toBeUndefined();
    expect(p.lists.experiences[1]?.row.start_date).toBeNull();
  });

  it("markerer rader som finnes fra før og fjerner duplikater i CV-en", () => {
    expect(p.lists.experiences).toHaveLength(2);
    expect(p.lists.experiences[0]).toMatchObject({ duplicate: true, selected: false });
    expect(p.lists.experiences[1]).toMatchObject({ duplicate: false, selected: true });
    expect(p.lists.skills.map((s) => [s.row.name, s.duplicate])).toEqual([
      ["Figma", false],
      ["React", true],
    ]);
  });

  it("nullstiller sluttdato for pågående stillinger og tomme tekster", () => {
    expect(p.lists.experiences[0]?.row.end_date).toBeNull();
    expect(p.lists.experiences[1]?.row.description).toBeNull();
  });

  it("teller valgte forslag", () => {
    // last_name, city + Rema-jobb + verv + Figma + Engelsk
    expect(countSelected(p)).toBe(6);
  });
});

describe("cleanDate", () => {
  it("godtar bare ekte ISO-datoer", () => {
    expect(cleanDate("2021-03-01")).toBe("2021-03-01");
    expect(cleanDate("2021-02-30")).toBeNull();
    expect(cleanDate("mars 2021")).toBeNull();
    expect(cleanDate(null)).toBeNull();
  });
});
