import { ConfigParser, ConfigPaths } from "../utils/config-parser";
import { paths } from "../config/paths";

export class DynamicPathsService {
  private static configPathsCache: Map<string, ConfigPaths> = new Map();

  /**
   * Get dynamic paths for a specific config file
   */
  public static async getPathsForConfig(configFilePath: string): Promise<ConfigPaths> {
    // Check cache first
    if (this.configPathsCache.has(configFilePath)) {
      return this.configPathsCache.get(configFilePath)!;
    }

    try {
      const dynamicPaths = await ConfigParser.getDynamicPaths(configFilePath);
      this.configPathsCache.set(configFilePath, dynamicPaths);
      return dynamicPaths;
    } catch (error) {
      console.warn(`Failed to load dynamic paths for ${configFilePath}, using defaults:`, error);
      return {
        datasetList: paths.datasetList,
        classList: paths.classList,
        datasetImages: paths.datasetImages,
        inputFile: ''
      };
    }
  }

  /**
   * Clear cache for a specific config file
   */
  public static clearCache(configFilePath?: string): void {
    if (configFilePath) {
      this.configPathsCache.delete(configFilePath);
    } else {
      this.configPathsCache.clear();
    }
  }

  /**
   * Get all cached config files
   */
  public static getCachedConfigs(): string[] {
    return Array.from(this.configPathsCache.keys());
  }
}
