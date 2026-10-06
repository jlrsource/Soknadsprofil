import type { FieldKey } from "@soknadsprofil/shared";

/**
 * Plattform-spesifikke regler. `fields` overstyrer den generiske klassifiseringen
 * for elementer som matcher selektoren. Plattformer uten `fields` gjenkjennes
 * (vises i popupen), men bruker den generiske motoren.
 *
 * Selektorene bør verifiseres mot ekte skjemaer jevnlig, siden plattformene endrer seg.
 */
export interface SiteAdapter {
  id: string;
  name: string;
  hosts: RegExp;
  fields?: { selector: string; key: FieldKey }[];
}

export const ADAPTERS: SiteAdapter[] = [
  {
    id: "workday",
    name: "Workday",
    hosts: /(^|\.)myworkdayjobs\.com$|(^|\.)myworkday\.com$/,
    fields: [
      { selector: '[data-automation-id="legalNameSection_firstName"]', key: "firstName" },
      { selector: '[data-automation-id="legalNameSection_lastName"]', key: "lastName" },
      { selector: '[data-automation-id="email"]', key: "email" },
      { selector: '[data-automation-id="phone-number"]', key: "phone" },
      { selector: '[data-automation-id="addressSection_addressLine1"]', key: "address" },
      { selector: '[data-automation-id="addressSection_city"]', key: "city" },
      { selector: '[data-automation-id="addressSection_postalCode"]', key: "postalCode" },
      { selector: '[data-automation-id="linkedinQuestion"]', key: "linkedin" },
      { selector: 'input[type="file"][data-automation-id="file-upload-input-ref"]', key: "cvFile" },
    ],
  },
  {
    id: "greenhouse",
    name: "Greenhouse",
    hosts: /(^|\.)greenhouse\.io$/,
    fields: [
      { selector: "#first_name", key: "firstName" },
      { selector: "#last_name", key: "lastName" },
      { selector: "#email", key: "email" },
      { selector: "#phone", key: "phone" },
      { selector: 'input[type="file"]#resume', key: "cvFile" },
      { selector: 'input[type="file"]#cover_letter', key: "coverLetterFile" },
    ],
  },
  {
    id: "lever",
    name: "Lever",
    hosts: /(^|\.)lever\.co$/,
    fields: [
      { selector: 'input[name="name"]', key: "fullName" },
      { selector: 'input[name="email"]', key: "email" },
      { selector: 'input[name="phone"]', key: "phone" },
      { selector: 'input[name="org"]', key: "currentEmployer" },
      { selector: 'input[name="location"]', key: "city" },
      { selector: 'input[name="urls[LinkedIn]"]', key: "linkedin" },
      { selector: 'input[name="urls[GitHub]"]', key: "github" },
      { selector: 'input[name="urls[Portfolio]"]', key: "website" },
      { selector: 'input[type="file"][name="resume"]', key: "cvFile" },
    ],
  },
  { id: "webcruiter", name: "Webcruiter", hosts: /(^|\.)webcruiter\.(no|com)$/ },
  { id: "jobylon", name: "Jobylon", hosts: /(^|\.)jobylon\.com$/ },
  { id: "teamtailor", name: "Teamtailor", hosts: /(^|\.)teamtailor\.com$/ },
  { id: "reachmee", name: "ReachMee", hosts: /(^|\.)reachmee\.com$/ },
  { id: "easycruit", name: "Easycruit", hosts: /(^|\.)easycruit\.com$/ },
];

export function findAdapter(hostname: string): SiteAdapter | null {
  return ADAPTERS.find((a) => a.hosts.test(hostname)) ?? null;
}
