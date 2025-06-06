import { database } from '@/lib/database'
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
  private static readonly STORAGE_KEY = 'audio-files'
  private static readonly MAX_STORAGE_SIZE = 100 * 1024 * 1024 // 100MB

  static async saveAudioFile(
    blob: Blob,
    spaceId: string,
    soundType: SoundType,
    duration: number,
    signalQuality: SignalQuality,
    analysis?: any
  ): Promise<string> {
    try {
      // Check storage quota
      await this.checkStorageQuota(blob.size)
      
      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const extension = this.getFileExtension(blob.type)
      const filename = `recording-${timestamp}.${extension}`
      
      // Convert blob to base64 for storage
      const base64Data = await this.blobToBase64(blob)
      
      // Create audio file record
      const audioFile: AudioFile = {
        id: crypto.randomUUID(),
        blob,
        filename,
        mimeType: blob.type,
        size: blob.size,
        duration,
        createdAt: new Date(),
      }
      
      // Store in IndexedDB
      await this.storeAudioFile(audioFile, base64Data)
      
      // Create sample record in database
      const sample = await database.createSample({
        spaceId,
        soundType,
        audioFilePath: audioFile.id,
        duration,
        signalQuality,
        ambientNoiseLevel: analysis?.ambientNoise || 0,
        peaks: analysis?.peaks || [],
        spectralData: analysis?.spectralData || {},
        sampleRate: 48000,
        recordingSettings: {
          mimeType: blob.type,
          size: blob.size,
          filename,
        },
      })
      
      return sample.id
    } catch (error) {
      console.error('Failed to save audio file:', error)
      throw new Error('Failed to save recording')
    }
  }

  static async getAudioFile(audioFileId: string): Promise<Blob | null> {
    try {
      const audioData = await this.retrieveAudioFile(audioFileId)
      if (!audioData) return null
      
      return this.base64ToBlob(audioData.data, audioData.mimeType)
    } catch (error) {
      console.error('Failed to retrieve audio file:', error)
      return null
    }
  }

  static async deleteAudioFile(audioFileId: string): Promise<void> {
    try {
      await this.removeAudioFile(audioFileId)
    } catch (error) {
      console.error('Failed to delete audio file:', error)
    }
  }

  static async getStorageUsage(): Promise<{ used: number; available: number }> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        return {
          used: estimate.usage || 0,
          available: estimate.quota || 0,
        }
      }
      
      // Fallback: estimate based on stored files
      const files = await this.getAllAudioFiles()
      const used = files.reduce((total, file) => total + file.size, 0)
      
      return {
        used,
        available: this.MAX_STORAGE_SIZE,
      }
    } catch (error) {
      console.error('Failed to get storage usage:', error)
      return { used: 0, available: this.MAX_STORAGE_SIZE }
    }
  }

  static async cleanupOldFiles(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const files = await this.getAllAudioFiles()
      const cutoffDate = new Date(Date.now() - maxAge)
      
      for (const file of files) {
        if (file.createdAt < cutoffDate) {
          await this.deleteAudioFile(file.id)
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old files:', error)
    }
  }

  private static async checkStorageQuota(fileSize: number): Promise<void> {
    const { used, available } = await this.getStorageUsage()
    
    if (used + fileSize > available) {
      throw new Error('Insufficient storage space')
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

  private static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1]) // Remove data:mime;base64, prefix
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  private static base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

  private static async storeAudioFile(audioFile: AudioFile, base64Data: string): Promise<void> {
    const dbName = 'audio-storage'
    const storeName = 'files'
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1)
      
      request.onerror = () => reject(request.error)
      
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction([storeName], 'readwrite')
        const store = transaction.objectStore(storeName)
        
        const fileData = {
          id: audioFile.id,
          filename: audioFile.filename,
          mimeType: audioFile.mimeType,
          size: audioFile.size,
          duration: audioFile.duration,
          createdAt: audioFile.createdAt,
          data: base64Data,
        }
        
        const addRequest = store.add(fileData)
        addRequest.onsuccess = () => resolve()
        addRequest.onerror = () => reject(addRequest.error)
      }
      
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' })
          store.createIndex('createdAt', 'createdAt')
          store.createIndex('size', 'size')
        }
      }
    })
  }

  private static async retrieveAudioFile(id: string): Promise<any> {
    const dbName = 'audio-storage'
    const storeName = 'files'
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1)
      
      request.onerror = () => reject(request.error)
      
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction([storeName], 'readonly')
        const store = transaction.objectStore(storeName)
        
        const getRequest = store.get(id)
        getRequest.onsuccess = () => resolve(getRequest.result)
        getRequest.onerror = () => reject(getRequest.error)
      }
    })
  }

  private static async removeAudioFile(id: string): Promise<void> {
    const dbName = 'audio-storage'
    const storeName = 'files'
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1)
      
      request.onerror = () => reject(request.error)
      
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction([storeName], 'readwrite')
        const store = transaction.objectStore(storeName)
        
        const deleteRequest = store.delete(id)
        deleteRequest.onsuccess = () => resolve()
        deleteRequest.onerror = () => reject(deleteRequest.error)
      }
    })
  }

  private static async getAllAudioFiles(): Promise<AudioFile[]> {
    const dbName = 'audio-storage'
    const storeName = 'files'
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1)
      
      request.onerror = () => reject(request.error)
      
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction([storeName], 'readonly')
        const store = transaction.objectStore(storeName)
        
        const getAllRequest = store.getAll()
        getAllRequest.onsuccess = () => {
          const files = getAllRequest.result.map((item: any) => ({
            id: item.id,
            blob: new Blob(), // We don't need the actual blob for metadata
            filename: item.filename,
            mimeType: item.mimeType,
            size: item.size,
            duration: item.duration,
            createdAt: new Date(item.createdAt),
          }))
          resolve(files)
        }
        getAllRequest.onerror = () => reject(getAllRequest.error)
      }
    })
  }
}