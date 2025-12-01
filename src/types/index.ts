export interface Route {
  id: string
  user_id: string
  title: string
  description: string
  status: 'recording' | 'paused' | 'completed'
  started_at: string
  finished_at?: string
  total_distance: number
  total_duration: number
  ai_narrative?: string
  substack_url?: string
  created_at: string
  updated_at: string
}

export interface RoutePoint {
  id: string
  route_id: string
  latitude: number
  longitude: number
  sequence: number
  recorded_at: string
  created_at: string
}

export interface Stop {
  id: string
  route_id: string
  latitude: number
  longitude: number
  place_name: string
  notes: string
  rating?: number
  sequence: number
  recorded_at: string
  created_at: string
}

export interface StopMedia {
  id: string
  stop_id: string
  route_id: string
  url: string
  type: 'image' | 'video'
  created_at: string
}

export interface UserProfile {
  id: string
  email: string
  head_cutout_url?: string
  display_name?: string
  created_at: string
  updated_at: string
}

export interface LatLng {
  lat: number
  lng: number
}
