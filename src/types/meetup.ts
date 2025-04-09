// Define the structure for the joined profile data
interface MeetupCreatorProfile {
  name: string;
  avatar_url: string | null;
}

// Define the main Meetup type based on the Supabase table and the fetch query
export interface Meetup {
  id: string; // UUID, but represented as string in JS/TS
  creator_id: string; // UUID
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
  meetup_time: string; // ISO timestamp string
  created_at: string; // ISO timestamp string
  updated_at: string; // ISO timestamp string
  profiles: MeetupCreatorProfile | null; // The joined profile data (can be null if profile doesn't exist, though unlikely with FK)
  // Add place_name if it's part of your table/query, otherwise remove if derived differently
  place_name?: string; // Optional: If place_name is stored directly in meetups table
}