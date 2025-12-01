import { LatLng } from '../types'

export function calculateDistance(point1: LatLng, point2: LatLng): number {
  const R = 6371000
  const lat1Rad = (point1.lat * Math.PI) / 180
  const lat2Rad = (point2.lat * Math.PI) / 180
  const deltaLat = ((point2.lat - point1.lat) * Math.PI) / 180
  const deltaLng = ((point2.lng - point1.lng) * Math.PI) / 180

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

export function calculateTotalDistance(points: LatLng[]): number {
  if (points.length < 2) return 0

  let total = 0
  for (let i = 1; i < points.length; i++) {
    total += calculateDistance(points[i - 1], points[i])
  }
  return total
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(2)}km`
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  }
  return `${secs}s`
}
