import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  vite: () => ({ plugins: [tailwindcss()] }),
  manifest: {
    name: "SøknadsProfil",
    description: "Fyll ut jobbsøknader med ett klikk, med profilen din fra SøknadsProfil.",
    // activeTab + scripting: vi får bare tilgang til en fane når brukeren selv ber om det.
    permissions: ["storage", "activeTab", "scripting"],
    commands: {
      "fill-page": {
        suggested_key: { default: "Alt+Shift+F" },
        description: "Fyll ut søknaden på denne siden",
      },
    },
    action: { default_title: "SøknadsProfil" },
  },
});
