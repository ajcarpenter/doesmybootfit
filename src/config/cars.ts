// Converted from config/cars.js to TypeScript
export interface CarConfig {
  name: string;
  W: number;
  D: number;
  H_shelf_in: number;
  H_shelf_out: number;
  bootShapeMode?: 'cube' | 'mesh';
  bootMesh?: import('../types').MeshBootConfig; // optional custom mesh
}

export const PRESET_CARS: Record<string, CarConfig> = {
  ENYAQ: { name: 'Skoda Enyaq', W: 100, D: 93, H_shelf_in: 49, H_shelf_out: 73 },
  MODEL_3: { name: 'Tesla Model 3', W: 97, D: 109, H_shelf_in: 43, H_shelf_out: 43 },
  I4: { name: 'BMW i4', W: 100, D: 105, H_shelf_in: 45, H_shelf_out: 75 },
  YARIS_CROSS: { name: 'Toyota Yaris Cross', W: 100, D: 79, H_shelf_in: 41, H_shelf_out: 67 },
  CAPTUR: { name: 'Renault Captur', W: 101, D: 68, H_shelf_in: 41, H_shelf_out: 62 },
  GOLF_8: { name: 'Volkswagen Golf (Mk8) hatch', W: 101, D: 75, H_shelf_in: 43, H_shelf_out: 67 },
  PEUGEOT_308: { name: 'Peugeot 308 (hatch)', W: 95, D: 76, H_shelf_in: 48, H_shelf_out: 68 },
  GOLF_8_SW: {
    name: 'Volkswagen Golf 8 SW (estate)',
    W: 101,
    D: 104,
    H_shelf_in: 49,
    H_shelf_out: 68,
  },
  PEUGEOT_308_SW: {
    name: 'Peugeot 308 SW (estate)',
    W: 104,
    D: 103,
    H_shelf_in: 49,
    H_shelf_out: 68,
  },
  TIGUAN: { name: 'Volkswagen Tiguan', W: 101, D: 94, H_shelf_in: 68, H_shelf_out: 103 },
  SEAT_ATECA: { name: 'SEAT Ateca', W: 101, D: 83, H_shelf_in: 53, H_shelf_out: 92 },
  TUCSON: { name: 'Hyundai Tucson', W: 104, D: 89, H_shelf_in: 42, H_shelf_out: 77 },
  AUSTRAL: { name: 'Renault Austral', W: 106, D: 82, H_shelf_in: 52, H_shelf_out: 73 },
  PASSAT_SW: {
    name: 'Volkswagen Passat SW (estate)',
    W: 100,
    D: 114,
    H_shelf_in: 50,
    H_shelf_out: 76,
  },
  QASHQAI_J12: { name: 'Nissan Qashqai (J12)', W: 110, D: 86, H_shelf_in: 46, H_shelf_out: 70 },
  MEGANE_IV: { name: 'Renault Mégane (hatch, IV)', W: 101, D: 75, H_shelf_in: 45, H_shelf_out: 67 },
  ASTRA_L: { name: 'Opel Astra (L, hatch)', W: 100, D: 73, H_shelf_in: 38, H_shelf_out: 72 },
  MEGANE_ESTATE: {
    name: 'Renault Mégane Estate (IV)',
    W: 110,
    D: 93,
    H_shelf_in: 46,
    H_shelf_out: 68,
  },
  C5_AIRCROSS: { name: 'Citroën C5 Aircross', W: 106, D: 96, H_shelf_in: 49, H_shelf_out: 77 },
  '308_SW_III': { name: 'Peugeot 308 SW (III)', W: 104, D: 103, H_shelf_in: 49, H_shelf_out: 68 },
  MEGANE_ESTATE_VS_308_SW_REF: {
    name: 'Peugeot 308 SW (II as ref. set)',
    W: 106,
    D: 107,
    H_shelf_in: 50,
    H_shelf_out: 72,
  },
};
