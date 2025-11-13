import fs from 'fs';
import { GCSService } from '../services/gcs.service';

/**
 * File Accessor - Abstrai acesso a arquivos (local ou GCS)
 * No modo demo local, baixa arquivos do GCS automaticamente
 */
export class FileAccessor {
  private static gcsService: GCSService | null = null;
  private static fileCache: Map<string, string> = new Map();

  /**
   * Initialize GCS service if in demo mode
   */
  private static initGCSIfNeeded(): void {
    if (!this.gcsService && process.env.API_MODE?.toLowerCase() === 'demo') {
      this.gcsService = new GCSService();
    }
  }

  /**
   * Check if we're in Cloud Run (GCSFuse available)
   */
  private static isCloudRun(): boolean {
    return !!process.env.K_SERVICE;
  }

  /**
   * Normalize path for GCS
   */
  private static normalizeGCSPath(filePath: string): string {
    let gcsPath = filePath.replace(/^\/+/, '');
    if (!gcsPath.startsWith('app/')) {
      gcsPath = 'app/' + gcsPath;
    }
    return gcsPath;
  }

  /**
   * Read file content - works with both local files and GCS
   */
  static async readFile(filePath: string): Promise<string> {
    this.initGCSIfNeeded();

    // If in Cloud Run, files are mounted via GCSFuse - use direct access
    if (this.isCloudRun()) {
      return fs.promises.readFile(filePath, 'utf-8');
    }

    // If in demo mode (local), try to get from cache or download from GCS
    if (this.gcsService) {
      // Check cache first
      if (this.fileCache.has(filePath)) {
        return this.fileCache.get(filePath)!;
      }

      try {
        const gcsPath = this.normalizeGCSPath(filePath);
        
        // Download file from GCS
        const [content] = await this.gcsService['bucket'].file(gcsPath).download();
        const contentString = content.toString('utf-8');
        
        // Cache it
        this.fileCache.set(filePath, contentString);
        console.log(`📥 Downloaded from GCS: ${gcsPath}`);
        
        return contentString;
      } catch (error) {
        console.error(`Error reading file from GCS (${filePath}):`, error);
        throw new Error(`File not found: ${filePath}`);
      }
    }

    // Default: local filesystem
    return fs.promises.readFile(filePath, 'utf-8');
  }

  /**
   * Check if file exists - works with both local files and GCS
   */
  static async fileExists(filePath: string): Promise<boolean> {
    this.initGCSIfNeeded();

    // If in Cloud Run, files are mounted via GCSFuse
    if (this.isCloudRun()) {
      try {
        await fs.promises.access(filePath, fs.constants.F_OK);
        return true;
      } catch {
        return false;
      }
    }

    // If in demo mode (local), check GCS
    if (this.gcsService) {
      try {
        const gcsPath = this.normalizeGCSPath(filePath);
        return await this.gcsService.fileExists(gcsPath);
      } catch {
        return false;
      }
    }

    // Default: local filesystem
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear cache (useful between executions)
   */
  static clearCache(): void {
    this.fileCache.clear();
    console.log('🗑️  File cache cleared');
  }

  /**
   * Get cache size
   */
  static getCacheSize(): number {
    return this.fileCache.size;
  }
}

