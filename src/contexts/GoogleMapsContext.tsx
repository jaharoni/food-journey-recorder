import React, { createContext, useContext, useState, useEffect } from 'react'

interface GoogleMapsContextType {
  isLoaded: boolean
  loadError: Error | null
  google: typeof google | null
}

const GoogleMapsContext = createContext<GoogleMapsContextType | undefined>(undefined)

export const GoogleMapsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<Error | null>(null)
  const [googleInstance, setGoogleInstance] = useState<typeof google | null>(null)

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

    if (!apiKey || apiKey === 'YOUR_API_KEY') {
      setLoadError(new Error('Google Maps API key not configured'))
      return
    }

    if (window.google && window.google.maps) {
      setGoogleInstance(window.google)
      setIsLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`
    script.async = true
    script.defer = true
    script.onload = () => {
      setGoogleInstance(window.google)
      setIsLoaded(true)
    }
    script.onerror = () => {
      setLoadError(new Error('Failed to load Google Maps'))
    }
    document.head.appendChild(script)
  }, [])

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError, google: googleInstance }}>
      {children}
    </GoogleMapsContext.Provider>
  )
}

export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext)
  if (context === undefined) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider')
  }
  return context
}
