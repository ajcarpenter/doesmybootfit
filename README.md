# Does My Boot Fit?

A lightweight 3D fit checker to see if your ski boot (or any object) will fit in your car trunk. Built with React, TypeScript, and Three.js via @react-three/fiber.

Live site: https://doesmyboot.fit

## Features

- 3D scene of your car trunk and items you add
- Accurate object-vs-bounds and object-vs-object checks using OBB + SAT with small tolerance
- Drag, rotate, and snap controls
  - Snap to floor (rotation-aware height projection)
  - Snap rotations to 90°
  - Clamped motion that respects car dimensions and object size
- Sidebar UX
  - Car selection with custom car modal and shelf-in/out toggle (when removable)
  - Manage items: add presets, add custom, rename, delete, select
  - Object controls: position and rotation with snapping
  - Fit status badge with quick legend
  - Share/backup: copy share link, export/import JSON, reset and clear
  - Typeahead inputs with accessible combobox behavior
- Performance
  - rAF-batched recompute of collisions/fit
  - Canvas frameloop “always” with AdaptiveDpr and device DPR bounds
- Persistence & sharing
  - LocalStorage autosave of full scene
  - Hash-based share links that load and then clear the hash
  - Import/export JSON of the entire scene

## Tech stack

- React 19 + TypeScript 5 + Vite 7
- three.js, @react-three/fiber, @react-three/drei
- Plain CSS for styling

## Getting started

Prerequisites
- Node.js 20.19+ or 22.12+

Install and run
- npm ci
- npm run dev — start the dev server
- npm run build — produce a production build in dist/
- npm run preview — preview the production build

## Deployment (GitHub Pages)

This repo is wired to deploy via GitHub Actions to GitHub Pages.

- Workflow: .github/workflows/deploy.yml
- On push to main, CI builds the site, copies CNAME into dist, and deploys to Pages
- Vite base is set to '/' (correct for the custom domain)
- Ensure GitHub → Settings → Pages → Source is set to GitHub Actions

Custom domain
- The CNAME file at repo root contains: doesmyboot.fit
- Ensure your DNS points to GitHub Pages per GitHub’s docs

## Project structure

```
public/
  favicon.svg
  logo.png
src/
  components/        # 3D scene + sidebar UI
  hooks/             # shared UI/transform math
  utils/fitUtils.ts  # OBB/SAT fit and collision logic
  Sidebar.tsx        # sidebar composition
  App.tsx            # root state, persistence, fit coordination
styles/
  main.css           # UI styles
```

## Data model (simplified)

Types are in `src/types.ts`. A scene export/share payload roughly looks like:

```json
{
  "carKey": "outback_2021",
  "shelfIn": true,
  "userCars": {},
  "userItems": {},
  "activeObjectId": 3,
  "sceneObjects": [
    {
      "id": 3,
      "itemKey": "boot_26_5",
      "position": { "x": 50, "y": 14, "z": 75 },
      "rotation": { "yaw": 90, "pitch": 0, "roll": 0 },
      "snapToFloor": true
    }
  ]
}
```

Notes
- Positions/rotations are in centimeters/degrees
- Snap-to-floor auto-adjusts Y when enabled
- On load, fit is recomputed and the share hash is cleared
