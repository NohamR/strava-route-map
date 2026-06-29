from strava_graphql import *
from route_map import display_routes_map
from login import get_bearer

# route_types :
# Foot Sports :
# Run, TrailRun, Walk, Hike
# Cycle Sports :
# Ride, MountainBikeRide, GravelRide

options = SuggestedRouteOptions(
    prefs=RoutePrefs(
        difficulty=['Undefined'], elevation=0, enforce_pass_thru_source=False,
        route_types=['Ride'], surface_type='Unknown', target_distance=-1,
    ),
    source=RouteSource(
        bounding_box_with_point=BoundingBoxWithPoint(
            bounding_box=BoundingBox(
                northeast_corner=Point(lat=??.707635807296661, lng=??.2102107930518207),
                northwest_corner=Point(lat=??.707635807296661, lng=??.1605019567412889),
                southeast_corner=Point(lat=??.645964691271445, lng=??.2102287593570034),
                southwest_corner=Point(lat=??.645964691271445, lng=??.1605164140024904),
            ),
            point=PointSource(
                current_location=CurrentLocation(
                    point=Point(lat=??.688180422617229, lng=??.1853723941463246)
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
print(f"Search area: {result.adjustedBoundingBox}\n")
for i, r in enumerate(result.routes, 1):
    print(f"  {i}. {r.title}")
    print(f"     {r.routeType} | {r.length/1000:.1f} km | {r.elevationGain:.0f} m")
    print(f"     {r.locationSummary}")
    if r.completionTimeEstimation:
        mins = r.completionTimeEstimation.expectedTime / 60
        print(f"     Estimated time: {mins:.0f} min")
    print()