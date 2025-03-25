import React, { useEffect, useRef, useState } from 'react';

// Fallback-Komponente für den Fall, dass Three.js nicht geladen werden kann
const ThreeWorldPage: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isThreeJsLoaded, setIsThreeJsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  useEffect(() => {
    // Erlaube Scrollen auf dieser Seite
    document.body.classList.add('allow-scroll');
    
    // Dynamisches Laden von Three.js
    const loadThreeJs = async () => {
      try {
        // Versuche, Three.js dynamisch zu laden
        const THREE = await import('three');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls');
        
        setIsThreeJsLoaded(true);
        initThreeJsScene(THREE, OrbitControls);
      } catch (error) {
        console.error('Failed to load Three.js:', error);
        setLoadError('Three.js konnte nicht geladen werden. Bitte stellen Sie sicher, dass Three.js installiert ist.');
      }
    };
    
    loadThreeJs();
    
    // Bereinigung
    return () => {
      document.body.classList.remove('allow-scroll');
    };
  }, []);
  
  // Three.js Szeneninitialisierung in eine separate Funktion extrahieren
  const initThreeJsScene = (THREE: any, OrbitControls: any) => {
    if (!mountRef.current) return;
    
    // Szene, Kamera und Renderer einrichten
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a365d); // Dunkelblau wie das Branding
    
    const camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    camera.position.z = 200;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);
    
    // Orbitkontrollen für Interaktivität
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Beleuchtung hinzufügen
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);
    
    // Vereinfachte Version der Erde erstellen ohne externe Textur
    const earthGeometry = new THREE.SphereGeometry(100, 64, 64);
    
    // Einfache blaue Erde ohne externe Textur
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x2233ff,
      emissive: 0x112244,
      specular: 0xffffff,
      shininess: 10
    });
    
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);
    
    // Markierungen für einige der wichtigsten Städte hinzufügen
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
    
    // Hilfsfunktion, um Lat/Lon in XYZ-Koordinaten auf der Kugel umzuwandeln
    const latLonToVector3 = (lat: number, lon: number, radius: number): THREE.Vector3 => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      
      const x = -radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      
      return new THREE.Vector3(x, y, z);
    };
    
    // Städte-Marker erstellen
    cityLocations.forEach(city => {
      const markerGeometry = new THREE.SphereGeometry(city.size, 16, 16);
      const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff6347 }); // Orange/Rot für Marker
      
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      const position = latLonToVector3(city.lat, city.lon, 101);
      marker.position.set(position.x, position.y, position.z);
      
      scene.add(marker);
    });
    
    // Sterne im Hintergrund hinzufügen
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
    
    // Animation-Loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Die Erde langsam rotieren
      earth.rotation.y += 0.001;
      
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Fenstergröße anpassen
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      
      renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Bereinigung (wird ausgeführt, wenn die Komponente unmounted wird)
    const cleanup = () => {
      window.removeEventListener('resize', handleResize);
      
      if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Speicherbereinigung
      scene.dispose();
      earthGeometry.dispose();
      earthMaterial.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
    };
    
    // Speichere die Cleanup-Funktion im ref, damit sie später aufgerufen werden kann
    return cleanup;
  };
  
  return (
    <div className="relative h-screen w-full bg-blue-900">
      {/* Mount-Punkt für Three.js */}
      <div ref={mountRef} className="absolute inset-0" />
      
      {/* Zeige Fehler an, wenn Three.js nicht geladen werden konnte */}
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center">
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
      
      {/* Lade-Anzeige während Three.js geladen wird */}
      {!isThreeJsLoaded && !loadError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-xl">3D Welt wird geladen...</p>
          </div>
        </div>
      )}
      
      {/* Overlay-Informationen nur anzeigen, wenn Three.js geladen ist */}
      {isThreeJsLoaded && (
        <div className="absolute top-6 left-6 text-white bg-black bg-opacity-50 p-4 rounded-lg z-10 max-w-md">
          <h2 className="text-2xl font-bold mb-2">3D Welt von Meet and Eat</h2>
          <p className="mb-4">Erkunden Sie eine interaktive 3D-Darstellung der Welt. Die markierten Punkte zeigen beliebte Reiseziele in unserem Netzwerk.</p>
          <div className="text-sm">
            <p>• Ziehen Sie, um zu drehen</p>
            <p>• Scrollen Sie, um zu zoomen</p>
            <p>• Drücken Sie Shift + Ziehen zum Verschieben</p>
          </div>
        </div>
      )}
      
      {/* Navigationshilfe */}
      <div className="absolute bottom-6 right-6">
        <a 
          href="/"
          className="bg-white text-blue-900 px-6 py-3 rounded-full shadow-lg font-medium hover:bg-blue-100 transition-colors"
        >
          Zurück zur Karte
        </a>
      </div>
    </div>
  );
};

export default ThreeWorldPage;
