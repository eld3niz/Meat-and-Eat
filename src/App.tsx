import { useEffect, useState } from 'react';
import Layout from './components/Layout/Layout';
import WorldMap from './components/Map/WorldMap';
import { fixLeafletIconPath } from './utils/mapUtils';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  
  // Fix für die Leaflet-Icons beim Laden der App
  useEffect(() => {
    fixLeafletIconPath();
    
    // Simuliere Ladezeit für die App
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <h1 className="mt-4 text-xl font-bold text-blue-800">Meet and Eat wird geladen...</h1>
          <p className="mt-2 text-gray-600">Entdecken Sie kulinarische Highlights aus aller Welt</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <WorldMap />
    </Layout>
  );
}

export default App;
