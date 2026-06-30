import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface RouteFiltersProps {
  routeType: string
  difficulty: string
  elevation: string
  distance: string
  onRouteTypeChange: (v: string) => void
  onDifficultyChange: (v: string) => void
  onElevationChange: (v: string) => void
  onDistanceChange: (v: string) => void
}

const ROUTE_TYPES = [
  { value: 'Run', label: 'Run' },
  { value: 'TrailRun', label: 'Trail Run' },
  { value: 'Walk', label: 'Walk' },
  { value: 'Hike', label: 'Hike' },
  { value: 'Ride', label: 'Ride' },
  { value: 'MountainBikeRide', label: 'Mountain Bike' },
  { value: 'GravelRide', label: 'Gravel Ride' },
]

const DIFFICULTIES = [
  { value: 'Undefined', label: 'Undefined' },
  { value: 'Easy', label: 'Easy' },
  { value: 'Moderate', label: 'Moderate' },
  { value: 'Hard', label: 'Hard' },
]

export function RouteFilters({
  routeType, difficulty, elevation, distance,
  onRouteTypeChange, onDifficultyChange, onElevationChange, onDistanceChange,
}: RouteFiltersProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="text-xs font-bold uppercase tracking-[0.06em] text-[#a89f97]">Route</div>

        <div>
          <Label className="text-xs font-semibold text-[#6b6158] uppercase tracking-[0.04em] mb-1">
            Route Type <span className="text-red-600">*</span>
          </Label>
          <Select value={routeType || undefined} onValueChange={(v) => onRouteTypeChange(v || '')}>
            <SelectTrigger className="h-8 text-sm font-mono">
              <SelectValue placeholder="-- Select --" />
            </SelectTrigger>
            <SelectContent>
              {ROUTE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs font-semibold text-[#6b6158] uppercase tracking-[0.04em] mb-1">Difficulty</Label>
          <Select value={difficulty} onValueChange={(v) => onDifficultyChange(v || 'Undefined')}>
            <SelectTrigger className="h-8 text-sm font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTIES.map((d) => (
                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <Label className="text-xs font-semibold text-[#6b6158] uppercase tracking-[0.04em] mb-1">Min Elevation (m)</Label>
            <Input
              type="number"
              placeholder="0"
              value={elevation}
              onChange={(e) => onElevationChange(e.target.value)}
              className="w-full h-8 text-sm font-mono"
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs font-semibold text-[#6b6158] uppercase tracking-[0.04em] mb-1">Target Distance (km)</Label>
            <Input
              type="number"
              step="any"
              placeholder="-1"
              value={distance}
              onChange={(e) => onDistanceChange(e.target.value)}
              className="w-full h-8 text-sm font-mono"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
