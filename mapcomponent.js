// ...existing code...

// Option 1: Wenn l eine Leaflet-Map-Instanz sein sollte
const l = this.map; // oder woher auch immer die Karteninstanz kommen sollte

// Option 2: Wenn l ein Layer sein sollte
const l = this.mapLayer; // oder ein anderer relevanter Layer

// Zeile 159 und 162 sollten jetzt funktionieren, da l definiert ist
// ...existing code...
