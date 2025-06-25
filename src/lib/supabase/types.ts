export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      spaces: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string
          type: string
          metadata: Json
          environmental_conditions: Json
          analyzed_frequencies: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description: string
          type: string
          metadata?: Json
          environmental_conditions?: Json
          analyzed_frequencies?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string
          type?: string
          metadata?: Json
          environmental_conditions?: Json
          analyzed_frequencies?: Json
          created_at?: string
          updated_at?: string
        }
      }
      samples: {
        Row: {
          id: string
          user_id: string
          space_id: string
          sound_type: string
          audio_file_path: string
          recorded_at: string
          duration: number
          ambient_noise_level: number
          peaks: Json
          spectral_data: Json
          signal_quality: string
          sample_rate: number
          recording_settings: Json
        }
        Insert: {
          id?: string
          user_id: string
          space_id: string
          sound_type: string
          audio_file_path: string
          recorded_at?: string
          duration: number
          ambient_noise_level?: number
          peaks?: Json
          spectral_data?: Json
          signal_quality?: string
          sample_rate?: number
          recording_settings?: Json
        }
        Update: {
          id?: string
          user_id?: string
          space_id?: string
          sound_type?: string
          audio_file_path?: string
          recorded_at?: string
          duration?: number
          ambient_noise_level?: number
          peaks?: Json
          spectral_data?: Json
          signal_quality?: string
          sample_rate?: number
          recording_settings?: Json
        }
      }
      audio_files: {
        Row: {
          id: string
          user_id: string
          sample_id: string
          filename: string
          file_path: string
          mime_type: string
          size: number
          duration: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          sample_id: string
          filename: string
          file_path: string
          mime_type: string
          size: number
          duration: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          sample_id?: string
          filename?: string
          file_path?: string
          mime_type?: string
          size?: number
          duration?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      space_type: 'residential' | 'commercial' | 'industrial' | 'performanceVenue' | 'educational' | 'religious' | 'other'
      sound_type: 'sineWaveSweep' | 'pinkNoise' | 'chirpSignal' | 'handClap' | 'ambient'
      signal_quality: 'excellent' | 'good' | 'fair' | 'poor'
    }
  }
}