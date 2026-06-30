import { PROXY, AUTH_BASE, GRAPHQL_URL, CLIENT_SECRET, SUGGESTED_ROUTES_QUERY } from './constants'
import type { GraphQLResponse, SearchParamsInput } from './types'

function getTimeOffset(): string {
  return String(-new Date().getTimezoneOffset() * 60)
}

export async function requestOtp(email: string): Promise<string> {
  const resp = await fetch(PROXY + AUTH_BASE + '/request_otp?hl=en', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Strava 422.0.1 (49113)|iPhone|iPhone10,1|iOS|16.7.15|en-FR',
      'x-strava-nav-version': '2',
      'time-offset-seconds': getTimeOffset(),
    },
    body: JSON.stringify({ email, client_id: '1', logging_in: true }),
  })
  if (!resp.ok) throw new Error(resp.status + ': ' + (await resp.text()).slice(0, 100))
  return (await resp.json()).otp_state
}

export async function loginWithOtp(email: string, state: string, otp: string): Promise<string> {
  const resp = await fetch(PROXY + AUTH_BASE + '/login/otp?hl=en', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Strava 422.0.1 (49113)|iPhone|iPhone10,1|iOS|16.7.15|en-FR',
      'x-strava-nav-version': '2',
      'time-offset-seconds': getTimeOffset(),
    },
    body: JSON.stringify({ email, otp_state: state, client_id: '1', otp, client_secret: CLIENT_SECRET }),
  })
  if (!resp.ok) throw new Error(resp.status + ': ' + (await resp.text()).slice(0, 100))
  return (await resp.json()).access_token
}

export function buildVariables(params: SearchParamsInput) {
  const { lat, lng, routeType, difficulty, elevation, distance, bbox } = params
  const offset = 0.05
  const bboxObj = bbox
    ? {
        northeastCorner: { lat: bbox[0], lng: bbox[1] },
        northwestCorner: { lat: bbox[0], lng: bbox[3] },
        southeastCorner: { lat: bbox[2], lng: bbox[1] },
        southwestCorner: { lat: bbox[2], lng: bbox[3] },
      }
    : {
        northeastCorner: { lat: lat + offset, lng: lng + offset },
        northwestCorner: { lat: lat + offset, lng: lng - offset },
        southeastCorner: { lat: lat - offset, lng: lng + offset },
        southwestCorner: { lat: lat - offset, lng: lng - offset },
      }

  return {
    args: {
      prefs: {
        difficulty: [difficulty],
        elevation,
        enforcePassThruSource: false,
        routeTypes: [routeType],
        surfaceType: 'Unknown',
        targetDistance: distance > 0 ? distance * 1000 : -1,
      },
      source: {
        boundingBoxWithPoint: {
          boundingBox: bboxObj,
          point: { currentLocation: { point: { lat, lng } } },
        },
      },
    },
    first: 15,
    resolutions: [{ height: 512, width: 512 }],
    minSizeDesired: 512,
    lookupOptions: { locale: 'en', source: 'Mysql' },
  }
}

export async function fetchRoutes(token: string, variables: unknown): Promise<GraphQLResponse['suggestedRoutesBySourceGeo']> {
  const resp = await fetch(PROXY + GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
      'User-Agent': 'Strava 422.0.1 (49113)|iPhone|iPhone10,1|iOS|16.7.15|en-FR',
      'apollographql-client-name': 'strava-ios',
      'apollographql-client-version': '422.0.1-49113',
      'X-APOLLO-OPERATION-TYPE': 'query',
      'X-APOLLO-OPERATION-NAME': 'SuggestedRoutes',
    },
    body: JSON.stringify({ operationName: 'SuggestedRoutes', query: SUGGESTED_ROUTES_QUERY, variables }),
  })
  const data: { errors?: { message: string }[]; data?: GraphQLResponse } = await resp.json()
  if (data.errors) throw new Error(data.errors.map((e) => e.message).join('; '))
  return data.data!.suggestedRoutesBySourceGeo
}
