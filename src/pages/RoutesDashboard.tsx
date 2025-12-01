import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Route } from '../types'
import { formatDistance, formatDuration } from '../lib/distance'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { generateNarrative } from '../api/generateNarrative'
import { publishToSubstack } from '../api/publishSubstack'

export const RoutesDashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRoutes()
  }, [user])

  const loadRoutes = async () => {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setRoutes(data || [])
    } catch (error) {
      console.error('Error loading routes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRoute = async (id: string) => {
    if (!confirm('Delete this route? This cannot be undone.')) return

    try {
      const { error } = await supabase
        .from('routes')
        .delete()
        .eq('id', id)

      if (error) throw error
      setRoutes(routes.filter(r => r.id !== id))
    } catch (error) {
      console.error('Error deleting route:', error)
      alert('Failed to delete route')
    }
  }

  const handleGenerateNarrative = async (id: string) => {
    try {
      await generateNarrative(id)
      alert('Narrative generated! (This is a stub - Gemini API not implemented yet)')
      loadRoutes()
    } catch (error) {
      console.error('Error generating narrative:', error)
      alert('Failed to generate narrative')
    }
  }

  const handlePublishToSubstack = async (id: string) => {
    try {
      const result = await publishToSubstack(id)
      alert(`Published! URL: ${result.substackUrl}\n\n(This is a stub - Substack API not implemented yet)`)
      loadRoutes()
    } catch (error) {
      console.error('Error publishing:', error)
      alert('Failed to publish to Substack')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Food Journey Recorder</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/profile')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Profile
              </button>
              <span className="text-sm text-gray-600">{user?.email}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">My Routes</h2>
          <button
            onClick={() => navigate('/record')}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            + Record New Route
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner message="Loading routes..." />
          </div>
        ) : routes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-gray-600 mb-4">No routes yet. Start recording your food adventures!</p>
            <button
              onClick={() => navigate('/record')}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Record your first route →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {routes.map((route) => (
              <div
                key={route.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{route.title}</h3>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        route.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : route.status === 'recording'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {route.status}
                    </span>
                  </div>

                  {route.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{route.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                    <div>
                      <span className="font-medium">Distance:</span> {formatDistance(route.total_distance)}
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span> {formatDuration(route.total_duration)}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mb-4">
                    Started: {new Date(route.started_at).toLocaleString()}
                  </div>

                  {route.status === 'completed' && (
                    <div className="space-y-2">
                      <button
                        onClick={() => navigate(`/routes/${route.id}/view`)}
                        className="w-full bg-primary-100 hover:bg-primary-200 text-primary-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        View Animated Route
                      </button>

                      <div className="flex gap-2">
                        {!route.ai_narrative && (
                          <button
                            onClick={() => handleGenerateNarrative(route.id)}
                            className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                          >
                            Generate Story
                          </button>
                        )}
                        {!route.substack_url && (
                          <button
                            onClick={() => handlePublishToSubstack(route.id)}
                            className="flex-1 bg-orange-100 hover:bg-orange-200 text-orange-800 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                          >
                            Publish
                          </button>
                        )}
                      </div>

                      {route.substack_url && (
                        <a
                          href={route.substack_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-center text-sm text-primary-600 hover:text-primary-700"
                        >
                          View on Substack →
                        </a>
                      )}
                    </div>
                  )}

                  {route.status === 'recording' && (
                    <button
                      onClick={() => navigate('/record')}
                      className="w-full bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Continue Recording
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteRoute(route.id)}
                    className="w-full mt-2 bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
