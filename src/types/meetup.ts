// Define the structure for the joined profile data
interface MeetupCreatorProfile {
  name: string;
  avatar_url: string | null;
  age?: number; // Added optional age
  languages?: string[]; // Corrected type to array of strings
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
  cuisines?: string[] | null; // Added optional cuisines array
  profiles: MeetupCreatorProfile | null; // The joined profile data (can be null if profile doesn't exist, though unlikely with FK)
  // Add place_name if it's part of your table/query, otherwise remove if derived differently
  place_name?: string; // Optional: If place_name is stored directly in meetups table
}

// --- New Type for Meetup Proposals ---
export interface MeetupProposal {
  proposalId: string; // Unique ID for the proposal (e.g., UUID)
  senderId: string;   // User ID of the person sending the proposal
  senderName: string; // Name of the sender (for display)
  recipientId: string;// User ID of the person receiving the proposal
  placeName: string;  // Name of the proposed meetup location
  latitude: number;   // Latitude of the location
  longitude: number;  // Longitude of the location
  meetupTime: string; // Proposed time (ISO 8601 format string)
  description: string | null; // Optional description/message from sender
  status: 'pending' | 'accepted' | 'declined' | 'countered'; // Status of the proposal
  createdAt: string;  // Timestamp when the proposal was created (ISO 8601 format string)
}