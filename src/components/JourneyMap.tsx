import React, { useEffect, useRef, useState } from 'react'
import { Location } from '../types'

interface JourneyMapProps {
  locations: Location[]
  animate?: boolean
}

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

export const JourneyMap: React.FC<JourneyMapProps> = ({ locations, animate = false }) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapInstance = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const polylineRef = useRef<any>(null)

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setMapLoaded(true)
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}`
      script.async = true
      script.defer = true
      script.onload = () => setMapLoaded(true)
      document.head.appendChild(script)
    }

    loadGoogleMaps()
  }, [])

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || locations.length === 0) return

    const google = window.google

    if (!mapInstance.current) {
      const center = {
        lat: locations[0].latitude,
        lng: locations[0].longitude,
      }

      mapInstance.current = new google.maps.Map(mapRef.current, {
        center,
        zoom: 12,
        styles: [
          {
            featureType: 'poi',
            stylers: [{ visibility: 'off' }],
          },
        ],
      })
    }

    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    if (polylineRef.current) {
      polylineRef.current.setMap(null)
    }

    const bounds = new google.maps.LatLngBounds()
    const path: any[] = []

    locations.forEach((location, index) => {
      const position = {
        lat: location.latitude,
        lng: location.longitude,
      }

      const marker = new google.maps.Marker({
        position,
        map: mapInstance.current,
        title: location.place_name,
        label: {
          text: (index + 1).toString(),
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold',
        },
        animation: animate ? google.maps.Animation.DROP : null,
      })

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="font-weight: bold; margin-bottom: 4px;">${location.place_name}</h3>
            ${location.notes ? `<p style="margin: 0; color: #666;">${location.notes}</p>` : ''}
          </div>
        `,
      })

      marker.addListener('click', () => {
        infoWindow.open(mapInstance.current, marker)
      })

      markersRef.current.push(marker)
      path.push(position)
      bounds.extend(position)
    })

    if (locations.length > 1) {
      polylineRef.current = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#22c55e',
        strokeOpacity: 1.0,
        strokeWeight: 3,
        map: mapInstance.current,
      })

      if (animate) {
        animatePolyline(polylineRef.current, path)
      }
    }

    if (locations.length > 1) {
      mapInstance.current.fitBounds(bounds)
    } else if (locations.length === 1) {
      mapInstance.current.setCenter(path[0])
      mapInstance.current.setZoom(14)
    }
  }, [mapLoaded, locations, animate])

  const animatePolyline = (polyline: any, path: any[]) => {
    let step = 0
    const numSteps = 100
    const timePerStep = 20

    const animate = () => {
      step++
      if (step > numSteps) return

      const progress = step / numSteps
      const numPoints = Math.floor(progress * path.length)

      if (numPoints > 0) {
        polyline.setPath(path.slice(0, numPoints))
      }

      if (step < numSteps) {
        setTimeout(animate, timePerStep)
      } else {
        polyline.setPath(path)
      }
    }

    polyline.setPath([])
    animate()
  }

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden">
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <p className="text-gray-600">Loading map...</p>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  )
}
