"use client";

import { BRIDGE_SOURCE_EXT, BRIDGE_SOURCE_WEB, type ExtToWebMessage, type WebToExtMessage } from "@soknadsprofil/shared";

type Payload = WebToExtMessage extends infer M ? (M extends { source: string } ? Omit<M, "source"> : never) : never;

export function postToExtension(msg: Payload) {
  window.postMessage({ source: BRIDGE_SOURCE_WEB, ...msg } satisfies WebToExtMessage, window.location.origin);
}

/** Send en melding og vent på et svar av en gitt type. */
export function requestExtension<T extends ExtToWebMessage["type"]>(
  msg: Payload,
  replyType: T,
  timeoutMs = 1500,
): Promise<Extract<ExtToWebMessage, { type: T }> | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve(null);
    }, timeoutMs);
    function onMessage(e: MessageEvent) {
      if (e.source !== window || e.origin !== window.location.origin) return;
      const data = e.data as ExtToWebMessage | undefined;
      if (data?.source !== BRIDGE_SOURCE_EXT || data.type !== replyType) return;
      clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      resolve(data as Extract<ExtToWebMessage, { type: T }>);
    }
    window.addEventListener("message", onMessage);
    postToExtension(msg);
  });
}

/** Be extensionen hente profilen på nytt etter en endring (ignoreres hvis den ikke er installert). */
let timer: ReturnType<typeof setTimeout> | undefined;
export function notifyProfileUpdated() {
  clearTimeout(timer);
  timer = setTimeout(() => postToExtension({ type: "PROFILE_UPDATED" }), 800);
}
