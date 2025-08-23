# Does My Boot Fit

A free 3D tool to visually check if strollers, luggage, and other items will fit in your car's boot. Supports presets for popular cars and items, or create your own.

## Features

- **3D Visualization**: Interactive 3D scene using Three.js
- **Preset Cars**: Pre-configured dimensions for popular car models
- **Preset Items**: Common items like strollers and luggage
- **Custom Items**: Add your own items with custom dimensions
- **Custom Cars**: Add your own car with custom boot dimensions
- **Collision Detection**: Check if items fit and don't overlap
- **Drag & Drop**: Move items around in the 3D scene
- **Responsive Design**: Works on desktop and mobile devices

## Project Structure

The project has been refactored into a clean, modular structure using modern JavaScript ES6 modules:

```
doesmybootfit/
├── index.html              # Main HTML file
├── styles/
│   └── main.css           # All CSS styles
├── config/
│   ├── cars.js            # Car preset configurations
│   └── items.js           # Item preset configurations
├── js/
│   ├── main.js            # Main application class
│   ├── scene.js           # Three.js scene management
│   ├── objects.js         # Object creation and management
│   ├── drag.js            # Drag and drop functionality
│   └── utils.js           # Utility functions
└── README.md              # This file
```

## Architecture

- **Modular Design**: Each module has a single responsibility
- **ES6 Modules**: Uses native JavaScript modules (no bundler required)
- **Class-based**: Object-oriented design for better organization
- **Modern JavaScript**: Uses latest JavaScript features (no transpilation needed)

### Key Modules

- **`SceneManager`**: Handles Three.js scene setup, camera, renderer, and controls
- **`ObjectManager`**: Manages 3D objects, collision detection, and fit checking
- **`DragHandler`**: Handles mouse/touch interactions for dragging objects
- **`UIManager`**: Manages all UI updates, form handling, and modal interactions
- **`BootFitApp`**: Main application class that orchestrates all modules

## Browser Support

This application uses modern JavaScript features and is designed for modern browsers. No transpilation or polyfills are required.

**Minimum Requirements:**
- ES6 Modules support
- WebGL support
- Modern CSS Grid and Flexbox support

## Deployment

### GitHub Pages

1. Push your code to a GitHub repository
2. Go to repository Settings > Pages
3. Select source branch (usually `main` or `master`)
4. Your app will be available at `https://username.github.io/repository-name`

### Local Development

Simply open `index.html` in a modern web browser. Due to ES6 modules, you'll need to serve the files from a local web server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000` in your browser.

## Adding New Cars

To add new car presets, edit `config/cars.js`:

```javascript
export const PRESET_CARS = {
    'YOUR_CAR': { 
        name: 'Your Car Name', 
        W: 100,        // Width in cm
        D: 93,         // Depth in cm
        H_shelf_in: 49, // Height with shelf in cm
        H_shelf_out: 73 // Height with shelf out cm
    },
    // ... existing cars
};
```

## Adding New Items

To add new item presets, edit `config/items.js`:

```javascript
export const PRESET_ITEMS = {
    'YOUR_ITEM': { 
        name: 'Your Item Name', 
        L: 84.5,  // Length in cm
        W: 65.3,  // Width in cm
        T: 44     // Thickness/Height in cm
    },
    // ... existing items
};
```

## Customization

The application is designed to be easily customizable:

- **Styling**: Modify `styles/main.css` to change the appearance
- **3D Scene**: Adjust lighting, camera position, and materials in `js/scene.js`
- **Physics**: Modify collision detection and fit logic in `js/objects.js`
- **UI**: Customize form layouts and interactions in `js/ui.js`

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.
