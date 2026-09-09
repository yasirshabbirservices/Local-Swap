const STORAGE_KEY = "rules";

const ruleList  = document.getElementById("ruleList");
const srcInput  = document.getElementById("srcHost");
const dstInput  = document.getElementById("dstHost");
const btnAdd    = document.getElementById("btnAdd");
const feedback  = document.getElementById("feedback");

function normalizeHost(raw) {
  if (!raw || typeof raw !== "string") return null;
  let s = raw.trim().toLowerCase();
  if (s.includes("://")) {
    try { s = new URL(s).host; } catch { return null; }
  } else {
    s = s.split(/[/?#]/)[0];
  }
  s = s.replace(/^www\./, "");
  if (!/^[a-z0-9][a-z0-9.\-]*(:[0-9]{1,5})?$/.test(s)) return null;
  return s;
}

async function loadRules() {
  try {
    const data = await chrome.storage.sync.get(STORAGE_KEY);
    return Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
  } catch { return []; }
}

async function saveRules(rules) {
  await chrome.storage.sync.set({ [STORAGE_KEY]: rules });
}

function showFeedback(message, type) {
  feedback.textContent = message;
  feedback.className = `feedback ${type}`;
  if (message) setTimeout(() => { feedback.textContent = ""; }, 3000);
}

function renderRules(rules) {
  ruleList.innerHTML = "";
  if (rules.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No mappings yet — add your first pair below.";
    ruleList.appendChild(empty);
    return;
  }
  rules.forEach((rule, index) => {
    const row = document.createElement("div");
    row.className = "rule-row";
    const pair = document.createElement("div");
    pair.className = "rule-pair";
    const src = document.createElement("span");
    src.className = "rule-host"; src.textContent = rule.source; src.title = rule.source;
    const arrow = document.createElement("span");
    arrow.className = "arrow"; arrow.textContent = "⇄";
    const dst = document.createElement("span");
    dst.className = "rule-host"; dst.textContent = rule.destination; dst.title = rule.destination;
    pair.append(src, arrow, dst);
    const del = document.createElement("button");
    del.className = "btn-delete"; del.textContent = "✕"; del.title = "Delete mapping";
    del.addEventListener("click", async () => {
      const current = await loadRules();
      current.splice(index, 1);
      await saveRules(current);
      renderRules(current);
    });
    row.append(pair, del);
    ruleList.appendChild(row);
  });
}

btnAdd.addEventListener("click", async () => {
  const source = normalizeHost(srcInput.value);
  const destination = normalizeHost(dstInput.value);

  if (!source || !destination) {
    showFeedback("⚠ One or both hostnames look invalid.", "error");
    return;
  }
  if (source === destination) {
    showFeedback("⚠ Source and destination are the same.", "error");
    return;
  }

  const rules = await loadRules();
  const duplicate = rules.some(
    (r) =>
      (r.source === source && r.destination === destination) ||
      (r.source === destination && r.destination === source)
  );
  if (duplicate) {
    showFeedback("⚠ That mapping (or its reverse) already exists.", "error");
    return;
  }

  rules.push({ source, destination });
  await saveRules(rules);
  srcInput.value = "";
  dstInput.value = "";
  showFeedback("✓ Mapping saved.", "ok");
  renderRules(rules);
  srcInput.focus();
});

[srcInput, dstInput].forEach((el) =>
  el.addEventListener("keydown", (e) => { if (e.key === "Enter") btnAdd.click(); })
);

(async () => {
  renderRules(await loadRules());
  srcInput.focus();
})();