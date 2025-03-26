# Entwicklungsplan: World Map mit den 100 größten Städte

## Projektübersicht
Eine moderne React-Webanwendung, die eine interaktive Weltkarte mit Markierungen für die 100 größten Städte der Welt anzeigt. Die Anwendung verwendet Leaflet für die Kartendarstellung und implementiert Marker-Clustering für Bereiche mit hoher Markerdichte. Zusätzlich wird eine ansprechende Landing Page integriert, die die Vorteile des Reisens und Essens mit Locals hervorhebt.

## Aktuelles Arbeitsverzeichnis
/workspaces/Meat-and-Eat/

## Website Informationen
- **Name:** Meet and Eat
- **Beschreibung:** Eine interaktive Weltkarte, die die 100 größten Städte der Welt anzeigt und es Benutzern ermöglicht, lokale Essensmöglichkeiten zu entdecken.
- **URL:** (TBD - Nach dem Deployment auf Vercel)

## Zielgruppe
- Personen, die gerne reisen und neue Kulturen kennenlernen möchten.
- Feinschmecker, die lokale kulinarische Erlebnisse suchen.
- Expats und Neuankömmlinge, die sich in einer neuen Stadt orientieren möchten.

## Monetarisierung (Optional)
- Premium-Funktionen (z.B. detaillierte Stadtführer, Offline-Karten).
- Partnerschaften mit lokalen Restaurants und Reiseanbietern.
- Anzeigen (nicht-intrusiv).

## Tech Stack
- React mit TypeScript
- Vite als Build-Tool
- React-Leaflet für Kartenintegration
- Leaflet.markercluster für Clustering
- TailwindCSS für Styling
- Vercel für Deployment
- ESLint und Prettier für Codequalität

## Ordnerstruktur
```
/workspaces/Meat-and-Eat/
│
├── public/
│   ├── assets/
│   │   ├── images/             # Bilder und Icons
│   │   └── markers/               # Benutzerdefinierte Marker-Icons
│   └── sw.js                    # Service Worker für Offline-Caching
│
├── src/
│   ├── components/
│   │   ├── Auth/                # Auth Komponenten (Login, Register)
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── Map/                   # Map-bezogene Komponenten
│   │   │   ├── WorldMap.tsx       # Haupt-Kartenkomponente
│   │   │   ├── Markers.tsx        # Marker-Logik
│   │   │   ├── MarkerCluster.tsx  # Clustering-Logik
│   │   │   ├── InfoPopup.tsx      # Popup-Komponente für Marker-Informationen
│   │   │   └── UserLocationMarker.tsx # Komponente für den Benutzerstandort
│   │   ├── Layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Layout.tsx         # Layout-Komponente für Seitenstruktur
│   │   ├── Pages/               # Seiten Komponenten
│   │   │   ├── AboutPage.tsx      # Über Uns Seite
│   │   │   ├── DatenschutzPage.tsx # Datenschutz Seite
│   │   │   ├── ImpressumPage.tsx  # Impressum Seite
│   │   │   └── MapPage.tsx        # Hauptkartenseite
│   │   └── UI/                    # Wiederverwendbare UI-Komponenten
│   │       ├── SearchBar.tsx      # Suchleiste
│   │       ├── Sidebar.tsx        # Seitenleiste mit Filtern
│   │       └── DistanceFilter.tsx # Entfernungsfilter Komponente
│   │
│   ├── hooks/
│   │   └── useMapData.ts          # Hook für Kartendaten
│   │
│   ├── data/
│   │   └── cities.ts              # Daten der 100 größten Städte
│   │
│   ├── types/
│   │   └── index.ts               # TypeScript-Typdefinitionen
│   │
│   ├── utils/
│   │   └── mapUtils.ts            # Hilfsfunktionen für die Karte
│   │
│   ├── App.tsx                    # Hauptanwendungskomponente
│   ├── main.tsx                   # Entry point
│   ├── index.css                  # Globale Styles
│   └── vite-env.d.ts              # TypeScript-Umgebungsvariablen
```

## Implementierungsphasen

### Phase 1: Projektinitialisierung (Abgeschlossen)
- [x] Erstellen eines Vite-Projekts mit React und TypeScript: `npm create vite`
- [x] Einrichten von TailwindCSS: `npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p`
- [x] Installieren von ESLint und Prettier für Codequalität
- [x] Erstellen der Basisordnerstruktur (siehe oben)
- [x] Einrichten der Versionskontrolle (Git)

