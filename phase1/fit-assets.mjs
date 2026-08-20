const STORAGE_EXAMPLES = [
  { maxSqFt: 15, size: 15, image: "../assets/fit/unit-15-sq-ft.webp?v=3" },
  { maxSqFt: 25, size: 25, image: "../assets/fit/unit-25-sq-ft.webp?v=3" },
  { maxSqFt: 35, size: 35, image: "../assets/fit/unit-35-sq-ft.webp?v=3" },
  { maxSqFt: 50, size: 50, image: "../assets/fit/unit-50-sq-ft.webp?v=3" },
  { maxSqFt: 75, size: 75, image: "../assets/fit/unit-75-sq-ft.webp?v=3" },
  { maxSqFt: 100, size: 100, image: "../assets/fit/unit-100-sq-ft.webp?v=3" },
  { maxSqFt: Infinity, size: 125, image: "../assets/fit/unit-125-sq-ft.webp?v=3" }
];

const VEHICLE_EXAMPLES = {
  "lwb-transit": { label: "LWB Transit", image: "../assets/fit/vehicle-lwb-transit.webp?v=3" },
  luton: { label: "Luton van", image: "../assets/fit/vehicle-luton.webp?v=3" },
  "maxi-low-loader": { label: "Maxi Low Loader", image: "../assets/fit/vehicle-maxi-low-loader.webp?v=3" },
  "multiple-loads": { label: "7.5-tonne removal lorry", image: "../assets/fit/vehicle-7-5-tonne.webp?v=3" }
};

export function storageExampleFor(storage) {
  if (!storage || storage.type !== "unit") return null;
  return STORAGE_EXAMPLES.find(example => storage.sizeSqFt <= example.maxSqFt);
}

export function vehicleExampleFor(vehicle) {
  if (!vehicle) return null;
  return VEHICLE_EXAMPLES[vehicle.id] || null;
}
