<p align="center">
    <img src="docs/images/logo_bg.png" width="256">
    <br/>
    <strong>strava-route-map</strong>
    <br/>
    <sup><em>Strava Route Explorer</em></sup>
</p>

<p align="center">
    <a href="https://github.com/NohamR/strava-route-map/blob/main/LICENSE">
        <img src="https://img.shields.io/:license-MIT-blue.svg" alt="License">
    </a>
    <a href="https://github.com/NohamR/strava-route-map">
        <img src="https://img.shields.io/badge/status-active-brightgreen" alt="Status">
    </a>
</p>

Query the Strava suggested routes API and render the results on an interactive Leaflet map.

## Web app

Open the [deployed page](https://nohamr.github.io/strava-route-map/) in a browser. Authenticate with your Strava email (OTP flow), pick your route parameters, and browse suggested routes directly on the map.

The web app talks to Strava through a CORS proxy (`cors.noh.am`) and caches your bearer token in `localStorage`.

## Python CLI

See [python/README.md](python/README.md) for setup and usage.

---

This project is not affiliated with Strava. It uses Strava's internal GraphQL API which is not public and may break at any time. Use at your own risk, it might violate Strava's Terms of Service.