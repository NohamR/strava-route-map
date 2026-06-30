from __future__ import annotations

import argparse
import sys

from strava_graphql import (
    BoundingBox,
    BoundingBoxWithPoint,
    CurrentLocation,
    Point,
    PointSource,
    RoutePrefs,
    RouteSource,
    SuggestedRouteOptions,
    getSuggestedRoutes,
)
from route_map import display_routes_map
from login import get_bearer

ROUTE_TYPES = [
    "Run",
    "TrailRun",
    "Walk",
    "Hike",
    "Ride",
    "MountainBikeRide",
    "GravelRide",
]
DIFFICULTIES = ["Easy", "Moderate", "Hard", "Undefined"]

DEFAULT_BOX_OFFSET = 0.05  # degrees (~5.5 km)


def parse_lat_lng(s: str) -> tuple[float, float]:
    parts = s.split(",")
    if len(parts) != 2:
        raise ValueError
    return float(parts[0]), float(parts[1])


def parse_bbox(s: str) -> tuple[float, float, float, float]:
    parts = s.split(",")
    if len(parts) != 4:
        raise ValueError
    return float(parts[0]), float(parts[1]), float(parts[2]), float(parts[3])


def build_bbox_around(
    lat: float, lng: float, offset: float = DEFAULT_BOX_OFFSET
) -> BoundingBox:
    return BoundingBox(
        northeast_corner=Point(lat=lat + offset, lng=lng + offset),
        northwest_corner=Point(lat=lat + offset, lng=lng - offset),
        southeast_corner=Point(lat=lat - offset, lng=lng + offset),
        southwest_corner=Point(lat=lat - offset, lng=lng - offset),
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Fetch and map suggested routes from Strava"
    )
    parser.add_argument(
        "--route-type",
        required=True,
        choices=ROUTE_TYPES,
        help="Type of route (required)",
    )
    parser.add_argument(
        "--location",
        required=True,
        type=parse_lat_lng,
        metavar="LAT,LNG",
        help="Center point latitude,longitude (required)",
    )
    parser.add_argument(
        "--difficulty",
        choices=DIFFICULTIES,
        default="Undefined",
        help="Route difficulty filter (default: Undefined)",
    )
    parser.add_argument(
        "--elevation",
        type=int,
        default=0,
        help="Minimum elevation gain in meters (default: 0)",
    )
    parser.add_argument(
        "--target-distance",
        type=float,
        default=-1,
        help="Target distance in km (default: -1 = no preference). Converted to meters for the API.",
    )
    parser.add_argument(
        "--bounding-box",
        type=parse_bbox,
        metavar="NE_LAT,NE_LNG,SW_LAT,SW_LNG",
        help="Bounding box corners (optional, auto-generated from location if omitted)",
    )

    args = parser.parse_args()
    lat, lng = args.location

    if args.bounding_box:
        ne_lat, ne_lng, sw_lat, sw_lng = args.bounding_box
        bbox = BoundingBox(
            northeast_corner=Point(lat=ne_lat, lng=ne_lng),
            northwest_corner=Point(lat=ne_lat, lng=sw_lng),
            southeast_corner=Point(lat=sw_lat, lng=ne_lng),
            southwest_corner=Point(lat=sw_lat, lng=sw_lng),
        )
    else:
        bbox = build_bbox_around(lat, lng)

    target_distance_m = (
        int(args.target_distance * 1000) if args.target_distance > 0 else -1
    )
    options = SuggestedRouteOptions(
        prefs=RoutePrefs(
            difficulty=[args.difficulty],
            elevation=args.elevation,
            enforce_pass_thru_source=False,
            route_types=[args.route_type],
            surface_type="Unknown",
            target_distance=target_distance_m,
        ),
        source=RouteSource(
            bounding_box_with_point=BoundingBoxWithPoint(
                bounding_box=bbox,
                point=PointSource(
                    current_location=CurrentLocation(
                        point=Point(lat=lat, lng=lng),
                    )
                ),
            )
        ),
    )

    token = get_bearer()
    headers = {"Authorization": f"Bearer {token}"}

    result = getSuggestedRoutes(options, headers=headers)

    filename = display_routes_map(result)
    print(f"Map saved to {filename}")

    print(f"\nTotal routes: {result.totalCount}")
    print(f"Has next page: {result.pageInfo.hasNextPage}")
    if result.adjustedBoundingBox:
        print(f"Search area: {result.adjustedBoundingBox}\n")
    else:
        print("No routes found — try expanding the bounding box or reducing filters.\n")
    for i, r in enumerate(result.routes, 1):
        print(f"  {i}. {r.title}")
        print(f"     {r.routeType} | {r.length/1000:.1f} km | {r.elevationGain:.0f} m")
        print(f"     {r.locationSummary}")
        if r.completionTimeEstimation:
            mins = r.completionTimeEstimation.expectedTime / 60
            print(f"     Estimated time: {mins:.0f} min")
        print()


if __name__ == "__main__":
    main()
