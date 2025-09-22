"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class SettingsService {
    constructor() {
        this.loadRuntimeSettings();
    }
    /**
     * Load runtime settings from file if it exists
     */
    loadRuntimeSettings() {
        try {
            const settingsPath = path_1.default.join(process.cwd(), 'runtime-settings.json');
            if (fs_1.default.existsSync(settingsPath)) {
                const settingsData = fs_1.default.readFileSync(settingsPath, 'utf8');
                const settings = JSON.parse(settingsData);
                if (settings.hostUdlfPath) {
                    process.env.HOST_UDLF_PATH = settings.hostUdlfPath;
                    console.log(`Loaded runtime settings: HOST_UDLF_PATH = ${settings.hostUdlfPath}`);
                }
            }
        }
        catch (error) {
            console.warn('Failed to load runtime settings:', error);
        }
    }
    /**
     * Validate if a path exists and is accessible
     */
    async validatePath(request) {
        const { path: targetPath } = request;
        try {
            // Check if path exists
            const exists = fs_1.default.existsSync(targetPath);
            if (!exists) {
                return {
                    exists: false,
                    isDirectory: false,
                    isAccessible: false,
                    error: 'Path does not exist'
                };
            }
            // Check if it's a directory
            const stats = fs_1.default.statSync(targetPath);
            const isDirectory = stats.isDirectory();
            // Check if it's accessible (can read)
            let isAccessible = false;
            try {
                fs_1.default.accessSync(targetPath, fs_1.default.constants.R_OK);
                isAccessible = true;
            }
            catch (accessError) {
                isAccessible = false;
            }
            return {
                exists: true,
                isDirectory,
                isAccessible,
            };
        }
        catch (error) {
            return {
                exists: false,
                isDirectory: false,
                isAccessible: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Update Docker environment configuration
     * This implementation updates the .env file directly for automatic Docker integration
     */
    async updateSettings(request) {
        const { hostUdlfPath } = request;
        try {
            // Validate the path first
            const validation = await this.validatePath({ path: hostUdlfPath });
            if (!validation.exists || !validation.isDirectory || !validation.isAccessible) {
                return {
                    success: false,
                    message: 'Invalid path provided',
                    error: validation.error || 'Path is not accessible'
                };
            }
            // Update the .env file directly
            const envPath = path_1.default.join(process.cwd(), '..', '.env'); // Go up one level to project root
            const envExamplePath = path_1.default.join(process.cwd(), '..', 'env.example');
            let envContent = '';
            // Read existing .env file or create from example
            if (fs_1.default.existsSync(envPath)) {
                envContent = fs_1.default.readFileSync(envPath, 'utf8');
            }
            else if (fs_1.default.existsSync(envExamplePath)) {
                envContent = fs_1.default.readFileSync(envExamplePath, 'utf8');
            }
            else {
                // Create basic .env content
                envContent = `# UDLF Web Application Configuration
# Generated automatically by the web interface

HOST_UDLF_PATH=${hostUdlfPath}

# API Configuration
API_PORT=8080
API_HOST=localhost

# Frontend Configuration
FRONTEND_PORT=3000
FRONTEND_HOST=localhost

# Environment
NODE_ENV=development

# URLs
NEXT_PUBLIC_URL_API_LOCAL=http://localhost:8080
`;
            }
            // Update or add HOST_UDLF_PATH
            const lines = envContent.split('\n');
            let found = false;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('HOST_UDLF_PATH=')) {
                    lines[i] = `HOST_UDLF_PATH=${hostUdlfPath}`;
                    found = true;
                    break;
                }
            }
            if (!found) {
                lines.push(`HOST_UDLF_PATH=${hostUdlfPath}`);
            }
            const updatedContent = lines.join('\n');
            fs_1.default.writeFileSync(envPath, updatedContent);
            console.log(`Settings updated: HOST_UDLF_PATH = ${hostUdlfPath}`);
            console.log(`Updated .env file: ${envPath}`);
            return {
                success: true,
                message: 'Settings updated successfully in .env file. Run "docker-compose up --build" to apply changes.'
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to update settings',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Get current settings from .env file
     */
    getCurrentSettings() {
        const envPath = path_1.default.join(process.cwd(), '..', '.env');
        let hostUdlfPath = '/app/Datasets'; // Default value
        try {
            if (fs_1.default.existsSync(envPath)) {
                const envContent = fs_1.default.readFileSync(envPath, 'utf8');
                const lines = envContent.split('\n');
                for (const line of lines) {
                    if (line.startsWith('HOST_UDLF_PATH=')) {
                        hostUdlfPath = line.split('=')[1]?.trim() || '/app/Datasets';
                        break;
                    }
                }
            }
        }
        catch (error) {
            console.warn('Failed to read .env file:', error);
        }
        return {
            hostUdlfPath,
            appDatasetsPath: process.env.APP_DATASETS_PATH || '/app/datasets',
            nodeEnv: process.env.NODE_ENV || 'development',
            envFileExists: fs_1.default.existsSync(envPath),
            envFilePath: envPath,
        };
    }
}
exports.SettingsService = SettingsService;
