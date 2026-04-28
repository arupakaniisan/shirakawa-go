// localStorage 読み書き
export type Vehicle = {
  id: string;
  name: string;
  color: string;
};

const STORAGE_KEY = "shirakawa-go:vehicles";

const DEFAULT_VEHICLES: Vehicle[] = [
  { id: "vehicle-001", name: "車A", color: "#E53935" },
  { id: "vehicle-002", name: "車B", color: "#1E88E5" },
];

export function getVehicles(): Vehicle[] {
  if (typeof window === "undefined") return DEFAULT_VEHICLES;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_VEHICLES;
  try {
    return JSON.parse(raw) as Vehicle[];
  } catch {
    return DEFAULT_VEHICLES;
  }
}

export function saveVehicles(vehicles: Vehicle[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
}
