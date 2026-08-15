const CUBIC_FEET_PER_CUBIC_METRE = 35.3147;
const FEET_PER_METRE = 3.28084;

export const STORAGE_SIZES_SQ_FT = [
  15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90,
  95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155,
  160, 165, 170, 175, 180, 190, 195, 200, 210, 220
];

export const ACCESS_LEVELS = {
  tight: { label: "Smallest practical", efficiency: 0.82 },
  some: { label: "Recommended", efficiency: 0.65 },
  easy: { label: "More comfortable", efficiency: 0.55 }
};

/**
 * A locker is dimension-led, not floor-area-led. Add provider-specific lockers
 * here when exact internal dimensions are known.
 */
export const DEFAULT_LOCKERS = [
  {
    id: "compact-1m-cube",
    label: "Compact locker (1 m × 1 m × 1 m)",
    internalDimensionsMetres: { width: 1, depth: 1, height: 1 },
    usableEfficiency: 0.70
  }
];

export function lockerUsableVolumeCubicFeet(locker) {
  const { width, depth, height } = locker.internalDimensionsMetres;
  return width * depth * height * CUBIC_FEET_PER_CUBIC_METRE * locker.usableEfficiency;
}

export function totalInventoryVolumeCubicFeet(inventory) {
  return inventory.reduce((total, item) => {
    const quantity = Number(item.qty) || 0;
    const volume = Number(item.cuft) || 0;
    return total + Math.max(0, quantity) * Math.max(0, volume);
  }, 0);
}

export function inventoryIsLockerSuitable(inventory) {
  const lockerItems = new Set([
    "Small box",
    "Medium box",
    "Large box",
    "Suitcase",
    "Storage bag"
  ]);

  return inventory.length > 0 && inventory.every((item) => lockerItems.has(item.name));
}

export function recommendStorage({
  inventory,
  access = "some",
  unitHeightMetres = 2.2,
  lockers = DEFAULT_LOCKERS,
  storageSizes = STORAGE_SIZES_SQ_FT
}) {
  if (!ACCESS_LEVELS[access]) throw new Error("Unknown access level");
  if (!(unitHeightMetres > 0)) throw new Error("Unit height must be greater than zero");

  const volumeCubicFeet = totalInventoryVolumeCubicFeet(inventory);
  if (volumeCubicFeet <= 0) return null;

  if (inventoryIsLockerSuitable(inventory)) {
    const locker = lockers
      .map((candidate) => ({
        ...candidate,
        usableVolumeCubicFeet: lockerUsableVolumeCubicFeet(candidate)
      }))
      .sort((a, b) => a.usableVolumeCubicFeet - b.usableVolumeCubicFeet)
      .find((candidate) => volumeCubicFeet <= candidate.usableVolumeCubicFeet);

    if (locker) {
      return {
        type: "locker",
        id: locker.id,
        label: locker.label,
        volumeCubicFeet,
        usableVolumeCubicFeet: locker.usableVolumeCubicFeet,
        internalDimensionsMetres: locker.internalDimensionsMetres
      };
    }
  }

  const unitHeightFeet = unitHeightMetres * FEET_PER_METRE;
  const requiredSqFt =
    volumeCubicFeet / (unitHeightFeet * ACCESS_LEVELS[access].efficiency);
  const listedSize = storageSizes.find((size) => size >= requiredSqFt);
  const sizeSqFt = listedSize ?? Math.ceil(requiredSqFt / 25) * 25;

  return {
    type: "unit",
    label: `${sizeSqFt} sq ft`,
    sizeSqFt,
    volumeCubicFeet,
    requiredSqFt,
    unitHeightMetres,
    access
  };
}

export function recommendVehicle(storageRecommendation) {
  if (!storageRecommendation) return null;

  // A compact locker load remains within the LWB Transit band.
  const sizeSqFt =
    storageRecommendation.type === "locker" ? 10 : storageRecommendation.sizeSqFt;

  if (sizeSqFt <= 50) {
    return {
      id: "lwb-transit",
      label: "Long-wheelbase Transit",
      guidance: "Suitable for storage loads up to 50 sq ft."
    };
  }

  if (sizeSqFt <= 100) {
    return {
      id: "luton",
      label: "Luton van",
      guidance: "Recommended for loads over 50 sq ft and up to 100 sq ft."
    };
  }

  if (sizeSqFt <= 125) {
    return {
      id: "maxi-low-loader",
      label: "Maxi Low Loader",
      guidance: "Suitable for larger loads up to about 125 sq ft."
    };
  }

  return {
    id: "multiple-loads",
    label: "More than one vehicle or load",
    guidance: "This estimate is above the normal 125 sq ft single-load guide."
  };
}
