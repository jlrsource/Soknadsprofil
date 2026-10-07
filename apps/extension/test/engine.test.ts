import { emptyProfile, type FullProfile } from "@soknadsprofil/shared";
import { createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { classifyDocument, fillDocument } from "@/lib/engine/engine";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const profile: FullProfile = {
  ...emptyProfile(),
  personal: {
    first_name: "Kari",
    last_name: "Nordmann",
    email: "kari@example.no",
    phone: "+47 900 00 000",
    address: "Storgata 1",
    postal_code: "0155",
    city: "Oslo",
    country: "Norge",
    birth_date: "1995-04-17",
    linkedin_url: "https://linkedin.com/in/kari",
  },
  experiences: [{ employer: "Fjord AS", title: "UX-designer", is_current: true, sort_order: 0 }],
  saved_answers: [{ question: "Lønnskrav", answer: "Etter avtale", tags: ["lønnskrav"] }],
};

const fill = (overwrite = false) => fillDocument({ profile, files: {}, overwrite }, document);
const value = (sel: string) => (document.querySelector(sel) as HTMLInputElement).value;

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("fillDocument – norsk skjema (Webcruiter-lignende)", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form>
        <div class="row"><label for="a1">Fornavn *</label><input id="a1" name="ctl00$Fornavn"></div>
        <div class="row"><label for="a2">Etternavn *</label><input id="a2"></div>
        <div class="row"><label for="a3">E-post</label><input id="a3" type="email"></div>
        <div class="row"><label for="a4">Bekreft e-post</label><input id="a4" type="email"></div>
        <div class="row"><span>Mobil</span><input id="a5" type="tel"></div>
        <div class="row"><label>Gateadresse <input id="a6"></label></div>
        <div class="row"><label for="a7">Postnr.</label><input id="a7"></div>
        <div class="row"><label for="a8">Poststed</label><input id="a8"></div>
        <div class="row"><label for="a9">Land</label>
          <select id="a9"><option value="">Velg land</option><option value="SE">Sverige</option><option value="NO">Norge</option></select></div>
        <div class="row"><label for="a10">Fødselsdato</label><input id="a10" placeholder="dd.mm.åååå"></div>
        <div class="row"><label for="a11">Lønnskrav</label><input id="a11"></div>
        <div class="row"><label for="a12">Har du førerkort?</label><input id="a12"></div>
        <input type="hidden" name="token" value="x">
        <button type="submit">Send</button>
      </form>`;
  });

  it("fyller ut gjenkjente felt", async () => {
    const report = await fill();
    expect(value("#a1")).toBe("Kari");
    expect(value("#a2")).toBe("Nordmann");
    expect(value("#a3")).toBe("kari@example.no");
    expect(value("#a4")).toBe("kari@example.no");
    expect(value("#a5")).toBe("+47 900 00 000");
    expect(value("#a6")).toBe("Storgata 1");
    expect(value("#a7")).toBe("0155");
    expect(value("#a8")).toBe("Oslo");
    expect(value("#a9")).toBe("NO");
    expect(value("#a10")).toBe("17.04.1995");
    expect(value("#a11")).toBe("Etter avtale");
    expect(value("#a12")).toBe("");
    expect(report.fields.filter((f) => f.status === "filled").length).toBeGreaterThanOrEqual(10);
  });

  it("markerer utfylte felt", async () => {
    await fill();
    expect(document.querySelector("#a1")!.getAttribute("data-soknadsprofil")).toBe("filled");
  });

  it("overskriver ikke felt som allerede har verdi", async () => {
    (document.querySelector("#a1") as HTMLInputElement).value = "Ola";
    await fill();
    expect(value("#a1")).toBe("Ola");
    await fill(true);
    expect(value("#a1")).toBe("Kari");
  });
});

describe("fillDocument – engelsk skjema med attributter", () => {
  it("bruker name/id/autocomplete når label mangler", async () => {
    document.body.innerHTML = `
      <input name="applicant[firstName]">
      <input id="last_name">
      <input autocomplete="email" name="x1">
      <input placeholder="LinkedIn profile URL">
      <input type="date" aria-label="Date of birth">
      <textarea aria-label="Current company"></textarea>`;
    await fill();
    expect(value('[name="applicant[firstName]"]')).toBe("Kari");
    expect(value("#last_name")).toBe("Nordmann");
    expect(value('[name="x1"]')).toBe("kari@example.no");
    expect(value('[placeholder="LinkedIn profile URL"]')).toBe("https://linkedin.com/in/kari");
    expect(value('[type="date"]')).toBe("1995-04-17");
  });

  it("finner labels via aria-labelledby", async () => {
    document.body.innerHTML = `<span id="lbl">Surname</span><input aria-labelledby="lbl" id="s">`;
    await fill();
    expect(value("#s")).toBe("Nordmann");
  });
});

describe("shadow DOM", () => {
  it("finner felt i åpne shadow roots", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    host.attachShadow({ mode: "open" }).innerHTML = `<label for="f">First name</label><input id="f">`;
    await fill();
    expect((host.shadowRoot!.getElementById("f") as HTMLInputElement).value).toBe("Kari");
  });
});

describe("adaptere", () => {
  it("bruker Lever-reglene på lever.co", () => {
    document.body.innerHTML = `<input name="name"><input name="org">`;
    const { matches, adapter } = classifyDocument(document, "jobs.lever.co");
    expect(adapter).toBe("Lever");
    expect(matches.map((m) => m.result.key)).toEqual(["fullName", "currentEmployer"]);
  });
});

describe("React-kontrollerte skjema", () => {
  it("oppdaterer React-state, ikke bare DOM-verdien", async () => {
    let state: Record<string, string> = {};
    function Form() {
      const [v, setV] = useState({ first: "", email: "" });
      state = v;
      return createElement(
        "form",
        null,
        createElement("label", { htmlFor: "rf" }, "Fornavn"),
        createElement("input", { id: "rf", value: v.first, onChange: (e: { target: { value: string } }) => setV((s) => ({ ...s, first: e.target.value })) }),
        createElement("label", { htmlFor: "re" }, "E-post"),
        createElement("input", { id: "re", value: v.email, onChange: (e: { target: { value: string } }) => setV((s) => ({ ...s, email: e.target.value })) }),
      );
    }
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => root.render(createElement(Form)));
    await act(async () => {
      await fill();
    });
    expect(state).toEqual({ first: "Kari", email: "kari@example.no" });
    root.unmount();
  });
});

describe("skjema med rader og skjulte filknapper (som i testen 7. okt)", () => {
  const row = (title: string, id: string, extra = "") => `
    <div class="row">
      <div class="head"><span class="icon"></span><h3>${title}</h3></div>
      ${extra}
      <button type="button">Last opp<input type="file" id="${id}" style="display:none"></button>
    </div>`;

  beforeEach(() => {
    document.body.innerHTML = `
      <form>
        ${row("CV *", "f-cv")}
        ${row("Bilde", "f-bilde")}
        ${row("Vitnemål *", "f-vitnemal", '<a href="#">Vitnemålsportalen</a>')}
        ${row("Annen dokumentasjon", "f-annen")}
        ${row("Video-CV", "f-video")}
        <div class="q">
          <p>Kva grad tek du? *</p>
          <div class="options">
            <label><input type="checkbox" name="g1"> Bachelor</label>
            <label><input type="checkbox" name="g2"> Master</label>
          </div>
        </div>
        <label for="studie">Kva heiter studiet ditt? *</label>
        <textarea id="studie" placeholder="Skriv inn et svar"></textarea>
        <div class="q">
          <p>Noverande studietrinn? *</p>
          <div><label><input type="checkbox" name="t1"> 1</label><label><input type="checkbox" name="t2"> 2</label></div>
        </div>
      </form>`;
  });

  it("gir hvert filfelt riktig type, og CV-en bare til CV-raden", () => {
    const { matches } = classifyDocument(document, "example.com");
    const byId = Object.fromEntries(matches.map((m) => [m.el.id, m.result.key]));
    expect(byId["f-cv"]).toBe("cvFile");
    expect(byId["f-vitnemal"]).toBe("diplomaFile");
    expect(byId["f-bilde"]).toBeUndefined();
    expect(byId["f-annen"]).toBeUndefined();
    expect(byId["f-video"]).toBeUndefined();
  });

  it("krysser av riktig grad og fyller studiet, men lar ukjente spørsmål være", async () => {
    const withEducation: FullProfile = {
      ...profile,
      educations: [{ school: "UiB", degree: "Master i informatikk", field_of_study: "Informatikk", sort_order: 0 }],
    };
    await fillDocument({ profile: withEducation, files: {}, overwrite: false }, document);
    const checked = (name: string) => (document.querySelector(`[name="${name}"]`) as HTMLInputElement).checked;
    expect(checked("g2")).toBe(true);
    expect(checked("g1")).toBe(false);
    expect(checked("t1") || checked("t2")).toBe(false);
    expect((document.querySelector("#studie") as HTMLTextAreaElement).value).toBe("Informatikk");
  });
});

describe("eneste filfelt uten tekst", () => {
  it("får CV-en som usikker", () => {
    document.body.innerHTML = `<input type="file" name="upload_1">`;
    const { matches } = classifyDocument(document, "example.com");
    expect(matches.map((m) => [m.result.key, m.result.confidence])).toEqual([["cvFile", 0.5]]);
  });

  it("får ingenting når det finnes flere filfelt", () => {
    document.body.innerHTML = `<input type="file" name="upload_1"><input type="file" name="upload_2">`;
    expect(classifyDocument(document, "example.com").matches).toHaveLength(0);
  });
});

describe("spørsmål pakket i mange lag (som «Andre spørsmål»)", () => {
  const question = (text: string, id: string) => `
    <div class="question">
      <div class="q-head"><div class="q-title"><span class="text">${text}</span><span class="req">*</span></div></div>
      <div class="q-body"><div class="field"><div class="wrap"><div class="inner"><div class="box">
        <textarea id="${id}" placeholder="Skriv inn et svar"></textarea>
      </div></div></div></div></div>
    </div>`;

  it("finner spørsmålsteksten og fyller ut", async () => {
    document.body.innerHTML = `
      <section><h2>Andre spørsmål *</h2>
        ${question("Kva stad/by er du student?", "q1")}
        ${question("Kva heiter studiestaden din? NTNU, HVL, UiB etc", "q2")}
        ${question("Kva heiter studiet ditt?", "q3")}
        ${question("Kva er din snittkarakter?", "q4")}
        ${question("Kor fekk du informasjon om campen?", "q5")}
      </section>`;
    const withEducation: FullProfile = {
      ...profile,
      educations: [{ school: "UiB", field_of_study: "Informatikk", location: "Bergen", grade: "B", sort_order: 0 }],
    };
    const report = await fillDocument({ profile: withEducation, files: {}, overwrite: false }, document);
    const v = (id: string) => (document.getElementById(id) as HTMLTextAreaElement).value;
    expect([v("q1"), v("q2"), v("q3"), v("q4")]).toEqual(["Bergen", "UiB", "Informatikk", "B"]);
    expect(v("q5")).toBe("");
    expect(report.unrecognized).toEqual(["Kor fekk du informasjon om campen?*"]);
  });
});
