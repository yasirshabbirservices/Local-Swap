const STORAGE_KEY = "rules";

const ruleList  = document.getElementById("ruleList");
const ruleLabel = document.getElementById("ruleLabel");
const srcInput  = document.getElementById("srcHost");
const dstInput  = document.getElementById("dstHost");
const btnAdd    = document.getElementById("btnAdd");
const feedback  = document.getElementById("feedback");

const btnExport = document.getElementById("btnExport");
const btnImport = document.getElementById("btnImport");
const fileInput = document.getElementById("fileInput");

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
    const rules = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
    // Map backwards compatibility for rules created before 'active' flag existed
    return rules.map(r => ({ ...r, active: r.active !== false }));
  } catch { return []; }
}

async function saveRules(rules) {
  await chrome.storage.sync.set({ [STORAGE_KEY]: rules });
}

function showFeedback(message, type) {
  feedback.textContent = message;
  feedback.className = `feedback ${type}`;
  if (message) setTimeout(() => { feedback.textContent = ""; }, 3500);
}

function renderRules(rules) {
  ruleList.innerHTML = "";
  if (rules.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
      No environments mapped yet.<br/>Add your first pair below.
    `;
    ruleList.appendChild(empty);
    return;
  }
  
  rules.forEach((rule, index) => {
    const row = document.createElement("div");
    row.className = `rule-row ${rule.active ? '' : 'inactive'}`;
    
    // Header section (Label + Controls)
    const header = document.createElement("div");
    header.className = "rule-header";
    
    const label = document.createElement("span");
    label.className = "rule-label";
    label.textContent = rule.label || `Mapping #${index + 1}`;
    
    const controls = document.createElement("div");
    controls.className = "rule-controls";
    
    // Toggle Switch
    const toggleLabel = document.createElement("label");
    toggleLabel.className = "toggle-switch";
    toggleLabel.title = rule.active ? "Disable mapping" : "Enable mapping";
    const toggleInput = document.createElement("input");
    toggleInput.type = "checkbox";
    toggleInput.checked = rule.active;
    toggleInput.addEventListener("change", async (e) => {
      const current = await loadRules();
      current[index].active = e.target.checked;
      await saveRules(current);
      renderRules(current);
    });
    const slider = document.createElement("span");
    slider.className = "slider";
    toggleLabel.append(toggleInput, slider);
    
    // Delete Button
    const del = document.createElement("button");
    del.className = "btn-icon"; 
    del.title = "Delete mapping";
    del.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`;
    del.addEventListener("click", async () => {
      const current = await loadRules();
      current.splice(index, 1);
      await saveRules(current);
      renderRules(current);
    });
    
    controls.append(toggleLabel, del);
    header.append(label, controls);

    // Host Pair section
    const pair = document.createElement("div");
    pair.className = "rule-pair";
    
    const src = document.createElement("span");
    src.className = "rule-host"; src.textContent = rule.source; src.title = rule.source;
    
    const arrow = document.createElement("span");
    arrow.className = "arrow"; arrow.textContent = "⇄";
    
    const dst = document.createElement("span");
    dst.className = "rule-host"; dst.textContent = rule.destination; dst.title = rule.destination;
    
    pair.append(src, arrow, dst);
    row.append(header, pair);
    ruleList.appendChild(row);
  });
}

btnAdd.addEventListener("click", async () => {
  const source = normalizeHost(srcInput.value);
  const destination = normalizeHost(dstInput.value);
  const labelText = ruleLabel.value.trim();

  if (!source || !destination) {
    showFeedback("⚠ One or both hostnames look invalid.", "error");
    return;
  }
  if (source === destination) {
    showFeedback("⚠ Source and destination cannot be the same.", "error");
    return;
  }

  const rules = await loadRules();
  const duplicate = rules.some(
    (r) =>
      (r.source === source && r.destination === destination) ||
      (r.source === destination && r.destination === source)
  );
  
  if (duplicate) {
    showFeedback("⚠ This environment mapping already exists.", "error");
    return;
  }

  rules.push({ 
    source, 
    destination, 
    label: labelText,
    active: true 
  });
  
  await saveRules(rules);
  srcInput.value = "";
  dstInput.value = "";
  ruleLabel.value = "";
  showFeedback("✓ Mapping successfully added.", "ok");
  renderRules(rules);
  ruleLabel.focus();
});

[srcInput, dstInput, ruleLabel].forEach((el) =>
  el.addEventListener("keydown", (e) => { if (e.key === "Enter") btnAdd.click(); })
);

btnExport.addEventListener("click", async () => {
  const rules = await loadRules();
  if (rules.length === 0) {
    showFeedback("⚠ Nothing to export.", "error");
    return;
  }
  const blob = new Blob([JSON.stringify(rules, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `local-swap-config-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showFeedback("✓ Configuration exported.", "ok");
});

btnImport.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const importedRules = JSON.parse(event.target.result);
      if (!Array.isArray(importedRules)) throw new Error("Invalid format");
      
      // Basic validation of imported rules
      const validRules = importedRules.filter(r => r.source && r.destination);
      
      const currentRules = await loadRules();
      // Combine and remove exact duplicates
      const merged = [...currentRules];
      validRules.forEach(newRule => {
        const isDup = merged.some(r => r.source === newRule.source && r.destination === newRule.destination);
        if (!isDup) merged.push({ ...newRule, active: newRule.active !== false });
      });

      await saveRules(merged);
      renderRules(merged);
      showFeedback(`✓ Imported ${validRules.length} mappings.`, "ok");
    } catch (err) {
      showFeedback("⚠ Failed to parse configuration file.", "error");
    }
    fileInput.value = ""; // reset
  };
  reader.readAsText(file);
});

(async () => {
  renderRules(await loadRules());
  ruleLabel.focus();
})();