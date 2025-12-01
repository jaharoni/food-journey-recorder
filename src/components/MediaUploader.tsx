import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

interface MediaUploaderProps {
  journeyId: string
  locationId: string
  onUploadComplete: () => void
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  journeyId,
  locationId,
  onUploadComplete,
}) => {
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState('')
  const [error, setError] = useState('')

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError('')
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        return
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${journeyId}/${locationId}/${Date.now()}.${fileExt}`
      const fileType = file.type.startsWith('image/') ? 'image' : 'video'

      const { error: uploadError } = await supabase.storage
        .from('journey-media')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('journey-media')
        .getPublicUrl(fileName)

      const { data: mediaCountData } = await supabase
        .from('media')
        .select('order_index')
        .eq('location_id', locationId)
        .order('order_index', { ascending: false })
        .limit(1)

      const nextOrderIndex = mediaCountData && mediaCountData.length > 0
        ? mediaCountData[0].order_index + 1
        : 0

      const { error: dbError } = await supabase.from('media').insert({
        journey_id: journeyId,
        location_id: locationId,
        url: urlData.publicUrl,
        type: fileType,
        caption: caption || null,
        order_index: nextOrderIndex,
      })

      if (dbError) throw dbError

      setCaption('')
      onUploadComplete()
    } catch (error: any) {
      setError(error.message || 'Failed to upload media')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-2">
          Caption (optional)
        </label>
        <input
          id="caption"
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Describe this photo or video..."
        />
      </div>

      <div>
        <label
          htmlFor="file-upload"
          className="block w-full cursor-pointer bg-primary-600 hover:bg-primary-700 text-white text-center px-4 py-3 rounded-lg font-medium transition-colors"
        >
          {uploading ? 'Uploading...' : 'Choose Photo or Video'}
        </label>
        <input
          id="file-upload"
          type="file"
          accept="image/*,video/*"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  )
}
