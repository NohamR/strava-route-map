export interface RouteMedia {
  mediaDetails: {
    imageUrlWithMetadata?: { imageUrl: string; size?: { height: number; width: number } }
    imageUrl?: string
  }
}

export interface GraphQLRoute {
  elevationGain: number
  completionTimeEstimation: { expectedTime: number } | null
  length: number
  locationSummary: string
  routeSource: string
  title: string
  routeType: string
  routeUrl: string
  routeDetails: { overallDifficulty: string }
  themedMapImages: { darkUrl: string; lightUrl: string }[]
  legs?: { paths: { polyline: { data: string } }[] }[]
  routePolylineData: {
    media: RouteMedia[]
  }
}

export interface GraphQLResponse {
  suggestedRoutesBySourceGeo: {
    routes: { nodes: GraphQLRoute[] }
    totalCount: number
    adjustedBoundingBox: {
      northeastCorner: { lat: number; lng: number }
      southwestCorner: { lat: number; lng: number }
    }
    pointSourceType: {
      currentLocation: { point: { lat: number; lng: number } } | null
    }
  }
}

export interface RouteData {
  index: number
  title: string
  type: string
  difficulty: string
  distanceKm: string
  elevationM: number
  location: string
  eta: string
  color: string
  bounds: number[]
  coords: [number, number][][]
  images: string[]
  image: string | null
}

export interface SearchParamsInput {
  lat: number
  lng: number
  routeType: string
  difficulty: string
  elevation: number
  distance: number
  bbox: number[] | null
}
