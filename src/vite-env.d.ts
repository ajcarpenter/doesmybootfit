/// <reference types="vite/client" />

declare module '../config/cars.js' {
  export const PRESET_CARS: Record<string, { name: string; W: number; D: number; H_shelf_in: number; H_shelf_out: number }>;
}
declare module '../config/items.js' {
  export const PRESET_ITEMS: Record<string, { name: string; L: number; W: number; T: number }>;
}
