import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Journey, Location, Media } from '../types'
import { LocationPicker } from '../components/LocationPicker'
import { MediaUploader } from '../components/MediaUploader'

export const EditJourneyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [journey, setJourney] = useState<Journey | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [locations, setLocations] = useState<Location[]>([])
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    loadJourney()
  }, [id])

  const loadJourney = async () => {
    try {
      const { data: journeyData, error: journeyError } = await supabase
        .from('journeys')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (journeyError) throw journeyError
      if (!journeyData) {
        navigate('/dashboard')
        return
      }

      setJourney(journeyData)
      setTitle(journeyData.title)
      setDescription(journeyData.description)

      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('*')
        .eq('journey_id', id)
        .order('order_index', { ascending: true })

      if (locationsError) throw locationsError
      setLocations(locationsData || [])

      const { data: mediaData, error: mediaError } = await supabase
        .from('media')
        .select('*')
        .eq('journey_id', id)
        .order('order_index', { ascending: true })

      if (mediaError) throw mediaError
      setMedia(mediaData || [])
    } catch (error) {
      console.error('Error loading journey:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddLocation = async (location: Omit<Location, 'id' | 'journey_id' | 'created_at'>) => {
    if (!id) return

    try {
      const { data, error } = await supabase
        .from('locations')
        .insert({
          journey_id: id,
          place_name: location.place_name,
          latitude: location.latitude,
          longitude: location.longitude,
          order_index: locations.length,
          notes: location.notes,
        })
        .select()
        .single()

      if (error) throw error
      setLocations([...locations, data])
    } catch (error: any) {
      setError(error.message || 'Failed to add location')
    }
  }

  const handleRemoveLocation = async (locationId: string) => {
    if (!confirm('Remove this location? Associated media will also be deleted.')) return

    try {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', locationId)

      if (error) throw error

      setLocations(locations.filter(loc => loc.id !== locationId))
      setMedia(media.filter(m => m.location_id !== locationId))
    } catch (error: any) {
      setError(error.message || 'Failed to remove location')
    }
  }

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('Delete this media?')) return

    try {
      const { error } = await supabase
        .from('media')
        .delete()
        .eq('id', mediaId)

      if (error) throw error
      setMedia(media.filter(m => m.id !== mediaId))
    } catch (error: any) {
      setError(error.message || 'Failed to delete media')
    }
  }

  const handleSave = async () => {
    if (!id) return

    setError('')
    setSaving(true)

    try {
      const { error } = await supabase
        .from('journeys')
        .update({
          title,
          description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      navigate(`/journey/${id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to save journey')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading journey...</p>
      </div>
    )
  }

  if (!journey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Journey not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate(`/journey/${id}`)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Cancel
            </button>
            <h1 className="text-xl font-bold text-gray-900">Edit Journey</h1>
            <button
              onClick={handleSave}
              disabled={saving || !title}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Journey Details</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Location</h2>
            <LocationPicker onAddLocation={handleAddLocation} />
          </div>

          {locations.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Locations & Media</h2>
              <div className="space-y-6">
                {locations.map((location, index) => {
                  const locationMedia = media.filter(m => m.location_id === location.id)
                  const isExpanded = selectedLocationId === location.id

                  return (
                    <div key={location.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-700 rounded-full font-medium">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{location.place_name}</p>
                            <p className="text-sm text-gray-500">
                              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedLocationId(isExpanded ? null : location.id)}
                            className="text-sm text-primary-600 hover:text-primary-700"
                          >
                            {isExpanded ? 'Hide Media' : 'Add Media'}
                          </button>
                          <button
                            onClick={() => handleRemoveLocation(location.id)}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t">
                          <MediaUploader
                            journeyId={id!}
                            locationId={location.id}
                            onUploadComplete={loadJourney}
                          />
                        </div>
                      )}

                      {locationMedia.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                          {locationMedia.map((item) => (
                            <div key={item.id} className="relative group">
                              {item.type === 'image' ? (
                                <img
                                  src={item.url}
                                  alt={item.caption || location.place_name}
                                  className="w-full h-32 object-cover rounded-lg"
                                />
                              ) : (
                                <video
                                  src={item.url}
                                  className="w-full h-32 object-cover rounded-lg"
                                />
                              )}
                              <button
                                onClick={() => handleDeleteMedia(item.id)}
                                className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ✕
                              </button>
                              {item.caption && (
                                <p className="mt-1 text-xs text-gray-600 truncate">{item.caption}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
