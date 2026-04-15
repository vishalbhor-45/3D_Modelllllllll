# 3D Model Viewer

A React + Vite application for viewing 3D bridge models using Three.js and React Three Fiber.

## Features

- 🎨 Realistic lighting and shadows
- 🖱️ Interactive orbit controls (rotate, zoom, pan)
- 📦 Optimized loading with KTX2 texture compression and Meshopt
- 🎭 High-quality rendering with ACES Filmic tone mapping
- 🗺️ Leaflet map integration (free, no API key required)
- 📋 Dynamic model selector dropdown

## Setup

1. Install dependencies:
```bash
npm install
```

2. Add your 3D model files:
   - Place your `.glb` model files in `public/models/` directory
   - Run `npm run update-models` to update the model list
   - Models will automatically appear in the dropdown selector

3. Run the development server:
```bash
npm run dev
```

## Model Files

**Note:** Large GLB model files (>100MB) are excluded from Git due to GitHub's file size limits. 

To use this project:
1. Add your model files to `public/models/` directory locally
2. For production, host model files on a CDN or cloud storage
3. Update the model path in `src/Bridge.jsx` to point to your hosted files if needed

## Tech Stack

- React 19
- Vite
- Three.js
- React Three Fiber
- React Three Drei
- Tailwind CSS
- react-leaflet & leaflet (Free open-source mapping)

## Project Structure

- `src/App.jsx` - Main scene setup with lighting and controls
- `src/Bridge.jsx` - Bridge model loader component
- `src/MapComponent.jsx` - Leaflet map integration component
- `src/ModelSelector.jsx` - Dynamic model selection dropdown
- `src/Car.jsx` - Procedural car component (unused)
- `public/models/` - 3D model files (not tracked in Git)
- `public/models/models.json` - Auto-generated model manifest
- `scripts/update-models-list.js` - Script to update model list
