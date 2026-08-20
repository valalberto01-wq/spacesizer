import { recommendStorage, recommendVehicle, totalInventoryVolumeCubicFeet } from "../src/calculation-engine.mjs";
import { ACCESS_OPTIONS, HOUSEHOLD_PRESETS, ITEM_CATALOGUE } from "./data.mjs";
import { storageExampleFor, vehicleExampleFor } from "./fit-assets.mjs";
import { localServiceSearchTerm } from "./provider-search.mjs";

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

function customItem() {
  return `<section class="screen"><div class="eyebrow">Add a custom item</div><h1>What is missing?</h1><p class="intro">Enter the item’s approximate outside dimensions. SpaceSizer will add its volume to your estimate.</p><form id="customItemForm" class="custom-form"><label class="field-label" for="customName">Item name</label><input id="customName" class="search" maxlength="60" required placeholder="e.g. Floor lamp"><div class="dimension-grid"><div><label class="field-label" for="customLength">Length (cm)</label><input id="customLength" class="search" type="number" min="1" max="1000" required placeholder="60"></div><div><label class="field-label" for="customWidth">Width (cm)</label><input id="customWidth" class="search" type="number" min="1" max="1000" required placeholder="40"></div><div><label class="field-label" for="customHeight">Height (cm)</label><input id="customHeight" class="search" type="number" min="1" max="1000" required placeholder="150"></div></div><label class="field-label" for="customQty">Quantity</label><input id="customQty" class="search" type="number" min="1" max="99" value="1" required><div class="notice"><b>Approximate measurements are fine.</b> Include any packaging and use the item’s widest points.</div><button class="button button-primary custom-submit" type="submit">Add to my list</button></form></section>`;
}

function addCustomItem(form) {
  const data = new FormData(form);
  const name = String(data.get("name") || document.querySelector("#customName").value).trim();
  const length = Number(document.querySelector("#customLength").value);
  const width = Number(document.querySelector("#customWidth").value);
  const height = Number(document.querySelector("#customHeight").value);
  const qty = Number(document.querySelector("#customQty").value);
  if (!name || !length || !width || !height || !qty) return;
  const cuft = (length * width * height) / 28316.8466;
  const existing = state.inventory.find(item => item.name.toLowerCase() === name.toLowerCase());
  if (existing) existing.qty += qty;
  else state.inventory.push({ name, cat: "Custom items", cuft, qty });
  go("review");
}

function saveEstimate() {
  const payload = { inventory: state.inventory, access: state.access, savedAt: new Date().toISOString() };
  localStorage.setItem("spacesizer-estimate", JSON.stringify(payload));
  const button = document.querySelector('[data-action="save-estimate"]');
  if (button) {
    button.textContent = "✓ Result saved on this device";
    button.classList.add("saved");
  }
  alert("Your SpaceSizer result has been saved on this device.");
}

