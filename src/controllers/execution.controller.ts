import { Request, Response } from "express";
import { ExecutionService } from "../services/execution.service";
import { GCSService } from "../services/gcs.service";
import path from "path";
import fs from "fs";
import { randomBytes } from "crypto";

const uploadsDirDocker = "/app/uploads" as const;

export class ExecutionController {
  private executionService: ExecutionService;
  private gcsService: GCSService | null = null;
  private UPLOADS_DIR: string;

  constructor(executionService: ExecutionService) {
    this.executionService = executionService;
    this.UPLOADS_DIR = uploadsDirDocker;
    
    // Initialize GCS service in demo mode
    if (process.env.API_MODE?.toLowerCase() === 'demo') {
      this.gcsService = new GCSService();
    }
  }

  /**
   * Check if we're running in Cloud Run (GCSFuse available)
   */
  private isCloudRun(): boolean {
    // Cloud Run sets K_SERVICE environment variable
    return !!process.env.K_SERVICE;
  }

  /**
   * Extract file paths from .ini config
   */
  private extractFilePaths(configContent: string): string[] {
    const paths: string[] = [];
    const lines = configContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || !trimmed || !trimmed.includes('=')) continue;
      
      const parts = trimmed.split('=');
      if (parts.length < 2) continue;
      
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      
      // Remove inline comments
      const valueWithoutComment = value.split('##')[0].trim();
      
      // Check if it's a file path parameter
      if (valueWithoutComment && (
        key.includes('FILE') || 
        key.includes('MATRIX') ||
        key.includes('PATH')
      )) {
        // Check if it looks like a file path (contains 'Datasets' or starts with / or app/)
        if (valueWithoutComment.includes('Datasets') || 
            valueWithoutComment.startsWith('/') ||
            valueWithoutComment.startsWith('app/')) {
          
          // Skip if it's just a boolean or number
          if (valueWithoutComment === 'TRUE' || valueWithoutComment === 'FALSE' || 
              !isNaN(Number(valueWithoutComment))) {
            continue;
          }
          
          paths.push(valueWithoutComment);
        }
      }
    }
    
    return [...new Set(paths)]; // Remove duplicates
  }

  /**
   * Download files from GCS for local testing (when GCSFuse is not available)
   */
  private async prepareLocalExecution(configFilePath: string): Promise<string> {
    if (!this.gcsService) return configFilePath;

    try {
      console.log("Local mode: Downloading files from GCS...");
      
      const configContent = fs.readFileSync(configFilePath, 'utf-8');
      const filePaths = this.extractFilePaths(configContent);
      
      console.log(`Found ${filePaths.length} file paths in config`);
      
      // Create temp directory
      const executionId = randomBytes(4).toString('hex');
      const tempDir = `/tmp/udlf_exec_${executionId}`;
      fs.mkdirSync(tempDir, { recursive: true });
      console.log(`Created temp directory: ${tempDir}`);
      
      let modifiedConfig = configContent;
      
      for (const filePath of filePaths) {
        try {
          // Normalize path: remove leading slash, ensure it starts with 'app/'
          let gcsPath = filePath.replace(/^\/+/, '');
          if (!gcsPath.startsWith('app/')) {
            gcsPath = 'app/' + gcsPath;
          }
          
          // Skip directories (paths without extensions or ending with /)
          if (!path.extname(filePath) || filePath.endsWith('/')) {
            console.log(`Skipping directory: ${filePath}`);
            continue;
          }
          
          // Check if file exists in GCS
          const exists = await this.gcsService.fileExists(gcsPath);
          
          if (exists) {
            const localPath = path.join(tempDir, path.basename(filePath));
            await this.gcsService.downloadFile(gcsPath, localPath);
            console.log(`✓ Downloaded: ${gcsPath} -> ${localPath}`);
            
            // Replace ALL occurrences of the path in config
            modifiedConfig = modifiedConfig.split(filePath).join(localPath);
          } else {
            console.warn(`✗ File not found in GCS: ${gcsPath}`);
          }
        } catch (error) {
          console.error(`✗ Error downloading ${filePath}:`, error);
        }
      }
      
      // Save modified config
      const modifiedConfigPath = path.join(tempDir, `config_${executionId}.ini`);
      fs.writeFileSync(modifiedConfigPath, modifiedConfig);
      console.log(`Created modified config: ${modifiedConfigPath}`);
      
      return modifiedConfigPath;
    } catch (error) {
      console.error("Error preparing local execution:", error);
      throw new Error("Failed to prepare local execution environment");
    }
  }

  async execute(filename: string, res: Response): Promise<void> {
    if (!filename) {
      res.status(400).json({ error: "File name is required" });
      return;
    }

    const configFilePath = path.join(this.UPLOADS_DIR, filename);
    let executionConfigPath = configFilePath;

    try {
      // If in demo mode AND not in Cloud Run, download files from GCS
      if (this.gcsService && !this.isCloudRun()) {
        console.log("Demo mode (local) detected - downloading files from GCS...");
        executionConfigPath = await this.prepareLocalExecution(configFilePath);
      } else if (this.isCloudRun()) {
        console.log("Cloud Run detected - using GCSFuse mounted files");
      }

      console.log("Executing command with config:", executionConfigPath);
      const result = await this.executionService.execute(executionConfigPath);

      res.json({
        message: "Command executed successfully",
        output: result.stdout,
        error: result.stderr,
      });
    } catch (err: any) {
      console.error(`Error executing command: ${err.message}`);
      res.status(500).json({ error: "Failed to execute command", details: err.message });
    }
  }
}
