-- Enable the uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a table for passport applications
CREATE TABLE IF NOT EXISTS passport_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  middle_name TEXT,
  date_of_birth TIMESTAMP WITH TIME ZONE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  place_of_birth TEXT,
  nationality TEXT,
  occupation TEXT,
  email TEXT,
  phone_number TEXT,
  address TEXT,
  passport_type TEXT CHECK (passport_type IN ('standard', 'official', 'diplomatic')),
  validity_period TEXT CHECK (validity_period IN ('5_years', '10_years')),
  birth_certificate_url TEXT,
  id_card_url TEXT,
  appointment_date TIMESTAMP WITH TIME ZONE,
  appointment_location TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE passport_applications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own applications" 
  ON passport_applications FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications" 
  ON passport_applications FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications" 
  ON passport_applications FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create a profiles table for extra user data
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
