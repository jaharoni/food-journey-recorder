import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { UserProfile } from '../types'
import { LoadingSpinner } from '../components/LoadingSpinner'

export const ProfilePage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProfile()
  }, [user])

  const loadProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setProfile(data)
        setDisplayName(data.display_name || '')
      } else {
        const newProfile = {
          id: user.id,
          email: user.email || '',
          display_name: '',
          head_cutout_url: null,
        }
        const { data: created, error: createError } = await supabase
          .from('user_profiles')
          .insert(newProfile)
          .select()
          .single()

        if (createError) throw createError
        setProfile(created)
      }
    } catch (err) {
      console.error('Error loading profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleHeadCutoutUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return

    setError('')
    setUploading(true)

    try {
      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/head-cutout.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('journey-media')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('journey-media')
        .getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ head_cutout_url: urlData.publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      await loadProfile()
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setError('')
    setSaving(true)

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          display_name: displayName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner message="Loading profile..." />
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
            <h1 className="text-xl font-bold text-gray-900">Profile</h1>
            <div className="w-32"></div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Head Cutout Photo
              </label>
              <p className="text-sm text-gray-600 mb-4">
                Upload a profile photo that will be used as your animated marker on route playback.
                Best if it's a front-facing headshot with a clear background.
              </p>

              {profile?.head_cutout_url && (
                <div className="mb-4">
                  <img
                    src={profile.head_cutout_url}
                    alt="Head cutout"
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                </div>
              )}

              <label
                htmlFor="head-cutout-upload"
                className="inline-block cursor-pointer bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {uploading ? 'Uploading...' : profile?.head_cutout_url ? 'Change Photo' : 'Upload Photo'}
              </label>
              <input
                id="head-cutout-upload"
                type="file"
                accept="image/*"
                onChange={handleHeadCutoutUpload}
                disabled={uploading}
                className="hidden"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
