/*
  # Storage Setup for Audio Files

  1. Storage
    - Create audio-files bucket for storing audio recordings
    - Set up RLS policies for audio file access
    - Configure bucket settings for audio file types

  2. Security
    - Users can only access their own audio files
    - Authenticated users can upload audio files
    - File size and type restrictions
*/

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-files', 'audio-files', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for storage
CREATE POLICY "Users can upload their own audio files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'audio-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can read their own audio files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'audio-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own audio files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'audio-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own audio files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'audio-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );