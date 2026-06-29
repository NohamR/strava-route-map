from __future__ import annotations

import json
from collections import Counter

from polyline import decode as decode_polyline
from strava_graphql import SuggestedRoute, SuggestedRoutesResult

COLORS = [
    "#e41a1c",
    "#377eb8",
    "#4daf4a",
    "#984ea3",
    "#ff7f00",
    "#a65628",
    "#f781bf",
]


def get_route_coords(route: SuggestedRoute) -> list[list[tuple[float, float]]]:
    coords = []
    for leg in route.legs:
        for path in leg.paths:
            decoded = decode_polyline(path.polyline.data)
            coords.append(decoded)
    return coords


def _route_bounds(
    all_coords: list[list[tuple[float, float]]],
) -> tuple[float, float, float, float]:
    lats = [p for seg in all_coords for (p, _) in seg]
    lngs = [p for seg in all_coords for (_, p) in seg]
    return min(lats), max(lats), min(lngs), max(lngs)


def _common_region(routes: list[dict]) -> str:
    regions = [
        r["location"].split(", ", 1)[-1] for r in routes if ", " in r["location"]
    ]
    return Counter(regions).most_common(1)[0][0] if regions else ""


def display_routes_map(
    result: SuggestedRoutesResult,
    filename: str = "routes_map.html",
) -> str:
    routes_data = []
    for i, route in enumerate(result.routes):
        coords = get_route_coords(route)
        bounds = _route_bounds(coords)
        color = COLORS[i % len(COLORS)]
        eta = (
            f"{route.completionTimeEstimation.expectedTime / 60:.0f} min"
            if route.completionTimeEstimation
            else ""
        )
        routes_data.append(
            {
                "index": i,
                "title": route.title,
                "type": route.routeType,
                "distance_km": round(route.length / 1000, 1),
                "elevation_m": round(route.elevationGain),
                "location": route.locationSummary,
                "eta": eta,
                "color": color,
                "bounds": bounds,
                "coords": coords,
            }
        )

    cur = result.pointSourceType.currentLocation

    sidebar_items_html = "\n".join(_sidebar_item(d) for d in routes_data)
    routes_js = _routes_js(routes_data)
    cur_js = _current_location_js(cur) if cur else ""
    location_summary = _common_region(routes_data)

    bb = result.adjustedBoundingBox
    if bb:
        center_lat = (bb.northeastCorner.lat + bb.southwestCorner.lat) / 2
        center_lng = (bb.northeastCorner.lng + bb.southwestCorner.lng) / 2
        bb_ne_lat = bb.northeastCorner.lat
        bb_ne_lng = bb.northeastCorner.lng
        bb_sw_lat = bb.southwestCorner.lat
        bb_sw_lng = bb.southwestCorner.lng
    elif cur:
        center_lat = cur["point"]["lat"]
        center_lng = cur["point"]["lng"]
        bb_ne_lat = center_lat + 0.05
        bb_ne_lng = center_lng + 0.05
        bb_sw_lat = center_lat - 0.05
        bb_sw_lng = center_lng - 0.05
    else:
        center_lat = 0
        center_lng = 0
        bb_ne_lat = bb_ne_lng = bb_sw_lat = bb_sw_lng = 0

    html = _HTML_TEMPLATE.format(
        total_count=result.totalCount,
        location_summary=location_summary,
        center_lat=center_lat,
        center_lng=center_lng,
        sidebar_items=sidebar_items_html,
        routes_js=routes_js,
        cur_js=cur_js,
        bb_ne_lat=bb_ne_lat,
        bb_ne_lng=bb_ne_lng,
        bb_sw_lat=bb_sw_lat,
        bb_sw_lng=bb_sw_lng,
    )

    with open(filename, "w", encoding="utf-8") as f:
        f.write(html)
    return filename


def _sidebar_item(d: dict) -> str:
    meta = f"{d['type']} \u00b7 {d['distance_km']} km \u00b7 {d['elevation_m']} m"
    eta_html = f'\n      <div class="route-eta">{d["eta"]}</div>' if d["eta"] else ""
    return f"""    <li class="route-item" data-index="{d["index"]}" style="--acolor:{d["color"]}">
      <div class="route-dot-wrap"><div class="route-color" style="background:{d["color"]}"></div></div>
      <div class="route-info">
        <div class="route-title">{d["title"]}</div>
        <div class="route-meta">{meta}</div>
        <div class="route-location">{d["location"]}</div>
      </div>{eta_html}
    </li>"""


