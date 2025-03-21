// Typdefinitionen für die Stadt-Daten
export interface City {
  id: number;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  population: number;
  description: string;
  landmarks?: string[];
  foundedYear?: number;
}
