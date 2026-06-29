import requests

headers = {
    "Host": "graphql.strava.com",
    "baggage": "sentry-environment=release,sentry-public_key=8207a88a55744998ac1c43d6443f980a,sentry-release=com.strava.stravaride%4042??.0.1%2B49113,sentry-trace_id=c91f160bf5654cbaad0d27b44be3c8e0",
    "apollographql-client-version": "42??.0.1-49113",
    "Authorization": "Bearer [REDACTED]",
    "Accept": "*/*",
    "Accept-Language": "en-GB,en;q=0.9",
    "User-Agent": "Strava 42??.0.1 (49113)|iPhone|iPhone10,1|iOS|16.7.15|en-FR",
    "X-APOLLO-OPERATION-TYPE": "query",
    "apollographql-client-name": "strava-ios",
    "Connection": "keep-alive",
    "hl": "en",
    "X-APOLLO-OPERATION-NAME": "SuggestedRoutes",
    "Content-Type": "application/json",
}

data = {
    "operationName": "SuggestedRoutes",
    "query": "query SuggestedRoutes($args: SuggestedRouteOptionsInput!, $first: Int, $after: Cursor, $resolutions: [FlatmapResolutionInput!]!, $minSizeDesired: Short!, $lookupOptions: LookupOptionsInput) { suggestedRoutesBySourceGeo(args: $args, first: $first, after: $after) { __typename routes { __typename nodes { __typename ... on SuggestedRoute { elevationGain completionTimeEstimation { __typename expectedTime } length locationSummary(lookupOptions: $lookupOptions) routeSource title routeType routeUrl routeDetails { __typename overallDifficulty } themedMapImages(resolutions: $resolutions) { __typename darkUrl lightUrl } routePolylineData { __typename media(limit: 3, preferUnique: true) { __typename mediaDetails { __typename ... on Photo { imageUrlWithMetadata(minSizeDesired: $minSizeDesired) { __typename imageUrl size { __typename height width } } imageUrl(minSizeDesired: $minSizeDesired) } } } } legs { __typename paths { __typename polyline { __typename data } } } } } pageInfo { __typename hasNextPage endCursor } } totalCount adjustedBoundingBox { __typename northeastCorner { __typename lat lng } southwestCorner { __typename lat lng } } pointSourceType { __typename searchPoint { __typename point { __typename lat lng } } droppedPin { __typename point { __typename lng lat } } currentLocation { __typename point { __typename lng lat } } } } }",
    "variables": {
        "args": {
            "prefs": {
                "difficulty": ["Undefined"],
                "elevation": 0,
                "enforcePassThruSource": False,
                "routeTypes": ["Ride"],
                "surfaceType": "Unknown",
                "targetDistance": -1,
            },
            "source": {
                "boundingBoxWithPoint": {
                    "boundingBox": {
                        "northeastCorner": {
                            "lat": ??.707635807296661,
                            "lng": ??.2102107930518207,
                        },
                        "northwestCorner": {
                            "lat": ??.707635807296661,
                            "lng": ??.1605019567412889,
                        },
                        "southeastCorner": {
                            "lat": ??.645964691271445,
                            "lng": ??.2102287593570034,
                        },
                        "southwestCorner": {
                            "lat": ??.645964691271445,
                            "lng": ??.1605164140024904,
                        },
                    },
                    "point": {
                        "currentLocation": {
                            "point": {
                                "lat": ??.688180422617229,
                                "lng": ??.1853723941463246,
                            }
                        }
                    },
                }
            },
        },
        "first": 15,
        "lookupOptions": {"locale": "en", "source": "Mysql"},
        "minSizeDesired": 512,
        "resolutions": [{"height": 512, "width": 512}],
    },
}

response = requests.post("https://graphql.strava.com/", headers=headers, json=data)
print(response.text)
