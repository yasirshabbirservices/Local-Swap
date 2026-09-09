/**
 * background.js — MV3 service worker for Local-Swap (COMPLETE file).
 *
 * Icon click or Alt+Shift+S → swap the active tab to its mapped twin,
 * preserving path, query string, and hash.
 */

const STORAGE_KEY = "rules";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Scheme inference: localhost / IPs → http, everything else → https. */
function inferScheme(host) {
  const name = host.split(":")[0]; // strip port
  const isLocal =
    name === "localhost" ||
    name.endsWith(".localhost") ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(name) || // IPv4
    name === "::1";
  return isLocal ? "http" : "https";
}

/** Normalized host from a URL object: lowercase, no leading "www.". */
function normalizedHostOf(url) {
  return url.hostname.toLowerCase().replace(/^www\./, "");
}

/**
 * Find a rule matching the current host, in either direction.
 * Returns { rule, direction: "forward" | "reverse" } or null.
 */
function findRule(rules, currentHost) {
  for (const rule of rules) {
    if (rule.source === currentHost) return { rule, direction: "forward" };
    if (rule.destination === currentHost) return { rule, direction: "reverse" };
  }
  return null;
}

/** Build the swapped URL preserving pathname, search, and hash exactly. */
function buildSwappedUrl(currentUrl, targetHost, scheme) {
  const target = new URL(`${scheme}://${targetHost}`);
  target.pathname = currentUrl.pathname;
  target.search = currentUrl.search;
  target.hash = currentUrl.hash;
  return target.toString();
}

/* ------------------------------------------------------------------ */
/*  Core swap routine                                                  */
/* ------------------------------------------------------------------ */

async function trySwap(tab) {
  if (!tab?.url) return;
  if (!tab.url.startsWith("http://") && !tab.url.startsWith("https://")) return;

  let currentUrl;
  try {
    currentUrl = new URL(tab.url);
  } catch {
    return;
  }

  const currentHost = normalizedHostOf(currentUrl);

  let rules = [];
  try {
    const data = await chrome.storage.sync.get(STORAGE_KEY);
    rules = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
  } catch {
    return;
  }

  console.log("[Local-Swap] on:", currentHost, "| rules:", rules); // ← diagnostic, remove later

  const match = findRule(rules, currentHost);

  if (!match) {
    // Red "✕" badge for 2s so you know WHY nothing happened.
    chrome.action.setBadgeBackgroundColor({ color: "#ff6b6b", tabId: tab.id });
    chrome.action.setBadgeText({ text: "✕", tabId: tab.id });
    setTimeout(() => chrome.action.setBadgeText({ text: "", tabId: tab.id }), 2000);
    return;
  }

  const targetHost =
    match.direction === "forward" ? match.rule.destination : match.rule.source;

  const swapped = buildSwappedUrl(currentUrl, targetHost, inferScheme(targetHost));
  if (swapped === currentUrl.toString()) return;

  try {
    await chrome.tabs.update(tab.id, { url: swapped });
  } catch (err) {
    console.warn("[Local-Swap] Navigation failed:", err.message);
  }
}

/* ------------------------------------------------------------------ */
/*  Triggers                                                           */
/* ------------------------------------------------------------------ */

chrome.action.onClicked.addListener((tab) => {
  trySwap(tab);
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== "swap-environment") return;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) trySwap(tabs[0]);
  });
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.action.setBadgeText({ text: "", tabId });
});