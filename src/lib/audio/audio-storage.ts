import { supabase } from '@/lib/supabase/client'
import { database } from '@/lib/supabase/database'
import { SoundType, SignalQuality } from '@/lib/types'

export interface AudioFile {
  id: string
  blob: Blob
  filename: string
  mimeType: string
  size: number
  duration: number
  createdAt: Date
}

export class AudioStorage {
  static async saveAudioFile(
    blob: Blob,
    spaceId: string,
    soundType: SoundType,
    duration: number,
    signalQuality: SignalQuality,
    analysis?: any
  ): Promise<string> {
    try {
      // Get current user
      const user = await database.getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const extension = this.getFileExtension(blob.type)
      const filename = `recording-${timestamp}.${extension}`
      
      // Create sample record first to get ID
      const sample = await database.createSample({
        spaceId,
        soundType,
        audioFilePath: '', // Will be updated after upload
        duration,
        ambientNoiseLevel: analysis?.ambientNoise || 0,
        peaks: analysis?.peaks || [],
        spectralData: analysis?.spectralData || {},
        signalQuality,
        sampleRate: 48000,
        recordingSettings: {
          mimeType: blob.type,
          size: blob.size,
          filename,
        },
      })

      // Upload file to Supabase Storage
      const filePath = await this.uploadToStorage(blob, sample.id, filename)
      
      // Update sample with file path
      await database.updateSample(sample.id, {
        audioFilePath: filePath,
      })

      console.log('Audio file saved successfully:', sample.id)
      return sample.id
    } catch (error) {
      console.error('Failed to save audio file:', error)
      throw new Error('Failed to save recording')
    }
  }

  static async getAudioFile(sampleId: string): Promise<Blob | null> {
    try {
      const sample = await database.getSample(sampleId)
      if (!sample || !sample.audioFilePath) return null

      const url = await database.getAudioFileUrl(sample.audioFilePath)
      const response = await fetch(url)
      
      if (!response.ok) throw new Error('Failed to fetch audio file')
      
      return await response.blob()
    } catch (error) {
      console.error('Failed to retrieve audio file:', error)
      return null
    }
  }

  static async deleteAudioFile(sampleId: string): Promise<void> {
    try {
      const sample = await database.getSample(sampleId)
      if (!sample) return

      // Delete from storage if file path exists
      if (sample.audioFilePath) {
        await database.deleteAudioFile(sample.audioFilePath)
      }

      // Delete sample record
      await database.deleteSample(sampleId)
    } catch (error) {
      console.error('Failed to delete audio file:', error)
    }
  }

  static async getStorageUsage(): Promise<{ used: number; available: number }> {
    try {
      // Get user's audio files
      const user = await database.getCurrentUser()
      if (!user) return { used: 0, available: 0 }

      const { data, error } = await supabase
        .from('audio_files')
        .select('size')
        .eq('user_id', user.id)

      if (error) throw error

      const used = data.reduce((total, file) => total + file.size, 0)
      
      // Supabase free tier has 1GB storage
      const available = 1024 * 1024 * 1024 // 1GB in bytes
      
      return { used, available }
    } catch (error) {
      console.error('Failed to get storage usage:', error)
      return { used: 0, available: 1024 * 1024 * 1024 }
    }
  }

  static async cleanupOldFiles(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const user = await database.getCurrentUser()
      if (!user) return

      const cutoffDate = new Date(Date.now() - maxAge)

      const { data, error } = await supabase
        .from('samples')
        .select('id, audio_file_path')
        .eq('user_id', user.id)
        .lt('recorded_at', cutoffDate.toISOString())

      if (error) throw error

      for (const sample of data) {
        await this.deleteAudioFile(sample.id)
      }
    } catch (error) {
      console.error('Failed to cleanup old files:', error)
    }
  }

  private static async uploadToStorage(blob: File | Blob, sampleId: string, filename: string): Promise<string> {
    const user = await database.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    // Create file path: userId/sampleId.extension
    const fileExt = filename.split('.').pop()
    const filePath = `${user.id}/${sampleId}.${fileExt}`

    // Convert blob to file if needed
    const file = blob instanceof File ? blob : new File([blob], filename, { type: blob.type })

    const { data, error } = await supabase.storage
      .from('audio-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw error

    // Store file metadata in database
    await supabase
      .from('audio_files')
      .insert({
        user_id: user.id,
        sample_id: sampleId,
        filename,
        file_path: data.path,
        mime_type: file.type,
        size: file.size,
        duration: 0, // Will be updated if needed
      })

    return data.path
  }

  private static getFileExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/webm;codecs=opus': 'webm',
      'audio/mp4': 'm4a',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
    }
    
    return extensions[mimeType] || 'webm'
  }
}