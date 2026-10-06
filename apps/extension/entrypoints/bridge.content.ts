import { browser } from "wxt/browser";
import { BRIDGE_SOURCE_EXT, BRIDGE_SOURCE_WEB, type ExtToWebMessage, type WebToExtMessage } from "@soknadsprofil/shared";
import type { BgRequest, BgResponse, ExtState } from "@/lib/messages";

/** Kjører bare på web-appen og videresender meldinger mellom siden og bakgrunnsscriptet. */
export default defineContentScript({
  matches: [`${import.meta.env.WXT_WEB_APP_URL ?? "http://localhost:3000"}/*`],
  runAt: "document_start",
  noScriptStartedPostMessage: true,
  main() {
    type Reply = ExtToWebMessage extends infer M ? (M extends ExtToWebMessage ? Omit<M, "source"> : never) : never;
    const reply = (msg: Reply) =>
      window.postMessage({ source: BRIDGE_SOURCE_EXT, ...msg }, window.location.origin);
    const bg = <T extends BgRequest>(m: T) => browser.runtime.sendMessage(m) as Promise<BgResponse<T["type"]>>;

    window.addEventListener("message", async (e: MessageEvent) => {
      if (e.source !== window || e.origin !== window.location.origin) return;
      const data = e.data as WebToExtMessage | undefined;
      if (data?.source !== BRIDGE_SOURCE_WEB) return;

      switch (data.type) {
        case "PING": {
          const state = (await bg({ type: "GET_STATE" })) as ExtState;
          reply({ type: "PONG", version: browser.runtime.getManifest().version, connectedEmail: state.email });
          break;
        }
        case "CONNECT": {
          const res = await bg({ type: "CONNECT", tokenHash: data.tokenHash });
          reply({ type: "CONNECT_RESULT", ...res });
          break;
        }
        case "DISCONNECT":
          await bg({ type: "SIGN_OUT" });
          reply({ type: "DISCONNECT_RESULT" });
          break;
        case "PROFILE_UPDATED":
          void bg({ type: "REFRESH_PROFILE" });
          break;
      }
    });
  },
});
