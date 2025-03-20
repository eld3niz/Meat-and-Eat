/**
 * Skript zum Generieren von 100 zufälligen Markern
 */

// Definiere den Bereich für die Koordinaten (für Deutschland ungefähr)
const LATITUDE_MIN = 47.0;    // Südlichster Punkt in Deutschland
const LATITUDE_MAX = 55.0;    // Nördlichster Punkt in Deutschland
const LONGITUDE_MIN = 5.0;    // Westlichster Punkt in Deutschland
const LONGITUDE_MAX = 15.0;   // Östlichster Punkt in Deutschland

// Funktion zum Generieren einer zufälligen Zahl innerhalb eines Bereichs
function getRandomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

// Funktion zum Generieren eines zufälligen Titelnamens
function getRandomTitle() {
  const titles = [
    'Grillplatz', 'BBQ Spot', 'Picknickplatz', 'Grillstelle', 'Feuerstelle',
    'BBQ Area', 'Waldgrillplatz', 'Seeblick-Grill', 'Stadtpark-Grill', 'Berggrill',
    'Grillzone', 'Familien-Grillplatz', 'Naturgrillplatz', 'Freizeitgrill'
  ];
  const locations = [
    'am See', 'im Wald', 'am Fluss', 'in der Stadt', 'auf dem Berg',
    'im Park', 'am Strand', 'an der Wiese', 'beim Spielplatz', 'in der Nähe'
  ];
  
  return `${titles[Math.floor(Math.random() * titles.length)]} ${locations[Math.floor(Math.random() * locations.length)]}`;
}

// Funktion zum Generieren einer zufälligen Beschreibung
function getRandomDescription() {
  const descriptions = [
    'Schöner Grillplatz mit ausreichend Sitzgelegenheiten.',
    'Einfache Grillstelle mit Tischen und Bänken.',
    'Idyllisch gelegener Ort zum Grillen und Entspannen.',
    'Gut ausgestatteter Grillplatz mit Überdachung.',
    'Natürlicher Grillbereich mit schöner Aussicht.',
    'Gepflegter Platz zum Grillen mit Freunden und Familie.',
    'Ruhiger Ort für ein gemütliches Grillerlebnis.',
    'Beliebter Treffpunkt zum gemeinsamen Grillen.',
    'Grillplatz mit Feuerstelle und viel Platz für Aktivitäten.',
    'Kostenfreie Grillmöglichkeit in schöner Umgebung.'
  ];
  
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

// Marker-Array generieren
const markers = [];

for (let i = 0; i < 100; i++) {
  const lat = getRandomInRange(LATITUDE_MIN, LATITUDE_MAX);
  const lng = getRandomInRange(LONGITUDE_MIN, LONGITUDE_MAX);
  
  markers.push({
    id: i + 1,
    title: getRandomTitle(),
    description: getRandomDescription(),
    latitude: parseFloat(lat.toFixed(6)),
    longitude: parseFloat(lng.toFixed(6)),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
}

// Ausgabe der generierten Marker
console.log(JSON.stringify(markers, null, 2));

// Hinweis zur Verwendung
console.log(`\n${markers.length} zufällige Marker wurden generiert.`);
console.log('Kopieren Sie die Ausgabe in eine JSON-Datei oder verwenden Sie sie direkt in Ihrer Anwendung.');
