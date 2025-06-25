/*
  # Initial Schema for Building Resonance Detector

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `full_name` (text, nullable)
      - `avatar_url` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `spaces`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text)
      - `description` (text)
      - `type` (enum: space_type)
      - `metadata` (jsonb)
      - `environmental_conditions` (jsonb)
      - `analyzed_frequencies` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `samples`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `space_id` (uuid, references spaces)
      - `sound_type` (enum: sound_type)
      - `audio_file_path` (text)
      - `recorded_at` (timestamp)
      - `duration` (numeric)
      - `ambient_noise_level` (numeric)
      - `peaks` (jsonb)
      - `spectral_data` (jsonb)
      - `signal_quality` (enum: signal_quality)
      - `sample_rate` (integer)
      - `recording_settings` (jsonb)
    
    - `audio_files`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `sample_id` (uuid, references samples)
      - `filename` (text)
      - `file_path` (text)
      - `mime_type` (text)
      - `size` (bigint)
      - `duration` (numeric)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add trigger for automatic profile creation
    - Add storage bucket for audio files

  3. Enums
    - space_type: residential, commercial, industrial, etc.
    - sound_type: sineWaveSweep, pinkNoise, chirpSignal, etc.
    - signal_quality: excellent, good, fair, poor
*/

-- Create custom types
CREATE TYPE space_type AS ENUM (
  'residential',
  'commercial', 
  'industrial',
  'performanceVenue',
  'educational',
  'religious',
  'other'
);

CREATE TYPE sound_type AS ENUM (
  'sineWaveSweep',
  'pinkNoise',
  'chirpSignal', 
  'handClap',
  'ambient'
);

CREATE TYPE signal_quality AS ENUM (
  'excellent',
  'good',
  'fair',
  'poor'
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create spaces table
CREATE TABLE IF NOT EXISTS spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  type space_type NOT NULL,
  metadata jsonb DEFAULT '{}',
  environmental_conditions jsonb DEFAULT '{}',
  analyzed_frequencies jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create samples table  
CREATE TABLE IF NOT EXISTS samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  space_id uuid NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  sound_type sound_type NOT NULL,
  audio_file_path text NOT NULL,
  recorded_at timestamptz DEFAULT now(),
  duration numeric NOT NULL,
  ambient_noise_level numeric DEFAULT 0,
  peaks jsonb DEFAULT '[]',
  spectral_data jsonb DEFAULT '{}',
  signal_quality signal_quality DEFAULT 'good',
  sample_rate integer DEFAULT 48000,
  recording_settings jsonb DEFAULT '{}'
);

-- Create audio_files table
CREATE TABLE IF NOT EXISTS audio_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sample_id uuid NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
  filename text NOT NULL,
  file_path text NOT NULL,
  mime_type text NOT NULL,
  size bigint NOT NULL,
  duration numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_spaces_user_id ON spaces(user_id);
CREATE INDEX IF NOT EXISTS idx_spaces_updated_at ON spaces(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_samples_user_id ON samples(user_id);
CREATE INDEX IF NOT EXISTS idx_samples_space_id ON samples(space_id);
CREATE INDEX IF NOT EXISTS idx_samples_recorded_at ON samples(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_audio_files_user_id ON audio_files(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_files_sample_id ON audio_files(sample_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create RLS policies for spaces
CREATE POLICY "Users can read own spaces"
  ON spaces
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own spaces"
  ON spaces
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own spaces"
  ON spaces
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own spaces"
  ON spaces
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for samples
CREATE POLICY "Users can read own samples"
  ON samples
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own samples"
  ON samples
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own samples"
  ON samples
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own samples"
  ON samples
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for audio_files
CREATE POLICY "Users can read own audio files"
  ON audio_files
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own audio files"
  ON audio_files
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own audio files"
  ON audio_files
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own audio files"
  ON audio_files
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spaces_updated_at
  BEFORE UPDATE ON spaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();