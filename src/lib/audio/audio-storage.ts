import { getDatabase } from '@/lib/supabase/database'
import { SoundType, SignalQuality } from '@/lib/types'
import type { User } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

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
    user: User,
    supabase: SupabaseClient<Database>,
    blob: Blob,
    spaceId: string,
    soundType: SoundType,
    duration: number,
    signalQuality: SignalQuality,
    analysis?: any
  ): Promise<string> {
    try {
      console.log('AudioStorage: Starting save process...', {
        userId: user.id,
        blobSize: blob.size,
        spaceId,
        soundType,
        duration,
        signalQuality
      })

      console.log('AudioStorage: User authenticated:', user.id)

      const database = getDatabase(supabase)

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const extension = this.getFileExtension(blob.type)
      const filename = `recording-${timestamp}.${extension}`
      
      console.log('AudioStorage: Generated filename:', filename)

      // Create sample record first to get ID
      const sample = await database.createSample(user, {
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

      console.log('AudioStorage: Sample created with ID:', sample.id)

      // Upload file to Supabase Storage
      const filePath = await this.uploadToStorage(user, supabase, blob, sample.id, filename)
      
      console.log('AudioStorage: File uploaded to path:', filePath)

      // Update sample with file path
      await database.updateSample(user, sample.id, {
        audioFilePath: filePath,
      })

      console.log('AudioStorage: Sample updated with file path')
      console.log('AudioStorage: Audio file saved successfully:', sample.id)
      return sample.id
    } catch (error) {
      console.error('AudioStorage: Failed to save audio file:', error)
      throw new Error(`Failed to save recording: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  static async getAudioFile(user: User, supabase: SupabaseClient<Database>, sampleId: string): Promise<Blob | null> {
    try {
      const database = getDatabase(supabase)
      const sample = await database.getSample(user, sampleId)
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

  static async deleteAudioFile(user: User, supabase: SupabaseClient<Database>, sampleId: string): Promise<void> {
    try {
      const database = getDatabase(supabase)
      const sample = await database.getSample(user, sampleId)
      if (!sample) return

      // Delete from storage if file path exists
      if (sample.audioFilePath) {
        await database.deleteAudioFile(sample.audioFilePath)
      }

      // Delete sample record
      await database.deleteSample(user, sampleId)
    } catch (error) {
      console.error('Failed to delete audio file:', error)
    }
  }

  static async getStorageUsage(): Promise<{ used: number; available: number }> {
    try {
      // For now, return placeholder values since we're using Supabase
      // In a real implementation, you'd query the storage usage
      return { used: 0, available: 1024 * 1024 * 1024 } // 1GB
    } catch (error) {
      console.error('Failed to get storage usage:', error)
      return { used: 0, available: 1024 * 1024 * 1024 }
    }
  }

  static async cleanupOldFiles(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      // This would need to be implemented based on your cleanup requirements
      console.log('Cleanup old files not implemented yet')
    } catch (error) {
      console.error('Failed to cleanup old files:', error)
    }
  }

  private static async uploadToStorage(user: User, supabase: SupabaseClient<Database>, blob: File | Blob, sampleId: string, filename: string): Promise<string> {
    try {
      console.log('AudioStorage: Starting file upload...', { userId: user.id, sampleId, filename })

      // Create file path: userId/sampleId.extension
      const fileExt = filename.split('.').pop()
      const filePath = `${user.id}/${sampleId}.${fileExt}`

      console.log('AudioStorage: Upload path:', filePath)

      // Convert blob to file if needed
      const file = blob instanceof File ? blob : new File([blob], filename, { type: blob.type })

      // Upload to Supabase storage
      const database = getDatabase(supabase)
      const uploadResult = await database.uploadAudioFile(user, file, sampleId)
      
      console.log('AudioStorage: Upload successful:', uploadResult)
      return uploadResult
    } catch (error) {
      console.error('AudioStorage: Upload failed:', error)
      throw error
    }
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