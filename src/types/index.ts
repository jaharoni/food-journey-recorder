export interface Journey {
  id: string
  user_id: string
  title: string
  description: string
  created_at: string
  updated_at: string
  published_to_substack: boolean
  substack_url?: string
}

export interface Location {
  id: string
  journey_id: string
  place_name: string
  latitude: number
  longitude: number
  order_index: number
  notes?: string
  created_at: string
}

export interface Media {
  id: string
  location_id: string
  journey_id: string
  url: string
  type: 'image' | 'video'
  caption?: string
  order_index: number
  created_at: string
}

export interface User {
  id: string
  email: string
  created_at: string
}
