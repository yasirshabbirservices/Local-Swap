/** background.js — MV3 service worker for Local-Swap. */

const STORAGE_KEY = "rules";
const errorBadgeTabs = new Set(); // track tabs showing temporary error badge

/** Scheme inference: localhost / IPs → http, everything else → https. */
function inferScheme(host) {
  const name = host.split(":")[0];
  const isLocal =
    name === "localhost" ||
    name.endsWith(".localhost") ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(name) ||
    name === "::1";
  return isLocal ? "http" : "https";
}

/** Normalized host from a URL object: lowercase, no leading "www.". */
function normalizedHostOf(url) {
  return url.hostname.toLowerCase().replace(/^www\./, "");
}

/** Find a rule matching the current host, in either direction. */
function findRule(rules, currentHost) {
  for (const rule of rules) {
    if (rule.active === false) continue;
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

/**
 * Update badge to indicate if the current tab's host is mapped.
 * Skip if an error badge is temporarily shown.
 */
async function updateBadgeForTab(tabId) {
  if (errorBadgeTabs.has(tabId)) return; // don't override error badge

  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab?.url) return clearBadge(tabId);
    if (!tab.url.startsWith("http://") && !tab.url.startsWith("https://")) {
      return clearBadge(tabId);
    }

    const currentUrl = new URL(tab.url);
    const currentHost = normalizedHostOf(currentUrl);

    const data = await chrome.storage.sync.get(STORAGE_KEY);
    const rules = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
    const match = findRule(rules, currentHost);

    if (match) {
      // Show green checkmark
      chrome.action.setBadgeBackgroundColor({ color: "#4CAF50", tabId });
      chrome.action.setBadgeText({ text: "✓", tabId });
    } else {
      clearBadge(tabId);
    }
  } catch {
    clearBadge(tabId);
  }
}

function clearBadge(tabId) {
  chrome.action.setBadgeText({ text: "", tabId });
}

/** Show a temporary red error badge for 2 seconds, then restore mapping indicator. */
function showErrorBadge(tabId) {
  errorBadgeTabs.add(tabId);
  chrome.action.setBadgeBackgroundColor({ color: "#f44336", tabId });
  chrome.action.setBadgeText({ text: "✕", tabId });

  setTimeout(() => {
    errorBadgeTabs.delete(tabId);
    // After error expires, update to the correct indicator
    updateBadgeForTab(tabId);
  }, 2000);
}

/** Core swap logic. */
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

  const match = findRule(rules, currentHost);
  if (!match) {
    showErrorBadge(tab.id);
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

// ---- Event Listeners ----

chrome.action.onClicked.addListener((tab) => {
  trySwap(tab);
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== "swap-environment") return;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) trySwap(tabs[0]);
  });
});

// When a tab becomes active, update its badge.
chrome.tabs.onActivated.addListener(({ tabId }) => {
  updateBadgeForTab(tabId);
});

// When a tab's URL changes, update its badge.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    updateBadgeForTab(tabId);
  }
});

// When rules are changed in the options page, update the active tab's badge.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes[STORAGE_KEY]) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) updateBadgeForTab(tabs[0].id);
    });
  }
});

// Initialise: set badge for the currently active tab when the service worker starts.
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]) updateBadgeForTab(tabs[0].id);
});