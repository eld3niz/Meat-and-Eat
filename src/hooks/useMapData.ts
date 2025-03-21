import { useState, useEffect, useMemo } from 'react';
import { City } from '../types';
import { cities } from '../data/cities';
import { sortCitiesByPopulation, filterCitiesByCountry } from '../utils/mapUtils';

interface Filters {
  country: string | null;
  population: {
    min: number;
    max: number;
  };
  search: string | null;
}

interface MapData {
  cities: City[];
  loading: boolean;
  error: string | null;
  selectedCity: City | null;
  filteredCities: City[];
  filterByCountry: (country: string | null) => void;
  filterByPopulation: (min: number, max: number) => void;
  filterBySearch: (term: string | null) => void;
  selectCity: (cityId: number | null) => void;
  getTopCities: (count: number) => City[];
  resetFilters: () => void;
  zoomToCity: (cityId: number) => [number, number];
}

/**
 * Custom Hook für die Verwaltung der Kartendaten
 * @returns MapData-Objekt mit Städteliste und Hilfsfunktionen
 */
export const useMapData = (): MapData => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [filters, setFilters] = useState<Filters>({
    country: null,
    population: {
      min: 0,
      max: Number.MAX_SAFE_INTEGER
    },
    search: null
  });

  // Gefilterte Städte basierend auf den aktiven Filtern
  const filteredCities = useMemo(() => {
    let result = cities;
    
    // Filter nach Land
    if (filters.country) {
      result = filterCitiesByCountry(result, filters.country);
    }
    
    // Filter nach Bevölkerung
    result = result.filter(city => 
      city.population >= filters.population.min && 
      city.population <= filters.population.max
    );
    
    // Filter nach Suchbegriff
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(city => 
        city.name.toLowerCase().includes(searchTerm) ||
        city.country.toLowerCase().includes(searchTerm)
      );
    }
    
    return result;
  }, [filters]);

  // Simulation eines API-Aufrufs zum Laden der Städtedaten
  useEffect(() => {
    const loadCities = async () => {
      try {
        // In einer realen Anwendung würden die Daten von einer API geladen
        // Für die Implementierungsphase verwenden wir die lokalen Daten
        setTimeout(() => {
          setLoading(false);
        }, 500); // Künstliche Verzögerung, um Ladezustand zu simulieren
      } catch (err) {
        setError('Fehler beim Laden der Städtedaten');
        setLoading(false);
      }
    };

    loadCities();
  }, []);

  /**
   * Filtert Städte nach Land
   * @param country Ländername oder null für alle Länder
   */
  const filterByCountry = (country: string | null) => {
    setFilters(prev => ({
      ...prev,
      country
    }));
  };

  /**
   * Filtert Städte nach Bevölkerungszahl
   * @param min Minimale Bevölkerungszahl
   * @param max Maximale Bevölkerungszahl
   */
  const filterByPopulation = (min: number, max: number) => {
    setFilters(prev => ({
      ...prev,
      population: { min, max }
    }));
  };

  /**
   * Filtert Städte nach Suchbegriff
   * @param term Suchbegriff oder null zum Zurücksetzen
   */
  const filterBySearch = (term: string | null) => {
    setFilters(prev => ({
      ...prev,
      search: term
    }));
  };

  /**
   * Setzt alle Filter zurück
   */
  const resetFilters = () => {
    setFilters({
      country: null,
      population: {
        min: 0,
        max: Number.MAX_SAFE_INTEGER
      },
      search: null
    });
  };

  /**
   * Wählt eine Stadt aus
   * @param cityId ID der ausgewählten Stadt oder null zum Zurücksetzen
   */
  const selectCity = (cityId: number | null) => {
    if (cityId === null) {
      setSelectedCity(null);
      return;
    }

    const city = cities.find(city => city.id === cityId) || null;
    setSelectedCity(city);
  };

  /**
   * Liefert die Koordinaten einer Stadt zum Zoomen
   * @param cityId ID der Stadt
   * @returns [latitude, longitude] als Tuple
   */
  const zoomToCity = (cityId: number): [number, number] => {
    const city = cities.find(city => city.id === cityId);
    if (!city) {
      return [20, 0]; // Fallback zur Weltansicht
    }
    return [city.latitude, city.longitude];
  };

  /**
   * Gibt die Top-n Städte nach Bevölkerungszahl zurück
   * @param count Anzahl der Städte
   * @returns Array der Top-n Städte
   */
  const getTopCities = (count: number): City[] => {
    return sortCitiesByPopulation(cities).slice(0, count);
  };

  return {
    cities,
    loading,
    error,
    selectedCity,
    filteredCities,
    filterByCountry,
    filterByPopulation,
    filterBySearch,
    selectCity,
    getTopCities,
    resetFilters,
    zoomToCity
  };
};
