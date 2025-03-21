import { City } from '../types';

// Die 100 größten Städte der Welt (nach Bevölkerungszahl in der Stadtregion)
// Daten basierend auf aktuellen demographischen Statistiken
export const cities: City[] = [
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
  {
    id: 2,
    name: "Delhi",
    country: "Indien",
    latitude: 28.7041,
    longitude: 77.1025,
    population: 31200000,
    description: "Die zweitbevölkerungsreichste Stadt der Welt und die größte Stadt Indiens.",
    landmarks: ["Rotes Fort", "Qutb Minar", "India Gate"],
    foundedYear: 736
  },
  {
    id: 3,
    name: "Shanghai",
    country: "China",
    latitude: 31.2304,
    longitude: 121.4737,
    population: 27100000,
    description: "Das wichtigste Wirtschafts-, Finanz-, Handels- und Kommunikationszentrum Chinas.",
    landmarks: ["The Bund", "Oriental Pearl Tower", "Yu Garden"],
    foundedYear: 751
  },
  {
    id: 4,
    name: "São Paulo",
    country: "Brasilien",
    latitude: -23.5505,
    longitude: -46.6333,
    population: 22400000,
    description: "Die größte Stadt in Brasilien und Südamerika.",
    landmarks: ["Paulista Avenue", "Ibirapuera Park", "São Paulo Cathedral"],
    foundedYear: 1554
  },
  {
    id: 5,
    name: "Mexiko-Stadt",
    country: "Mexiko",
    latitude: 19.4326,
    longitude: -99.1332,
    population: 21800000,
    description: "Die Hauptstadt und größte Stadt Mexikos.",
    landmarks: ["Zócalo", "Frida Kahlo Museum", "Chapultepec Castle"],
    foundedYear: 1325
  },
  {
    id: 6,
    name: "Kairo",
    country: "Ägypten",
    latitude: 30.0444,
    longitude: 31.2357,
    population: 21300000,
    description: "Die Hauptstadt von Ägypten und größte Stadt Afrikas.",
    landmarks: ["Pyramiden von Gizeh", "Ägyptisches Museum", "Khan el-Khalili"],
    foundedYear: 969
  },
  {
    id: 7,
    name: "Mumbai",
    country: "Indien",
    latitude: 19.0760,
    longitude: 72.8777,
    population: 20700000,
    description: "Das Finanz- und Unterhaltungszentrum Indiens.",
    landmarks: ["Gateway of India", "Chhatrapati Shivaji Terminus", "Marine Drive"],
    foundedYear: 1507
  },
  {
    id: 8,
    name: "Peking",
    country: "China",
    latitude: 39.9042,
    longitude: 116.4074,
    population: 20400000,
    description: "Die Hauptstadt der Volksrepublik China.",
    landmarks: ["Verbotene Stadt", "Große Mauer", "Sommerpalast"],
    foundedYear: 1045
  },
  {
    id: 9,
    name: "Dhaka",
    country: "Bangladesch",
    latitude: 23.8103,
    longitude: 90.4125,
    population: 20300000,
    description: "Die Hauptstadt und größte Stadt von Bangladesch.",
    landmarks: ["Lalbagh Fort", "Ahsan Manzil", "Nationalmuseum"],
    foundedYear: 1608
  },
  {
    id: 10,
    name: "Osaka",
    country: "Japan",
    latitude: 34.6937,
    longitude: 135.5023,
    population: 19300000,
    description: "Ein wichtiges Wirtschaftszentrum Japans.",
    landmarks: ["Osaka Castle", "Dotonbori", "Universal Studios Japan"],
    foundedYear: 645
  },
  {
    id: 11,
    name: "New York City",
    country: "USA",
    latitude: 40.7128,
    longitude: -74.0060,
    population: 18800000,
    description: "Die bevölkerungsreichste Stadt der Vereinigten Staaten.",
    landmarks: ["Freiheitsstatue", "Empire State Building", "Central Park"],
    foundedYear: 1624
  },
  {
    id: 12,
    name: "Karatschi",
    country: "Pakistan",
    latitude: 24.8607,
    longitude: 67.0011,
    population: 16400000,
    description: "Die größte Stadt in Pakistan und siebtgrößte Stadt der Welt.",
    landmarks: ["Mohatta Palace", "Frere Hall", "Quaid's Mausoleum"],
    foundedYear: 1729
  },
  {
    id: 13,
    name: "Chongqing",
    country: "China",
    latitude: 29.4316,
    longitude: 106.9123,
    population: 15800000,
    description: "Eine der vier regierungsunmittelbaren Städte Chinas.",
    landmarks: ["Three Gorges Museum", "Hongya Cave", "Dazu Rock Carvings"],
    foundedYear: 314
  },
  {
    id: 14,
    name: "Istanbul",
    country: "Türkei",
    latitude: 41.0082,
    longitude: 28.9784,
    population: 15600000,
    description: "Die größte Stadt der Türkei, liegt auf zwei Kontinenten.",
    landmarks: ["Hagia Sophia", "Blaue Moschee", "Großer Basar"],
    foundedYear: 657
  },
  {
    id: 15,
    name: "Kalkutta",
    country: "Indien",
    latitude: 22.5726,
    longitude: 88.3639,
    population: 14900000,
    description: "Die Hauptstadt des indischen Bundesstaates Westbengalen.",
    landmarks: ["Victoria Memorial", "Howrah Bridge", "Indian Museum"],
    foundedYear: 1686
  },
  // Fortsetzung mit weiteren 85 Städten...
  {
    id: 16,
    name: "Manila",
    country: "Philippinen",
    latitude: 14.5995,
    longitude: 120.9842,
    population: 14400000,
    description: "Die Hauptstadt und größte Stadt der Philippinen.",
    landmarks: ["Intramuros", "Fort Santiago", "Manila Bay"],
    foundedYear: 1571
  },
  {
    id: 17,
    name: "Lagos",
    country: "Nigeria",
    latitude: 6.5244,
    longitude: 3.3792,
    population: 14400000,
    description: "Die größte Stadt Nigerias und größte Stadt Afrikas gemessen an der Bevölkerung.",
    landmarks: ["Nationalmuseum Lagos", "Freedom Park", "Lekki Conservation Centre"],
    foundedYear: 1792
  },
  {
    id: 18,
    name: "Rio de Janeiro",
    country: "Brasilien",
    latitude: -22.9068,
    longitude: -43.1729,
    population: 13600000,
    description: "Die zweitgrößte Stadt Brasiliens, bekannt für ihre spektakuläre Lage.",
    landmarks: ["Christus-Erlöser-Statue", "Zuckerhut", "Copacabana"],
    foundedYear: 1565
  },
  {
    id: 19,
    name: "Tianjin",
    country: "China",
    latitude: 39.3434,
    longitude: 117.3616,
    population: 13600000,
    description: "Eine der vier regierungsunmittelbaren Städte Chinas.",
    landmarks: ["Tianjin Eye", "Ancient Culture Street", "Drum Tower"],
    foundedYear: 1404
  },
  {
    id: 20,
    name: "Guangzhou",
    country: "China",
    latitude: 23.1291,
    longitude: 113.2644,
    population: 13500000,
    description: "Die drittgrößte Stadt in Festlandchina.",
    landmarks: ["Canton Tower", "Chen Clan Ancestral Hall", "Shamian Island"],
    foundedYear: 214
  },
  // Weitere 80 Städte hier...
  {
    id: 100,
    name: "Berlin",
    country: "Deutschland",
    latitude: 52.5200,
    longitude: 13.4050,
    population: 3700000,
    description: "Die Hauptstadt und größte Stadt Deutschlands.",
    landmarks: ["Brandenburger Tor", "Reichstag", "Berliner Mauer"],
    foundedYear: 1237
  }
];

// Die Top 100 Städte umfassen mehr Einträge für die vollständige Anwendung.
// Für die Implementierungsphase wurden nur 20 Beispielstädte vollständig definiert.

