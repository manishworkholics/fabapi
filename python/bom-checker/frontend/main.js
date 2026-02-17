// ──────────────────────────────────────────────────────────────
//  BOM Checker – Front-end logic
// ──────────────────────────────────────────────────────────────

// -- Config
// const API_BASE_URL = "http://localhost:5000/api";
// const API_BASE_URL = "https://bom-checker-backend.onrender.com/api";

const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

export const API_BASE_URL = isLocal
  ? "http://localhost:5000/api"
  : "https://bom-checker-backend.onrender.com/api";

// -- App-wide state
const state = {
  fileName: null,
  columns: [],
  selectedMappings: {},
  rows: [],
  progress: {
    digikey: { total: 0, processed: 0, found: 0, not_found: 0 },
    mouser: { total: 0, processed: 0, found: 0, not_found: 0 },
  },
};

// -- DOM map
const elements = {
  /* Upload */
  uploadSection: el("#upload-section"),
  uploadArea: el("#upload-area"),
  fileInput: el("#file-input"),
  uploadProgress: q(".upload-progress"),
  uploadPrompt: q(".upload-prompt"),
  uploadError: el("#upload-error"),

  /* Mapping */
  columnMappingSection: el("#column-mapping-section"),
  columnsContainer: el("#columns-container"),
  backToUpload: el("#back-to-upload"),
  submitMapping: el("#submit-mapping"),
  mappingError: el("#mapping-error"),

  /* DigiKey results */
  resultsSection: el("#results-section"),
  progressBar: el("#progress-bar"),
  progressText: el("#progress-text"),
  foundStats: el("#found-stats"),
  foundPartsContainer: el("#found-parts-container"),
  notFoundPartsContainer: el("#not-found-parts-container"),
  resultsSummary: el("#results-summary"),
  summaryStats: el("#summary-stats"),

  /* Mouser results */
  mouserResults: el("#mouser-results"),
  mouserFoundPartsContainer: el("#mouser-found-parts-container"),
  mouserNotFoundPartsContainer: el("#mouser-not-found-parts-container"),
  mouserResultsSummary: el("#mouser-results-summary"),
  mouserSummaryStats: el("#mouser-summary-stats"),

  /* Common buttons */
  backToMapping: el("#back-to-mapping"),
  exportResults: el("#export-results"),

  /* Templates */
  columnCardTemplate: el("#column-card-template"),
  partCardTemplate: el("#part-card-template"),
  substituteCardTemplate: el("#substitute-card-template"),
};

// quick selectors
function el(sel) {
  return document.querySelector(sel);
}
function q(sel) {
  return document.querySelector(sel);
}

// -- API client
const api = {
  async uploadFile(file) {
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      body: fd,
    });
    if (!r.ok) throw new Error((await r.json()).error || "Upload failed");
    return await r.json();
  },
  async processBOM(fileName, columns) {
    const r = await fetch(`${API_BASE_URL}/process-bom`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_name: fileName, columns }),
    });
    if (!r.ok) throw new Error((await r.json()).error || "Processing failed");
    return await r.json();
  },

  /* generic SSE-style streaming */
  async streamResults(
    rowData,
    callbacks,
    endpoint = "/stream-digikey-results",
    initOverride = {}
  ) {
    /* merge headers safely */
    const mergedHeaders = {
      "Content-Type": "application/json",
      ...(initOverride.headers || {}), // <-- add/override extras
    };

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: mergedHeaders,
      body: JSON.stringify(rowData),
      ...initOverride, // keep signal, mode, etc.
    });

    if (!res.ok) {
      callbacks.httpError?.(new Error("Streaming failed"));
      return;
    }

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop();
      lines.forEach((ln) => dispatch(ln.trim()));
    }
    if (buf.trim()) dispatch(buf.trim());

    /* helper */
    function dispatch(line) {
      if (!line) return;
      try {
        const evt = JSON.parse(line);
        const { event, data } = evt;
        if (callbacks[event]) callbacks[event](data);
      } catch (e) {
        console.error("parse", e, line);
      }
    }
  },

  /* Mouser wrapper */
  streamMouserResults(rowData, callbacks) {
    return this.streamResults(rowData, callbacks, "/stream-mouser-results");
  },
};

