import type { MenuItem, DailyMenu, WeeklyMenu, DayKey, MealType } from "@/types/index";

// --- Constants ---------------------------------------------------------------

export const DAYS: DayKey[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const DAY_ABBR: Record<DayKey, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

export const MEAL_ORDER: MealType[] = [
  "breakfast",
  "lunch",
  "snacks",
  "dinner",
];

const JS_DAY_TO_KEY: DayKey[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// --- Item factory ------------------------------------------------------------

let _nextId = 1;
const _idMap: Record<string, number> = {};

function mkItem(
  name: string,
  type: "veg" | "non-veg",
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
  fiber: number,
  tags: string[]
): MenuItem {
  if (_idMap[name] === undefined) {
    _idMap[name] = _nextId++;
  }
  return {
    id: _idMap[name] as number,
    name,
    type,
    calories,
    protein,
    carbs,
    fat,
    fiber,
    tags,
  };
}

// --- Dish catalogue ----------------------------------------------------------

const d = {
  idliSambar:      mkItem("Idli Sambar",          "veg",     220, 8,  38, 4,  4,  ["veg"]),
  coconutChutney:  mkItem("Coconut Chutney",       "veg",     80,  1,  6,  7,  1,  ["veg"]),
  masalaChai:      mkItem("Masala Chai",           "veg",     60,  2,  10, 2,  0,  ["veg", "low-cal"]),
  poha:            mkItem("Poha",                 "veg",     200, 4,  38, 4,  2,  ["veg"]),
  banana:          mkItem("Banana",               "veg",     90,  1,  22, 0,  2,  ["veg", "low-cal"]),
  alooParatha:     mkItem("Aloo Paratha",          "veg",     280, 6,  42, 10, 3,  ["veg"]),
  curd:            mkItem("Curd",                 "veg",     90,  5,  8,  4,  0,  ["veg", "high-protein"]),
  upma:            mkItem("Upma",                 "veg",     210, 5,  36, 5,  3,  ["veg"]),
  masalaDosa:      mkItem("Masala Dosa",           "veg",     300, 6,  50, 8,  3,  ["veg"]),
  sambar:          mkItem("Sambar",               "veg",     80,  4,  12, 2,  3,  ["veg", "high-fiber"]),
  breadButter:     mkItem("Bread Butter",          "veg",     200, 5,  28, 9,  1,  ["veg"]),
  boiledEgg2:      mkItem("Boiled Egg (2 pcs)",    "non-veg", 140, 12, 1,  10, 0,  ["non-veg", "high-protein"]),
  milk:            mkItem("Milk",                 "veg",     120, 6,  12, 5,  0,  ["veg", "high-protein"]),
  dalFry:          mkItem("Dal Fry",              "veg",     220, 12, 32, 5,  8,  ["veg", "high-protein", "high-fiber"]),
  steamedRice:     mkItem("Steamed Rice",          "veg",     200, 4,  44, 1,  1,  ["veg"]),
  mixedVegSabzi:   mkItem("Mixed Veg Sabzi",       "veg",     120, 4,  18, 4,  4,  ["veg", "high-fiber"]),
  roti2:           mkItem("Roti (2 pcs)",          "veg",     180, 6,  36, 2,  3,  ["veg"]),
  roti3:           mkItem("Roti (3 pcs)",          "veg",     270, 9,  54, 3,  5,  ["veg"]),
  onionSalad:      mkItem("Onion Salad",           "veg",     30,  1,  6,  0,  1,  ["veg", "low-cal"]),
  rajmaCurry:      mkItem("Rajma Curry",           "veg",     280, 14, 40, 5,  10, ["veg", "high-protein", "high-fiber"]),
  alooGobiSabzi:   mkItem("Aloo Gobi Sabzi",       "veg",     130, 3,  20, 5,  3,  ["veg"]),
  pickle:          mkItem("Pickle",               "veg",     15,  0,  2,  1,  0,  ["veg", "low-cal", "spicy"]),
  chanaMasala:     mkItem("Chana Masala",          "veg",     250, 13, 36, 7,  10, ["veg", "high-protein", "high-fiber"]),
  bhatura2:        mkItem("Bhatura (2 pcs)",       "veg",     320, 7,  48, 12, 2,  ["veg"]),
  onionRings:      mkItem("Onion Rings",           "veg",     30,  1,  6,  0,  1,  ["veg", "low-cal"]),
  lassi:           mkItem("Lassi",                "veg",     160, 5,  24, 5,  0,  ["veg"]),
  dalTadka:        mkItem("Dal Tadka",             "veg",     210, 11, 30, 6,  7,  ["veg", "high-protein", "high-fiber"]),
  alooSabzi:       mkItem("Aloo Sabzi",            "veg",     140, 3,  22, 5,  3,  ["veg"]),
  palakPaneer:     mkItem("Palak Paneer",          "veg",     290, 16, 12, 20, 4,  ["veg", "high-protein"]),
  moongDalSalad:   mkItem("Moong Dal Salad",       "veg",     110, 8,  16, 2,  5,  ["veg", "high-protein", "low-cal"]),
  paneerBhurji:    mkItem("Paneer Bhurji",         "veg",     280, 18, 8,  20, 1,  ["veg", "high-protein"]),
  dalMakhani:      mkItem("Dal Makhani",           "veg",     230, 10, 28, 9,  6,  ["veg", "high-fiber"]),
  jeeraRice:       mkItem("Jeera Rice",            "veg",     220, 4,  46, 4,  1,  ["veg"]),
  paneerButter:    mkItem("Paneer Butter Masala",  "veg",     320, 16, 16, 22, 2,  ["veg", "high-protein"]),
  raita:           mkItem("Raita",                "veg",     80,  4,  8,  3,  0,  ["veg"]),
  greenSalad:      mkItem("Green Salad",           "veg",     40,  1,  7,  0,  2,  ["veg", "low-cal"]),
  salad:           mkItem("Salad",                "veg",     40,  1,  7,  0,  2,  ["veg", "low-cal"]),
  mixedDal:        mkItem("Mixed Dal",             "veg",     220, 12, 32, 4,  9,  ["veg", "high-protein", "high-fiber"]),
  alooJeera:       mkItem("Aloo Jeera",            "veg",     150, 3,  24, 5,  3,  ["veg"]),
  papad:           mkItem("Papad",                "veg",     40,  2,  6,  1,  0,  ["veg"]),
  chickenCurry:    mkItem("Chicken Curry",         "non-veg", 320, 28, 10, 18, 1,  ["non-veg", "high-protein", "spicy"]),
  eggCurry:        mkItem("Egg Curry",             "non-veg", 300, 20, 10, 20, 1,  ["non-veg", "high-protein", "spicy"]),
  muttonCurry:     mkItem("Mutton Curry",          "non-veg", 400, 32, 8,  26, 1,  ["non-veg", "high-protein", "spicy"]),
  samosa:          mkItem("Samosa",               "veg",     210, 4,  28, 10, 2,  ["veg", "spicy"]),
  tamarindChutney: mkItem("Tamarind Chutney",      "veg",     40,  0,  10, 0,  0,  ["veg", "low-cal"]),
  breadPakora:     mkItem("Bread Pakora",          "veg",     250, 6,  32, 12, 2,  ["veg", "spicy"]),
  mintChutney:     mkItem("Mint Chutney",          "veg",     20,  0,  4,  0,  1,  ["veg", "low-cal"]),
  vegCutlet:       mkItem("Veg Cutlet",            "veg",     180, 5,  24, 7,  3,  ["veg"]),
  ketchup:         mkItem("Ketchup",              "veg",     20,  0,  5,  0,  0,  ["veg", "low-cal"]),
  dhokla:          mkItem("Dhokla",               "veg",     140, 5,  22, 4,  1,  ["veg", "low-cal"]),
  greenChutney:    mkItem("Green Chutney",         "veg",     20,  0,  3,  0,  1,  ["veg", "low-cal"]),
  pavBhaji:        mkItem("Pav Bhaji",             "veg",     380, 9,  58, 14, 6,  ["veg", "spicy", "high-fiber"]),
  maggi:           mkItem("Maggi Noodles",         "veg",     310, 7,  48, 10, 2,  ["veg"]),
  vegSandwich:     mkItem("Veg Sandwich",          "veg",     220, 6,  36, 6,  3,  ["veg"]),
  tomatoKetchup:   mkItem("Tomato Ketchup",        "veg",     20,  0,  5,  0,  0,  ["veg", "low-cal"]),
  choleBhature:    mkItem("Chole Bhature",         "veg",     560, 18, 80, 20, 12, ["veg", "high-fiber"]),
};

// --- Weekly menu -------------------------------------------------------------

export const weeklyMenu: WeeklyMenu = {
  Monday: {
    breakfast: { time: "7:30 - 9:30 AM",  items: [d.idliSambar, d.coconutChutney, d.masalaChai] },
    lunch:     { time: "12:30 - 2:30 PM", items: [d.dalFry, d.steamedRice, d.mixedVegSabzi, d.roti2, d.onionSalad] },
    snacks:    { time: "4:30 - 5:30 PM",  items: [d.samosa, d.tamarindChutney] },
    dinner:    { time: "7:30 - 9:30 PM",  items: [d.paneerBhurji, d.roti3, d.dalMakhani, d.jeeraRice] },
  },
  Tuesday: {
    breakfast: { time: "7:30 - 9:30 AM",  items: [d.poha, d.banana, d.masalaChai] },
    lunch:     { time: "12:30 - 2:30 PM", items: [d.rajmaCurry, d.steamedRice, d.roti2, d.alooGobiSabzi, d.pickle] },
    snacks:    { time: "4:30 - 5:30 PM",  items: [d.breadPakora, d.mintChutney] },
    dinner:    { time: "7:30 - 9:30 PM",  items: [d.chickenCurry, d.roti3, d.jeeraRice, d.raita] },
  },
  Wednesday: {
    breakfast: { time: "7:30 - 9:30 AM",  items: [d.alooParatha, d.curd, d.pickle, d.masalaChai] },
    lunch:     { time: "12:30 - 2:30 PM", items: [d.chanaMasala, d.bhatura2, d.onionRings, d.lassi] },
    snacks:    { time: "4:30 - 5:30 PM",  items: [d.vegCutlet, d.ketchup] },
    dinner:    { time: "7:30 - 9:30 PM",  items: [d.dalTadka, d.jeeraRice, d.alooSabzi, d.roti3] },
  },
  Thursday: {
    breakfast: { time: "7:30 - 9:30 AM",  items: [d.upma, d.coconutChutney, d.masalaChai] },
    lunch:     { time: "12:30 - 2:30 PM", items: [d.palakPaneer, d.roti3, d.steamedRice, d.moongDalSalad] },
    snacks:    { time: "4:30 - 5:30 PM",  items: [d.dhokla, d.greenChutney] },
    dinner:    { time: "7:30 - 9:30 PM",  items: [d.eggCurry, d.roti3, d.jeeraRice, d.papad] },
  },
  Friday: {
    breakfast: { time: "7:30 - 9:30 AM",  items: [d.masalaDosa, d.sambar, d.coconutChutney] },
    lunch:     { time: "12:30 - 2:30 PM", items: [d.dalTadka, d.jeeraRice, d.paneerButter, d.roti2, d.greenSalad] },
    snacks:    { time: "4:30 - 5:30 PM",  items: [d.pavBhaji] },
    dinner:    { time: "7:30 - 9:30 PM",  items: [d.muttonCurry, d.roti3, d.steamedRice, d.raita] },
  },
  Saturday: {
    breakfast: { time: "7:30 - 9:30 AM",  items: [d.breadButter, d.boiledEgg2, d.banana, d.milk] },
    lunch:     { time: "12:30 - 2:30 PM", items: [d.mixedDal, d.steamedRice, d.alooJeera, d.roti2] },
    snacks:    { time: "4:30 - 5:30 PM",  items: [d.maggi] },
    dinner:    { time: "7:30 - 9:30 PM",  items: [d.choleBhature, d.lassi, d.onionSalad] },
  },
  Sunday: {
    breakfast: { time: "7:30 - 9:30 AM",  items: [d.poha, d.banana, d.masalaChai] },
    lunch:     { time: "12:30 - 2:30 PM", items: [d.dalTadka, d.jeeraRice, d.alooSabzi, d.roti2, d.salad] },
    snacks:    { time: "4:30 - 5:30 PM",  items: [d.vegSandwich, d.tomatoKetchup] },
    dinner:    { time: "7:30 - 9:30 PM",  items: [d.paneerButter, d.dalMakhani, d.steamedRice, d.roti3] },
  },
};

// --- Helper functions --------------------------------------------------------

export function getTodayMenu(): DailyMenu {
  const key = JS_DAY_TO_KEY[new Date().getDay()] ?? "Monday";
  return weeklyMenu[key];
}

export function getTodayKey(): DayKey {
  return JS_DAY_TO_KEY[new Date().getDay()] ?? "Monday";
}

export function getAllMenuItems(): MenuItem[] {
  const seen = new Set<number>();
  const result: MenuItem[] = [];
  for (const day of DAYS) {
    const menu = weeklyMenu[day];
    for (const mealType of MEAL_ORDER) {
      for (const item of menu[mealType].items) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          result.push(item);
        }
      }
    }
  }
  return result;
}

export function getItemsByTag(tag: string): MenuItem[] {
  return getAllMenuItems().filter((item) => item.tags.includes(tag));
}
