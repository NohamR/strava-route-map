import { Button } from '@/components/ui/button'
import type { RouteData } from '@/lib/types'

interface RouteDetailProps {
  route: RouteData
  onUnselect: () => void
  onImageClick: (url: string) => void
}

export function RouteDetail({ route, onUnselect, onImageClick }: RouteDetailProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-[#d8d2ca] overflow-hidden">
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-stone leading-snug line-clamp-2">{route.title}</h3>
          <Button
            size="sm"
            className="shrink-0 text-xs px-2 h-6 bg-[#ddd8d0] text-[#3e3a35] hover:bg-[#cec8be]"
            onClick={onUnselect}
          >
            ✕
          </Button>
        </div>

        {route.location && (
          <div className="text-[10px] text-[#a89f97] truncate">{route.location}</div>
        )}

        <div className="flex flex-wrap gap-1">
          <span className="meta-tag">{route.type}</span>
          <span className="meta-tag">{route.distanceKm} km</span>
          <span className="meta-tag">{route.elevationM} m</span>
          {route.eta && <span className="meta-tag">{route.eta}</span>}
          {route.difficulty && route.difficulty !== 'Undefined' && (
            <span className="meta-tag">{route.difficulty}</span>
          )}
        </div>

        {route.images.length > 1 && (
          <div className="flex gap-1 overflow-x-auto pb-1">
            {route.images.map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                loading="lazy"
                className="w-16 h-16 rounded-md object-cover shrink-0 cursor-pointer border border-[#d8d2ca] hover:scale-105 transition-transform duration-150"
                onClick={() => onImageClick(url)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
