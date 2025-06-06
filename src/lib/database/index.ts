import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { v4 as uuidv4 } from 'uuid'
import { Space, Sample, CreateSpaceData, CreateSampleData } from '@/lib/types'

interface ResonanceDB extends DBSchema {
  spaces: {
    key: string
    value: Space
    indexes: {
      'by-type': string
      'by-updated': Date
      'by-created': Date
    }
  }
  samples: {
    key: string
    value: Sample
    indexes: {
      'by-space': string
      'by-recorded': Date
      'by-quality': string
      'by-type': string
    }
  }
}

class DatabaseManager {
  private db: IDBPDatabase<ResonanceDB> | null = null
  private readonly DB_NAME = 'resonance-detector'
  private readonly DB_VERSION = 1
  private initPromise: Promise<void> | null = null
  private isInitialized = false

  async init(): Promise<void> {
    // Return existing initialization promise if already in progress
    if (this.initPromise) {
      return this.initPromise
    }

    // Return immediately if already initialized
    if (this.db && this.isInitialized) {
      return Promise.resolve()
    }

    // Create new initialization promise
    this.initPromise = this.performInit()
    
    try {
      await this.initPromise
      this.isInitialized = true
    } finally {
      this.initPromise = null
    }
  }

  private async performInit(): Promise<void> {
    try {
      this.db = await openDB<ResonanceDB>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
          console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`)
          
          // Create spaces store
          if (!db.objectStoreNames.contains('spaces')) {
            const spacesStore = db.createObjectStore('spaces', {
              keyPath: 'id',
            })
            spacesStore.createIndex('by-type', 'type')
            spacesStore.createIndex('by-updated', 'updatedAt')
            spacesStore.createIndex('by-created', 'createdAt')
          }

          // Create samples store
          if (!db.objectStoreNames.contains('samples')) {
            const samplesStore = db.createObjectStore('samples', {
              keyPath: 'id',
            })
            samplesStore.createIndex('by-space', 'spaceId')
            samplesStore.createIndex('by-recorded', 'recordedAt')
            samplesStore.createIndex('by-quality', 'signalQuality')
            samplesStore.createIndex('by-type', 'soundType')
          }
        },
        blocked() {
          console.warn('Database upgrade blocked by another tab')
        },
        blocking() {
          console.warn('Database upgrade blocking another tab')
        },
      })
      
      console.log('Database initialized successfully')
    } catch (error) {
      console.error('Failed to initialize database:', error)
      this.db = null
      this.isInitialized = false
      throw error
    }
  }

  private async ensureDB(): Promise<IDBPDatabase<ResonanceDB>> {
    await this.init()
    
    if (!this.db) {
      throw new Error('Database not initialized')
    }
    
    return this.db
  }

  // Space operations
  async createSpace(data: CreateSpaceData): Promise<Space> {
    const db = await this.ensureDB()
    const now = new Date()
    
    const space: Space = {
      id: uuidv4(),
      name: data.name,
      description: data.description,
      type: data.type,
      createdAt: now,
      updatedAt: now,
      sampleIds: [],
      metadata: data.metadata || {},
      environmentalConditions: data.environmentalConditions || {},
      analyzedFrequencies: [],
    }

    await db.add('spaces', space)
    return space
  }

  async getSpace(id: string): Promise<Space | undefined> {
    const db = await this.ensureDB()
    return await db.get('spaces', id)
  }

  async getAllSpaces(): Promise<Space[]> {
    const db = await this.ensureDB()
    try {
      return await db.getAllFromIndex('spaces', 'by-updated')
    } catch (error) {
      console.error('Error getting all spaces:', error)
      // Fallback to getAll if index fails
      return await db.getAll('spaces')
    }
  }

  async updateSpace(id: string, updates: Partial<Space>): Promise<Space> {
    const db = await this.ensureDB()
    const existing = await db.get('spaces', id)
    
    if (!existing) {
      throw new Error(`Space with id ${id} not found`)
    }

    const updated: Space = {
      ...existing,
      ...updates,
      id: existing.id, // Ensure ID doesn't change
      updatedAt: new Date(),
    }

    await db.put('spaces', updated)
    return updated
  }

  async deleteSpace(id: string): Promise<void> {
    const db = await this.ensureDB()
    
    try {
      // Start a transaction that includes both stores
      const tx = db.transaction(['spaces', 'samples'], 'readwrite')
      const spacesStore = tx.objectStore('spaces')
      const samplesStore = tx.objectStore('samples')
      
      // Get all samples for this space
      const samplesIndex = samplesStore.index('by-space')
      const samples = await samplesIndex.getAll(id)
      
      // Delete all samples for this space
      for (const sample of samples) {
        await samplesStore.delete(sample.id)
      }
      
      // Delete the space
      await spacesStore.delete(id)
      
      // Wait for transaction to complete
      await tx.done
      
      console.log(`Successfully deleted space ${id} and ${samples.length} associated samples`)
    } catch (error) {
      console.error('Error deleting space:', error)
      throw new Error(`Failed to delete space: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getSpaceCount(): Promise<number> {
    const db = await this.ensureDB()
    try {
      return await db.count('spaces')
    } catch (error) {
      console.error('Error getting space count:', error)
      return 0
    }
  }

  // Sample operations
  async createSample(data: CreateSampleData): Promise<Sample> {
    const db = await this.ensureDB()
    const now = new Date()
    
    const sample: Sample = {
      id: uuidv4(),
      spaceId: data.spaceId,
      soundType: data.soundType,
      audioFilePath: data.audioFilePath,
      recordedAt: now,
      duration: data.duration,
      ambientNoiseLevel: data.ambientNoiseLevel || 0,
      peaks: data.peaks || [],
      spectralData: data.spectralData || {},
      signalQuality: data.signalQuality || 'good' as any,
      sampleRate: data.sampleRate || 48000,
      recordingSettings: data.recordingSettings || {},
    }

    await db.add('samples', sample)
    
    // Update space's sample IDs
    const space = await this.getSpace(data.spaceId)
    if (space) {
      await this.updateSpace(data.spaceId, {
        sampleIds: [...space.sampleIds, sample.id],
      })
    }
    
    return sample
  }

  async getSample(id: string): Promise<Sample | undefined> {
    const db = await this.ensureDB()
    return await db.get('samples', id)
  }

  async getSamplesForSpace(spaceId: string): Promise<Sample[]> {
    const db = await this.ensureDB()
    try {
      return await db.getAllFromIndex('samples', 'by-space', spaceId)
    } catch (error) {
      console.error('Error getting samples for space:', error)
      // Fallback to filtering all samples
      const allSamples = await db.getAll('samples')
      return allSamples.filter(sample => sample.spaceId === spaceId)
    }
  }

  async getAllSamples(): Promise<Sample[]> {
    const db = await this.ensureDB()
    try {
      return await db.getAllFromIndex('samples', 'by-recorded')
    } catch (error) {
      console.error('Error getting all samples:', error)
      // Fallback to getAll if index fails
      return await db.getAll('samples')
    }
  }

  async getRecentSamples(limit: number = 5): Promise<Sample[]> {
    const db = await this.ensureDB()
    try {
      const allSamples = await db.getAllFromIndex('samples', 'by-recorded')
      return allSamples.slice(-limit).reverse()
    } catch (error) {
      console.error('Error getting recent samples:', error)
      // Fallback to getAll and manual sorting
      const allSamples = await db.getAll('samples')
      return allSamples
        .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())
        .slice(0, limit)
    }
  }

  async updateSample(id: string, updates: Partial<Sample>): Promise<Sample> {
    const db = await this.ensureDB()
    const existing = await db.get('samples', id)
    
    if (!existing) {
      throw new Error(`Sample with id ${id} not found`)
    }

    const updated: Sample = {
      ...existing,
      ...updates,
      id: existing.id, // Ensure ID doesn't change
    }

    await db.put('samples', updated)
    return updated
  }

  async deleteSample(id: string): Promise<void> {
    const db = await this.ensureDB()
    const sample = await db.get('samples', id)
    
    if (sample) {
      // Remove from space's sample IDs
      const space = await this.getSpace(sample.spaceId)
      if (space) {
        await this.updateSpace(sample.spaceId, {
          sampleIds: space.sampleIds.filter(sampleId => sampleId !== id),
        })
      }
    }
    
    await db.delete('samples', id)
  }

  async getSampleCount(): Promise<number> {
    const db = await this.ensureDB()
    try {
      return await db.count('samples')
    } catch (error) {
      console.error('Error getting sample count:', error)
      return 0
    }
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    const db = await this.ensureDB()
    await db.clear('spaces')
    await db.clear('samples')
  }

  async exportData(): Promise<{ spaces: Space[]; samples: Sample[] }> {
    const spaces = await this.getAllSpaces()
    const samples = await this.getAllSamples()
    return { spaces, samples }
  }

  async importData(data: { spaces: Space[]; samples: Sample[] }): Promise<void> {
    const db = await this.ensureDB()
    
    // Clear existing data
    await this.clearAllData()
    
    // Import spaces
    for (const space of data.spaces) {
      await db.add('spaces', space)
    }
    
    // Import samples
    for (const sample of data.samples) {
      await db.add('samples', sample)
    }
  }
}

// Singleton instance
export const database = new DatabaseManager()

// Initialize database on module load (browser only)
if (typeof window !== 'undefined') {
  database.init().catch(error => {
    console.error('Failed to initialize database on module load:', error)
  })
}