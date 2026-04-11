export type DisciplineCategory =
  | "Sprints"
  | "Middle Distance"
  | "Long Distance"
  | "Hurdles"
  | "Steeplechase"
  | "Road"
  | "Race Walk"
  | "Relays"
  | "Jumps"
  | "Throws"
  | "Combined Events";

export type Discipline = {
  value: string;
  label: string;
  unit: "s" | "m";
  wind: boolean; // whether wind is applicable
  category: DisciplineCategory;
};

export const DISCIPLINES: Discipline[] = [
  // Sprints
  { value: "60m", label: "60m", unit: "s", wind: true, category: "Sprints" },
  { value: "100m", label: "100m", unit: "s", wind: true, category: "Sprints" },
  { value: "200m", label: "200m", unit: "s", wind: true, category: "Sprints" },
  { value: "400m", label: "400m", unit: "s", wind: false, category: "Sprints" },

  // Middle Distance
  { value: "800m", label: "800m", unit: "s", wind: false, category: "Middle Distance" },
  { value: "1500m", label: "1500m", unit: "s", wind: false, category: "Middle Distance" },
  { value: "mile", label: "Mile", unit: "s", wind: false, category: "Middle Distance" },

  // Long Distance
  { value: "3000m", label: "3000m", unit: "s", wind: false, category: "Long Distance" },
  { value: "5000m", label: "5000m", unit: "s", wind: false, category: "Long Distance" },
  { value: "10000m", label: "10000m", unit: "s", wind: false, category: "Long Distance" },

  // Hurdles
  { value: "60mH", label: "60m Hurdles", unit: "s", wind: true, category: "Hurdles" },
  { value: "100mH", label: "100m Hurdles", unit: "s", wind: true, category: "Hurdles" },
  { value: "110mH", label: "110m Hurdles", unit: "s", wind: true, category: "Hurdles" },
  { value: "400mH", label: "400m Hurdles", unit: "s", wind: false, category: "Hurdles" },

  // Steeplechase
  { value: "2000mSC", label: "2000m Steeplechase", unit: "s", wind: false, category: "Steeplechase" },
  { value: "3000mSC", label: "3000m Steeplechase", unit: "s", wind: false, category: "Steeplechase" },

  // Road
  { value: "5km_road", label: "5km (Road)", unit: "s", wind: false, category: "Road" },
  { value: "10km_road", label: "10km (Road)", unit: "s", wind: false, category: "Road" },
  { value: "half_marathon", label: "Half Marathon", unit: "s", wind: false, category: "Road" },
  { value: "marathon", label: "Marathon", unit: "s", wind: false, category: "Road" },

  // Race Walk
  { value: "3000mW", label: "3000m Walk", unit: "s", wind: false, category: "Race Walk" },
  { value: "5000mW", label: "5000m Walk", unit: "s", wind: false, category: "Race Walk" },
  { value: "10000mW", label: "10000m Walk", unit: "s", wind: false, category: "Race Walk" },
  { value: "20kmW", label: "20km Walk", unit: "s", wind: false, category: "Race Walk" },

  // Relays
  { value: "4x100m", label: "4×100m", unit: "s", wind: false, category: "Relays" },
  { value: "4x400m", label: "4×400m", unit: "s", wind: false, category: "Relays" },

  // Jumps
  { value: "high_jump", label: "High Jump", unit: "m", wind: false, category: "Jumps" },
  { value: "long_jump", label: "Long Jump", unit: "m", wind: true, category: "Jumps" },
  { value: "triple_jump", label: "Triple Jump", unit: "m", wind: true, category: "Jumps" },
  { value: "pole_vault", label: "Pole Vault", unit: "m", wind: false, category: "Jumps" },

  // Throws
  { value: "shot_put", label: "Shot Put", unit: "m", wind: false, category: "Throws" },
  { value: "discus", label: "Discus", unit: "m", wind: false, category: "Throws" },
  { value: "hammer", label: "Hammer", unit: "m", wind: false, category: "Throws" },
  { value: "javelin", label: "Javelin", unit: "m", wind: false, category: "Throws" },

  // Combined Events
  { value: "pentathlon", label: "Pentathlon", unit: "m", wind: false, category: "Combined Events" },
  { value: "heptathlon", label: "Heptathlon", unit: "m", wind: false, category: "Combined Events" },
  { value: "decathlon", label: "Decathlon", unit: "m", wind: false, category: "Combined Events" },
];

export const DISCIPLINE_MAP = new Map(DISCIPLINES.map((d) => [d.value, d]));

export const CATEGORIES: DisciplineCategory[] = [
  "Sprints",
  "Middle Distance",
  "Long Distance",
  "Hurdles",
  "Steeplechase",
  "Road",
  "Race Walk",
  "Relays",
  "Jumps",
  "Throws",
  "Combined Events",
];