// -- Upload: UI + logic
function initUpload() {
  elements.uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    elements.uploadArea.classList.add("drag-over");
  });
  elements.uploadArea.addEventListener("dragleave", (e) => {
    e.preventDefault();
    elements.uploadArea.classList.remove("drag-over");
  });
  elements.uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    elements.uploadArea.classList.remove("drag-over");
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
  elements.fileInput.addEventListener("change", (e) => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
  });

  async function handleFile(file) {
    elements.uploadError.style.display = "none";
    if (!/\.(xlsx?|xls)$/i.test(file.name)) {
      elements.uploadError.textContent =
        "Please upload an Excel file (.xlsx / .xls)";
      elements.uploadError.style.display = "block";
      return;
    }
    elements.uploadPrompt.style.display = "none";
    elements.uploadProgress.style.display = "flex";
    try {
      const res = await api.uploadFile(file);
      state.fileName = res.file_name;
      state.columns = res.columns;
      renderColumnCards();
      elements.uploadSection.style.display = "none";
      elements.columnMappingSection.style.display = "block";
    } catch (e) {
      elements.uploadError.textContent = `Upload failed: ${e.message}`;
      elements.uploadError.style.display = "block";
      elements.uploadPrompt.style.display = "flex";
      elements.uploadProgress.style.display = "none";
    }
  }
}

// -- Column mapping
function renderColumnCards() {
  elements.columnsContainer.innerHTML = "";
  state.columns.forEach((col, idx) => {
    const card = elements.columnCardTemplate.content.cloneNode(true);
    card.querySelector(".column-name").textContent = col.name;

    const ul = card.querySelector(".sample-values");
    (col.sample_values || ["(No sample values)"]).forEach((v) => {
      const li = document.createElement("li");
      li.textContent = v ?? "";
      ul.appendChild(li);
    });

    const [p, s, c] = ["primary", "secondary", "custom"].map((k) =>
      card.querySelector(`.${k}-radio`)
    );
    const sel = card.querySelector(".custom-select");
    const name = `col-${idx}`;
    [p, s, c].forEach((r) => {
      r.name = name;
    });
    p.id = `p-${idx}`;
    s.id = `s-${idx}`;
    c.id = `c-${idx}`;
    card.querySelector(".primary-label").setAttribute("for", `p-${idx}`);
    card.querySelector(".secondary-label").setAttribute("for", `s-${idx}`);
    card.querySelector(".custom-label").setAttribute("for", `c-${idx}`);
    card.querySelector(".primary-label").textContent =
      col.prediction.primary_category;
    card.querySelector(".secondary-label").textContent =
      col.prediction.secondary_category;
    p.checked = true;

    function store() {
      state.selectedMappings[col.name] = p.checked
        ? col.prediction.primary_category
        : s.checked
        ? col.prediction.secondary_category
        : sel.value;
    }
    [p, s, c, sel].forEach((elm) =>
      elm.addEventListener("change", () => {
        sel.disabled = !c.checked;
        store();
      })
    );
    store();
    elements.columnsContainer.appendChild(card);
  });
}

function initMappingBtns() {
  elements.backToUpload.onclick = () => {
    elements.columnMappingSection.style.display = "none";
    elements.uploadSection.style.display = "block";
    elements.uploadPrompt.style.display = "flex";
    elements.uploadProgress.style.display = "none";
  };

  elements.submitMapping.onclick = async () => {
    elements.mappingError.style.display = "none";
    const cols = Object.entries(state.selectedMappings).map(
      ([name, mapping]) => ({ name, mapping })
    );
    if (!cols.some((c) => c.mapping === "ManufacturerPN")) {
      elements.mappingError.textContent =
        "At least one column must be mapped as Manufacturer Part Number";
      elements.mappingError.style.display = "block";
      return;
    }
    try {
      const res = await api.processBOM(state.fileName, cols);
      state.rows = res.rows || [];
      state.results = {
        found: [],
        notFound: [],
        total: res.total_rows || 0,
        processed: 0,
      };
      resetProgressUI();
      elements.columnMappingSection.style.display = "none";
      elements.resultsSection.style.display = "block";
      streamAllResults(); // start
    } catch (e) {
      elements.mappingError.textContent = `Processing failed: ${e.message}`;
      elements.mappingError.style.display = "block";
    }
  };
}

