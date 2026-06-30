import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Auth } from '@/components/auth'
import { LocationInput } from '@/components/location-input'
import { RouteFilters } from '@/components/route-filters'
import { BoundingBox } from '@/components/bounding-box'
import type { SearchParamsInput } from '@/lib/types'

interface SearchFormProps {
  token: string | null
  authLoading: boolean
  authError: string
  onSendOtp: (email: string) => Promise<string | null>
  onVerifyOtp: (email: string, state: string, otp: string) => Promise<boolean>
  onLogout: () => void
  onSetAuthError: (msg: string) => void
  onSearch: (params: SearchParamsInput) => void
  loading: boolean
}

export function SearchForm({
  token, authLoading, authError, onSendOtp, onVerifyOtp, onLogout, onSetAuthError, onSearch, loading,
}: SearchFormProps) {
  const [lat, setLat] = useState(() => localStorage.getItem('strava_last_lat') || '')
  const [lng, setLng] = useState(() => localStorage.getItem('strava_last_lng') || '')
  const [routeType, setRouteType] = useState(() => localStorage.getItem('strava_last_routeType') || '')
  const [difficulty, setDifficulty] = useState('Undefined')
  const [elevation, setElevation] = useState('')
  const [distance, setDistance] = useState('')
  const [bboxEnabled, setBboxEnabled] = useState(false)
  const [neLat, setNeLat] = useState('')
  const [neLng, setNeLng] = useState('')
  const [swLat, setSwLat] = useState('')
  const [swLng, setSwLng] = useState('')

  const handlePositionChange = (_lat: number, _lng: number) => {
    // inputs already updated via onLatChange/onLngChange
  }

  const handleSearch = () => {
    if (!token) return
    if (!lat || !lng) return
    if (!routeType) return

    let bbox: number[] | null = null
    if (bboxEnabled && neLat && neLng && swLat && swLng) {
      bbox = [parseFloat(neLat), parseFloat(neLng), parseFloat(swLat), parseFloat(swLng)]
    }

    localStorage.setItem('strava_last_lat', lat)
    localStorage.setItem('strava_last_lng', lng)
    localStorage.setItem('strava_last_routeType', routeType)

    onSearch({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      routeType,
      difficulty: difficulty === 'Undefined' ? 'Undefined' : difficulty,
      elevation: parseInt(elevation) || 0,
      distance: parseFloat(distance) || -1,
      bbox,
    })
  }

  return (
    <div className="w-full max-w-[640px] mx-auto px-4 py-8 space-y-4">
      <div>
        <h1 className="text-lg font-bold tracking-tight text-stone">Strava Route Map</h1>
        <p className="text-xs text-[#a89f97] mt-0.5">Find suggested routes from Strava</p>
      </div>

      <div className={`bg-white rounded-lg shadow-sm border border-[#d8d2ca] ${token ? 'py-1.5 px-4' : 'p-4'}`}>
        <Auth
          token={token}
          loading={authLoading}
          error={authError}
          onSendOtp={onSendOtp}
          onVerifyOtp={onVerifyOtp}
          onLogout={onLogout}
          onSetError={onSetAuthError}
        />
      </div>

      <LocationInput
        lat={lat}
        lng={lng}
        onLatChange={setLat}
        onLngChange={setLng}
        onPositionChange={handlePositionChange}
      />

      <RouteFilters
        routeType={routeType}
        difficulty={difficulty}
        elevation={elevation}
        distance={distance}
        onRouteTypeChange={setRouteType}
        onDifficultyChange={setDifficulty}
        onElevationChange={setElevation}
        onDistanceChange={setDistance}
      />

      <BoundingBox
        enabled={bboxEnabled}
        neLat={neLat}
        neLng={neLng}
        swLat={swLat}
        swLng={swLng}
        onToggle={setBboxEnabled}
        onNeLatChange={setNeLat}
        onNeLngChange={setNeLng}
        onSwLatChange={setSwLat}
        onSwLngChange={setSwLng}
      />

      <Button
        className="w-full py-3 text-sm font-bold h-auto bg-strava text-white hover:bg-[#e04402]"
        onClick={handleSearch}
        disabled={loading || !token || !lat || !lng || !routeType}
      >
        Find Routes
      </Button>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-[#6b6158]">
          <span>Loading...</span>
        </div>
      )}

      <div className="text-center py-6">
        <a
          href="https://github.com/NohamR/strava-route-map"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#a89f97] hover:text-strava transition-colors font-mono"
        >
          NohamR/strava-route-map
        </a>
      </div>
    </div>
  )
}
