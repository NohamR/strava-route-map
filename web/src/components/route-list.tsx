import type { RouteData } from '@/lib/types'

interface RouteListProps {
  routes: RouteData[]
  activeIndex: number
  onSelect: (idx: number) => void
  onImageClick: (url: string) => void
}

function escapeHtml(s: string) {
  const d = document.createElement('div')
  d.appendChild(document.createTextNode(s))
  return d.innerHTML
}

export function RouteList({ routes, activeIndex, onSelect, onImageClick }: RouteListProps) {
  return (
    <ul className="flex-1 overflow-y-auto list-none">
      {routes.map((r) => (
        <li
          key={r.index}
          className={`flex items-start gap-2.5 px-3 py-2.5 cursor-pointer border-b border-[#e4dfd8] transition-all duration-100 hover:bg-[#ede9e3] ${
            activeIndex === r.index ? 'bg-[#e8e3dc]' : ''
          }`}
          onClick={() => onSelect(r.index)}
        >
          <div className="flex items-start gap-2 shrink-0 mt-1">
            <div
              className={`w-2 h-2 rounded-full shrink-0 transition-transform duration-150 ${activeIndex === r.index ? 'scale-125' : ''}`}
              style={{ background: r.color }}
            />
            {r.image && (
              <img
                className="w-[52px] h-[52px] rounded-md object-cover shrink-0 cursor-pointer border border-[#d8d2ca] transition-transform duration-150 hover:scale-105"
                src={r.image}
                alt=""
                loading="lazy"
                onClick={(e) => { e.stopPropagation(); onImageClick(r.image!) }}
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-stone leading-snug line-clamp-2">
              {escapeHtml(r.title)}
            </div>
            <div className="flex flex-wrap gap-0.5 mt-1">
              <span className="meta-tag">{escapeHtml(r.type)}</span>
              <span className="meta-tag">{escapeHtml(r.distanceKm)} km</span>
              <span className="meta-tag">{escapeHtml(String(r.elevationM))} m</span>
            </div>
            <div className="text-[9px] text-[#a89f97] mt-0.5 truncate">{escapeHtml(r.location)}</div>
          </div>

          {r.eta && (
            <div className="shrink-0 self-start mt-0.5 font-mono text-[9px] font-medium text-[#3e3a35] bg-[#ddd8d0] px-1.5 py-0.5 rounded-sm whitespace-nowrap">
              {escapeHtml(r.eta)}
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
