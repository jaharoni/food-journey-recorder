import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGoogleMaps } from '../contexts/GoogleMapsContext'
import { supabase } from '../lib/supabase'
import { Route, RoutePoint, Stop, StopMedia } from '../types'
import { formatDistance, formatDuration } from '../lib/distance'
import { LoadingSpinner } from '../components/LoadingSpinner'

export const ViewRoutePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isLoaded, google } = useGoogleMaps()

  const [route, setRoute] = useState<Route | null>(null)
  const [points, setPoints] = useState<RoutePoint[]>([])
  const [stops, setStops] = useState<Stop[]>([])
  const [stopMedia, setStopMedia] = useState<Record<string, StopMedia[]>>({})
  const [loading, setLoading] = useState(true)

  const [playing, setPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [activeStopId, setActiveStopId] = useState<string | null>(null)
  const [headCutoutUrl, setHeadCutoutUrl] = useState<string | null>(null)

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<google.maps.Map | null>(null)
  const polylineRef = useRef<google.maps.Polyline | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (id) {
      loadRoute()
    }
  }, [id])

  useEffect(() => {
    if (isLoaded && google && mapRef.current && !mapInstance.current) {
      mapInstance.current = new google.maps.Map(mapRef.current, {
        center: { lat: 40.7128, lng: -74.006 },
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
      })
    }
  }, [isLoaded, google])

  useEffect(() => {
    if (points.length > 0 && google && mapInstance.current) {
      const path = points.map(p => ({ lat: p.latitude, lng: p.longitude }))

      if (!polylineRef.current) {
        polylineRef.current = new google.maps.Polyline({
          path,
          geodesic: true,
          strokeColor: '#22c55e',
          strokeOpacity: 1.0,
          strokeWeight: 4,
          map: mapInstance.current,
        })

        const bounds = new google.maps.LatLngBounds()
        path.forEach(p => bounds.extend(p))
        mapInstance.current.fitBounds(bounds)
      }
    }
  }, [points, google])

  useEffect(() => {
    if (points.length > 0 && google && mapInstance.current) {
      const point = points[currentIndex]
      const position = { lat: point.latitude, lng: point.longitude }

      if (!markerRef.current) {
        const markerElement = document.createElement('div')
        markerElement.style.width = '50px'
        markerElement.style.height = '50px'
        markerElement.style.borderRadius = '50%'
        markerElement.style.border = '3px solid white'
        markerElement.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.3)'
        markerElement.style.overflow = 'hidden'
        markerElement.style.backgroundColor = '#4285F4'

        if (headCutoutUrl) {
          markerElement.style.backgroundImage = `url(${headCutoutUrl})`
          markerElement.style.backgroundSize = 'cover'
          markerElement.style.backgroundPosition = 'center'
        } else {
          markerElement.style.display = 'flex'
          markerElement.style.alignItems = 'center'
          markerElement.style.justifyContent = 'center'
          markerElement.style.color = 'white'
          markerElement.style.fontWeight = 'bold'
          markerElement.style.fontSize = '20px'
          markerElement.innerHTML = '👤'
        }

        markerRef.current = new google.maps.Marker({
          position,
          map: mapInstance.current,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 0,
          },
        })

        const overlay = new google.maps.OverlayView()
        overlay.onAdd = function() {
          const panes = this.getPanes()
          if (panes && panes.overlayLayer) {
            panes.overlayLayer.appendChild(markerElement)
          }
        }
        overlay.draw = function() {
          const projection = this.getProjection()
          const pos = markerRef.current?.getPosition()
          if (pos && projection) {
            const point = projection.fromLatLngToDivPixel(pos)
            if (point) {
              markerElement.style.left = point.x - 25 + 'px'
              markerElement.style.top = point.y - 25 + 'px'
              markerElement.style.position = 'absolute'
            }
          }
        }
        overlay.setMap(mapInstance.current)
      } else {
        markerRef.current.setPosition(position)
      }

      const nearbyStop = stops.find((_stop, idx) => {
        const stopPointIndex = Math.floor((idx / Math.max(stops.length - 1, 1)) * (points.length - 1))
        return Math.abs(currentIndex - stopPointIndex) < 10
      })

      if (nearbyStop) {
        setActiveStopId(nearbyStop.id)
      }
    }
  }, [currentIndex, points, stops, google, headCutoutUrl])

  useEffect(() => {
    if (playing && points.length > 0) {
      const animate = () => {
        setCurrentIndex(prev => {
          const next = prev + 1
          if (next >= points.length) {
            setPlaying(false)
            return prev
          }
          return next
        })
        animationFrameRef.current = window.setTimeout(animate, 100 / speed)
      }
      animationFrameRef.current = window.setTimeout(animate, 100 / speed)
    }

    return () => {
      if (animationFrameRef.current) {
        clearTimeout(animationFrameRef.current)
      }
    }
  }, [playing, speed, points.length])

  const loadRoute = async () => {
    try {
      const { data: routeData, error: routeError } = await supabase
        .from('routes')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (routeError) throw routeError
      if (!routeData) {
        navigate('/dashboard')
        return
      }

      setRoute(routeData)

      const { data: pointsData, error: pointsError } = await supabase
        .from('route_points')
        .select('*')
        .eq('route_id', id)
        .order('sequence', { ascending: true })

      if (pointsError) throw pointsError
      setPoints(pointsData || [])

      const { data: stopsData, error: stopsError } = await supabase
        .from('stops')
        .select('*')
        .eq('route_id', id)
        .order('sequence', { ascending: true })

      if (stopsError) throw stopsError
      setStops(stopsData || [])

      const { data: mediaData } = await supabase
        .from('stop_media')
        .select('*')
        .eq('route_id', id)

      if (mediaData) {
        const mediaByStop: Record<string, StopMedia[]> = {}
        mediaData.forEach(media => {
          if (!mediaByStop[media.stop_id]) {
            mediaByStop[media.stop_id] = []
          }
          mediaByStop[media.stop_id].push(media)
        })
        setStopMedia(mediaByStop)
      }

      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('head_cutout_url')
        .eq('id', routeData.user_id)
        .maybeSingle()

      if (profileData?.head_cutout_url) {
        setHeadCutoutUrl(profileData.head_cutout_url)
      }
    } catch (error) {
      console.error('Error loading route:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlayPause = () => {
    setPlaying(!playing)
  }

  const handleJumpToStop = (stopIndex: number) => {
    const pointIndex = Math.floor((stopIndex / Math.max(stops.length - 1, 1)) * (points.length - 1))
    setCurrentIndex(pointIndex)
    setPlaying(false)
  }

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner message="Loading route..." />
      </div>
    )
  }

  if (!route) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Route not found</p>
      </div>
    )
  }

  const progress = points.length > 0 ? (currentIndex / (points.length - 1)) * 100 : 0

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold text-gray-900">{route.title}</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex">
        <div className="flex-1 relative">
          <div ref={mapRef} className="absolute inset-0" />

          <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-600">Distance: {formatDistance(route.total_distance)}</p>
                <p className="text-sm text-gray-600">Duration: {formatDuration(route.total_duration)}</p>
              </div>
              <div className="flex gap-2">
                {[1, 2, 5].map(s => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-3 py-1 rounded ${
                      speed === s
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <input
                type="range"
                min="0"
                max={points.length - 1}
                value={currentIndex}
                onChange={(e) => {
                  setCurrentIndex(parseInt(e.target.value))
                  setPlaying(false)
                }}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{Math.round(progress)}%</span>
                <span>{currentIndex} / {points.length}</span>
              </div>
            </div>

            <button
              onClick={handlePlayPause}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {playing ? '⏸ Pause' : '▶ Play'}
            </button>
          </div>
        </div>

        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Stops ({stops.length})</h2>
            <div className="space-y-4">
              {stops.map((stop, idx) => (
                <div
                  key={stop.id}
                  onClick={() => handleJumpToStop(idx)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    activeStopId === stop.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{stop.place_name}</h3>
                    {stop.rating && (
                      <div className="text-yellow-400">
                        {'★'.repeat(stop.rating)}
                      </div>
                    )}
                  </div>
                  {stop.notes && (
                    <p className="text-sm text-gray-600 mb-2">{stop.notes}</p>
                  )}
                  {stopMedia[stop.id] && stopMedia[stop.id].length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {stopMedia[stop.id].slice(0, 4).map((media) => (
                        <img
                          key={media.id}
                          src={media.url}
                          alt={stop.place_name}
                          className="w-full h-20 object-cover rounded"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
