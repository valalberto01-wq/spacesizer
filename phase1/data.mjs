export const ACCESS_OPTIONS = {
  tight: { label: "Smallest practical", note: "Best if you do not need regular access." },
  some: { label: "Recommended", note: "A sensible balance of fit and access." },
  easy: { label: "More comfortable", note: "More space to reach and move belongings." }
};

const rows = [
  ["Small box", "Boxes & bags", "📦", 1.27, "40 × 30 × 30 cm"],
  ["Medium box", "Boxes & bags", "📦", 2.86, "45 × 45 × 40 cm"],
  ["Large box", "Boxes & bags", "📦", 4.29, "60 × 45 × 45 cm"],
  ["Suitcase", "Boxes & bags", "🧳", 5, "Medium or large suitcase"],
  ["Storage bag", "Boxes & bags", "👜", 3, "Soft storage bag"],
  ["Armchair", "Living room", "🪑", 30, "Standard armchair"],
  ["Two-seater sofa", "Living room", "🛋️", 45, "Typical two-seat sofa"],
  ["Three-seater sofa", "Living room", "🛋️", 65, "Typical three-seat sofa"],
  ["Coffee table", "Living room", "▰", 12, "Standard coffee table"],
  ["TV unit", "Living room", "📺", 15, "Low television cabinet"],
  ["TV", "Living room", "📺", 8, "Flat-screen television"],
  ["Single bed", "Bedroom", "🛏️", 32, "Frame and mattress"],
  ["Double bed", "Bedroom", "🛏️", 50, "Frame and mattress"],
  ["King bed", "Bedroom", "🛏️", 60, "Frame and mattress"],
  ["Bedside table", "Bedroom", "🗄️", 6, "Small bedside unit"],
  ["Chest of drawers", "Bedroom", "🗄️", 18, "Medium chest"],
  ["Wardrobe", "Bedroom", "🚪", 40, "Standard wardrobe"],
  ["Dining table", "Kitchen & dining", "🍽️", 28, "Four to six-seat table"],
  ["Dining chair", "Kitchen & dining", "🪑", 7, "Standard chair"],
  ["Fridge freezer", "Kitchen & dining", "🧊", 28, "Tall fridge freezer"],
  ["Washing machine", "Kitchen & dining", "🫧", 13, "Standard appliance"],
  ["Dishwasher", "Kitchen & dining", "🍽️", 13, "Standard appliance"],
  ["Microwave", "Kitchen & dining", "◫", 3, "Countertop microwave"],
  ["Desk", "Office", "🖥️", 20, "Standard office desk"],
  ["Office chair", "Office", "🪑", 10, "Swivel chair"],
  ["Filing cabinet", "Office", "🗃️", 12, "Two to three-drawer cabinet"],
  ["Computer monitor", "Office", "🖥️", 3, "Desktop monitor"],
  ["Bicycle", "Garage & outdoor", "🚲", 15, "Adult bicycle"],
  ["Lawn mower", "Garage & outdoor", "🌿", 16, "Push mower"],
  ["Tool box", "Garage & outdoor", "🧰", 3, "Portable tool box"],
  ["Garden chair", "Garage & outdoor", "🪑", 8, "Outdoor chair"]
];

export const ITEM_CATALOGUE = rows.map(([name, cat, emoji, cuft, note]) => ({ name, cat, emoji, cuft, note }));

export const HOUSEHOLD_PRESETS = [
  { name: "Typical bedroom", emoji: "🛏️", description: "A double bed, wardrobe, drawers, bedside tables and around 12 boxes.", items: [["Double bed",1],["Wardrobe",1],["Chest of drawers",1],["Bedside table",2],["Medium box",8],["Large box",4]] },
  { name: "Studio or small flat", emoji: "🏠", description: "Core furniture and boxes from a compact studio home.", items: [["Double bed",1],["Two-seater sofa",1],["Coffee table",1],["TV",1],["TV unit",1],["Dining table",1],["Dining chair",2],["Medium box",12],["Large box",6]] },
  { name: "One-bedroom home", emoji: "🏡", description: "A practical starting list for a typical one-bedroom home.", items: [["Double bed",1],["Wardrobe",1],["Chest of drawers",1],["Three-seater sofa",1],["Armchair",1],["Coffee table",1],["TV",1],["TV unit",1],["Dining table",1],["Dining chair",4],["Medium box",16],["Large box",8]] },
  { name: "Two-bedroom home", emoji: "🏘️", description: "Two bedrooms, living furniture, appliances and around 36 boxes.", items: [["Double bed",1],["Single bed",1],["Wardrobe",2],["Chest of drawers",2],["Three-seater sofa",1],["Armchair",2],["Coffee table",1],["TV",2],["TV unit",1],["Dining table",1],["Dining chair",4],["Fridge freezer",1],["Washing machine",1],["Medium box",24],["Large box",12]] },
  { name: "Three-bedroom home", emoji: "🏠", description: "A larger family household with three bedrooms and around 50 boxes.", items: [["Double bed",2],["Single bed",1],["Wardrobe",3],["Chest of drawers",3],["Three-seater sofa",1],["Two-seater sofa",1],["Armchair",2],["Coffee table",1],["TV",2],["TV unit",1],["Dining table",1],["Dining chair",6],["Fridge freezer",1],["Washing machine",1],["Dishwasher",1],["Medium box",34],["Large box",16]] }
];
