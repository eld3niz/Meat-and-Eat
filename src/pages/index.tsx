import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'

// Dynamischer Import, um Server-side Rendering-Probleme mit Leaflet zu vermeiden
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false
})

export default function Home() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <div className="flex flex-col h-full">
      <Header />
      <main className="flex-grow">
        {isClient && <MapComponent />}
      </main>
    </div>
  )
}
