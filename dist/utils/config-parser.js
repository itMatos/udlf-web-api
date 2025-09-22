"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigParser = void 0;
const fs_1 = __importDefault(require("fs"));
class ConfigParser {
    /**
     * Parse a UDLF configuration file to extract dynamic paths
     */
    static async parseConfigFile(configFilePath) {
        try {
            const configContent = await fs_1.default.promises.readFile(configFilePath, 'utf-8');
            const lines = configContent.split('\n');
            let datasetList = '';
            let classList = '';
            let datasetImages = '';
            let inputFile = '';
            for (const line of lines) {
                const trimmedLine = line.trim();
                // Skip comments and empty lines
                if (trimmedLine.startsWith('#') || trimmedLine === '') {
                    continue;
                }
                // Parse key-value pairs
                const [key, ...valueParts] = trimmedLine.split('=');
                if (key && valueParts.length > 0) {
                    let value = valueParts.join('=').trim();
                    // Remove inline comments (## or #)
                    const commentIndex = value.indexOf('##');
                    if (commentIndex !== -1) {
                        value = value.substring(0, commentIndex).trim();
                    }
                    else {
                        const hashIndex = value.indexOf('#');
                        if (hashIndex !== -1) {
                            value = value.substring(0, hashIndex).trim();
                        }
                    }
                    switch (key.trim()) {
                        case 'INPUT_FILE_LIST':
                            datasetList = value;
                            break;
                        case 'INPUT_FILE_CLASSES':
                            classList = value;
                            break;
                        case 'INPUT_IMAGES_PATH':
                            datasetImages = value;
                            break;
                        case 'INPUT_FILE':
                            inputFile = value;
                            break;
                    }
                }
            }
            return {
                datasetList,
                classList,
                datasetImages,
                inputFile
            };
        }
        catch (error) {
            throw new Error(`Failed to parse config file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get dynamic paths based on config file
     */
    static async getDynamicPaths(configFilePath) {
        const configPaths = await this.parseConfigFile(configFilePath);
        // Validate that required paths exist
        const requiredPaths = ['datasetList', 'classList'];
        for (const pathKey of requiredPaths) {
            const pathValue = configPaths[pathKey];
            if (!pathValue) {
                throw new Error(`Required path ${pathKey} not found in config file`);
            }
        }
        return configPaths;
    }
}
exports.ConfigParser = ConfigParser;
