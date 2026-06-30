# Strava Route Map - Web App

Search and explore suggested routes from Strava on an interactive map.

## Features

- Search Strava routes by location, type, difficulty, elevation, and distance
- Interactive Leaflet map with 6 base layers (OSM, Topo, Street, Dark, Satellite, Hybrid)
- Route list with detail cards, ETA, and images
- GPX export for any route
- Unit toggle : switch between km/m and mi/ft (persisted in localStorage)

## Tech Stack

React 19, TypeScript 6, Vite 8, Tailwind CSS v4, shadcn/ui (base-nova), Leaflet, Lucide icons.

## Build

```sh
npm install
npm run dev    # dev server
npm run build  # production build
```
