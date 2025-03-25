import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { debounce, throttle } from '../../utils/mapUtils';
import L from 'leaflet';

// Koordinatenumwandlungsfunktionen
const latLonToVector3 = (lat: number, lon: number, radius: number): THREE.Vector3 => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  
  return new THREE.Vector3(x, y, z);
};

// Umwandlung von 3D-Koordinaten zu Lat/Long
const vector3ToLatLon = (position: THREE.Vector3, radius: number): { lat: number, lon: number } => {
  const phi = Math.acos(position.y / radius);
  const theta = Math.atan2(position.z, -position.x);
  
  const lat = 90 - phi * (180 / Math.PI);
  const lon = theta * (180 / Math.PI) - 180;
  
  return { lat, lon };
};

// Kameraposition zu Leaflet-Zoom umrechnen
const cameraPositionToZoom = (distance: number, radius: number): number => {
  // Maximaler Abstand entspricht Zoom-Level 2, Minimaler Abstand entspricht Zoom-Level 10
  const maxDistance = radius * 4;
  const minDistance = radius * 1.2;
  
  // Logarithmische Skalierung für natürlicheres Zoomverhalten
  const zoomLevel = 10 - 8 * (Math.log(distance) - Math.log(minDistance)) / (Math.log(maxDistance) - Math.log(minDistance));
  return Math.max(2, Math.min(10, zoomLevel));
};

// Leaflet-Zoom zu Kameraabstand umrechnen
const zoomToCameraDistance = (zoom: number, radius: number): number => {
  const maxDistance = radius * 4;
  const minDistance = radius * 1.2;
  
  // Umkehrfunktion der obigen Formel
  const distanceFactor = 1 - (zoom - 2) / 8;
  const distance = minDistance * Math.exp(distanceFactor * (Math.log(maxDistance) - Math.log(minDistance)));
  return distance;
};

// Komponente zur Synchronisierung des Leaflet-Maps mit dem 3D-Globus
const SyncMapWithGlobe: React.FC<{
  onMapChange: (center: [number, number], zoom: number) => void;
  threeJsReady: boolean;
}> = ({ onMapChange, threeJsReady }) => {
  const map = useMap();
  
  // Map-Events abfangen und an den 3D-Globus weiterleiten
  useMapEvents({
    moveend: throttle(() => {
      if (threeJsReady) {
        const center = map.getCenter();
        const zoom = map.getZoom();
        onMapChange([center.lat, center.lng], zoom);
      }
    }, 100),
    zoom: throttle(() => {
      if (threeJsReady) {
        const center = map.getCenter();
        const zoom = map.getZoom();
        onMapChange([center.lat, center.lng], zoom);
      }
    }, 100)
  });
  
  return null;
};

