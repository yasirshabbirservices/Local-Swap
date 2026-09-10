# Privacy Policy for Local‑Swap

**Last updated:** 2026-09-10

Local‑Swap is a browser extension designed to help developers quickly swap between environment hostnames. This privacy policy explains how we handle data.

## Data Collection

Local‑Swap **does not collect, store, or transmit any personal information, browsing history, or other user data**.

- **No analytics** – we do not use any tracking or analytics services.
- **No remote code** – the extension runs entirely locally; no code is fetched from the internet.
- **No network requests** – the extension only navigates your browser to URLs you explicitly request via a click or keyboard shortcut.

## Data Storage

- **Mappings:** The hostname pairs (e.g., `example.com` ↔ `localhost:3000`) that you create are stored using Chrome's `chrome.storage.sync` API. This storage is local to your browser and may be synced across your signed‑in Chrome devices if you enable Chrome Sync. The data is never sent to us or any third party.
- **Badge state:** A temporary badge (✓ or ✕) is shown on the extension icon; this is rendered by the browser and is not persisted or transmitted.

## Permissions

We request the minimum permissions necessary for the extension to function:

- `activeTab` – to read and update the current tab's URL only when you click the icon or press the shortcut.
- `storage` – to save your environment mappings.
- `tabs` – to listen for tab changes and update the badge, and to navigate to the swapped URL.

All permissions are used exclusively for the core functionality described above.

## Third‑Party Sharing

We do not share, sell, or transfer any data to third parties.

## Changes to This Policy

If we update this policy, we will revise the "Last updated" date. We encourage you to review it periodically.

## Contact

If you have questions about this privacy policy, please open an issue on the [GitHub repository](https://github.com/your-username/local-swap).

---

This extension complies with the Chrome Web Store Developer Program Policies.