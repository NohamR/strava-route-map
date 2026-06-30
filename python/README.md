# Strava Route Map - Python CLI

Query the Strava suggested routes API and render the results on an interactive Leaflet map.

## Setup
```bash
uv sync
```
You'll need a Strava bearer token. The first time you run the script it will ask for your email and an OTP sent to your inbox. The token is cached in `.strava_token` so you only need to do this once.

## Usage
```bash
uv run main.py --help
```
```bash
options:
  -h, --help            show this help message and exit
  --route-type {Run,TrailRun,Walk,Hike,Ride,MountainBikeRide,GravelRide}
                        Type of route (required)
  --location LAT,LNG    Center point latitude,longitude (required)
  --difficulty {Easy,Moderate,Hard,Undefined}
                        Route difficulty filter (default: Undefined)
  --elevation ELEVATION
                        Minimum elevation gain in meters (default: 0)
  --target-distance TARGET_DISTANCE
                        Target distance in km (default: -1 = no preference). Converted to meters for the API.
  --bounding-box NE_LAT,NE_LNG,SW_LAT,SW_LNG
                        Bounding box corners (optional, auto-generated from location if omitted)
```

An HTML file (`routes_map.html`) is written to the current directory. Open it in a browser to see the routes on a map with a sidebar listing each one.

### Examples
Find suggested rides near a location:
```bash
uv run main.py --route-type Ride --location 48,852,2,348
```

Hard rides around 50 km on Long Island:
```bash
uv run main.py --route-type Ride --location 48,852,2,348 --difficulty Hard --target-distance 50
```

Run routes with a custom bounding box:
```bash
uv run main.py --route-type Run --location 48,852,2,348 --bounding-box 48.73,2.25,48.64,2.13
```

### CLI generator
Open `cli_generator.html` in a browser. Select your parameters on the form and
it will generate the CLI command for you. You can click the map to choose a
location or use the browser's geolocation API.