const HybridMapPage: React.FC = () => {
  const [isThreeJsReady, setIsThreeJsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20, 0]);
  const [mapZoom, setMapZoom] = useState(3);
  const [viewMode, setViewMode] = useState<'2d' | '3d' | 'hybrid'>('hybrid');
  
  // Refs für Three.js-Elemente
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const earthRef = useRef<THREE.Mesh | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  
  // Konstante für den Erdradius
  const EARTH_RADIUS = 100;
  
  // Umschalten zwischen 2D und 3D-Ansicht
  const toggleViewMode = () => {
    setViewMode(prev => {
      if (prev === '2d') return '3d';
      if (prev === '3d') return 'hybrid';
      return '2d';
    });
  };
  
  // Handler für Änderungen in der Leaflet-Karte
  const handleMapChange = useCallback((center: [number, number], zoom: number) => {
    if (!cameraRef.current || !controlsRef.current || !earthRef.current) return;
    
    // Kameraposition aktualisieren basierend auf Kartenposition
    const target = latLonToVector3(center[0], center[1], EARTH_RADIUS);
    
    // Distanz basierend auf Zoom-Level berechnen
    const distance = zoomToCameraDistance(zoom, EARTH_RADIUS);
    
    // Kamera-Position berechnen (von der Zielposition in Richtung Ursprung)
    const direction = target.clone().normalize();
    const cameraPosition = target.clone().add(direction.multiplyScalar(-distance));
    
    // Erde so rotieren, dass der ausgewählte Punkt nach vorne zeigt
    const earthRotation = new THREE.Euler(
      0,
      THREE.MathUtils.degToRad(-center[1]),
      0,
      'YXZ'
    );
    
    // Animation der Kamera- und Erdposition
    animateCamera(cameraPosition, target, earthRotation);
  }, []);

  // Animation der Kamera und Erde
  const animateCamera = (
    targetPosition: THREE.Vector3,
    lookAtTarget: THREE.Vector3,
    earthRotation: THREE.Euler
  ) => {
    if (!cameraRef.current || !controlsRef.current || !earthRef.current) return;
    
    const camera = cameraRef.current;
    const earth = earthRef.current;
    const controls = controlsRef.current;
    
    // Aktuelle Positionen
    const startPosition = camera.position.clone();
    const startRotation = earth.rotation.clone();
    
    // Zielwerte
    controls.target.copy(lookAtTarget);
    
    // Animationsparameter
    const duration = 1000; // ms
    const startTime = Date.now();
    
    // Animationsfunktion
    const animate = () => {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      // Easing-Funktion für sanftere Animation
      const eased = easeInOutCubic(progress);
      
      // Kameraposition interpolieren
      camera.position.lerpVectors(startPosition, targetPosition, eased);
      
      // Erdrotation interpolieren
      earth.rotation.set(
        startRotation.x + (earthRotation.x - startRotation.x) * eased,
        startRotation.y + (earthRotation.y - startRotation.y) * eased,
        startRotation.z + (earthRotation.z - startRotation.z) * eased
      );
      
      // Kamera aktualisieren
      controls.update();
      
      // Animation fortsetzen, wenn noch nicht abgeschlossen
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    // Animation starten
    animate();
  };
  
  // Easing-Funktion für sanftere Übergänge
  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };
  
  // Handler für Änderungen des Three.js-Globus
  const handleGlobeChange = useCallback(debounce(() => {
    if (!cameraRef.current || !earthRef.current) return;
    
    const camera = cameraRef.current;
    
    // Berechne Entfernung von der Kamera zum Mittelpunkt
    const distance = camera.position.length();
    
    // Konvertiere Kameraposition zu Lat/Long
    const cameraDirection = camera.position.clone().normalize();
    const { lat, lon } = vector3ToLatLon(cameraDirection, 1);
    
    // Berechne Zoom-Level basierend auf Entfernung
    const zoom = cameraPositionToZoom(distance, EARTH_RADIUS);
    
    // Aktualisiere Zustand für Leaflet-Karte
    setMapCenter([lat, lon]);
    setMapZoom(zoom);
  }, 150), []);
  
  // Initialisierung der Three.js-Szene
  useEffect(() => {
    if (!mountRef.current) return;
    
    // Erlaube Scrollen auf dieser Seite
    document.body.classList.add('allow-scroll');
    
    try {
      // Szene, Kamera und Renderer einrichten
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a365d); // Dunkelblau
      sceneRef.current = scene;
      
      const camera = new THREE.PerspectiveCamera(
        75, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        1000
      );
      camera.position.z = 200;
      cameraRef.current = camera;
      
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true // Transparenter Hintergrund
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x000000, 0); // Transparenter Hintergrund
      mountRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;
      
      // Orbitkontrollen für Interaktivität
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.addEventListener('change', handleGlobeChange);
      controlsRef.current = controls;
      
      // Beleuchtung
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      
      const pointLight = new THREE.PointLight(0xffffff, 1);
      pointLight.position.set(10, 10, 10);
      scene.add(pointLight);
      
      // Erde erstellen
      const earthGeometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
      const earthMaterial = new THREE.MeshPhongMaterial({
        color: 0x2233ff,
        emissive: 0x112244,
        specular: 0xffffff,
        shininess: 10
      });
      
      const earth = new THREE.Mesh(earthGeometry, earthMaterial);
      scene.add(earth);
      earthRef.current = earth;
      
      // Markierungen für Städte hinzufügen
      const cityLocations = [
        { name: "New York", lat: 40.7128, lon: -74.0060, size: 2 },
        { name: "London", lat: 51.5074, lon: -0.1278, size: 2 },
        { name: "Tokyo", lat: 35.6762, lon: 139.6503, size: 2 },
        { name: "Sydney", lat: -33.8688, lon: 151.2093, size: 1.5 },
        { name: "Rio de Janeiro", lat: -22.9068, lon: -43.1729, size: 1.5 },
        { name: "Cape Town", lat: -33.9249, lon: 18.4241, size: 1.3 },
        { name: "Moscow", lat: 55.7558, lon: 37.6173, size: 1.8 },
        { name: "Beijing", lat: 39.9042, lon: 116.4074, size: 2 },
        { name: "Dubai", lat: 25.2048, lon: 55.2708, size: 1.7 },
      ];
      
      cityLocations.forEach(city => {
        const markerGeometry = new THREE.SphereGeometry(city.size, 16, 16);
        const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff6347 });
        
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        const position = latLonToVector3(city.lat, city.lon, EARTH_RADIUS + 0.5);
        marker.position.set(position.x, position.y, position.z);
        
        scene.add(marker);
      });
      
      // Sterne im Hintergrund
      const starGeometry = new THREE.BufferGeometry();
      const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1,
        transparent: true
      });
      
      const starVertices = [];
      for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starVertices.push(x, y, z);
      }
      
      starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
      const stars = new THREE.Points(starGeometry, starMaterial);
      scene.add(stars);
      
      // Animation
      const animate = () => {
        requestAnimationFrame(animate);
        
        controls.update();
        renderer.render(scene, camera);
      };
      
      animate();
      
      // Event-Handler für Fenstergrößenänderungen
      const handleResize = () => {
        if (!cameraRef.current || !rendererRef.current) return;
        
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        
        rendererRef.current.setSize(width, height);
      };
      
      window.addEventListener('resize', handleResize);
      
      // Three.js ist bereit
      setIsThreeJsReady(true);
      
      // Aufräumen
      return () => {
        window.removeEventListener('resize', handleResize);
        
        if (controlsRef.current) {
          controlsRef.current.removeEventListener('change', handleGlobeChange);
        }
        
        if (mountRef.current && rendererRef.current) {
          mountRef.current.removeChild(rendererRef.current.domElement);
        }
        
        // Bereinige Three.js-Ressourcen
        if (rendererRef.current) {
          rendererRef.current.dispose();
        }
        
        // Entferne alle Objekte aus der Szene
        if (sceneRef.current) {
          sceneRef.current.clear();
        }
        
        document.body.classList.remove('allow-scroll');
      };
    } catch (error) {
      console.error('Fehler beim Initialisieren der Three.js-Szene:', error);
      setLoadError('Three.js konnte nicht geladen werden. Bitte stellen Sie sicher, dass Three.js installiert ist.');
    }
  }, [handleGlobeChange]);
  
  // CSS-Klassen für verschiedene Ansichtsmodi
  const getMapClasses = () => {
    if (viewMode === '2d') return 'opacity-100';
    if (viewMode === '3d') return 'opacity-0 pointer-events-none';
    return 'opacity-70'; // Für hybrid-Modus
  };
  
  const getGlobeClasses = () => {
    if (viewMode === '3d') return 'opacity-100';
    if (viewMode === '2d') return 'opacity-0 pointer-events-none';
    return 'opacity-100'; // Für hybrid-Modus
  };
  
  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Three.js Globus */}
      <div 
        ref={mountRef} 
        className={`absolute inset-0 z-0 transition-opacity duration-500 ${getGlobeClasses()}`}
      />
      
      {/* Leaflet Karte */}
      <div className={`absolute inset-0 z-10 transition-opacity duration-500 ${getMapClasses()}`}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%', background: 'transparent' }}
          zoomControl={false}
          attributionControl={false}
          worldCopyJump={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            opacity={viewMode === 'hybrid' ? 0.7 : 1}
          />
          <SyncMapWithGlobe onMapChange={handleMapChange} threeJsReady={isThreeJsReady} />
        </MapContainer>
      </div>
      
      {/* Fehleranzeige */}
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
            <h2 className="text-xl font-bold mb-2">Fehler beim Laden</h2>
            <p>{loadError}</p>
            <p className="mt-4">
              <a 
                href="/"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Zurück zur Karte
              </a>
            </p>
          </div>
        </div>
      )}
      
      {/* Steuerelemente */}
      <div className="absolute top-6 right-6 z-20 bg-white bg-opacity-80 p-3 rounded-lg shadow-lg">
        <button
          onClick={toggleViewMode}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          {viewMode === '2d' ? '3D-Ansicht' : viewMode === '3d' ? 'Hybrid-Ansicht' : '2D-Ansicht'}
        </button>
      </div>
      
      {/* Navigationshilfe */}
      <div className="absolute bottom-6 right-6 z-20">
        <a 
          href="/"
          className="bg-white text-blue-900 px-6 py-3 rounded-full shadow-lg font-medium hover:bg-blue-100 transition-colors"
        >
          Zurück zur Karte
        </a>
      </div>
      
      {/* Info-Box */}
      <div className="absolute top-6 left-6 text-white bg-black bg-opacity-50 p-4 rounded-lg z-20 max-w-md">
        <h2 className="text-2xl font-bold mb-2">Hybride Welt-Karte</h2>
        <p className="mb-4">
          Erkunden Sie unsere interaktive Weltkarte in 2D und 3D. Wechseln Sie zwischen den Ansichten oder nutzen Sie den Hybrid-Modus.
        </p>
        <div className="text-sm">
          <p>• Ziehen Sie, um zu navigieren</p>
          <p>• Scrollen Sie, um zu zoomen</p>
          <p>• Änderungen in einer Ansicht werden mit der anderen synchronisiert</p>
        </div>
      </div>
    </div>
  );
};

export default HybridMapPage;