function loadEstimate() {
  try {
    const saved = JSON.parse(localStorage.getItem("spacesizer-estimate"));
    if (!saved?.inventory?.length) return;
    state.inventory = saved.inventory;
    state.access = saved.access || "some";
    go("review");
  } catch { localStorage.removeItem("spacesizer-estimate"); }
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

function storageName(storage) {
  return storage.type === "locker" ? "Compact locker" : storage.label;
}

function storageComparisons() {
  return ["tight", "some", "easy"].map(access => {
    const storage = recommendStorage({ inventory: state.inventory, access });
    return { access, storage, option: accessOptions[access] };
  });
}

function estimatedFill(storage) {
  if (storage.type === "locker") return Math.min(100, Math.round((storage.volumeCubicFeet / storage.usableVolumeCubicFeet) * 100));
  return Math.min(100, Math.round((storage.requiredSqFt / storage.sizeSqFt) * 100));
}

function packingIcon(item) {
  const source = itemCatalogue.find(candidate => candidate.name === item.name);
  if (source?.emoji) return source.emoji;
  if (item.cat === "Boxes & bags") return "📦";
  if (item.cat === "Bedroom") return "🛏️";
  if (item.cat === "Living room") return "🛋️";
  if (item.cat === "Office") return "🖥️";
  return "◼";
}

function packingObjects() {
  return [...state.inventory]
    .sort((a, b) => (b.cuft * b.qty) - (a.cuft * a.qty))
    .flatMap(item => {
      const visible = Math.min(item.qty, 3);
      const size = item.cuft >= 35 ? "large" : item.cuft >= 12 ? "medium" : "small";
      const objects = Array.from({ length: visible }, () => ({ ...item, size }));
      if (item.qty > visible) objects.push({ ...item, name: `+${item.qty - visible} ${item.name}`, size: "small", more: true });
      return objects;
    })
    .slice(0, 12);
}

function packingShape(item) {
  const name = item.name.toLowerCase();
  if (name.includes("sofa") || name.includes("armchair") || name.includes("chair")) return "seating";
  if (name.includes("bed") || name.includes("mattress")) return "mattress";
  if (name.includes("wardrobe") || name.includes("drawers") || name.includes("cabinet")) return "cabinet";
  if (name.includes("box") || name.includes("tool")) return "box";
  if (name.includes("suitcase") || name.includes("bag")) return "case";
  if (name.includes("table") || name.includes("desk")) return "table";
  if (["washing machine", "dishwasher", "fridge freezer", "microwave"].includes(name)) return "appliance";
  if (name.includes("tv") || name.includes("monitor")) return "screen";
  if (name.includes("bicycle")) return "bicycle";
  return "box";
}

function packingLoadMarkup() {
  return packingObjects().map(item => `<div class="scene-item ${packingShape(item)} ${item.size} ${item.more ? "more" : ""}" title="${escapeHtml(item.name)}"><span>${item.more ? escapeHtml(item.name.split(" ")[0]) : ""}</span><small>${escapeHtml(item.more ? item.name.split(" ").slice(1).join(" ") : item.name)}</small></div>`).join("");
}

function packingPreview(storage, vehicle) {
  const fill = estimatedFill(storage);
  const load = packingLoadMarkup();
  return `<section class="fit-preview"><div class="fit-heading"><div><div class="eyebrow">Illustrated fit</div><h2>Picture your space before you book</h2><p>A simplified view using the belongings you selected.</p></div><span>${totalItems()} items</span></div><div class="fit-tabs" role="tablist"><button class="active" data-fit-view="unit" role="tab">Storage unit</button><button data-fit-view="vehicle" role="tab">Removal vehicle</button></div><div class="fit-stage active" data-fit-stage="unit"><div class="stage-summary"><div><small>Recommended space</small><b>${escapeHtml(storageName(storage))}</b></div><strong>${fill}% estimated use</strong></div><div class="unit-scene"><div class="scene-back"><span>YOUR BELONGINGS</span></div><div class="scene-load">${load}</div><div class="scene-floor"></div><div class="scene-door"><i></i><i></i><i></i><i></i><i></i></div></div><div class="capacity-row"><span>Space used</span><div><i style="width:${fill}%"></i></div><b>${fill}%</b></div></div><div class="fit-stage" data-fit-stage="vehicle" hidden><div class="stage-summary"><div><small>Suggested vehicle</small><b>${escapeHtml(vehicle.label)}</b></div><strong>${fill < 86 ? "Likely one carefully packed load" : "Professional confirmation needed"}</strong></div><div class="vehicle-scene"><div class="vehicle-box"><div class="scene-load">${load}</div></div><div class="vehicle-cab"><span></span><i></i></div><div class="vehicle-chassis"></div><div class="vehicle-wheel first"></div><div class="vehicle-wheel second"></div></div></div><div class="fit-inventory"><small>Included in this illustration</small><div>${state.inventory.slice(0, 5).map(item => `<span>${packingIcon(item)} <b>${escapeHtml(item.name)}</b> × ${item.qty}</span>`).join("")}${state.inventory.length > 5 ? `<span><b>+${state.inventory.length - 5}</b> more item types</span>` : ""}</div></div><p class="fit-disclaimer"><b>Illustrative arrangement—not a packing guarantee.</b> Exact fit depends on measurements, dismantling, stacking, weight and safe loading. Confirm with your chosen provider.</p></section>`;
}

function realisticFitPreview(storage, vehicle) {
  const examples = [];
  const storageExample = storageExampleFor(storage);
  const vehicleExample = vehicleExampleFor(vehicle);
  if (storageExample) examples.push({ id: "unit", tab: `${storageExample.size} sq ft unit`, title: `Example ${storageExample.size} sq ft arrangement`, image: storageExample.image, alt: `Realistic example of furniture and moving boxes arranged inside a ${storageExample.size} square foot storage unit`, copy: storage.sizeSqFt === storageExample.size ? "A representative load for the recommended unit size." : `The nearest visual example is ${storageExample.size} sq ft; your calculated recommendation is ${storage.sizeSqFt} sq ft.` });
  if (vehicleExample) examples.push({ id: "vehicle", tab: vehicleExample.label, title: `Example ${vehicleExample.label} load`, image: vehicleExample.image, alt: `Realistic example of furniture and moving boxes safely arranged inside a ${vehicleExample.label}`, copy: "A representative carefully packed load—not a picture of your exact belongings." });
  if (!examples.length) return "";
  return `<section class="photo-fit"><div class="photo-fit-heading"><div><div class="eyebrow">Real-world example</div><h2>What this space can look like</h2></div><span>Illustrative</span></div>${examples.length > 1 ? `<div class="photo-tabs" role="tablist">${examples.map((example, index) => `<button class="${index === 0 ? "active" : ""}" data-fit-view="${example.id}" role="tab">${escapeHtml(example.tab)}</button>`).join("")}</div>` : ""}${examples.map((example, index) => `<article class="photo-stage ${index === 0 ? "active" : ""}" data-fit-stage="${example.id}" ${index === 0 ? "" : "hidden"}><img src="${example.image}" alt="${escapeHtml(example.alt)}" loading="lazy"><div class="photo-caption"><div><b>${escapeHtml(example.title)}</b><p>${escapeHtml(example.copy)}</p></div><span>${example.id === "unit" ? `${estimatedFill(storage)}% estimated use` : "Confirm with remover"}</span></div></article>`).join("")}<p class="photo-disclaimer"><b>Example arrangement only.</b> Your result is calculated from your selected items; the photograph shows comparable contents rather than an exact packing plan.</p></section>`;
}

function result() {
  const storage = recommendStorage({ inventory: state.inventory, access: state.access });
  const vehicle = recommendVehicle(storage);
  const cubicFeet = totalInventoryVolumeCubicFeet(state.inventory);
  const storageLabel = storageName(storage);
  const explanation = storage.type === "locker" ? `Your selected boxes and bags fit within a locker based on its actual 1 m × 1 m × 1 m internal dimensions.` : `${storage.label} is the practical starting point for your belongings and your “${accessOptions[state.access].label.toLowerCase()}” preference.`;
  const comparisons = storageComparisons();
  const alternatives = vehicle.alternatives?.map(item => `<li>${escapeHtml(item)}</li>`).join("") || "";
  return `<section class="screen"><div class="eyebrow">Step 3 of 4 · Your result</div><h1>Your practical starting point.</h1><div class="result-card"><small>Recommended storage</small><div class="result-size">${escapeHtml(storageLabel)}</div><div class="result-copy">${escapeHtml(explanation)}</div><div class="fill-label"><span>Estimated usable space filled</span><b>${estimatedFill(storage)}%</b></div><div class="fill-track"><span style="width:${estimatedFill(storage)}%"></span></div><div class="result-facts"><div class="fact"><small>Selected items</small><b>${totalItems()}</b></div><div class="fact"><small>Estimated volume</small><b>${Math.round(cubicFeet)} cu ft</b></div></div></div>${realisticFitPreview(storage, vehicle)}<section class="comparison-section"><h2>Compare your access options</h2><div class="comparison-grid">${comparisons.map(({ access, storage: optionStorage, option }) => `<button class="comparison-card ${state.access === access ? "active" : ""}" data-access-result="${access}"><small>${escapeHtml(option.label)}</small><b>${escapeHtml(storageName(optionStorage))}</b><span>${escapeHtml(option.note)}</span></button>`).join("")}</div></section><div class="vehicle-card"><div class="vehicle-icon">${vehicleEmoji(vehicle.id)}</div><div><small>Suggested vehicle</small><b>${escapeHtml(vehicle.label)}</b><small>${escapeHtml(vehicle.guidance)}</small>${alternatives ? `<details><summary>Other vehicles a remover may suggest</summary><ul>${alternatives}</ul></details>` : ""}<small class="vehicle-confirmation">${escapeHtml(vehicle.confirmation || "Confirm the final vehicle with the chosen company.")}</small></div></div><section class="next-step"><div class="eyebrow">Next step</div><h2>What would you like to find?</h2><button class="provider-choice" data-provider="storage"><span>🏢</span><span><b>Find storage</b><small>Search near you using your recommended size.</small></span><strong>→</strong></button><button class="provider-choice" data-provider="transport"><span>🚐</span><span><b>Find transport or movers</b><small>Man-and-van, removals, loading, unloading and furniture moving help.</small></span><strong>→</strong></button></section><div class="notice"><b>Estimate only.</b> The final fit depends on dismantling, stacking, item shapes and the exact internal dimensions available.</div><div class="result-actions"><button class="button button-primary" data-action="share">Share my result</button><button class="button button-quiet" data-action="edit">Adjust my items</button><button class="button button-secondary" data-action="restart">Start again</button></div></section>`;
}

function squareMetres(storage) {
  const squareFeet = storage.type === "locker" ? 10 : storage.sizeSqFt;
  return (squareFeet * 0.092903).toFixed(1);
}

function provider() {
  const storage = recommendStorage({ inventory: state.inventory, access: state.access });
  const vehicle = recommendVehicle(storage);
  const isStorage = state.providerType === "storage";
  const storageLabel = storage.type === "locker" ? "Compact locker" : storage.label;
  const heading = isStorage ? "Find storage near you." : "Find transport or movers.";
  const searchLabel = isStorage ? "Search local storage" : "Search local transport and movers";
  const switchLabel = isStorage ? "I also need transport" : "I also need storage";
  const providerNote = isStorage ? `SpaceSizer estimates approximately ${escapeHtml(storageLabel)} (${squareMetres(storage)} m²) of storage.` : `SpaceSizer suggests a ${escapeHtml(vehicle.label)} for this load. Confirm whether you also need loading, unloading, heavy lifting or dismantling help.`;
  return `<section class="screen"><div class="eyebrow">Step 4 of 4</div><h1>${heading}</h1><p class="intro">Enter your location and we will create a local search using your SpaceSizer recommendation.</p><div class="provider-recap"><div><small>Storage</small><b>${escapeHtml(storageLabel)} (${squareMetres(storage)} m²)</b></div><div><small>Vehicle guide</small><b>${escapeHtml(vehicle.label)}</b></div></div><label class="field-label" for="country">Country</label><select id="country" class="search">${countries.map(country => `<option ${country === state.country ? "selected" : ""}>${escapeHtml(country)}</option>`).join("")}</select><label class="field-label" for="location">Town, city, postcode or ZIP code</label><input id="location" class="search" autocomplete="postal-code" placeholder="e.g. Wimbledon or SW19 5BA" value="${escapeHtml(state.location)}"><p class="privacy-note">Your location is used only to open relevant local results. SpaceSizer does not save it.</p><button class="button button-primary provider-search" data-action="provider-search">${searchLabel}</button><button class="button button-quiet provider-search" data-action="provider-switch">${switchLabel}</button><div class="provider-summary"><b>What to tell the provider</b><p>${providerNote}</p><button class="add-button" data-action="copy-summary">Copy recommendation</button></div><div class="notice"><b>Independent search.</b> SpaceSizer does not currently rank, endorse or guarantee external providers. Confirm prices, availability, insurance and suitability directly.</div></section>`;
}

function providerSummary() {
  const storage = recommendStorage({ inventory: state.inventory, access: state.access });
  const vehicle = recommendVehicle(storage);
  const label = storage.type === "locker" ? "Compact locker (1 m × 1 m × 1 m)" : storage.label;
  return `SpaceSizer estimate\nStorage: ${label} (${squareMetres(storage)} m²)\nSuggested vehicle: ${vehicle.label}\nSelected items: ${totalItems()}\nLocation: ${state.location || "Not entered"}, ${state.country}\n\nEstimate only — confirm the exact fit with the provider.`;
}

function enquiry() {
  const storage = recommendStorage({ inventory: state.inventory, access: state.access });
  const vehicle = recommendVehicle(storage);
  const label = storage.type === "locker" ? "Compact locker (1 m × 1 m × 1 m)" : storage.label;
  return `<section class="screen"><div class="eyebrow">Send a SpaceSizer enquiry</div><h1>Contact your chosen company.</h1><p class="intro">Enter the company’s contact details and your own. SpaceSizer will prepare a branded request containing your estimate.</p><div class="provider-recap"><div><small>Storage estimate</small><b>${escapeHtml(label)}</b></div><div><small>Vehicle guidance</small><b>${escapeHtml(vehicle.label)}</b></div></div><form id="enquiryForm" class="custom-form"><label class="field-label" for="companyName">Company name</label><input id="companyName" class="search" required maxlength="80" placeholder="Chosen company"><div class="enquiry-method"><button type="button" class="method-card active" data-method="email">✉️ Email</button><button type="button" class="method-card" data-method="whatsapp">💬 WhatsApp</button></div><div id="emailField"><label class="field-label" for="companyEmail">Company email address</label><input id="companyEmail" class="search" type="email" placeholder="enquiries@company.co.uk"></div><div id="whatsappField" hidden><label class="field-label" for="companyPhone">Company WhatsApp number</label><input id="companyPhone" class="search" type="tel" placeholder="e.g. +44 7700 900000"></div><h2 class="form-section-title">Your details</h2><label class="field-label" for="customerName">Your name</label><input id="customerName" class="search" required maxlength="80"><label class="field-label" for="customerEmail">Your email</label><input id="customerEmail" class="search" type="email" required><label class="field-label" for="customerPhone">Your telephone number</label><input id="customerPhone" class="search" type="tel" required><label class="field-label" for="moveDate">Preferred date</label><input id="moveDate" class="search" type="date"><label class="field-label" for="collectionLocation">Collection or storage location</label><input id="collectionLocation" class="search" placeholder="Town or postcode" value="${escapeHtml(state.location)}"><label class="field-label" for="enquiryNotes">Anything else the company should know?</label><textarea id="enquiryNotes" class="search enquiry-notes" maxlength="1000" placeholder="Access, floors, parking, preferred contact time…"></textarea><label class="consent-row"><input id="enquiryConsent" type="checkbox" required><span>I agree to share these details with my chosen company. I understand that the company—not SpaceSizer—will respond with availability, suitability and pricing.</span></label><div class="notice"><b>Sent directly by you.</b> SpaceSizer prepares the request but does not store it or guarantee the provider’s service.</div><button class="button button-primary custom-submit" type="submit">Review and send enquiry</button></form></section>`;
}

function buildEnquiryMessage() {
  const storage = recommendStorage({ inventory: state.inventory, access: state.access });
  const vehicle = recommendVehicle(storage);
  const label = storage.type === "locker" ? "Compact locker (1 m × 1 m × 1 m)" : storage.label;
  const value = id => document.querySelector(`#${id}`)?.value.trim() || "Not provided";
  return `SpaceSizer customer enquiry\n\nCompany: ${value("companyName")}\nCustomer: ${value("customerName")}\nEmail: ${value("customerEmail")}\nTelephone: ${value("customerPhone")}\nPreferred date: ${value("moveDate")}\nLocation: ${value("collectionLocation")}\n\nSPACE ESTIMATE\nRecommended storage: ${label} (${squareMetres(storage)} m²)\nVehicle guidance: ${vehicle.label}\nSelected belongings: ${totalItems()} items\nEstimated volume: ${Math.round(totalInventoryVolumeCubicFeet(state.inventory))} cu ft\nAccess preference: ${accessOptions[state.access].label}\n\nCustomer notes: ${value("enquiryNotes")}\n\nEstimate prepared using SpaceSizer — https://spacesizer.co.uk\nThe estimate is guidance only. Please confirm suitability, availability and pricing directly with the customer.`;
}

function sendEnquiry(form) {
  if (!form.reportValidity()) return;
  const method = form.dataset.method || "email";
  const message = buildEnquiryMessage();
  const company = document.querySelector("#companyName").value.trim();
  if (method === "email") {
    const email = document.querySelector("#companyEmail").value.trim();
    if (!email) return alert("Enter the company’s email address.");
    location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`SpaceSizer enquiry for ${company}`)}&body=${encodeURIComponent(message)}`;
  } else {
    const phone = document.querySelector("#companyPhone").value.replace(/[^\d]/g, "");
    if (!phone) return alert("Enter the company’s WhatsApp number, including its country code.");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  }
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
  const serviceTerm = localServiceSearchTerm(state.providerType, state.country);
  const query = state.providerType === "storage" ? `${serviceTerm} ${location} ${state.country} ${storageLabel}` : `${serviceTerm} ${location} ${state.country}`;
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
    if (action === "custom-item") go("custom");
    if (action === "save-estimate") saveEstimate();
    if (action === "load-estimate") loadEstimate();
    if (action === "provider-search") searchProviders();
    if (action === "provider-switch") { state.providerType = state.providerType === "storage" ? "transport" : "storage"; render(); }
    if (action === "copy-summary") copyText(providerSummary(), "Your recommendation has been copied.");
    if (action === "prepare-enquiry") go("enquiry");
    if (action === "restart") { Object.assign(state, { screen: "welcome", history: [], inventory: [], category: "All", search: "", access: "some", providerType: "storage", country: "United Kingdom", location: "" }); render(); }
  }));
  document.querySelectorAll("[data-item]").forEach(button => button.addEventListener("click", () => changeItem(button.dataset.item, Number(button.dataset.change))));
  document.querySelectorAll("[data-category]").forEach(button => button.addEventListener("click", () => { state.category = button.dataset.category; render(); }));
  document.querySelectorAll("[data-access]").forEach(button => button.addEventListener("click", () => { state.access = button.dataset.access; render(); }));
  document.querySelectorAll("[data-access-result]").forEach(button => button.addEventListener("click", () => { state.access = button.dataset.accessResult; render(); }));
  document.querySelectorAll("[data-fit-view]").forEach(button => button.addEventListener("click", () => {
    const view = button.dataset.fitView;
    document.querySelectorAll("[data-fit-view]").forEach(tab => tab.classList.toggle("active", tab === button));
    document.querySelectorAll("[data-fit-stage]").forEach(stage => {
      const selected = stage.dataset.fitStage === view;
      stage.hidden = !selected;
      stage.classList.toggle("active", selected);
    });
  }));
  document.querySelectorAll("[data-preset]").forEach(button => button.addEventListener("click", () => usePreset(Number(button.dataset.preset))));
  document.querySelectorAll("[data-provider]").forEach(button => button.addEventListener("click", () => { state.providerType = button.dataset.provider; go("provider"); }));
  const location = document.querySelector("#location");
  if (location) location.addEventListener("input", event => { state.location = event.target.value; });
  const country = document.querySelector("#country");
  if (country) country.addEventListener("change", event => { state.country = event.target.value; });
  const customForm = document.querySelector("#customItemForm");
  if (customForm) customForm.addEventListener("submit", event => { event.preventDefault(); addCustomItem(customForm); });
  const enquiryForm = document.querySelector("#enquiryForm");
  if (enquiryForm) {
    enquiryForm.dataset.method = "email";
    enquiryForm.addEventListener("submit", event => { event.preventDefault(); sendEnquiry(enquiryForm); });
    document.querySelectorAll("[data-method]").forEach(button => button.addEventListener("click", () => {
      enquiryForm.dataset.method = button.dataset.method;
      document.querySelectorAll("[data-method]").forEach(choice => choice.classList.toggle("active", choice === button));
      document.querySelector("#emailField").hidden = button.dataset.method !== "email";
      document.querySelector("#whatsappField").hidden = button.dataset.method !== "whatsapp";
    }));
  }
  const search = document.querySelector("#search");
  if (search) search.addEventListener("input", event => { state.search = event.target.value; render(); document.querySelector("#search")?.focus(); });
}

function render() {
  backButton.classList.toggle("hidden", state.screen === "welcome");
  progressLabel.textContent = ({ welcome: "Start", household: "Quick start", catalogue: "1 / 4", boxes: "1 / 4", custom: "Custom item", review: "2 / 4", result: "3 / 4", provider: "4 / 4", enquiry: "Enquiry" })[state.screen];
  app.innerHTML = ({ welcome, household, catalogue, boxes: () => catalogue(true), custom: customItem, review, result, provider, enquiry })[state.screen]();
  if (state.screen === "catalogue") {
    document.querySelector(".item-list").insertAdjacentHTML("beforebegin", `<button class="custom-item-button" data-action="custom-item"><span>＋</span><span><b>Can’t find an item?</b><small>Add it using approximate measurements.</small></span><strong>→</strong></button>`);
  }
  if (state.screen === "result") {
    document.querySelector(".next-step").insertAdjacentHTML("beforebegin", `<section class="save-result-card"><div><b>Keep this result</b><small>Save it on this device and continue later—no account needed.</small></div><button class="button button-primary" data-action="save-estimate">Save result on this device</button></section>`);
  }
  if (state.screen === "welcome" && localStorage.getItem("spacesizer-estimate")) {
    document.querySelector(".hero-actions").insertAdjacentHTML("afterbegin", `<button class="button saved-estimate" data-action="load-estimate">Continue my saved estimate</button>`);
  }
  if (state.screen === "provider") {
    const searchButton = document.querySelector('[data-action="provider-search"]');
    searchButton.insertAdjacentHTML("afterend", `<button class="button send-enquiry-button" data-action="prepare-enquiry">Send my details to a chosen company</button>`);
  }
  if (state.screen === "provider" && state.providerType === "transport") {
    document.querySelector(".intro").textContent = "Enter your location to find man-and-van, removal, loading, unloading and furniture moving services. The vehicle result is guidance only and does not restrict the search.";
  }
  bind();
}

backButton.addEventListener("click", () => { state.screen = state.history.pop() || "welcome"; render(); });
render();
