import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

interface BoundingBoxProps {
  enabled: boolean
  neLat: string
  neLng: string
  swLat: string
  swLng: string
  onToggle: (v: boolean) => void
  onNeLatChange: (v: string) => void
  onNeLngChange: (v: string) => void
  onSwLatChange: (v: string) => void
  onSwLngChange: (v: string) => void
}

export function BoundingBox({
  enabled, neLat, neLng, swLat, swLng,
  onToggle, onNeLatChange, onNeLngChange, onSwLatChange, onSwLngChange,
}: BoundingBoxProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="text-xs font-bold uppercase tracking-[0.06em] text-[#a89f97]">
          Bounding Box <span className="font-normal normal-case text-[#c4bcb4] text-[10px] tracking-normal">(optional)</span>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="custom-bbox" checked={enabled} onCheckedChange={(v) => onToggle(v === true)} />
          <Label htmlFor="custom-bbox" className="text-sm text-[#3e3a35] font-normal">Set custom bounding box</Label>
        </div>

        {enabled && (
          <div className="space-y-2">
            <div>
              <Label className="text-xs font-semibold text-[#6b6158] uppercase tracking-[0.04em] mb-1">NE Corner (lat, lng)</Label>
              <div className="flex gap-1.5">
                <Input
                  type="number"
                  step="any"
                  placeholder="lat"
                  value={neLat}
                  onChange={(e) => onNeLatChange(e.target.value)}
                  className="w-[80px] sm:flex-1 h-8 text-sm font-mono"
                />
                <Input
                  type="number"
                  step="any"
                  placeholder="lng"
                  value={neLng}
                  onChange={(e) => onNeLngChange(e.target.value)}
                  className="w-[80px] sm:flex-1 h-8 text-sm font-mono"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#6b6158] uppercase tracking-[0.04em] mb-1">SW Corner (lat, lng)</Label>
              <div className="flex gap-1.5">
                <Input
                  type="number"
                  step="any"
                  placeholder="lat"
                  value={swLat}
                  onChange={(e) => onSwLatChange(e.target.value)}
                  className="w-[80px] sm:flex-1 h-8 text-sm font-mono"
                />
                <Input
                  type="number"
                  step="any"
                  placeholder="lng"
                  value={swLng}
                  onChange={(e) => onSwLngChange(e.target.value)}
                  className="w-[80px] sm:flex-1 h-8 text-sm font-mono"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