/* ---------- streaming helpers ---------- */
function streamAllResults() {
  elements.mouserResults.style.display = "block";
  const req = { rows: state.rows };

  /* --- helpers to collect row-level errors --- */
  const dkErrors = [];
  const mouserErrors = [];

  const warnIfAny = () => {
    if (dkErrors.length || mouserErrors.length) {
      console.warn(
        `⚠️  Stream finished with Digi-Key errors on ${dkErrors.length} rows and Mouser errors on ${mouserErrors.length} rows.`
      );
      console.table([
        ...dkErrors.map((e) => ({ source: "DigiKey", ...e })),
        ...mouserErrors.map((e) => ({ source: "Mouser", ...e })),
      ]);
    }
  };

  /* ---------- Digi-Key stream ---------- */
  api.streamResults(req, {
    progress: (d) => updateAggregate("digikey", d),
    found: (d) => renderPartCard(d, elements.foundPartsContainer),
    not_found: (d) => renderPartCard(d, elements.notFoundPartsContainer, true),
    error: (d) => {
      // row-level error already includes mpn + error string
      dkErrors.push(d);
      console.error(`[DigiKey] error for ${d.mpn}: ${d.error}`);
    },
    complete: (d) => {
      finalizeSummary(d, elements.summaryStats, elements.resultsSummary);
      warnIfAny();
    },
    httpError: (e) => {
      /* hard HTTP failure (unlikely) */
      console.error("DigiKey stream transport error", e);
    },
  });

  /* ---------- Mouser stream ---------- */
  api.streamMouserResults(req, {
    progress: (d) => updateAggregate("mouser", d),
    found: (d) => renderPartCard(d, elements.mouserFoundPartsContainer),
    not_found: (d) =>
      renderPartCard(d, elements.mouserNotFoundPartsContainer, true),
    error: (d) => {
      mouserErrors.push(d);
      console.error(`[Mouser] error for ${d.mpn}: ${d.error}`);
    },
    complete: (d) => {
      finalizeSummary(
        d,
        elements.mouserSummaryStats,
        elements.mouserResultsSummary
      );
      warnIfAny();
    },
    httpError: (e) => {
      console.error("Mouser stream transport error", e);
    },
  });
}

/* ---------- aggregate progress ---------- */
function updateAggregate(source, d) {
  Object.assign(state.progress[source], d); // merge update
  const p = state.progress.digikey;
  const m = state.progress.mouser;

  const total = p.total + m.total;
  const processed = p.processed + m.processed;
  const found = p.found + m.found;
  const percent = total ? (processed / total) * 100 : 0;

  elements.progressBar.style.width = `${percent.toFixed(1)}%`;
  elements.progressText.textContent = `Processed: ${processed} of ${total}`;
  elements.foundStats.textContent = `Found: ${found} (${(
    (found / total) * 100 || 0
  ).toFixed(1)}%)`;
}

// -- Helpers for progress / summary
function resetProgressUI() {
  elements.progressBar.style.width = "0%";
  elements.progressText.textContent = `Processed: 0 of ${state.results.total}`;
  elements.foundStats.textContent = "Found: 0 (0%)";
  elements.foundPartsContainer.innerHTML = "";
  elements.notFoundPartsContainer.innerHTML = "";
  elements.resultsSummary.style.display = "none";
  elements.mouserResults.style.display = "block";
}

// update bar & stats
function updateProgressUI(d) {
  const pct = d.percent_complete || (d.processed / d.total) * 100;
  elements.progressBar.style.width = `${pct}%`;
  elements.progressText.textContent = `Processed: ${d.processed} of ${d.total}`;
  const fpct = (d.found / d.total) * 100 || 0;
  elements.foundStats.textContent = `Found: ${d.found} (${fpct.toFixed(1)}%)`;
}

