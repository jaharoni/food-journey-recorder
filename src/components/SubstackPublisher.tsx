import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

interface SubstackPublisherProps {
  journeyId: string
  journeyTitle: string
  currentlyPublished: boolean
  substackUrl?: string
  onPublishComplete: () => void
}

export const SubstackPublisher: React.FC<SubstackPublisherProps> = ({
  journeyId,
  currentlyPublished,
  substackUrl,
  onPublishComplete,
}) => {
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')
  const [newSubstackUrl, setNewSubstackUrl] = useState(substackUrl || '')

  const handlePublish = async () => {
    if (!newSubstackUrl) {
      setError('Please enter your Substack post URL')
      return
    }

    setError('')
    setPublishing(true)

    try {
      const { error } = await supabase
        .from('journeys')
        .update({
          published_to_substack: true,
          substack_url: newSubstackUrl,
        })
        .eq('id', journeyId)

      if (error) throw error

      onPublishComplete()
    } catch (err: any) {
      setError(err.message || 'Failed to mark as published')
    } finally {
      setPublishing(false)
    }
  }

  const handleUnpublish = async () => {
    if (!confirm('Mark this journey as unpublished?')) return

    setPublishing(true)

    try {
      const { error } = await supabase
        .from('journeys')
        .update({
          published_to_substack: false,
          substack_url: null,
        })
        .eq('id', journeyId)

      if (error) throw error

      setNewSubstackUrl('')
      onPublishComplete()
    } catch (err: any) {
      setError(err.message || 'Failed to unpublish')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Substack Publishing</h2>

      {currentlyPublished ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium mb-2">This journey is published to Substack</p>
            {substackUrl && (
              <a
                href={substackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:text-primary-700 underline"
              >
                View on Substack →
              </a>
            )}
          </div>
          <button
            onClick={handleUnpublish}
            disabled={publishing}
            className="w-full bg-red-100 hover:bg-red-200 text-red-800 px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {publishing ? 'Updating...' : 'Mark as Unpublished'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              To publish your journey to Substack, first create a post manually on Substack with your journey content.
              Then paste the URL of your published post below to track it.
            </p>
          </div>

          <div>
            <label htmlFor="substackUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Substack Post URL
            </label>
            <input
              id="substackUrl"
              type="url"
              value={newSubstackUrl}
              onChange={(e) => setNewSubstackUrl(e.target.value)}
              placeholder="https://yoursubstack.substack.com/p/your-post"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={handlePublish}
            disabled={publishing || !newSubstackUrl}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {publishing ? 'Saving...' : 'Mark as Published'}
          </button>
        </div>
      )}
    </div>
  )
}
