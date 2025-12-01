import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Journey } from '../types'

export const useJourneys = () => {
  const [journeys, setJourneys] = useState<Journey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadJourneys = async () => {
    try {
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('journeys')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setJourneys(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load journeys')
    } finally {
      setLoading(false)
    }
  }

  const deleteJourney = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('journeys')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      setJourneys(journeys.filter(j => j.id !== id))
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete journey' }
    }
  }

  useEffect(() => {
    loadJourneys()
  }, [])

  return { journeys, loading, error, loadJourneys, deleteJourney }
}
