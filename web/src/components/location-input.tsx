import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import { useEffect, useRef } from 'react'
import L from 'leaflet'

interface LocationInputProps {
  lat: string
  lng: string
  onLatChange: (v: string) => void
  onLngChange: (v: string) => void
  onPositionChange: (lat: number, lng: number) => void
}

function MapClickHandler({ onPositionChange }: { onPositionChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPositionChange(parseFloat(e.latlng.lat.toFixed(6)), parseFloat(e.latlng.lng.toFixed(6)))
    },
  })
  return null
}

function MapViewUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  const prev = useRef({ lat: 0, lng: 0 })
  useEffect(() => {
    if (lat !== prev.current.lat || lng !== prev.current.lng) {
      map.setView([lat, lng], 13)
      prev.current = { lat, lng }
    }
  }, [lat, lng, map])
  return null
}

const markerIcon = L.divIcon({
  className: '',
  html: `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#fc4c02" stroke="#fff" stroke-width="2" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="2.5" fill="#fff"/>
    </svg>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
})

export function LocationInput({ lat, lng, onLatChange, onLngChange, onPositionChange }: LocationInputProps) {
  const latNum = parseFloat(lat) || 0
  const lngNum = parseFloat(lng) || 0
  const hasPosition = lat !== '' && lng !== ''

  const handleDetect = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = pos.coords.latitude.toFixed(6)
        const newLng = pos.coords.longitude.toFixed(6)
        onLatChange(newLat)
        onLngChange(newLng)
        onPositionChange(parseFloat(newLat), parseFloat(newLng))
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="text-xs font-bold uppercase tracking-[0.06em] text-[#a89f97]">Location</div>
        <div>
          <label className="block text-xs font-semibold text-[#6b6158] uppercase tracking-[0.04em] mb-1">
            Latitude <span className="text-red-600">*</span>
          </label>
          <div className="flex flex-nowrap gap-1.5">
            <Input
              type="number"
              step="any"
              placeholder="Lat"
              value={lat}
              onChange={(e) => onLatChange(e.target.value)}
              className="w-[70px] sm:flex-1 h-8 text-sm font-mono"
            />
            <Input
              type="number"
              step="any"
              placeholder="Lng"
              value={lng}
              onChange={(e) => onLngChange(e.target.value)}
              className="w-[70px] sm:flex-1 h-8 text-sm font-mono"
            />
            <Button
              size="sm"
              className="text-lg px-2 h-8 shrink-0 bg-[#ddd8d0] text-[#3e3a35] hover:bg-[#cec8be]"
              onClick={handleDetect}
              title="Auto-detect"
            >
              ⌂
            </Button>
          </div>
          <div className="text-[10px] text-[#a89f97] mt-1">
            Click the map, enter coords, or use auto-detect
          </div>
        </div>
        <div className="h-[200px] md:h-[260px] rounded-lg border border-[#d8d2ca] overflow-hidden z-0">
          <MapContainer
            center={hasPosition ? [latNum, lngNum] : [20, 0]}
            zoom={hasPosition ? 13 : 2}
            className="h-full w-full"
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              maxZoom={20}
            />
            <MapClickHandler onPositionChange={onPositionChange} />
            {hasPosition && (
              <>
                <Marker position={[latNum, lngNum]} icon={markerIcon} draggable={true}
                  eventHandlers={{
                    dragend(e) {
                      const pos = e.target.getLatLng()
                      onLatChange(pos.lat.toFixed(6))
                      onLngChange(pos.lng.toFixed(6))
                      onPositionChange(pos.lat, pos.lng)
                    },
                  }}
                />
                <MapViewUpdater lat={latNum} lng={lngNum} />
              </>
            )}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  )
}