### Phase 2: Datenaufbereitung (Abgeschlossen)
- [x] Recherchieren und Sammeln von Daten zu den 100 größten Städten (Name, Land, Koordinaten, Bevölkerungszahl, Beschreibung, Sehenswürdigkeiten, Gründungsjahr).
- [x] Erstellen der Datenstruktur in `src/data/cities.ts` (siehe #file:src/data/cities.ts als Beispiel).
  ```typescript
  // filepath: src/data/cities.ts
  export interface City {
    id: number;
    name: string;
    country: string;
    latitude: number;
    longitude: number;
    population: number;
    description: string;
    landmarks: string[];
    foundedYear: number;
  }

  export const cities: City[] = [
    // ... (Beispiel)
    {
      id: 1,
      name: "Tokio",
      country: "Japan",
      latitude: 35.6762,
      longitude: 139.6503,
      population: 37400000,
      description: "Die Hauptstadt Japans und größte Metropolregion der Welt.",
      landmarks: ["Tokyo Skytree", "Kaiserpalast", "Shibuya-Kreuzung"],
      foundedYear: 1457
    },
    // ...
  ];
  ```

### Phase 3: Kartenimplementierung (In Arbeit)
- [ ] Installation von React-Leaflet und Leaflet.markercluster: `npm install leaflet react-leaflet leaflet.markercluster`
- [ ] Beheben des Problems mit fehlenden Icon-Pfaden in Leaflet (siehe `src/utils/mapUtils.ts`).
- [ ] Erstellen der Basis-Kartenkomponente (`src/components/Map/WorldMap.tsx`):
  ```typescript
  // filepath: src/components/Map/WorldMap.tsx
  import React, { useEffect, useState } from 'react';
  import { MapContainer, TileLayer, useMap } from 'react-leaflet';
  import 'leaflet/dist/leaflet.css';

  const WorldMap: React.FC = () => {
    const [map, setMap] = useState<any>(null);

    useEffect(() => {
      if (!map) return;

      // Definiere die maximalen Grenzen der Karte (Weltkarte einmalig sichtbar)
      // Benutze -85 bis 85 für Latitude, weil Mercator-Projektionen nahe den Polen Verzerrungen haben
      const southWest = L.latLng(-85, -180);
      const northEast = L.latLng(85, 180);
      const bounds = L.latLngBounds(southWest, northEast);

      map.setMaxBounds(bounds);
      map.setMinZoom(2); // Verhindert zu starkes herauszoomen
    }, [map]);

    return (
      <MapContainer
        className="h-full w-full"
        center={[20, 0]}
        zoom={2}
        maxZoom={18}
        style={{ height: '100%', width: '100%' }}
        whenCreated={setMap}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
      </MapContainer>
    );
  };

  export default WorldMap;
  ```
- [ ] Implementieren der Marker basierend auf den Stadtdaten (`src/components/Map/Markers.tsx`):
  ```typescript
  // filepath: src/components/Map/Markers.tsx
  import React from 'react';
  import { Marker, Popup } from 'react-leaflet';
  import { City } from '../../types';

  interface MarkersProps {
    cities: City[];
  }

  const Markers: React.FC<MarkersProps> = ({ cities }) => {
    return (
      <>
        {cities.map(city => (
          <Marker key={city.id} position={[city.latitude, city.longitude]}>
            <Popup>
              <h2>{city.name}</h2>
              <p>{city.description}</p>
            </Popup>
          </Marker>
        ))}
      </>
    );
  };

  export default Markers;
  ```
- [ ] Hinzufügen von Marker-Clustering für dichte Bereiche (`src/components/Map/MarkerCluster.tsx`):
  ```typescript
  // filepath: src/components/Map/MarkerCluster.tsx
  import React, { useEffect, useRef } from 'react';
  import { useMap } from 'react-leaflet';
  import MarkerClusterGroup from 'leaflet.markercluster';
  import 'leaflet.markercluster/dist/leaflet.markercluster.js';
  import 'leaflet.markercluster/dist/MarkerCluster.css';
  import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
  import { City } from '../../types';
  import Markers from './Markers';

  interface MarkerClusterProps {
    cities: City[];
  }

  const MarkerCluster: React.FC<MarkerClusterProps> = ({ cities }) => {
    const map = useMap();
    const markerClusterRef = useRef<any>(null);

    useEffect(() => {
      if (!map) return;

      if (markerClusterRef.current) {
        markerClusterRef.current.clearLayers();
      }

      markerClusterRef.current = new MarkerClusterGroup();

      cities.forEach(city => {
        const marker = L.marker([city.latitude, city.longitude]);
        markerClusterRef.current.addLayer(marker);
      });

      map.addLayer(markerClusterRef.current);

      return () => {
        map.removeLayer(markerClusterRef.current);
      };
    }, [cities, map]);

    return null;
  };

  export default MarkerCluster;
  ```
- [ ] Integration der Komponenten in `src/components/Map/WorldMap.tsx`:
  ```typescript
  // filepath: src/components/Map/WorldMap.tsx
  import React, { useEffect, useState } from 'react';
  import { MapContainer, TileLayer, useMap } from 'react-leaflet';
  import 'leaflet/dist/leaflet.css';
  import MarkerCluster from './MarkerCluster';
  import { cities } from '../../data/cities';

  const WorldMap: React.FC = () => {
    const [map, setMap] = useState<any>(null);

    useEffect(() => {
      if (!map) return;

      // Definiere die maximalen Grenzen der Karte (Weltkarte einmalig sichtbar)
      // Benutze -85 bis 85 für Latitude, weil Mercator-Projektionen nahe den Polen Verzerrungen haben
      const southWest = L.latLng(-85, -180);
      const northEast = L.latLng(85, 180);
      const bounds = L.latLngBounds(southWest, northEast);

      map.setMaxBounds(bounds);
      map.setMinZoom(2); // Verhindert zu starkes herauszoomen
    }, [map]);

    return (
      <MapContainer
        className="h-full w-full"
        center={[20, 0]}
        zoom={2}
        maxZoom={18}
        style={{ height: '100%', width: '100%' }}
        whenCreated={setMap}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MarkerCluster cities={cities} />
      </MapContainer>
    );
  };

  export default WorldMap;
  ```

### Phase 4: UI und Interaktivität (Geplant)
- [ ] Entwickeln der Popup-Komponente für Markerinformationen (`src/components/Map/InfoPopup.tsx`).
- [ ] Implementieren von Hover- und Klick-Interaktionen (in `src/components/Map/Markers.tsx`).
- [ ] Verbessern des UI mit TailwindCSS (Farben, Schriftarten, Abstände).
- [ ] Erstellen der `src/components/UI/Sidebar.tsx` mit Filtern (Land, Bevölkerungszahl, Suchleiste).
- [ ] Implementieren der responsiven Darstellung (Media Queries in TailwindCSS).
- [ ] Implementierung der `src/components/UI/SearchBar.tsx` für die Suche nach Städten.
- [ ] Implementierung der `src/components/Map/UserLocationMarker.tsx` für die Anzeige des Benutzerstandorts.

### Phase 5: Seiten und Navigation (Geplant)
- [ ] Erstellen der `src/components/Layout/Header.tsx` und `src/components/Layout/Footer.tsx` für die Navigation und grundlegende Informationen.
- [ ] Erstellen der `src/components/Pages/AboutPage.tsx`, `src/components/Pages/DatenschutzPage.tsx` und `src/components/Pages/ImpressumPage.tsx`.
- [ ] Einrichten von React Router für die Navigation zwischen den Seiten.

### Phase 6: Optimierung und Deployment (Geplant)
- [ ] Performance-Optimierung (Lazy Loading von Bildern, Caching von Daten).
- [ ] Tests auf verschiedenen Geräten und Browsern.
- [ ] Deployment auf Vercel (siehe Vercel-Dokumentation).
- [ ] Einrichten eines Service Workers für Offline-Caching der Karten-Tiles (`public/sw.js`).

## Paketliste
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "leaflet.markercluster": "^1.5.3",
    "react-router-dom": "^6.x.x"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@types/leaflet": "^1.9.3",
    "@types/leaflet.markercluster": "^1.5.1",
    "typescript": "^5.0.2",
    "vite": "^4.4.5",
    "tailwindcss": "^3.3.3",
    "postcss": "^8.4.27",
    "autoprefixer": "^10.4.14",
    "eslint": "^8.0.0",
    "prettier": "^2.0.0"
  }
}
```

## Schlüsselfunktionen
1. Interaktive Weltkarte mit React-Leaflet
2. Anzeige von Markern für die 100 größten Städte
3. Automatisches Clustering für überlappende Marker
4. Informations-Popups beim Hovern oder Klicken auf Marker
5. Sofortige Anzeige der Karte mit allen Markern beim Laden der Seite
6. Responsive Design für alle Gerätetypen
7. Filter für Land und Bevölkerungszahl
8. Suchleiste für Städte
9. Anzeige des Benutzerstandorts
10. Navigation zu "Über uns", "Datenschutz" und "Impressum" Seiten

## Style Guide
- Verwendung von TailwindCSS für konsistentes Styling.
- Farbpalette: Blau- und Grüntöne für Hauptfarben, Grau für Text.
- Schriftart: Inter.
- Konsistente Abstände und Größen.

## Code Style
- ESLint und Prettier verwenden.
- Klare und prägnante Kommentare.
- DRY (Don't Repeat Yourself) Prinzip beachten.
- Aussagekräftige Variablennamen.

## Nächste Schritte
1. Projekt initialisieren und Grundstruktur erstellen
2. Daten für die 100 größten Städte recherchieren und strukturieren
3. Basis-Kartenkomponente mit React-Leaflet implementieren
4. Marker und Clustering hinzufügen
5. UI-Komponenten und Interaktivität entwickeln
6. Seiten und Navigation implementieren
7. Optimierung und Deployment
