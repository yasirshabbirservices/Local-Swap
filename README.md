# Local-Swap

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Install-blue)](https://chromewebstore.google.com/detail/jloijjnoiielijinemcjomklklabhbhc)

A lightweight, open-source browser extension (Chrome Manifest V3) for web developers that instantly jumps between equivalent pages on different environments — local dev, staging, and production — without manually editing URLs.

**Install now from the [Chrome Web Store](https://chromewebstore.google.com/detail/jloijjnoiielijinemcjomklklabhbhc).**

## The Problem

You're debugging a page at:

```
https://your-app.com/dashboard/users?tab=active#settings
```

and need to check the same view on your local machine. Normally you'd copy the URL, edit the domain, fix the port, and hope you didn't drop the query string or hash along the way.

## The Solution

Define a mapping once:

```
your-app.com  ⇄  localhost:3000
```

Then press the extension icon (or `Alt+Shift+S`) on any page. Local-Swap swaps the hostname and navigates you to the twin environment — preserving the exact path, query parameters, and hash fragment:

```
https://your-app.com/dashboard/users?tab=active#settings
        ↓  one click  ↓
http://localhost:3000/dashboard/users?tab=active#settings
```

Press again to swap back. Works in both directions for every mapping.

## Features

- ⚡ **One-click / one-keystroke** environment swap — no URL editing, no copy-paste
- 🔁 **Bidirectional rules** — a single mapping works both ways automatically
- 🔗 **Full URL preservation** — path, query string, and hash survive the swap untouched
- 🏷️ **Custom Labels** — assign friendly names to your mappings (e.g., "Authentication API", "Frontend V2")
- 🎚️ **Toggle States** — temporarily enable or disable individual mappings using clean toggle switches without deleting them
- 📤 **Import & Export** — backup or share your environment mappings with your team using 1-click JSON exports/imports
- 💾 **Persistent rules** — mappings are stored with `chrome.storage.sync` and follow you across browser sessions
- 🌐 **www. tolerance** — `www.example.com` and `example.com` match the same rule
- 🧠 **Smart scheme inference** — `localhost`, `*.localhost`, and IP addresses default to `http://`; everything else to `https://`
- ⌨️ **Keyboard shortcut** — `Alt+Shift+S` (configurable at `chrome://extensions/shortcuts`)
- 🚫 **Honest feedback** — a red badge appears on the icon for 2 seconds when the current site has no mapping, instead of failing silently
- 🎨 **Custom themes** — colors are styled cleanly via CSS variables inspired by the brand palette

## Tech Stack

Vanilla JavaScript, HTML, and CSS. No frameworks, no build step, no dependencies — the entire extension is a handful of readable files.

## Project Structure

```
local-swap/
├── manifest.json      # MV3 configuration (permissions, commands, options page)
├── background.js      # Service worker: URL swap logic + click/shortcut handlers
├── options.html       # Options page UI (rule manager, toggles, import/export)
├── options.js         # Options page logic (storage sync, validation, import/export)
├── PRIVACY.md         # Privacy policy
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## Installation

### From the Chrome Web Store (recommended)

1. Visit the [Local-Swap listing](https://chromewebstore.google.com/detail/jloijjnoiielijinemcjomklklabhbhc).
2. Click **Add to Chrome**.
3. (Optional) Pin Local-Swap to the toolbar via the puzzle-piece menu.

### Developer Mode (for testing or development)

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the project folder.
5. (Optional) Pin Local-Swap to the toolbar via the puzzle-piece menu.

## Usage

### Adding a mapping

- Right-click the Local-Swap icon → **Options** (or open it via `chrome://extensions` → Local-Swap → Extension options).
- (Optional) Provide a custom label to identify your mapping.
- Enter two hostnames — one per environment. Ports are required for local servers (e.g. `localhost:5173`).
- Click **+ Add Mapping**.

### Swapping

- Click the extension icon on any page whose hostname matches an active mapping, **or**
- Press `Alt+Shift+S`.

The tab navigates to the mapped environment with path, query, and hash intact. No mapping for the current site? You'll see a red ✕ badge on the icon for 2 seconds.

### Managing rules

- **Toggling:** Use the toggle switch next to any rule to temporarily disable it without deleting it. Inactive rules are ignored during swaps.
- **Exporting/Importing:** Use the top action bar buttons in the options page to backup your settings or share standard team configurations via JSON files.

## Permissions Justifications (for Chrome Web Store)

When publishing, you'll need to provide justifications for each permission. Here are ready‑to‑copy explanations:

| Permission | Justification |
|------------|---------------|
| **`activeTab`** | The extension reads the URL of the currently active tab **only** when the user clicks the toolbar icon or presses the keyboard shortcut. It then navigates that same tab to the swapped URL. This is a direct user‑initiated action and no data is collected or sent anywhere. |
| **`storage`**   | The extension stores user‑created environment mappings (hostname pairs) and their active/inactive states using `chrome.storage.sync`. This allows the rules to persist across browser sessions and sync across signed‑in Chrome browsers. No personal data is stored — only hostnames that the user explicitly adds. |
| **`tabs`**      | The extension needs `tabs` permission to: (1) listen for tab activation and URL changes so it can update the badge icon (green checkmark or no badge) to indicate if the current page matches a mapping; (2) actually perform the navigation to the swapped URL. This is used solely for UI feedback and the core swap functionality. |

### Single Purpose Description

*"Local‑Swap lets web developers instantly switch between equivalent pages on different environments (local, staging, production) by swapping the hostname while preserving the full path, query string, and hash. The extension is purely a developer productivity tool and does not collect, transmit, or store any personal information."*

## Privacy

Local‑Swap does **not** collect, store, or transmit any personal data. All configuration (mapping rules) is stored locally in your browser's sync storage. No network requests are made except for the normal page navigation that you initiate. For full details, see [PRIVACY.md](https://github.com/yasirshabbirservices/Local-Swap/blob/53c691dcfaff8fadddfdfc594db63d08485eb173/privacy.md).

## Contributing

Issues and pull requests are welcome. This is a fully open-source project — keep it vanilla and lightweight!

## License

MIT
```