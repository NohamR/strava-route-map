import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ResultsMap } from '@/components/results-map'
import { RouteList } from '@/components/route-list'
import { RouteDetail } from '@/components/route-detail'
import { Lightbox } from '@/components/lightbox'
import type { RouteData } from '@/lib/types'

interface ResultsViewProps {
  routes: RouteData[]
  totalCount: number
  adjustedBoundingBox: { northeastCorner: { lat: number; lng: number }; southwestCorner: { lat: number; lng: number } } | null
  currentLocation: { lat: number; lng: number } | null
  onNewSearch: () => void
  onResearch: () => void
  loading: boolean
}

export function ResultsView({
  routes, totalCount, adjustedBoundingBox, currentLocation, onNewSearch, onResearch, loading,
}: ResultsViewProps) {
  const [activeIndex, setActiveIndex] = useState(-1)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const handleSelect = (idx: number) => {
    setActiveIndex((prev) => (prev === idx ? -1 : idx))
    setPanelOpen(false)
  }

  const handleFitAll = () => {
    setActiveIndex(-1)
  }

  return (
    <>
      {/* Results map */}
      <ResultsMap
        routes={routes}
        activeIndex={activeIndex}
        onActiveIndexChange={setActiveIndex}
        adjustedBoundingBox={adjustedBoundingBox}
        currentLocation={currentLocation}
      />

      {/* Floating top bar */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 flex items-start gap-2 pointer-events-none">
        <Button
          size="sm"
          className="pointer-events-auto text-xs px-2.5 h-7 bg-[#ddd8d0] text-[#3e3a35] hover:bg-[#cec8be] shadow-md"
          onClick={onNewSearch}
        >
          ← New Search
        </Button>
        <Button
          size="sm"
          className="pointer-events-auto text-xs px-2.5 h-7 bg-[#ddd8d0] text-[#3e3a35] hover:bg-[#cec8be] shadow-md"
          onClick={onResearch}
          disabled={loading}
        >
          {loading ? '...' : '⟳ Re-search'}
        </Button>
      </div>

      {/* Desktop panel */}
      <div className="hidden md:flex fixed top-0 right-0 bottom-0 z-30 w-[340px] bg-cream shadow-lg border-l border-[#d8d2ca] flex-col pt-12">
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#a89f97] px-4 pt-2 pb-1 font-mono">
          {totalCount} routes found
        </div>
        <div className="flex items-center gap-2 px-4 py-1.5 border-b border-[#e4dfd8]">
          <Button size="sm" className="text-xs px-2.5 h-7 bg-[#ddd8d0] text-[#3e3a35] hover:bg-[#cec8be]" onClick={handleFitAll}>
            All routes
          </Button>
        </div>
        <RouteList
          routes={routes}
          activeIndex={activeIndex}
          onSelect={handleSelect}
          onImageClick={(url) => setLightboxUrl(url)}
        />
        <div className="shrink-0 text-center py-3 border-t border-[#e4dfd8]">
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

      {/* Mobile panel backdrop */}
      {panelOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={() => setPanelOpen(false)}
        />
      )}

      {/* Mobile panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-30 w-full sm:w-[380px] bg-cream shadow-lg transition-transform duration-300 md:hidden flex flex-col ${
          panelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#e4dfd8] shrink-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#a89f97] font-mono">
            {totalCount} routes found
          </div>
          <Button
            size="sm"
            className="text-xs px-2 h-7 bg-[#ddd8d0] text-[#3e3a35] hover:bg-[#cec8be]"
            onClick={() => setPanelOpen(false)}
          >
            ✕
          </Button>
        </div>
        <div className="px-4 py-1.5 border-b border-[#e4dfd8]">
          <Button size="sm" className="text-xs px-2.5 h-7 bg-[#ddd8d0] text-[#3e3a35] hover:bg-[#cec8be]" onClick={handleFitAll}>
            All routes
          </Button>
        </div>
        <RouteList
          routes={routes}
          activeIndex={activeIndex}
          onSelect={handleSelect}
          onImageClick={(url) => setLightboxUrl(url)}
        />
        <div className="shrink-0 text-center py-3 border-t border-[#e4dfd8]">
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

      {/* Route detail panel */}
      {activeIndex >= 0 && routes[activeIndex] && (
        <div className="fixed bottom-4 left-4 right-4 z-20 md:left-auto md:right-4 md:w-[320px] md:bottom-24">
          <RouteDetail
            route={routes[activeIndex]}
            onUnselect={() => setActiveIndex(-1)}
            onImageClick={(url) => setLightboxUrl(url)}
          />
        </div>
      )}

      {/* FAB for mobile */}
      {activeIndex === -1 && (
        <button
          className="fixed bottom-5 right-5 z-20 w-12 h-12 rounded-full bg-strava text-white shadow-lg flex items-center justify-center text-xl md:hidden"
          onClick={() => setPanelOpen((v) => !v)}
        >
          ☰
        </button>
      )}

      {/* Lightbox */}
      <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </>
  )
}
