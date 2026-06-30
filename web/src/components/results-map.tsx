import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, LayersControl, Polyline, Rectangle, Marker, Popup, LayerGroup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { RouteData } from '@/lib/types'

const locationIcon = L.divIcon({
  className: '',
  html: '<div style="background:red;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 4px rgba(0,0,0,.4)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

function OSM() { return <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' maxZoom={19} /> }
function Topo() { return <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}" attribution='&copy; <a href="https://www.esri.com/">Esri</a>' maxZoom={19} /> }
function Street() { return <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>' subdomains="abcd" maxZoom={20} /> }
function Dark() { return <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>' subdomains="abcd" maxZoom={20} /> }
function Satellite() { return <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution='&copy; <a href="https://www.esri.com/">Esri</a>' maxZoom={19} /> }
function HybridLayers() {
  return <LayerGroup>
    <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution='&copy; <a href="https://www.esri.com/">Esri</a>' maxZoom={19} />
    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://carto.com/">CARTO</a>' subdomains="abcd" maxZoom={20} opacity={0.85} />
  </LayerGroup>
}

function MapController({
  routes, activeIndex, adjustedBoundingBox, currentLocation, onPolylineClick,
}: {
  routes: RouteData[]
  activeIndex: number
  adjustedBoundingBox: { northeastCorner: { lat: number; lng: number }; southwestCorner: { lat: number; lng: number } } | null
  currentLocation: { lat: number; lng: number } | null
  onPolylineClick: (idx: number) => void
}) {
  const map = useMap()
  const initialFitDone = useRef(false)

  useEffect(() => {
    if (initialFitDone.current) return
    initialFitDone.current = true
    if (adjustedBoundingBox) {
      map.fitBounds(
        [[adjustedBoundingBox.southwestCorner.lat, adjustedBoundingBox.southwestCorner.lng],
         [adjustedBoundingBox.northeastCorner.lat, adjustedBoundingBox.northeastCorner.lng]],
        { padding: [40, 40], maxZoom: 14 }
      )
    } else if (currentLocation) {
      map.setView([currentLocation.lat, currentLocation.lng], 13)
    }
  }, [map, adjustedBoundingBox, currentLocation])

  useEffect(() => {
    if (activeIndex >= 0 && routes[activeIndex]) {
      const b = routes[activeIndex].bounds
      if (b[0] !== 0 || b[1] !== 0 || b[2] !== 0 || b[3] !== 0) {
        map.fitBounds([[b[0], b[2]], [b[1], b[3]]], { padding: [40, 40], maxZoom: 15 })
      }
    } else if (activeIndex === -1 && adjustedBoundingBox) {
      map.fitBounds(
        [[adjustedBoundingBox.southwestCorner.lat, adjustedBoundingBox.southwestCorner.lng],
         [adjustedBoundingBox.northeastCorner.lat, adjustedBoundingBox.northeastCorner.lng]],
        { padding: [40, 40], maxZoom: 14 }
      )
    }
  }, [activeIndex, routes, map, adjustedBoundingBox])

  return (
    <>
      {routes.map((r) =>
        r.coords.map((seg, si) => (
          <Polyline
            key={`${r.index}-${si}`}
            positions={seg}
            pathOptions={{
              color: r.color,
              weight: activeIndex === -1 ? 4 : r.index === activeIndex ? 5 : 2.5,
              opacity: activeIndex === -1 ? 0.5 : r.index === activeIndex ? 1 : 0.12,
            }}
            smoothFactor={1.5}
            eventHandlers={{ click: () => onPolylineClick(r.index) }}
          />
        ))
      )}

      {adjustedBoundingBox && (
        <Rectangle
          bounds={[[adjustedBoundingBox.southwestCorner.lat, adjustedBoundingBox.southwestCorner.lng],
                    [adjustedBoundingBox.northeastCorner.lat, adjustedBoundingBox.northeastCorner.lng]]}
          pathOptions={{ color: '#666', weight: 1, fill: false, interactive: false }}
        />
      )}

      {currentLocation && (
        <Marker position={[currentLocation.lat, currentLocation.lng]} icon={locationIcon} zIndexOffset={1000}>
          <Popup>Current location</Popup>
        </Marker>
      )}
    </>
  )
}

interface ResultsMapProps {
  routes: RouteData[]
  activeIndex: number
  onActiveIndexChange: (idx: number) => void
  adjustedBoundingBox: { northeastCorner: { lat: number; lng: number }; southwestCorner: { lat: number; lng: number } } | null
  currentLocation: { lat: number; lng: number } | null
}

export function ResultsMap({
  routes, activeIndex, onActiveIndexChange, adjustedBoundingBox, currentLocation,
}: ResultsMapProps) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      className="fixed inset-0 z-0"
      zoomControl={true}
    >
      <LayersControl position="bottomleft">
        <LayersControl.BaseLayer name="OSM"><OSM /></LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Topo"><Topo /></LayersControl.BaseLayer>
        <LayersControl.BaseLayer checked name="Street"><Street /></LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Dark"><Dark /></LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite"><Satellite /></LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Hybrid"><HybridLayers /></LayersControl.BaseLayer>
      </LayersControl>

      <MapController
        routes={routes}
        activeIndex={activeIndex}
        adjustedBoundingBox={adjustedBoundingBox}
        currentLocation={currentLocation}
        onPolylineClick={(idx) => onActiveIndexChange(activeIndex === idx ? -1 : idx)}
      />
    </MapContainer>
  )
}
