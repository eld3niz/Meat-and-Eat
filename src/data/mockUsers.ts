import { MapUser } from '../hooks/useMapData'; // Ensure MapUser is exported from useMapData

// Center coordinates for Hanoi
const HANOI_LAT = 21.0285;
const HANOI_LON = 105.8542;
const STD_DEV = 0.05; // Standard deviation in degrees for normal distribution (~5.5km)

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

export const mockUsers: MapUser[] = [];

for (let i = 1; i <= 215; i++) { // Increased loop limit to 215
  mockUsers.push({
    user_id: `mockuser_${i}`, // Unique ID for mock users
    name: `Mock User ${i}`,    // Simple name
    // Generate normally distributed coordinates around Hanoi center
    latitude: parseFloat(getNormallyDistributedRandom(HANOI_LAT, STD_DEV).toFixed(6)),
    longitude: parseFloat(getNormallyDistributedRandom(HANOI_LON, STD_DEV).toFixed(6)),
  });
}