def _routes_js(routes: list[dict]) -> str:
    parts = []
    for d in routes:
        segs = json.dumps(d["coords"])
        parts.append(f"""{{
          index:{d["index"]},
          title:{json.dumps(d["title"])},
          color:{json.dumps(d["color"])},
          coords:{segs},
          bounds:[{d["bounds"][0]},{d["bounds"][1]},{d["bounds"][2]},{d["bounds"][3]}],
        }}""")
    return "[" + ",\n".join(parts) + "]"


def _current_location_js(cur: dict) -> str:
    return f"""L.marker([{cur["point"]["lat"]}, {cur["point"]["lng"]}], {{
      icon: L.divIcon({{className:"", html:'<div style="background:red;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 4px rgba(0,0,0,.4)"></div>', iconSize:[16,16], iconAnchor:[8,8]}}),
      zIndexOffset:1000,
    }}).addTo(map).bindPopup("Current location");"""


_HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Suggested Routes</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
*, *::before, *::after {{ margin: 0; padding: 0; box-sizing: border-box; }}

body {{
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  -webkit-font-smoothing: antialiased;
}}

html, body, #wrapper {{ height: 100%; overflow: hidden; }}
#wrapper {{ display: flex; }}

/* -- sidebar -- */

#sidebar {{
  width: 310px;
  min-width: 310px;
  background: #f6f2ed;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #d8d2ca;
  box-shadow: 3px 0 16px rgba(0,0,0,.07);
  position: relative;
  z-index: 1;
}}

#sidebar-header {{
  padding: 17px 17px 13px;
  border-bottom: 1px solid #d8d2ca;
}}

.header-eyebrow {{
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #a89f97;
  margin-bottom: 5px;
  font-family: 'JetBrains Mono', monospace;
}}

#sidebar-header h1 {{
  font-size: 14px;
  font-weight: 700;
  color: #1a1614;
  letter-spacing: -0.02em;
  line-height: 1;
}}

/* -- list -- */

#route-list {{
  flex: 1;
  overflow-y: auto;
  list-style: none;
}}

#route-list::-webkit-scrollbar {{ width: 3px; }}
#route-list::-webkit-scrollbar-track {{ background: transparent; }}
#route-list::-webkit-scrollbar-thumb {{ background: #c4bcb4; border-radius: 2px; }}

/* -- item -- */

.route-item {{
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 13px 11px 12px;
  cursor: pointer;
  border-left: 3px solid transparent;
  border-bottom: 1px solid #e4dfd8;
  transition: background .11s ease, border-left-color .13s ease;
}}

.route-item:last-child {{ border-bottom: none; }}

.route-item:hover {{
  background: #ede9e3;
  border-left-color: #cac3ba;
}}

.route-item.active {{
  background: #e8e3dc;
  border-left-color: var(--acolor);
}}

/* -- dot -- */

.route-dot-wrap {{
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}}

.route-color {{
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: transform .15s ease, box-shadow .15s ease;
}}

.route-item:hover .route-color {{
  transform: scale(1.25);
}}

.route-item.active .route-color {{
  transform: scale(1.3);
  box-shadow:
    0 0 0 2.5px #f6f2ed,
    0 0 0 4.5px var(--acolor);
}}

/* -- info block -- */

.route-info {{
  flex: 1;
  min-width: 0;
}}

