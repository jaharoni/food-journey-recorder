import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { LatLng } from '../types'

interface AddStopModalProps {
  routeId: string
  position: LatLng
  sequence: number
  onClose: () => void
  onStopAdded: () => void
}

export const AddStopModal: React.FC<AddStopModalProps> = ({
  routeId,
  position,
  sequence,
  onClose,
  onStopAdded,
}) => {
  const [placeName, setPlaceName] = useState('')
  const [notes, setNotes] = useState('')
  const [rating, setRating] = useState<number>(5)
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [error, setError] = useState('')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setUploading(true)

    try {
      const { data: stop, error: stopError } = await supabase
        .from('stops')
        .insert({
          route_id: routeId,
          latitude: position.lat,
          longitude: position.lng,
          place_name: placeName,
          notes,
          rating,
          sequence,
          recorded_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (stopError) throw stopError

      for (const file of uploadedFiles) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${routeId}/${stop.id}/${Date.now()}.${fileExt}`
        const fileType = file.type.startsWith('image/') ? 'image' : 'video'

        const { error: uploadError } = await supabase.storage
          .from('journey-media')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('journey-media')
          .getPublicUrl(fileName)

        await supabase.from('stop_media').insert({
          stop_id: stop.id,
          route_id: routeId,
          url: urlData.publicUrl,
          type: fileType,
        })
      }

      onStopAdded()
    } catch (err: any) {
      setError(err.message || 'Failed to add stop')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Stop</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="placeName" className="block text-sm font-medium text-gray-700 mb-2">
                Place Name *
              </label>
              <input
                id="placeName"
                type="text"
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Restaurant or location name"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="What did you eat? How was it?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-3xl ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos/Videos
              </label>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              {uploadedFiles.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    {uploadedFiles.length} file(s) selected
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={uploading}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || !placeName}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Adding...' : 'Add Stop'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