// fill summary block
function finalizeSummary(d, statsDiv, summaryDiv) {
  statsDiv.innerHTML = `
        <div><span class="value">${
          d.found
        }</span><span class="label">Parts Found</span></div>
        <div><span class="value">${
          d.not_found
        }</span><span class="label">Not Found</span></div>
        <div><span class="value">${d.percent_found.toFixed(
          1
        )}%</span><span class="label">Success Rate</span></div>`;
  summaryDiv.style.display = "block";
}
// Render a part card
function renderPartCard(part, container, isNotFound = false) {
  console.log("Rendering part card:", part, "to container:", container);

  const card = elements.partCardTemplate.content.cloneNode(true);

  // Set part MPN - check multiple properties
  const mpnElement = card.querySelector(".part-mpn");
  let mpnValue = "Unknown Part";

  // Try different property names that might contain the MPN
  if (part.mpn) {
    mpnValue = part.mpn;
  } else if (part.manufacturerPN) {
    mpnValue = part.manufacturerPN;
  } else if (part.ManufacturerPartNumber) {
    mpnValue = part.ManufacturerPartNumber;
  }

  mpnElement.textContent = mpnValue;

  const statusElement = card.querySelector(".part-status");
  statusElement.textContent = part.status || "Unknown";

  if (part.status === "In Stock") {
    statusElement.classList.add("in-stock");
  } else {
    statusElement.classList.add("out-of-stock");
  }

  // Set manufacturer - check multiple properties
  const manufacturerElement = card.querySelector(".part-manufacturer");
  let manufacturerValue = "Not specified";

  if (part.manufacturer) {
    manufacturerValue = part.manufacturer;
  } else if (part.Manufacturer && part.Manufacturer.Name) {
    manufacturerValue = part.Manufacturer.Name;
  } else if (part.Manufacturer && part.Manufacturer.Value) {
    manufacturerValue = part.Manufacturer.Value;
  }

  manufacturerElement.textContent = `Manufacturer: ${manufacturerValue}`;

  // Set description - check both direct property and nested property
  let description = "No description available";

  if (part.description) {
    description = part.description;
  } else if (part.Description && part.Description.ProductDescription) {
    description = part.Description.ProductDescription;
  } else if (part.ProductDescription) {
    description = part.ProductDescription;
  }

  card.querySelector(".part-description").textContent = description;

  // Set price - ensure it's a number and format it
  let price = 0;
  if (typeof part.price === "number") {
    price = part.price;
  } else if (typeof part.price === "string" && !isNaN(parseFloat(part.price))) {
    price = parseFloat(part.price);
  } else if (part.UnitPrice !== undefined) {
    price = part.UnitPrice;
  }
  card.querySelector(".part-price").textContent = `Price: $${price.toFixed(2)}`;

  // Add price breaks if available
  if (part.price_breaks && part.price_breaks.length > 0) {
    const priceBreaksElement = card.querySelector(".price-breaks");

    part.price_breaks.forEach((pb) => {
      const div = document.createElement("div");

      // Get price value - handle both formats
      let breakPrice = 0;
      if (pb.price !== undefined) {
        breakPrice = pb.price;
      } else if (pb.unitPrice !== undefined) {
        breakPrice = pb.unitPrice;
      } else if (pb.UnitPrice !== undefined) {
        breakPrice = pb.UnitPrice;
      }

      // Get quantity - handle both formats
      let quantity = 1;
      if (pb.quantity !== undefined) {
        quantity = pb.quantity;
      } else if (pb.breakQuantity !== undefined) {
        quantity = pb.breakQuantity;
      } else if (pb.BreakQuantity !== undefined) {
        quantity = pb.BreakQuantity;
      }

      div.innerHTML = `<span>Qty ${quantity}+</span><span>$${parseFloat(
        breakPrice
      ).toFixed(2)}</span>`;
      priceBreaksElement.appendChild(div);
    });
  }

  // Add substitutes if available and not found/out of stock
  if (isNotFound && part.substitutes && part.substitutes.length > 0) {
    const substitutesElement = card.querySelector(".part-substitutes");
    substitutesElement.style.display = "block";

    const substitutesContainer = substitutesElement.querySelector(
      ".substitutes-container"
    );

    part.substitutes.forEach((sub) => {
      const subCard = elements.substituteCardTemplate.content.cloneNode(true);

      // Set substitute MPN
      let subMpnValue = "Unknown Part";
      if (sub.mpn) {
        subMpnValue = sub.mpn;
      } else if (sub.manufacturerPN) {
        subMpnValue = sub.manufacturerPN;
      } else if (sub.ManufacturerPartNumber) {
        subMpnValue = sub.ManufacturerPartNumber;
      }
      subCard.querySelector(".substitute-mpn").textContent = subMpnValue;

      const subStatusElement = subCard.querySelector(".substitute-status");
      subStatusElement.textContent = sub.status || "Unknown";

      if (sub.status === "In Stock") {
        subStatusElement.classList.add("in-stock");
      } else {
        subStatusElement.classList.add("out-of-stock");
      }

      // Set substitute manufacturer
      let subManufacturerValue = "Not specified";
      if (sub.manufacturer) {
        subManufacturerValue = sub.manufacturer;
      } else if (sub.Manufacturer && sub.Manufacturer.Name) {
        subManufacturerValue = sub.Manufacturer.Name;
      } else if (sub.Manufacturer && sub.Manufacturer.Value) {
        subManufacturerValue = sub.Manufacturer.Value;
      }
      subCard.querySelector(".substitute-manufacturer").textContent =
        subManufacturerValue;

      // Set substitute description
      let subDescription = "No description available";
      if (sub.description) {
        subDescription = sub.description;
      } else if (sub.Description && sub.Description.ProductDescription) {
        subDescription = sub.Description.ProductDescription;
      } else if (sub.ProductDescription) {
        subDescription = sub.ProductDescription;
      }
      subCard.querySelector(".substitute-description").textContent =
        subDescription;

      // Handle price formatting for substitutes too
      let subPrice = 0;
      if (typeof sub.price === "number") {
        subPrice = sub.price;
      } else if (
        typeof sub.price === "string" &&
        !isNaN(parseFloat(sub.price))
      ) {
        subPrice = parseFloat(sub.price);
      } else if (sub.UnitPrice !== undefined) {
        subPrice = sub.UnitPrice;
      }
      subCard.querySelector(
        ".substitute-price"
      ).textContent = `$${subPrice.toFixed(2)}`;

      substitutesContainer.appendChild(subCard);
    });
  }

  container.appendChild(card);
  console.log("Added card to container, new count:", container.children.length);
}

