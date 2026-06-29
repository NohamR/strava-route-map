from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any, Optional
import requests


GRAPHQL_URL = "https://graphql.strava.com/"

SUGGESTED_ROUTES_QUERY = """query SuggestedRoutes($args: SuggestedRouteOptionsInput!, $first: Int, $after: Cursor, $resolutions: [FlatmapResolutionInput!]!, $minSizeDesired: Short!, $lookupOptions: LookupOptionsInput) { suggestedRoutesBySourceGeo(args: $args, first: $first, after: $after) { __typename routes { __typename nodes { __typename ... on SuggestedRoute { elevationGain completionTimeEstimation { __typename expectedTime } length locationSummary(lookupOptions: $lookupOptions) routeSource title routeType routeUrl routeDetails { __typename overallDifficulty } themedMapImages(resolutions: $resolutions) { __typename darkUrl lightUrl } routePolylineData { __typename media(limit: 3, preferUnique: true) { __typename mediaDetails { __typename ... on Photo { imageUrlWithMetadata(minSizeDesired: $minSizeDesired) { __typename imageUrl size { __typename height width } } imageUrl(minSizeDesired: $minSizeDesired) } } } } legs { __typename paths { __typename polyline { __typename data } } } } } pageInfo { __typename hasNextPage endCursor } } totalCount adjustedBoundingBox { __typename northeastCorner { __typename lat lng } southwestCorner { __typename lat lng } } pointSourceType { __typename searchPoint { __typename point { __typename lat lng } } droppedPin { __typename point { __typename lng lat } } currentLocation { __typename point { __typename lng lat } } } } }"""


# --- Input types ---

@dataclass
class Point:
    lat: float
    lng: float


@dataclass
class BoundingBox:
    northeast_corner: Point
    northwest_corner: Point
    southeast_corner: Point
    southwest_corner: Point


@dataclass
class CurrentLocation:
    point: Point


@dataclass
class PointSource:
    current_location: CurrentLocation


@dataclass
class BoundingBoxWithPoint:
    bounding_box: BoundingBox
    point: PointSource


@dataclass
class RoutePrefs:
    difficulty: list[str]
    elevation: int
    enforce_pass_thru_source: bool
    route_types: list[str]
    surface_type: str
    target_distance: int


@dataclass
class RouteSource:
    bounding_box_with_point: BoundingBoxWithPoint


@dataclass
class SuggestedRouteOptions:
    prefs: RoutePrefs
    source: RouteSource


@dataclass
class FlatmapResolution:
    height: int
    width: int


@dataclass
class LookupOptions:
    locale: str
    source: str


# --- Response types ---

@dataclass
class MediaSize:
    height: int
    width: int


@dataclass
class UrlWithMetadata:
    imageUrl: str
    size: MediaSize


@dataclass
class Photo:
    imageUrlWithMetadata: UrlWithMetadata
    imageUrl: str


@dataclass
class GeoMedia:
    mediaDetails: Photo


@dataclass
class PolylineData:
    media: list[GeoMedia]


@dataclass
class EncodedStream:
    data: str


@dataclass
class Path:
    polyline: EncodedStream


@dataclass
class Leg:
    paths: list[Path]


@dataclass
class CompletionTimeEstimation:
    expectedTime: Optional[float]


@dataclass
class RouteDetails:
    overallDifficulty: Optional[str]


@dataclass
class MapImage:
    darkUrl: str
    lightUrl: str


@dataclass
class SuggestedRoute:
    elevationGain: float
    completionTimeEstimation: Optional[CompletionTimeEstimation]
    length: float
    locationSummary: str
    routeSource: str
    title: str
    routeType: str
    routeUrl: str
    routeDetails: RouteDetails
    themedMapImages: list[MapImage]
    routePolylineData: PolylineData
    legs: list[Leg]


@dataclass
class PageInfo:
    hasNextPage: bool
    endCursor: Optional[str]


@dataclass
class AdjustedBoundingBox:
    northeastCorner: Point
    southwestCorner: Point


@dataclass
class PointSourceResult:
    searchPoint: Optional[dict]
    droppedPin: Optional[dict]
    currentLocation: Optional[dict]


@dataclass
class SuggestedRoutesResult:
    routes: list[SuggestedRoute]
    pageInfo: PageInfo
    totalCount: int
    adjustedBoundingBox: AdjustedBoundingBox
    pointSourceType: PointSourceResult


def _to_camel(s: str) -> str:
    parts = s.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def _convert_keys(v: Any) -> Any:
    if isinstance(v, dict):
        return {_to_camel(k): _convert_keys(v2) for k, v2 in v.items()}
    if isinstance(v, list):
        return [_convert_keys(i) for i in v]
    return v


