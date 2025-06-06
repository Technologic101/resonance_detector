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

  async init(): Promise<void> {
    if (this.db) return

    this.db = await openDB<ResonanceDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Create spaces store
        const spacesStore = db.createObjectStore('spaces', {
          keyPath: 'id',
        })
        spacesStore.createIndex('by-type', 'type')
        spacesStore.createIndex('by-updated', 'updatedAt')
        spacesStore.createIndex('by-created', 'createdAt')

        // Create samples store
        const samplesStore = db.createObjectStore('samples', {
          keyPath: 'id',
        })
        samplesStore.createIndex('by-space', 'spaceId')
        samplesStore.createIndex('by-recorded', 'recordedAt')
        samplesStore.createIndex('by-quality', 'signalQuality')
        samplesStore.createIndex('by-type', 'soundType')
      },
    })
  }

  private ensureDB(): IDBPDatabase<ResonanceDB> {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.')
    }
    return this.db
  }

  // Space operations
  async createSpace(data: CreateSpaceData): Promise<Space> {
    const db = this.ensureDB()
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
    const db = this.ensureDB()
    return await db.get('spaces', id)
  }

  async getAllSpaces(): Promise<Space[]> {
    const db = this.ensureDB()
    return await db.getAllFromIndex('spaces', 'by-updated')
  }

  async updateSpace(id: string, updates: Partial<Space>): Promise<Space> {
    const db = this.ensureDB()
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
    const db = this.ensureDB()
    
    // Delete all samples for this space first
    const samples = await this.getSamplesForSpace(id)
    for (const sample of samples) {
      await db.delete('samples', sample.id)
    }
    
    // Delete the space
    await db.delete('spaces', id)
  }

  async getSpaceCount(): Promise<number> {
    const db = this.ensureDB()
    return await db.count('spaces')
  }

  // Sample operations
  async createSample(data: CreateSampleData): Promise<Sample> {
    const db = this.ensureDB()
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
    const db = this.ensureDB()
    return await db.get('samples', id)
  }

  async getSamplesForSpace(spaceId: string): Promise<Sample[]> {
    const db = this.ensureDB()
    return await db.getAllFromIndex('samples', 'by-space', spaceId)
  }

  async getAllSamples(): Promise<Sample[]> {
    const db = this.ensureDB()
    return await db.getAllFromIndex('samples', 'by-recorded')
  }

  async getRecentSamples(limit: number = 5): Promise<Sample[]> {
    const db = this.ensureDB()
    const allSamples = await db.getAllFromIndex('samples', 'by-recorded')
    return allSamples.slice(-limit).reverse()
  }

  async updateSample(id: string, updates: Partial<Sample>): Promise<Sample> {
    const db = this.ensureDB()
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
    const db = this.ensureDB()
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
    const db = this.ensureDB()
    return await db.count('samples')
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    const db = this.ensureDB()
    await db.clear('spaces')
    await db.clear('samples')
  }

  async exportData(): Promise<{ spaces: Space[]; samples: Sample[] }> {
    const spaces = await this.getAllSpaces()
    const samples = await this.getAllSamples()
    return { spaces, samples }
  }

  async importData(data: { spaces: Space[]; samples: Sample[] }): Promise<void> {
    const db = this.ensureDB()
    
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

// Initialize database on module load
if (typeof window !== 'undefined') {
  database.init().catch(console.error)
}