.route-title {{
  font-size: 12px;
  font-weight: 600;
  color: #1a1614;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}}

.route-meta {{
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 5px;
}}

.meta-tag {{
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 9.5px;
  font-weight: 500;
  color: #6b6158;
  background: #ddd8d0;
  padding: 2px 5px;
  border-radius: 3px;
  white-space: nowrap;
  line-height: 1.6;
}}

.route-location {{
  font-size: 10px;
  color: #a89f97;
  margin-top: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}}

/* -- eta chip -- */

.route-eta {{
  flex-shrink: 0;
  align-self: flex-start;
  margin-top: 1px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 500;
  color: #3e3a35;
  background: #ddd8d0;
  padding: 2.5px 6px;
  border-radius: 3px;
  white-space: nowrap;
  letter-spacing: 0.01em;
}}

/* -- map -- */

#map {{ flex: 1; height: 100%; }}
</style>
</head>
<body>
<div id="wrapper">
<div id="sidebar">
  <div id="sidebar-header">
    <div class="header-eyebrow">{total_count} routes \u00b7 {location_summary}</div>
    <h1>Suggested Routes</h1>
  </div>
  <ul id="route-list">
{sidebar_items}
  </ul>
</div>
<div id="map"></div>
</div>
<script>
document.querySelectorAll('.route-meta').forEach(function(el) {{
  var parts = el.textContent.split(' \u00b7 ');
  el.innerHTML = parts.map(function(p) {{
    return '<span class="meta-tag">' + p + '</span>';
  }}).join('');
}});

var map = L.map("map", {{zoomControl:true}}).setView([{center_lat}, {center_lng}], 13);

var osm = L.tileLayer("https://tile.openstreetmap.org/{{z}}/{{x}}/{{y}}.png", {{
  attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxZoom:19,
}});
var topo = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{{z}}/{{y}}/{{x}}", {{
  attribution:'&copy; <a href="https://www.esri.com/">Esri</a>',
  maxZoom:19,
}});
var street = L.tileLayer("https://{{s}}.basemaps.cartocdn.com/light_all/{{z}}/{{x}}/{{y}}{{r}}.png", {{
  attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
  subdomains:"abcd", maxZoom:20,
}});
var dark = L.tileLayer("https://{{s}}.basemaps.cartocdn.com/dark_all/{{z}}/{{x}}/{{y}}{{r}}.png", {{
  attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
  subdomains:"abcd", maxZoom:20,
}});
var satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{{z}}/{{y}}/{{x}}", {{
  attribution:'&copy; <a href="https://www.esri.com/">Esri</a>',
  maxZoom:19,
}});
var hybrid = L.layerGroup([
  satellite,
  L.tileLayer("https://{{s}}.basemaps.cartocdn.com/light_only_labels/{{z}}/{{x}}/{{y}}{{r}}.png", {{
    attribution:'&copy; <a href="https://carto.com/">CARTO</a>',
    subdomains:"abcd", maxZoom:20, opacity:0.85,
  }}),
]);

osm.addTo(map);
L.control.layers({{"OSM":osm,"Topo":topo,"Street":street,"Dark":dark,"Satellite":satellite,"Hybrid":hybrid}}, null, {{position:"bottomleft"}}).addTo(map);

L.rectangle([[{bb_sw_lat},{bb_sw_lng}],[{bb_ne_lat},{bb_ne_lng}]],{{
  color:"#666", weight:1, fill:false, interactive:false,
}}).addTo(map);

var routes = {routes_js};
var polylines = [];
var activeIndex = -1;

routes.forEach(function(r, i) {{
  var group = [];
  r.coords.forEach(function(seg) {{
    var poly = L.polyline(seg, {{color:r.color, weight:4, opacity:0.5, smoothFactor:1.5}}).addTo(map);
    poly.on("click", function(){{ selectRoute(i); }});
    group.push(poly);
  }});
  polylines.push(group);
}});

{cur_js}

function selectRoute(idx) {{
  activeIndex = (activeIndex === idx) ? -1 : idx;
  updateVisibility();
  document.querySelectorAll(".route-item").forEach(function(el, i) {{
    el.classList.toggle("active", i === activeIndex);
  }});
  if (activeIndex >= 0) {{
    var b = routes[activeIndex].bounds;
    map.fitBounds([[b[0],b[2]],[b[1],b[3]]], {{padding:[40,40], maxZoom:15}});
  }} else {{
    map.fitBounds([[{bb_sw_lat},{bb_sw_lng}],[{bb_ne_lat},{bb_ne_lng}]], {{padding:[40,40], maxZoom:13}});
  }}
}}

function updateVisibility() {{
  routes.forEach(function(r, i) {{
    polylines[i].forEach(function(poly) {{
      if (activeIndex === -1) {{
        poly.setStyle({{opacity:0.5, weight:4}}); poly.bringToBack();
      }} else if (i === activeIndex) {{
        poly.setStyle({{opacity:1, weight:5}}); poly.bringToFront();
      }} else {{
        poly.setStyle({{opacity:0.12, weight:2.5}}); poly.bringToBack();
      }}
    }});
  }});
}}

document.querySelectorAll(".route-item").forEach(function(el) {{
  el.addEventListener("click", function() {{
    selectRoute(parseInt(el.dataset.index));
  }});
}});
</script>
</body>
</html>"""