// Initialize tab switching
function initResults() {
  elements.backToMapping.onclick = () => {
    elements.resultsSection.style.display = "none";
    elements.columnMappingSection.style.display = "block";
  };
  elements.exportResults.onclick = () => exportResults();
}

// -- Tabs (works for both vendors)
function initTabs() {
  document.querySelectorAll(".tab-button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const parent = btn.closest(".tabs");
      parent
        .querySelectorAll(".tab-button")
        .forEach((b) => b.classList.remove("active"));
      parent.nextElementSibling
        .querySelectorAll(".tab-pane")
        .forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const paneId = btn.dataset.tab;
      document.getElementById(paneId).classList.add("active");
    });
  });
}

// Export results to CSV
function exportResults() {
  // Combine found and not found parts
  const allParts = [
    ...state.results.found.map((part) => ({
      ...part,
      found: true,
      substitutes: [],
    })),
    ...state.results.notFound.map((part) => ({
      ...part,
      found: false,
    })),
  ];

  // Create CSV header
  let csv = "MPN,Manufacturer,Status,Price,Description,Found,Substitute MPNs\n";

  // Add rows
  allParts.forEach((part) => {
    // Get substitute MPNs if any
    const substituteMPNs =
      part.substitutes && part.substitutes.length > 0
        ? part.substitutes.map((s) => s.mpn).join(";")
        : "";

    // Clean description for CSV
    const cleanDesc = part.description
      ? `"${part.description.replace(/"/g, '""')}"`
      : "";

    // Create CSV row
    csv += `${part.mpn},"${part.manufacturer}","${part.status}",${part.price},${cleanDesc},${part.found},${substituteMPNs}\n`;
  });

  // Create download link
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.setAttribute("href", url);
  a.setAttribute(
    "download",
    `bom-results-${new Date().toISOString().split("T")[0]}.csv`
  );
  a.style.display = "none";

  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// -- Kick-off
document.addEventListener("DOMContentLoaded", () => {
  initUpload();
  initMappingBtns();
  initResults();
  initTabs();
});
