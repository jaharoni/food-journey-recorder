import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useGoogleMaps } from '../contexts/GoogleMapsContext'
import { supabase } from '../lib/supabase'
import { Route, RoutePoint, LatLng } from '../types'
import { calculateDistance, formatDistance, formatDuration } from '../lib/distance'
import { AddStopModal } from '../components/AddStopModal'
import { LoadingSpinner } from '../components/LoadingSpinner'

export const RecordRoutePage: React.FC = () => {
  const { user } = useAuth()
  const { isLoaded, google } = useGoogleMaps()
  const navigate = useNavigate()

  const [route, setRoute] = useState<Route | null>(null)
  const [recording, setRecording] = useState(false)
  const [paused, setPaused] = useState(false)
  const [points, setPoints] = useState<RoutePoint[]>([])
  const [currentPosition, setCurrentPosition] = useState<LatLng | null>(null)
  const [totalDistance, setTotalDistance] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showStopModal, setShowStopModal] = useState(false)
  const [error, setError] = useState('')

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<google.maps.Map | null>(null)
  const polylineRef = useRef<google.maps.Polyline | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const durationIntervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (isLoaded && google && mapRef.current && !mapInstance.current) {
      mapInstance.current = new google.maps.Map(mapRef.current, {
        center: { lat: 40.7128, lng: -74.006 },
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
      })
    }
  }, [isLoaded, google])

  useEffect(() => {
    if (currentPosition && google && mapInstance.current) {
      const position = { lat: currentPosition.lat, lng: currentPosition.lng }
      mapInstance.current.setCenter(position)

      if (!markerRef.current) {
        markerRef.current = new google.maps.Marker({
          position,
          map: mapInstance.current,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        })
      } else {
        markerRef.current.setPosition(position)
      }
    }
  }, [currentPosition, google])

  useEffect(() => {
    if (points.length > 1 && google && mapInstance.current) {
      const path = points.map(p => ({ lat: p.latitude, lng: p.longitude }))

      if (!polylineRef.current) {
        polylineRef.current = new google.maps.Polyline({
          path,
          geodesic: true,
          strokeColor: '#22c55e',
          strokeOpacity: 1.0,
          strokeWeight: 3,
          map: mapInstance.current,
        })
      } else {
        polylineRef.current.setPath(path)
      }
    }
  }, [points, google])

  const savePoint = useCallback(async (position: LatLng, routeId: string) => {
    try {
      const sequence = points.length
      const { data, error } = await supabase
        .from('route_points')
        .insert({
          route_id: routeId,
          latitude: position.lat,
          longitude: position.lng,
          sequence,
          recorded_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      setPoints(prev => [...prev, data])

      if (points.length > 0) {
        const lastPoint = { lat: points[points.length - 1].latitude, lng: points[points.length - 1].longitude }
        const dist = calculateDistance(lastPoint, position)
        setTotalDistance(prev => prev + dist)
      }
    } catch (err) {
      console.error('Error saving point:', err)
    }
  }, [points])

  const startRecording = async () => {
    if (!user) return

    try {
      setError('')

      const { data, error } = await supabase
        .from('routes')
        .insert({
          user_id: user.id,
          title: `Route ${new Date().toLocaleDateString()}`,
          description: '',
          status: 'recording',
          started_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      setRoute(data)
      setRecording(true)
      setPaused(false)
      startTimeRef.current = Date.now()

      durationIntervalRef.current = window.setInterval(() => {
        if (startTimeRef.current) {
          setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
        }
      }, 1000)

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const latLng = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setCurrentPosition(latLng)
          if (!paused) {
            savePoint(latLng, data.id)
          }
        },
        (error) => {
          setError(`GPS error: ${error.message}`)
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000,
        }
      )
    } catch (err: any) {
      setError(err.message || 'Failed to start recording')
    }
  }

  const pauseRecording = async () => {
    setPaused(true)
    if (route) {
      await supabase
        .from('routes')
        .update({ status: 'paused' })
        .eq('id', route.id)
    }
  }

  const resumeRecording = async () => {
    setPaused(false)
    if (route) {
      await supabase
        .from('routes')
        .update({ status: 'recording' })
        .eq('id', route.id)
    }
  }

  const finishRecording = async () => {
    if (!route) return

    try {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }

      await supabase
        .from('routes')
        .update({
          status: 'completed',
          finished_at: new Date().toISOString(),
          total_distance: totalDistance,
          total_duration: duration,
        })
        .eq('id', route.id)

      navigate(`/routes/${route.id}/view`)
    } catch (err: any) {
      setError(err.message || 'Failed to finish recording')
    }
  }

  const handleAddStop = () => {
    if (currentPosition && route) {
      setShowStopModal(true)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner message="Loading GPS..." />
      </div>
    )
  }

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
            <h1 className="text-xl font-bold text-gray-900">Record Food Journey</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </nav>

      <div className="flex-1 relative">
        <div ref={mapRef} className="absolute inset-0" />

        <div className="absolute top-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4">
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div>
              <p className="text-xs text-gray-600">Distance</p>
              <p className="text-lg font-bold text-gray-900">{formatDistance(totalDistance)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Duration</p>
              <p className="text-lg font-bold text-gray-900">{formatDuration(duration)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Points</p>
              <p className="text-lg font-bold text-gray-900">{points.length}</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {!recording ? (
            <button
              onClick={startRecording}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Start Recording
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                {paused ? (
                  <button
                    onClick={resumeRecording}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Resume
                  </button>
                ) : (
                  <button
                    onClick={pauseRecording}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Pause
                  </button>
                )}
                <button
                  onClick={finishRecording}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Finish
                </button>
              </div>
              <button
                onClick={handleAddStop}
                disabled={!currentPosition || paused}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Stop Here
              </button>
            </div>
          )}
        </div>
      </div>

      {showStopModal && route && currentPosition && (
        <AddStopModal
          routeId={route.id}
          position={currentPosition}
          sequence={points.length}
          onClose={() => setShowStopModal(false)}
          onStopAdded={() => {
            setShowStopModal(false)
          }}
        />
      )}
    </div>
  )
}
