import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Journey } from '../types'

export const DashboardPage: React.FC = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [journeys, setJourneys] = useState<Journey[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadJourneys()
  }, [user])

  const loadJourneys = async () => {
    try {
      const { data, error } = await supabase
        .from('journeys')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setJourneys(data || [])
    } catch (error) {
      console.error('Error loading journeys:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const handleDeleteJourney = async (id: string) => {
    if (!confirm('Are you sure you want to delete this journey?')) return

    try {
      const { error } = await supabase
        .from('journeys')
        .delete()
        .eq('id', id)

      if (error) throw error
      setJourneys(journeys.filter(j => j.id !== id))
    } catch (error) {
      console.error('Error deleting journey:', error)
      alert('Failed to delete journey')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Food Journey Recorder</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">My Journeys</h2>
          <button
            onClick={() => navigate('/journey/new')}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            + Create New Journey
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading journeys...</p>
          </div>
        ) : journeys.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-gray-600 mb-4">No journeys yet. Start documenting your food adventures!</p>
            <button
              onClick={() => navigate('/journey/new')}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Create your first journey →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {journeys.map((journey) => (
              <div
                key={journey.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{journey.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{journey.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>{new Date(journey.created_at).toLocaleDateString()}</span>
                    {journey.published_to_substack && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Published</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/journey/${journey.id}`)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => navigate(`/journey/${journey.id}/edit`)}
                      className="flex-1 bg-primary-100 hover:bg-primary-200 text-primary-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteJourney(journey.id)}
                      className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
