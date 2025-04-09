// Based on the Supabase schema defined in improved_supabase_setup.md

// From Supabase Auth (basic structure)
export interface User {
  id: string;
  email?: string;
  // Add other relevant auth fields if needed
}

// From public.profiles table
export interface Profile {
  id: string; // UUID, Foreign Key to auth.users
  name: string;
  age?: number | null;
  birth_date?: string | null; // ISO Date string
  languages?: string[] | null;
  cuisines?: string[] | null;
  location_access?: boolean | null;
  city?: string | null;
  budget?: 1 | 2 | 3 | null;
  bio?: string | null;
  avatar_url?: string | null;
  home_latitude?: number | null;
  home_longitude?: number | null;
  home_location_last_updated?: string | null; // ISO Timestamp string
  gender?: string | null;
  created_at: string; // ISO Timestamp string
  updated_at: string; // ISO Timestamp string
}

// From public.chats table
export interface Chat {
  id: string; // UUID
  participant1_id: string; // UUID, Foreign Key to profiles
  participant2_id: string; // UUID, Foreign Key to profiles
  created_at: string; // ISO Timestamp string
  updated_at: string; // ISO Timestamp string
}

// From public.messages table
export interface Message {
  id: string; // UUID
  chat_id: string; // UUID, Foreign Key to chats
  sender_id: string; // UUID, Foreign Key to profiles
  message_type: 'text' | 'form' | 'map_marker';
  content?: string | null;
  form_data?: any | null; // Consider defining a more specific type if form structure is known
  map_latitude?: number | null;
  map_longitude?: number | null;
  map_marker_label?: string | null;
  created_at: string; // ISO Timestamp string
  is_read: boolean;
}

// From public.user_blocks table
export interface UserBlock {
    blocker_id: string; // UUID, Foreign Key to profiles
    blocked_id: string; // UUID, Foreign Key to profiles
    created_at: string; // ISO Timestamp string
}

// From public.user_reports table
export interface UserReport {
    id: string; // UUID
    reporter_id: string; // UUID, Foreign Key to profiles
    reported_id: string; // UUID, Foreign Key to profiles
    reason: string;
    chat_id?: string | null; // UUID, Foreign Key to chats
    message_id?: string | null; // UUID, Foreign Key to messages
    created_at: string; // ISO Timestamp string
    status: 'pending' | 'resolved' | 'dismissed';
}

// You can add other table interfaces (Meetups, UserLocations) here if needed elsewhere