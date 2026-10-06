/**
 * Meldinger mellom web-appen og extensionens content script via window.postMessage.
 * Content scriptet kjører bare på web-appens domene og videresender til bakgrunnsscriptet.
 */
export const BRIDGE_SOURCE_WEB = "soknadsprofil-web";
export const BRIDGE_SOURCE_EXT = "soknadsprofil-ext";

export type WebToExtMessage =
  | { source: typeof BRIDGE_SOURCE_WEB; type: "PING" }
  | { source: typeof BRIDGE_SOURCE_WEB; type: "CONNECT"; tokenHash: string }
  | { source: typeof BRIDGE_SOURCE_WEB; type: "DISCONNECT" }
  | { source: typeof BRIDGE_SOURCE_WEB; type: "PROFILE_UPDATED" };

export type ExtToWebMessage =
  | { source: typeof BRIDGE_SOURCE_EXT; type: "PONG"; version: string; connectedEmail: string | null }
  | { source: typeof BRIDGE_SOURCE_EXT; type: "CONNECT_RESULT"; ok: boolean; email?: string; error?: string }
  | { source: typeof BRIDGE_SOURCE_EXT; type: "DISCONNECT_RESULT" };
