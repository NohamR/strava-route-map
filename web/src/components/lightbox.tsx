import { Dialog, DialogContent } from '@/components/ui/dialog'

interface LightboxProps {
  url: string | null
  onClose: () => void
}

export function Lightbox({ url, onClose }: LightboxProps) {
  return (
    <Dialog open={!!url} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-transparent border-none shadow-none">
        {url && (
          <img
            src={url}
            alt="Route image"
            className="w-auto h-auto max-w-[90vw] max-h-[90vh] rounded-lg shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
