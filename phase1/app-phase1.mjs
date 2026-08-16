import { ACCESS_OPTIONS, HOUSEHOLD_PRESETS, ITEM_CATALOGUE } from "./data.mjs";

const app = document.querySelector("#app");
const backButton = document.querySelector("#backButton");
const progressLabel = document.querySelector("#progressLabel");
const itemCatalogue = ITEM_CATALOGUE;
const accessOptions = ACCESS_OPTIONS;

const state = { screen: "welcome", history: [], inventory: [], category: "All", search: "", access: "some", providerType: "storage", country: "United Kingdom", location: "" };
const countries = ["United Kingdom", "Ireland", "United States", "Canada", "Australia", "New Zealand", "France", "Germany", "Spain", "Portugal", "Italy", "Netherlands", "Belgium", "Switzerland", "Austria", "Denmark", "Sweden", "Norway", "Finland", "Poland", "Czechia", "Greece", "Turkey", "United Arab Emirates", "South Africa", "India", "Singapore", "Malaysia", "Brazil", "Mexico", "Other"];

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}

function quantity(name) { return state.inventory.find(item => item.name === name)?.qty || 0; }
function totalItems() { return state.inventory.reduce((sum, item) => sum + item.qty, 0); }

function changeItem(name, amount) {
  let selected = state.inventory.find(item => item.name === name);
  const source = itemCatalogue.find(item => item.name === name);
  if (!selected && amount > 0) {
    selected = { name: source.name, cat: source.cat, cuft: source.cuft, qty: 0 };
    state.inventory.push(selected);
  }
  if (!selected) return;
  selected.qty = Math.max(0, selected.qty + amount);
  if (!selected.qty) state.inventory = state.inventory.filter(item => item !== selected);
  render();
}

function go(screen) {
  state.history.push(state.screen);
  state.screen = screen;
  render();
  scrollTo({ top: 0, behavior: "smooth" });
}

function welcome() {
  return `<section class="hero"><div class="eyebrow">Storage and moving, made clearer</div><h1>Know what fits before you book.</h1><p>Select what you are storing. SpaceSizer will recommend a practical storage size and the right vehicle guide.</p><div class="result-preview"><small>Your result will include</small><div class="preview-size">One clear size</div><div class="trust-row"><span>Storage estimate</span><span>Vehicle guide</span><span>No account needed</span></div></div><div class="hero-actions"><button class="button button-primary" data-action="start">Choose my items</button><button class="button button-secondary" data-action="household">Household estimate</button><button class="button button-secondary" data-action="boxes">I only have boxes</button></div></section>`;
}

function household() {
  return `<section class="screen"><div class="eyebrow">Quick household estimate</div><h1>Choose the closest match.</h1><p class="intro">We will create a typical starting list. You can adjust every item and quantity before calculating.</p><div class="household-list">${HOUSEHOLD_PRESETS.map((preset, index) => `<article class="household-card"><div class="household-icon">${preset.emoji}</div><div><b>${escapeHtml(preset.name)}</b><p>${escapeHtml(preset.description)}</p><button class="add-button" data-preset="${index}">Use this estimate</button></div></article>`).join("")}</div><div class="notice"><b>Every household is different.</b> Check the suggested list and add or remove anything that does not apply.</div></section>`;
}

function usePreset(index) {
  state.inventory = HOUSEHOLD_PRESETS[index].items.map(([name, qty]) => {
    const source = itemCatalogue.find(item => item.name === name);
    return { name, cat: source.cat, cuft: source.cuft, qty };
  });
  go("review");
}

