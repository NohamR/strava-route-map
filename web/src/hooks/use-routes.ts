import { useState, useCallback } from 'react'
import { fetchRoutes, buildVariables } from '@/lib/api'
import { decodePolyline } from '@/lib/polyline'
import { COLORS } from '@/lib/constants'
import type { GraphQLRoute, RouteData, SearchParamsInput } from '@/lib/types'

function getRouteImageUrl(route: GraphQLRoute): string | null {
  try {
    const media = route.routePolylineData?.media
    if (media?.[0]) {
      const md = media[0].mediaDetails
      if (md.imageUrlWithMetadata?.imageUrl) return md.imageUrlWithMetadata.imageUrl
      if (md.imageUrl) return md.imageUrl
    }
  } catch {}
  return null
}

function getAllRouteImages(route: GraphQLRoute): string[] {
  const urls: string[] = []
  try {
    const media = route.routePolylineData?.media
    media?.forEach((m) => {
      const md = m.mediaDetails
      if (md.imageUrlWithMetadata?.imageUrl) urls.push(md.imageUrlWithMetadata.imageUrl)
      else if (md.imageUrl) urls.push(md.imageUrl)
    })
  } catch {}
  return urls
}

function transformRoute(route: GraphQLRoute, index: number): RouteData {
  const coords: [number, number][][] = []
  const legs = route.legs
  if (legs) {
    for (const leg of legs) {
      if (leg.paths) {
        for (const path of leg.paths) {
          if (path.polyline?.data) coords.push(decodePolyline(path.polyline.data))
        }
      }
    }
  }

  const color = COLORS[index % COLORS.length]
  const eta = route.completionTimeEstimation
    ? Math.round(route.completionTimeEstimation.expectedTime / 60) + ' min'
    : ''

  const allLats: number[] = []
  const allLngs: number[] = []
  coords.forEach((seg) => seg.forEach((p) => { allLats.push(p[0]); allLngs.push(p[1]) }))

  const bounds = allLats.length
    ? [Math.min(...allLats), Math.max(...allLats), Math.min(...allLngs), Math.max(...allLngs)]
    : [0, 0, 0, 0]

  return {
    index,
    title: route.title || '',
    type: route.routeType || '',
    difficulty: route.routeDetails?.overallDifficulty || '',
    distanceKm: route.length ? (route.length / 1000).toFixed(1) : '0',
    elevationM: route.elevationGain ? Math.round(route.elevationGain) : 0,
    location: route.locationSummary || '',
    eta,
    color,
    bounds,
    coords,
    images: getAllRouteImages(route),
    image: getRouteImageUrl(route),
  }
}

export function useRoutes() {
  const [routes, setRoutes] = useState<RouteData[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [adjustedBoundingBox, setAdjustedBoundingBox] = useState<{
    northeastCorner: { lat: number; lng: number }
    southwestCorner: { lat: number; lng: number }
  } | null>(null)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const search = useCallback(async (token: string, params: SearchParamsInput): Promise<{ ok: boolean; error?: string }> => {
    setLoading(true)
    setError('')
    try {
      const variables = buildVariables(params)
      const result = await fetchRoutes(token, variables)
      const routeNodes = result.routes.nodes
      setRoutes(routeNodes.map(transformRoute))
      setTotalCount(result.totalCount)
      setAdjustedBoundingBox(result.adjustedBoundingBox)
      setCurrentLocation(
        result.pointSourceType?.currentLocation?.point ?? null
      )
      return { ok: true }
    } catch (err) {
      const msg = (err as Error).message
      setError(msg)
      return { ok: false, error: msg }
    } finally {
      setLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setRoutes([])
    setTotalCount(0)
    setAdjustedBoundingBox(null)
    setCurrentLocation(null)
    setError('')
  }, [])

  return { routes, totalCount, adjustedBoundingBox, currentLocation, loading, error, search, clear }
}
