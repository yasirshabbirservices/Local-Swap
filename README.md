# Local-Swap

A lightweight browser extension (Chrome Manifest V3) for web developers that instantly jumps between equivalent pages on different environments — local dev, staging, and production — without manually editing URLs.

![Manifest Version](https://img.shields.io/badge/manifest-v3-blue)
![Framework](https://img.shields.io/badge/framework-vanilla%20JS-yellow)
![License](https://img.shields.io/badge/license-MIT-green)

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

Then press the extension icon (or `Alt+Shift+S`) on **any** page. Local-Swap swaps the hostname and navigates you to the twin environment — preserving the **exact path, query parameters, and hash fragment**:

```
https://your-app.com/dashboard/users?tab=active#settings
        ↓  one click  ↓
http://localhost:3000/dashboard/users?tab=active#settings
```

Press again to swap back. Works in both directions for every mapping.

## Features

- ⚡ **One-click / one-keystroke environment swap** — no URL editing, no copy-paste
- 🔁 **Bidirectional rules** — a single mapping works both ways
- 🔗 **Full URL preservation** — path, query string, and hash survive the swap untouched
- 💾 **Persistent rules** — mappings are stored with `chrome.storage.sync` and follow you across browser sessions (and devices, if you're signed into Chrome)
- 🌐 **`www.` tolerance** — `www.example.com` and `example.com` match the same rule
- 🧠 **Smart scheme inference** — `localhost`, `*.localhost`, and IP addresses default to `http://`; everything else to `https://`
- ⌨️ **Keyboard shortcut** — `Alt+Shift+S` (configurable at `chrome://extensions/shortcuts`)
- 🚫 **Honest feedback** — a red badge appears on the icon for 2 seconds when the current site has no mapping, instead of failing silently
- 🎨 **Custom themes** — all colors are CSS custom properties in one `:root` block; swap the palette to re-skin the whole UI

## Tech Stack

Vanilla JavaScript, HTML, and CSS. No frameworks, no build step, no dependencies — the entire extension is a handful of readable files.

## Project Structure

```
local-swap/
├── manifest.json      # MV3 configuration (permissions, commands, options page)
├── background.js      # Service worker: URL swap logic + click/shortcut handlers
├── options.html       # Options page UI (rule manager)
├── options.js         # Options page logic (storage read/write, validation)
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## Installation (Developer Mode)

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the project folder.
5. (Optional) Pin Local-Swap to the toolbar via the puzzle-piece menu.

## Usage

### Adding a mapping

1. Right-click the Local-Swap icon → **Options** (or open it via `chrome://extensions` → Local-Swap → **Extension options**).
2. Enter two hostnames — one per environment. Ports are supported and required for local servers (e.g. `localhost:5173`). You can paste full URLs; the scheme and path are stripped automatically.
3. Click **+ Add mapping**.

Example pair:

| Environment A | Environment B |
| --- | --- |
| `myapp.com` | `localhost:3000` |

### Swapping

- **Click the extension icon** on any page whose hostname matches a mapping (either side of it), **or**
- Press **`Alt+Shift+S`**.

The tab navigates to the mapped environment with path, query, and hash intact. No mapping for the current site? You'll see a red ✕ badge on the icon for 2 seconds.

### Managing rules

All mappings are listed on the options page with a delete button per rule. Reverse duplicates are rejected automatically (mapping `A ⇄ B` makes `B ⇄ A` unnecessary).

## Permissions

| Permission | Why it's needed |
| --- | --- |
| `activeTab` | Read the current tab's URL and navigate it, only in response to your explicit click/shortcut gesture |
| `storage` | Persist mapping rules via `chrome.storage.sync` |
| `tabs` | Access `tab.url` reliably (including after browser restarts) and perform the navigation |

No remote code, no analytics, no network requests — your rules never leave your browser's sync storage.

## How It Works

```
icon click / Alt+Shift+S
        │
        ▼
read active tab URL ──► normalize hostname (lowercase, strip "www.")
        │
        ▼
lookup in stored rules (match source OR destination)
        │
        ├── no match ──► red ✕ badge for 2s, done
        │
        ▼
rebuild URL: new host + inferred scheme,
copy pathname / search / hash verbatim
        │
        ▼
chrome.tabs.update(tab.id, { url })
```

Hostnames are normalized at save time and lookup time, so `WWW.Example.COM` pasted from anywhere still matches. URL components are reassigned via the `URL` API (`url.search`, `url.hash`) rather than string concatenation, so encoded characters are never mangled.

## Customizing the Theme

Every color lives in `:root` at the top of `options.html`:

```css
:root {
  --bg-color: #121212;
  --text-color: #e0e0e0;
  --card-bg: #1e1e1e;
  --border-color: #333333;
  --header-bg: #ff7e3a;
  --button-bg: #ff7e3a;
  --button-hover: #e66c2c;
  --status-good: #9caf88;
  --status-missing: #f44336;
  --status-info: #ffffff;
}
```

Edit these tokens to re-skin the entire options page. If you change `--status-missing`, mirror it in the badge color inside `background.js`.

## Roadmap

- [ ] Per-rule scheme override (force `http` or `https` explicitly)
- [ ] Rule import/export as JSON
- [ ] Optional "swap on hover-preview" via context menu entry
- [ ] Firefox (MV2-compatible) port

## Contributing

Issues and pull requests are welcome. Keep it vanilla — no build tooling or frameworks, so anyone can read and audit the whole codebase in five minutes.

## License

[MIT](LICENSE)
