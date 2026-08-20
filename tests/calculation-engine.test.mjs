import test from "node:test";
import assert from "node:assert/strict";
import {
  lockerUsableVolumeCubicFeet,
  recommendStorage,
  recommendVehicle,
  totalInventoryVolumeCubicFeet
} from "../src/calculation-engine.mjs";
import { storageExampleFor, vehicleExampleFor } from "../phase1/fit-assets.mjs";
import { localServiceSearchTerm } from "../phase1/provider-search.mjs";

test("calculates inventory volume from quantities", () => {
  assert.equal(
    totalInventoryVolumeCubicFeet([
      { name: "Small box", cuft: 1.27, qty: 2 },
      { name: "Medium box", cuft: 2.86, qty: 1 }
    ]),
    5.4
  );
});

test("recommends a locker by its actual internal dimensions", () => {
  const result = recommendStorage({
    inventory: [{ name: "Small box", cuft: 1.27, qty: 10 }]
  });

  assert.equal(result.type, "locker");
  assert.equal(result.label, "Compact locker (1 m × 1 m × 1 m)");
  assert.deepEqual(result.internalDimensionsMetres, {
    width: 1,
    depth: 1,
    height: 1
  });
});

test("does not put furniture into a locker", () => {
  const result = recommendStorage({
    inventory: [{ name: "Armchair", cuft: 30, qty: 1 }]
  });

  assert.equal(result.type, "unit");
});

test("accepts provider-specific locker dimensions", () => {
  const lockers = [{
    id: "small-provider-locker",
    label: "Provider small locker",
    internalDimensionsMetres: { width: 0.5, depth: 0.5, height: 0.5 },
    usableEfficiency: 0.7
  }];

  assert.ok(lockerUsableVolumeCubicFeet(lockers[0]) < 4);
  const result = recommendStorage({
    inventory: [{ name: "Medium box", cuft: 2.86, qty: 2 }],
    lockers
  });
  assert.equal(result.type, "unit");
});

test("supports configurable unit height while defaulting to 2.2 m", () => {
  const inventory = [{ name: "Three-seater sofa", cuft: 65, qty: 2 }];
  const standard = recommendStorage({ inventory });
  const lowerUnit = recommendStorage({ inventory, unitHeightMetres: 1.8 });

  assert.equal(standard.unitHeightMetres, 2.2);
  assert.ok(lowerUnit.sizeSqFt >= standard.sizeSqFt);
});

test("preserves SpaceSizer vehicle bands", () => {
  assert.equal(recommendVehicle({ type: "unit", sizeSqFt: 50 }).label, "Long-wheelbase Transit");
  assert.equal(recommendVehicle({ type: "unit", sizeSqFt: 55 }).label, "Luton van");
  assert.equal(recommendVehicle({ type: "unit", sizeSqFt: 100 }).label, "Luton van");
  assert.equal(recommendVehicle({ type: "unit", sizeSqFt: 105 }).label, "Maxi Low Loader");
  assert.equal(recommendVehicle({ type: "unit", sizeSqFt: 125 }).label, "Maxi Low Loader");
  assert.equal(recommendVehicle({ type: "unit", sizeSqFt: 130 }).label, "Professional load assessment");
});

test("provides wider UK removal vehicle alternatives without replacing the core bands", () => {
  const small = recommendVehicle({ type: "unit", sizeSqFt: 25 });
  const medium = recommendVehicle({ type: "unit", sizeSqFt: 75 });
  const substantial = recommendVehicle({ type: "unit", sizeSqFt: 150 });

  assert.equal(small.label, "Long-wheelbase Transit");
  assert.ok(small.alternatives.includes("Medium-wheelbase van"));
  assert.equal(medium.label, "Luton van");
  assert.ok(medium.alternatives.some((item) => item.includes("tail lift")));
  assert.ok(substantial.alternatives.includes("7.5-tonne removal lorry"));
  assert.match(substantial.confirmation, /weight, access, dismantling and packing/);
});

test("returns no recommendation for an empty inventory", () => {
  assert.equal(recommendStorage({ inventory: [] }), null);
});

test("maps calculated storage sizes to the nearest approved visual band", () => {
  assert.equal(storageExampleFor({ type: "unit", sizeSqFt: 15 }).size, 15);
  assert.equal(storageExampleFor({ type: "unit", sizeSqFt: 20 }).size, 25);
  assert.equal(storageExampleFor({ type: "unit", sizeSqFt: 35 }).size, 35);
  assert.equal(storageExampleFor({ type: "unit", sizeSqFt: 55 }).size, 75);
  assert.equal(storageExampleFor({ type: "unit", sizeSqFt: 100 }).size, 100);
  assert.equal(storageExampleFor({ type: "unit", sizeSqFt: 150 }).size, 125);
  assert.equal(storageExampleFor({ type: "locker" }), null);
});

test("maps each core vehicle recommendation to its approved image", () => {
  assert.match(vehicleExampleFor({ id: "lwb-transit" }).image, /lwb-transit/);
  assert.match(vehicleExampleFor({ id: "luton" }).image, /luton/);
  assert.match(vehicleExampleFor({ id: "maxi-low-loader" }).image, /maxi-low-loader/);
  assert.match(vehicleExampleFor({ id: "multiple-loads" }).image, /7-5-tonne/);
});

test("finds generic furniture moving help without advertising marketplaces", () => {
  const term = localServiceSearchTerm("help", "United Kingdom");
  assert.match(term, /furniture moving help/);
  assert.match(term, /loading unloading/);
  assert.doesNotMatch(term, /taskrabbit|airtasker/i);
});
