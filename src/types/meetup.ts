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

// --- Types for Meetup Proposals ---

// Structure for INSERTING a new proposal
export interface MeetupProposalPayload {
  sender_id: string;
  recipient_id: string;
  place_name: string;
  latitude: number;
  longitude: number;
  meetup_time: string; // ISO string
  description?: string | null;
  status?: 'pending' | 'accepted' | 'declined' | 'countered'; // Defaults to 'pending' in DB
}

// Structure for FETCHING proposals, including joined sender profile data
export interface MeetupProposal {
  id: string; // Renamed from proposalId to match DB column
  sender_id: string;
  recipient_id: string;
  place_name: string;
  latitude: number;
  longitude: number;
  meetup_time: string; // ISO string
  description: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'countered';
  created_at: string; // ISO string
  updated_at: string; // ISO string
  // Joined sender profile information
  profiles: {
    name: string;
    avatar_url: string | null;
    // Add other sender profile fields if needed for display later
  } | null; // Profile might be null if sender deleted account (though FK should prevent this usually)
}