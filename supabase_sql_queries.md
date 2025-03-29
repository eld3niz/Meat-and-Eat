-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER,
    birth_date DATE,
    languages TEXT[] DEFAULT '{}',
    cuisines TEXT[] DEFAULT '{}',
    location_access BOOLEAN DEFAULT FALSE,
    city TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Create user_locations table
CREATE TABLE public.user_locations (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    latitude DECIMAL NOT NULL,
    longitude DECIMAL NOT NULL,
    city TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view their own location
CREATE POLICY "Users can view own location" 
ON public.user_locations 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to insert their own location
CREATE POLICY "Users can insert own location" 
ON public.user_locations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own location
CREATE POLICY "Users can update own location" 
ON public.user_locations 
FOR UPDATE 
USING (auth.uid() = user_id);

-- First, drop the existing insert policy if it exists
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a new, more permissive insert policy
CREATE POLICY "Enable insert for authenticated users only" 
ON profiles FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- If you're using a trigger to create profiles automatically, you might need this policy too
CREATE POLICY "Allow trigger to create profiles" 
ON profiles FOR INSERT 
WITH CHECK (TRUE);

-- Make sure authenticated users can update their own profiles
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

