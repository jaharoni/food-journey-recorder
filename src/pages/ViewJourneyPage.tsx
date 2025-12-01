import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Journey, Location, Media } from '../types'
import { JourneyMap } from '../components/JourneyMap'
import { SubstackPublisher } from '../components/SubstackPublisher'

export const ViewJourneyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [journey, setJourney] = useState<Journey | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [showPublisher, setShowPublisher] = useState(false)

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
              onClick={() => navigate('/dashboard')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Dashboard
            </button>
            <div className="flex gap-4">
              <button
                onClick={() => setShowPublisher(!showPublisher)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {showPublisher ? 'Hide' : 'Publish to Substack'}
              </button>
              <button
                onClick={() => navigate(`/journey/${id}/edit`)}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Edit Journey
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{journey.title}</h1>
              {journey.published_to_substack && (
                <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  Published to Substack
                </span>
              )}
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>Created: {new Date(journey.created_at).toLocaleDateString()}</p>
              <p>Updated: {new Date(journey.updated_at).toLocaleDateString()}</p>
            </div>
          </div>

          {journey.description && (
            <div className="prose max-w-none mb-8">
              <p className="text-gray-700 text-lg leading-relaxed">{journey.description}</p>
            </div>
          )}
        </div>

        {showPublisher && (
          <SubstackPublisher
            journeyId={journey.id}
            journeyTitle={journey.title}
            currentlyPublished={journey.published_to_substack}
            substackUrl={journey.substack_url}
            onPublishComplete={loadJourney}
          />
        )}

        {locations.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Journey Map</h2>
            <div className="h-[500px]">
              <JourneyMap locations={locations} animate={true} />
            </div>
          </div>
        )}

        {locations.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Locations</h2>
            <div className="space-y-6">
              {locations.map((location, index) => {
                const locationMedia = media.filter(m => m.location_id === location.id)
                return (
                  <div key={location.id} className="border-l-4 border-primary-500 pl-6 pb-6">
                    <div className="flex items-start gap-4 mb-4">
                      <span className="flex items-center justify-center w-10 h-10 bg-primary-100 text-primary-700 rounded-full font-bold">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {location.place_name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        </p>
                        {location.notes && (
                          <p className="text-gray-700">{location.notes}</p>
                        )}
                      </div>
                    </div>

                    {locationMedia.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 ml-14">
                        {locationMedia.map((item) => (
                          <div key={item.id} className="relative group">
                            {item.type === 'image' ? (
                              <img
                                src={item.url}
                                alt={item.caption || location.place_name}
                                className="w-full h-48 object-cover rounded-lg"
                              />
                            ) : (
                              <video
                                src={item.url}
                                controls
                                className="w-full h-48 object-cover rounded-lg"
                              />
                            )}
                            {item.caption && (
                              <p className="mt-2 text-sm text-gray-600">{item.caption}</p>
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

        {locations.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-600">No locations added yet.</p>
            <button
              onClick={() => navigate(`/journey/${id}/edit`)}
              className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              Add locations →
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
