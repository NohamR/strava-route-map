import type { RouteData } from './types'

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function generateGpx(route: RouteData): string {
  let gpx = '<?xml version="1.0" encoding="UTF-8"?>\n'
  gpx += '<gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1" creator="Strava Route Map">\n'
  gpx += '  <metadata>\n'
  gpx += `    <name>${escapeXml(route.title)}</name>\n`
  gpx += '  </metadata>\n'
  gpx += '  <trk>\n'
  gpx += `    <name>${escapeXml(route.title)}</name>\n`

  for (const segment of route.coords) {
    gpx += '    <trkseg>\n'
    for (const [lat, lng] of segment) {
      gpx += `      <trkpt lat="${lat}" lon="${lng}"></trkpt>\n`
    }
    gpx += '    </trkseg>\n'
  }

  gpx += '  </trk>\n'
  gpx += '</gpx>\n'
  return gpx
}

export function downloadGpx(route: RouteData): void {
  const gpx = generateGpx(route)
  const blob = new Blob([gpx], { type: 'application/gpx+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const safeName = route.title.replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, '_')
  a.download = `${safeName || 'route'}.gpx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