def getSuggestedRoutes(
    options: SuggestedRouteOptions,
    first: int = 15,
    after: Optional[str] = None,
    resolutions: Optional[list[FlatmapResolution]] = None,
    min_size_desired: int = 512,
    lookup_options: Optional[LookupOptions] = None,
    headers: Optional[dict[str, str]] = None,
    timeout: Optional[int] = None,
) -> SuggestedRoutesResult:
    if resolutions is None:
        resolutions = [FlatmapResolution(height=512, width=512)]
    if lookup_options is None:
        lookup_options = LookupOptions(locale="en", source="Mysql")

    variables: dict[str, Any] = {
        "args": _convert_keys(asdict(options)),
        "first": first,
        "resolutions": [asdict(r) for r in resolutions],
        "minSizeDesired": min_size_desired,
        "lookupOptions": _convert_keys(asdict(lookup_options)),
    }
    if after is not None:
        variables["after"] = after

    payload = {
        "operationName": "SuggestedRoutes",
        "query": SUGGESTED_ROUTES_QUERY,
        "variables": variables,
    }

    default_headers: dict[str, str] = {
        "Host": "graphql.strava.com",
        "Accept": "*/*",
        "Accept-Language": "en-GB,en;q=0.9",
        "User-Agent": "Strava 422.0.1 (49113)|iPhone|iPhone10,1|iOS|16.7.15|en-FR",
        "X-APOLLO-OPERATION-TYPE": "query",
        "apollographql-client-name": "strava-ios",
        "apollographql-client-version": "422.0.1-49113",
        "Connection": "keep-alive",
        "hl": "en",
        "X-APOLLO-OPERATION-NAME": "SuggestedRoutes",
        "Content-Type": "application/json",
    }
    merged_headers = {**default_headers, **(headers or {})}

    resp = requests.post(
        GRAPHQL_URL,
        headers=merged_headers,
        json=payload,
        timeout=timeout,
    )
    resp.raise_for_status()
    data = resp.json()["data"]["suggestedRoutesBySourceGeo"]

    return _parse_suggested_routes_response(data)


def _parse_photo(d: dict) -> Photo:
    md = d["mediaDetails"]
    iwm = md["imageUrlWithMetadata"]
    size = MediaSize(
        height=iwm["size"]["height"],
        width=iwm["size"]["width"],
    )
    return Photo(
        imageUrlWithMetadata=UrlWithMetadata(imageUrl=iwm["imageUrl"], size=size),
        imageUrl=md["imageUrl"],
    )


def _parse_polyline_data(d: dict) -> PolylineData:
    return PolylineData(
        media=[GeoMedia(mediaDetails=_parse_photo(m)) for m in d.get("media", [])]
    )


def _parse_leg(d: dict) -> Leg:
    return Leg(
        paths=[
            Path(polyline=EncodedStream(data=p["polyline"]["data"]))
            for p in d["paths"]
        ]
    )


def _parse_suggested_route(d: dict) -> SuggestedRoute:
    cte = d.get("completionTimeEstimation")
    return SuggestedRoute(
        elevationGain=d["elevationGain"],
        completionTimeEstimation=CompletionTimeEstimation(
            expectedTime=cte["expectedTime"]
        ) if cte else None,
        length=d["length"],
        locationSummary=d["locationSummary"],
        routeSource=d["routeSource"],
        title=d["title"],
        routeType=d["routeType"],
        routeUrl=d["routeUrl"],
        routeDetails=RouteDetails(
            overallDifficulty=d["routeDetails"]["overallDifficulty"]
        ),
        themedMapImages=[
            MapImage(darkUrl=i["darkUrl"], lightUrl=i["lightUrl"])
            for i in d["themedMapImages"]
        ],
        routePolylineData=_parse_polyline_data(d["routePolylineData"]),
        legs=[_parse_leg(leg) for leg in d["legs"]],
    )


def _parse_suggested_routes_response(data: dict) -> SuggestedRoutesResult:
    routes_data = data["routes"]
    return SuggestedRoutesResult(
        routes=[_parse_suggested_route(n) for n in routes_data["nodes"]],
        pageInfo=PageInfo(
            hasNextPage=routes_data["pageInfo"]["hasNextPage"],
            endCursor=routes_data["pageInfo"]["endCursor"],
        ),
        totalCount=data["totalCount"],
        adjustedBoundingBox=AdjustedBoundingBox(
            northeastCorner=Point(
                lat=data["adjustedBoundingBox"]["northeastCorner"]["lat"],
                lng=data["adjustedBoundingBox"]["northeastCorner"]["lng"],
            ),
            southwestCorner=Point(
                lat=data["adjustedBoundingBox"]["southwestCorner"]["lat"],
                lng=data["adjustedBoundingBox"]["southwestCorner"]["lng"],
            ),
        ),
        pointSourceType=PointSourceResult(
            searchPoint=data["pointSourceType"].get("searchPoint"),
            droppedPin=data["pointSourceType"].get("droppedPin"),
            currentLocation=data["pointSourceType"].get("currentLocation"),
        ),
    )