function catalogue(boxesOnly = false) {
  const categories = ["All", ...new Set(itemCatalogue.map(item => item.cat))];
  const matching = itemCatalogue.filter(item => (!boxesOnly || item.cat === "Boxes & bags") && (state.category === "All" || item.cat === state.category) && (!state.search || item.name.toLowerCase().includes(state.search.toLowerCase())));
  return `<section class="screen"><div class="eyebrow">Step 1 of 3</div><h1>${boxesOnly ? "How many boxes and bags?" : "What are you storing?"}</h1><p class="intro">Add the closest match. You can change every quantity before calculating.</p><input id="search" class="search" type="search" placeholder="Search sofa, bed, box…" value="${escapeHtml(state.search)}">${boxesOnly ? "" : `<div class="chips">${categories.map(category => `<button class="chip ${state.category === category ? "active" : ""}" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join("")}</div>`}<div class="item-list">${matching.length ? matching.map(item => { const qty = quantity(item.name); return `<article class="item-card"><div class="item-icon">${item.emoji}</div><div class="item-copy"><b>${escapeHtml(item.name)}</b><small>${escapeHtml(item.note)}</small></div>${qty ? `<div class="counter"><button data-item="${escapeHtml(item.name)}" data-change="-1" aria-label="Remove one">−</button><strong>${qty}</strong><button data-item="${escapeHtml(item.name)}" data-change="1" aria-label="Add one">+</button></div>` : `<button class="add-button" data-item="${escapeHtml(item.name)}" data-change="1">+ Add</button>`}</article>`; }).join("") : `<div class="empty">No matching items found.</div>`}</div><div class="sticky-action"><button class="button button-primary" data-action="review" ${totalItems() ? "" : "disabled"}>Review ${totalItems() || ""} item${totalItems() === 1 ? "" : "s"}</button></div></section>`;
}

function review() {
  return `<section class="screen"><div class="eyebrow">Step 2 of 3</div><h1>Check your list.</h1><p class="intro">Adjust the quantities and tell us how easily you want to reach your belongings.</p><div class="review-list">${state.inventory.map(item => `<div class="review-row"><div><b>${escapeHtml(item.name)}</b><small>${escapeHtml(item.cat)}</small></div><div class="counter"><button data-item="${escapeHtml(item.name)}" data-change="-1">−</button><strong>${item.qty}</strong><button data-item="${escapeHtml(item.name)}" data-change="1">+</button></div></div>`).join("")}</div><h2 class="access-title">How much access do you need?</h2><div class="access-list">${Object.entries(accessOptions).map(([key, option]) => `<button class="access-card ${state.access === key ? "active" : ""}" data-access="${key}"><b>${escapeHtml(option.label)}${key === "some" ? " · Most popular" : ""}</b><small>${escapeHtml(option.note)}</small></button>`).join("")}</div><div class="sticky-action"><button class="button button-primary" data-action="result">Calculate my size</button></div></section>`;
}

function vehicleEmoji(id) { return id === "lwb-transit" ? "🚐" : id === "luton" ? "🚚" : "🚛"; }

function result() {
  const storage = recommendStorage({ inventory: state.inventory, access: state.access });
  const vehicle = recommendVehicle(storage);
  const cubicFeet = totalInventoryVolumeCubicFeet(state.inventory);
  const storageLabel = storage.type === "locker" ? "Compact locker" : storage.label;
  const explanation = storage.type === "locker" ? `Your selected boxes and bags fit within a locker based on its actual 1 m × 1 m × 1 m internal dimensions.` : `${storage.label} is the practical starting point for your belongings and your “${accessOptions[state.access].label.toLowerCase()}” preference.`;
  return `<section class="screen"><div class="eyebrow">Step 3 of 4 · Your result</div><h1>Your practical starting point.</h1><div class="result-card"><small>Recommended storage</small><div class="result-size">${escapeHtml(storageLabel)}</div><div class="result-copy">${escapeHtml(explanation)}</div><div class="result-facts"><div class="fact"><small>Selected items</small><b>${totalItems()}</b></div><div class="fact"><small>Estimated volume</small><b>${Math.round(cubicFeet)} cu ft</b></div></div></div><div class="vehicle-card"><div class="vehicle-icon">${vehicleEmoji(vehicle.id)}</div><div><small>Suggested vehicle</small><b>${escapeHtml(vehicle.label)}</b><small>${escapeHtml(vehicle.guidance)}</small></div></div><section class="next-step"><div class="eyebrow">Next step</div><h2>What would you like to find?</h2><button class="provider-choice" data-provider="storage"><span>🏢</span><span><b>Find storage</b><small>Search near you using your recommended size.</small></span><strong>→</strong></button><button class="provider-choice" data-provider="transport"><span>🚐</span><span><b>Find transport or movers</b><small>Search using your suggested vehicle and load.</small></span><strong>→</strong></button></section><div class="notice"><b>Estimate only.</b> The final fit depends on dismantling, stacking, item shapes and the exact internal dimensions available.</div><div class="result-actions"><button class="button button-primary" data-action="share">Share my result</button><button class="button button-quiet" data-action="edit">Adjust my items</button><button class="button button-secondary" data-action="restart">Start again</button></div></section>`;
}

function squareMetres(storage) {
  const squareFeet = storage.type === "locker" ? 10 : storage.sizeSqFt;
  return (squareFeet * 0.092903).toFixed(1);
}

function transportTerm(country) {
  if (["United Kingdom", "Ireland"].includes(country)) return "man and van movers removal services";
  if (["Australia", "New Zealand"].includes(country)) return "removalists movers moving services";
  if (["United States", "Canada"].includes(country)) return "moving companies movers removal services";
  return "moving services movers removal companies";
}

function provider() {
  const storage = recommendStorage({ inventory: state.inventory, access: state.access });
  const vehicle = recommendVehicle(storage);
  const isStorage = state.providerType === "storage";
  const storageLabel = storage.type === "locker" ? "Compact locker" : storage.label;
  return `<section class="screen"><div class="eyebrow">Step 4 of 4</div><h1>${isStorage ? "Find storage near you." : "Find transport or movers."}</h1><p class="intro">Enter your location and we will create a local search using your SpaceSizer recommendation.</p><div class="provider-recap"><div><small>Storage</small><b>${escapeHtml(storageLabel)} (${squareMetres(storage)} m²)</b></div><div><small>Vehicle guide</small><b>${escapeHtml(vehicle.label)}</b></div></div><label class="field-label" for="country">Country</label><select id="country" class="search">${countries.map(country => `<option ${country === state.country ? "selected" : ""}>${escapeHtml(country)}</option>`).join("")}</select><label class="field-label" for="location">Town, city, postcode or ZIP code</label><input id="location" class="search" autocomplete="postal-code" placeholder="e.g. Wimbledon or SW19 5BA" value="${escapeHtml(state.location)}"><p class="privacy-note">Your location is used only to open relevant local results. SpaceSizer does not save it.</p><button class="button button-primary provider-search" data-action="provider-search">${isStorage ? "Search local storage" : "Search local transport and movers"}</button><button class="button button-quiet provider-search" data-action="provider-switch">${isStorage ? "I also need transport" : "I also need storage"}</button><div class="provider-summary"><b>What to tell the provider</b><p>${isStorage ? `SpaceSizer estimates approximately ${escapeHtml(storageLabel)} (${squareMetres(storage)} m²) of storage.` : `SpaceSizer suggests a ${escapeHtml(vehicle.label)} for this load.`}</p><button class="add-button" data-action="copy-summary">Copy recommendation</button></div><div class="notice"><b>Independent search.</b> SpaceSizer does not currently rank, endorse or guarantee external providers. Confirm prices, availability and suitability directly.</div></section>`;
}

function providerSummary() {
  const storage = recommendStorage({ inventory: state.inventory, access: state.access });
  const vehicle = recommendVehicle(storage);
  const label = storage.type === "locker" ? "Compact locker (1 m × 1 m × 1 m)" : storage.label;
  return `SpaceSizer estimate\nStorage: ${label} (${squareMetres(storage)} m²)\nSuggested vehicle: ${vehicle.label}\nSelected items: ${totalItems()}\nLocation: ${state.location || "Not entered"}, ${state.country}\n\nEstimate only — confirm the exact fit with the provider.`;
}

function copyText(text, confirmation) {
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => alert(confirmation));
  else prompt("Copy this information:", text);
}

function searchProviders() {
  const location = state.location.trim();
  if (!location) return alert("Enter your town, city, postcode or ZIP code first.");
  const storage = recommendStorage({ inventory: state.inventory, access: state.access });
  const storageLabel = storage.type === "locker" ? "storage locker" : storage.label;
  const query = state.providerType === "storage" ? `self storage ${location} ${state.country} ${storageLabel}` : `${transportTerm(state.country)} ${location} ${state.country}`;
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank", "noopener");
}

async function shareResult() {
  const storage = recommendStorage({ inventory: state.inventory, access: state.access });
  const vehicle = recommendVehicle(storage);
  const label = storage.type === "locker" ? "Compact locker (1 m × 1 m × 1 m)" : storage.label;
  const text = `My SpaceSizer estimate\nStorage: ${label}\nVehicle: ${vehicle.label}\nItems selected: ${totalItems()}\n\nEstimate only — final fit depends on packing and exact dimensions.`;
  if (navigator.share) return navigator.share({ title: "SpaceSizer estimate", text }).catch(() => {});
  if (navigator.clipboard) { await navigator.clipboard.writeText(text); alert("Your result has been copied."); return; }
  prompt("Copy your result:", text);
}

function bind() {
  document.querySelectorAll("[data-action]").forEach(button => button.addEventListener("click", () => {
    const action = button.dataset.action;
    if (action === "start") { state.category = "All"; go("catalogue"); }
    if (action === "household") go("household");
    if (action === "boxes") { state.category = "All"; go("boxes"); }
    if (action === "review" && totalItems()) go("review");
    if (action === "result") go("result");
    if (action === "edit") go("review");
    if (action === "share") shareResult();
    if (action === "provider-search") searchProviders();
    if (action === "provider-switch") { state.providerType = state.providerType === "storage" ? "transport" : "storage"; render(); }
    if (action === "copy-summary") copyText(providerSummary(), "Your recommendation has been copied.");
    if (action === "restart") { Object.assign(state, { screen: "welcome", history: [], inventory: [], category: "All", search: "", access: "some", providerType: "storage", country: "United Kingdom", location: "" }); render(); }
  }));
  document.querySelectorAll("[data-item]").forEach(button => button.addEventListener("click", () => changeItem(button.dataset.item, Number(button.dataset.change))));
  document.querySelectorAll("[data-category]").forEach(button => button.addEventListener("click", () => { state.category = button.dataset.category; render(); }));
  document.querySelectorAll("[data-access]").forEach(button => button.addEventListener("click", () => { state.access = button.dataset.access; render(); }));
  document.querySelectorAll("[data-preset]").forEach(button => button.addEventListener("click", () => usePreset(Number(button.dataset.preset))));
  document.querySelectorAll("[data-provider]").forEach(button => button.addEventListener("click", () => { state.providerType = button.dataset.provider; go("provider"); }));
  const location = document.querySelector("#location");
  if (location) location.addEventListener("input", event => { state.location = event.target.value; });
  const country = document.querySelector("#country");
  if (country) country.addEventListener("change", event => { state.country = event.target.value; });
  const search = document.querySelector("#search");
  if (search) search.addEventListener("input", event => { state.search = event.target.value; render(); document.querySelector("#search")?.focus(); });
}

function render() {
  backButton.classList.toggle("hidden", state.screen === "welcome");
  progressLabel.textContent = ({ welcome: "Start", household: "Quick start", catalogue: "1 / 4", boxes: "1 / 4", review: "2 / 4", result: "3 / 4", provider: "4 / 4" })[state.screen];
  app.innerHTML = ({ welcome, household, catalogue, boxes: () => catalogue(true), review, result, provider })[state.screen]();
  const transportNote = document.querySelector('[data-provider="transport"] small');
  if (transportNote) transportNote.textContent = "Search all nearby man-and-van, mover and removal services.";
  if (state.screen === "provider" && state.providerType === "transport") {
    document.querySelector(".intro").textContent = "Enter your location to see all relevant local transport and removal services. The vehicle result is guidance only and does not restrict the search.";
  }
  bind();
}

backButton.addEventListener("click", () => { state.screen = state.history.pop() || "welcome"; render(); });
render();
