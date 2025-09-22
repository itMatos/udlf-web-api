"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicPathsService = void 0;
const config_parser_1 = require("../utils/config-parser");
const paths_1 = require("../config/paths");
class DynamicPathsService {
    /**
     * Get dynamic paths for a specific config file
     */
    static async getPathsForConfig(configFilePath) {
        // Check cache first
        if (this.configPathsCache.has(configFilePath)) {
            return this.configPathsCache.get(configFilePath);
        }
        try {
            const dynamicPaths = await config_parser_1.ConfigParser.getDynamicPaths(configFilePath);
            this.configPathsCache.set(configFilePath, dynamicPaths);
            return dynamicPaths;
        }
        catch (error) {
            console.warn(`Failed to load dynamic paths for ${configFilePath}, using defaults:`, error);
            return {
                datasetList: paths_1.paths.datasetList,
                classList: paths_1.paths.classList,
                datasetImages: paths_1.paths.datasetImages,
                inputFile: ''
            };
        }
    }
    /**
     * Clear cache for a specific config file
     */
    static clearCache(configFilePath) {
        if (configFilePath) {
            this.configPathsCache.delete(configFilePath);
        }
        else {
            this.configPathsCache.clear();
        }
    }
    /**
     * Get all cached config files
     */
    static getCachedConfigs() {
        return Array.from(this.configPathsCache.keys());
    }
}
exports.DynamicPathsService = DynamicPathsService;
DynamicPathsService.configPathsCache = new Map();
