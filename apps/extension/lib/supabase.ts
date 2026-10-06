import { browser } from "wxt/browser";
import { createClient, type SupportedStorage } from "@supabase/supabase-js";

/** Lagrer Supabase-sesjonen i browser.storage.local (service workers har ikke localStorage). */
const chromeStorage: SupportedStorage = {
  getItem: async (key) => ((await browser.storage.local.get(key))[key] as string | undefined) ?? null,
  setItem: async (key, value) => browser.storage.local.set({ [key]: value }),
  removeItem: async (key) => browser.storage.local.remove(key),
};

export const supabase = createClient(import.meta.env.WXT_SUPABASE_URL, import.meta.env.WXT_SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: chromeStorage,
    storageKey: "soknadsprofil-auth",
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
