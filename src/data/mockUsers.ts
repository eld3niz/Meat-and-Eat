import { MapUser } from '../hooks/useMapData'; // Ensure MapUser is exported from useMapData

// Center coordinates for Hanoi
const HANOI_LAT = 21.0285;
const HANOI_LON = 105.8542;
// Center coordinates for Da Nang
const DANANG_LAT = 16.0479;
const DANANG_LON = 108.2209;
// Center coordinates for My Khe Beach, Da Nang
const MYKHE_LAT = 16.0544;
const MYKHE_LON = 108.2480;
const STD_DEV = 0.05; // Standard deviation in degrees for normal distribution (~5.5km)
const BEACH_STD_DEV = 0.01; // Smaller deviation for beach area (~1.1km)

// Available options for new fields
const localOptions = ["Local", "Expat", "Tourist", "Other"];
const budgetOptions = [1, 2, 3];

// Box-Muller transform to generate normally distributed random numbers
// Takes mean (center) and standard deviation
// Returns one normally distributed random number
// Note: Generates two numbers at a time, we use one and could cache the other for efficiency if needed often
function getNormallyDistributedRandom(mean: number, stddev: number): number {
    let u1 = 0, u2 = 0;
    // Convert [0,1) to (0,1)
    while (u1 === 0) u1 = Math.random();
    while (u2 === 0) u2 = Math.random();
    const R = Math.sqrt(-2.0 * Math.log(u1));
    const Theta = 2.0 * Math.PI * u2;
    // We use the cosine part; sine part could be saved for next call if optimizing
    const Z = R * Math.cos(Theta);
    return mean + stddev * Z;
}

// Helper function to get a random element from an array
function getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}


export const mockUsers: MapUser[] = [];

// Generate existing Hanoi users (1 to 215)
for (let i = 1; i <= 215; i++) {
  mockUsers.push({
    user_id: `mockuser_${i}`, // Unique ID for mock users
    name: `Mock User ${i}`,    // Simple name
    // Generate normally distributed coordinates around Hanoi center
    latitude: parseFloat(getNormallyDistributedRandom(HANOI_LAT, STD_DEV).toFixed(6)),
    longitude: parseFloat(getNormallyDistributedRandom(HANOI_LON, STD_DEV).toFixed(6)),
    // Keep is_local and budget undefined for original users, or assign defaults if needed
    is_local: null, // Or undefined
    budget: null,   // Or undefined
  });
}

// Generate 100 Da Nang center users (216 to 315)
for (let i = 216; i <= 315; i++) {
  mockUsers.push({
    user_id: `mockuser_${i}`, // Unique ID for new mock users
    name: `Mock User ${i}`,    // Simple name
    // Generate normally distributed coordinates around Da Nang center
    latitude: parseFloat(getNormallyDistributedRandom(DANANG_LAT, STD_DEV).toFixed(6)),
    longitude: parseFloat(getNormallyDistributedRandom(DANANG_LON, STD_DEV).toFixed(6)),
    // Assign random local status and budget
    is_local: getRandomElement(localOptions),
    budget: getRandomElement(budgetOptions),
  });
}

// Generate 50 My Khe Beach users (316 to 365)
for (let i = 316; i <= 365; i++) {
  mockUsers.push({
    user_id: `mockuser_${i}`, // Unique ID for beach mock users
    name: `Mock User ${i}`,    // Simple name
    // Generate normally distributed coordinates around My Khe Beach center with smaller deviation
    latitude: parseFloat(getNormallyDistributedRandom(MYKHE_LAT, BEACH_STD_DEV).toFixed(6)),
    longitude: parseFloat(getNormallyDistributedRandom(MYKHE_LON, BEACH_STD_DEV).toFixed(6)),
    // Assign random local status and budget
    is_local: getRandomElement(localOptions),
    budget: getRandomElement(budgetOptions),
  });
}