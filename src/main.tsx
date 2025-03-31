import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import 'leaflet/dist/leaflet.css'; // Base Leaflet CSS
import 'leaflet.markercluster/dist/MarkerCluster.css'; // MarkerCluster CSS
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'; // Default MarkerCluster styles (includes SVGs)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
