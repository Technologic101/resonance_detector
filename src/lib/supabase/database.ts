import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from './types'
import { Space, Sample, CreateSpaceData, CreateSampleData, SpaceType, SoundType, SignalQuality } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

type Tables = Database['public']['Tables']
type SpaceRow = Tables['spaces']['Row']
type SampleRow = Tables['samples']['Row']
type ProfileRow = Tables['profiles']['Row']

class SupabaseDatabase {
  constructor(private supabase: SupabaseClient<Database>) {}

  // Auth helpers
  async signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    if (error) throw error
    return data
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut()
    if (error) throw error
  }

  async getProfile(userId: string): Promise<ProfileRow | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async updateProfile(userId: string, updates: Partial<ProfileRow>) {
    const { data, error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Space operations
  async createSpace(user: User, data: CreateSpaceData): Promise<Space> {
    const { data: spaceData, error } = await this.supabase
      .from('spaces')
      .insert({
        user_id: user.id,
        name: data.name,
        description: data.description,
        type: data.type,
        metadata: data.metadata || {},
        environmental_conditions: data.environmentalConditions || {},
        analyzed_frequencies: [],
      })
      .select()
      .single()

    if (error) throw error
    return this.mapSpaceFromRow(spaceData)
  }

  async getSpace(user: User, id: string): Promise<Space | null> {
    const { data, error } = await this.supabase
      .from('spaces')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data ? this.mapSpaceFromRow(data) : null
  }

  async getAllSpaces(user: User): Promise<Space[]> {
    const { data, error } = await this.supabase
      .from('spaces')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data.map(this.mapSpaceFromRow)
  }

  async updateSpace(user: User, id: string, updates: Partial<Space>): Promise<Space> {
    const { data, error } = await this.supabase
      .from('spaces')
      .update({
        name: updates.name,
        description: updates.description,
        type: updates.type,
        metadata: updates.metadata,
        environmental_conditions: updates.environmentalConditions,
        analyzed_frequencies: updates.analyzedFrequencies,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return this.mapSpaceFromRow(data)
  }

  async deleteSpace(user: User, id: string): Promise<void> {
    // Delete associated samples first
    const { error: samplesError } = await this.supabase
      .from('samples')
      .delete()
      .eq('space_id', id)
      .eq('user_id', user.id)

    if (samplesError) throw samplesError

    // Delete the space
    const { error } = await this.supabase
      .from('spaces')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
  }

  async getSpaceCount(user: User): Promise<number> {
    const { count, error } = await this.supabase
      .from('spaces')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (error) throw error
    return count || 0
  }

  // Sample operations
  async createSample(user: User, data: CreateSampleData): Promise<Sample> {
    const { data: sampleData, error } = await this.supabase
      .from('samples')
      .insert({
        user_id: user.id,
        space_id: data.spaceId,
        sound_type: data.soundType,
        audio_file_path: data.audioFilePath,
        duration: data.duration,
        ambient_noise_level: data.ambientNoiseLevel || 0,
        peaks: data.peaks || [],
        spectral_data: data.spectralData || {},
        signal_quality: data.signalQuality || 'good',
        sample_rate: data.sampleRate || 48000,
        recording_settings: data.recordingSettings || {},
      })
      .select()
      .single()

    if (error) throw error
    return this.mapSampleFromRow(sampleData)
  }

  async getSample(user: User, id: string): Promise<Sample | null> {
    const { data, error } = await this.supabase
      .from('samples')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data ? this.mapSampleFromRow(data) : null
  }

  async getSamplesForSpace(user: User, spaceId: string): Promise<Sample[]> {
    const { data, error } = await this.supabase
      .from('samples')
      .select('*')
      .eq('space_id', spaceId)
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false })

    if (error) throw error
    return data.map(this.mapSampleFromRow)
  }

  async getAllSamples(user: User): Promise<Sample[]> {
    const { data, error } = await this.supabase
      .from('samples')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false })

    if (error) throw error
    return data.map(this.mapSampleFromRow)
  }

  async getRecentSamples(user: User, limit: number = 5): Promise<Sample[]> {
    const { data, error } = await this.supabase
      .from('samples')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data.map(this.mapSampleFromRow)
  }

  async updateSample(user: User, id: string, updates: Partial<Sample>): Promise<Sample> {
    const { data, error } = await this.supabase
      .from('samples')
      .update({
        sound_type: updates.soundType,
        duration: updates.duration,
        ambient_noise_level: updates.ambientNoiseLevel,
        peaks: updates.peaks,
        spectral_data: updates.spectralData,
        signal_quality: updates.signalQuality,
        sample_rate: updates.sampleRate,
        recording_settings: updates.recordingSettings,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return this.mapSampleFromRow(data)
  }

  async deleteSample(user: User, id: string): Promise<void> {
    const { error } = await this.supabase
      .from('samples')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
  }

  async getSampleCount(user: User): Promise<number> {
    const { count, error } = await this.supabase
      .from('samples')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (error) throw error
    return count || 0
  }

  // Audio file operations
  async uploadAudioFile(user: User, file: File, sampleId: string): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${sampleId}.${fileExt}`

    const { data, error } = await this.supabase.storage
      .from('audio-files')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw error

    // Store file metadata
    await this.supabase
      .from('audio_files')
      .insert({
        user_id: user.id,
        sample_id: sampleId,
        filename: file.name,
        file_path: data.path,
        mime_type: file.type,
        size: file.size,
        duration: 0, // Will be updated after processing
      })

    return data.path
  }

  async getAudioFileUrl(filePath: string): Promise<string> {
    const { data } = await this.supabase.storage
      .from('audio-files')
      .createSignedUrl(filePath, 3600) // 1 hour expiry

    if (!data?.signedUrl) throw new Error('Failed to get audio file URL')
    return data.signedUrl
  }

  async deleteAudioFile(filePath: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from('audio-files')
      .remove([filePath])

    if (error) throw error
  }

  // Utility methods
  private mapSpaceFromRow(row: SpaceRow): Space {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type as SpaceType,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      sampleIds: [], // Will be populated by joining with samples
      metadata: (row.metadata as Record<string, any>) || {},
      environmentalConditions: (row.environmental_conditions as Record<string, number>) || {},
      analyzedFrequencies: (row.analyzed_frequencies as any[]) || [],
    }
  }

  private mapSampleFromRow(row: SampleRow): Sample {
    return {
      id: row.id,
      spaceId: row.space_id,
      soundType: row.sound_type as SoundType,
      audioFilePath: row.audio_file_path,
      recordedAt: new Date(row.recorded_at),
      duration: row.duration,
      ambientNoiseLevel: row.ambient_noise_level,
      peaks: (row.peaks as any[]) || [],
      spectralData: (row.spectral_data as Record<string, any>) || {},
      signalQuality: row.signal_quality as SignalQuality,
      sampleRate: row.sample_rate,
      recordingSettings: (row.recording_settings as Record<string, any>) || {},
    }
  }
}

export const getDatabase = (supabase: SupabaseClient<Database>) => new SupabaseDatabase(supabase)