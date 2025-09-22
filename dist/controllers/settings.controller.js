"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
class SettingsController {
    constructor(settingsService) {
        this.settingsService = settingsService;
    }
    /**
     * Validate if a path exists and is accessible
     */
    async validatePath(req, res) {
        try {
            const request = req.body;
            if (!request.path) {
                res.status(400).json({
                    success: false,
                    error: 'Path is required'
                });
                return;
            }
            const result = await this.settingsService.validatePath(request);
            if (result.exists && result.isDirectory && result.isAccessible) {
                res.json({
                    success: true,
                    exists: result.exists,
                    isDirectory: result.isDirectory,
                    isAccessible: result.isAccessible,
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    exists: result.exists,
                    isDirectory: result.isDirectory,
                    isAccessible: result.isAccessible,
                    error: result.error || 'Path validation failed'
                });
            }
        }
        catch (error) {
            console.error('Error validating path:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    /**
     * Update application settings
     */
    async updateSettings(req, res) {
        try {
            const request = req.body;
            if (!request.hostUdlfPath) {
                res.status(400).json({
                    success: false,
                    error: 'hostUdlfPath is required'
                });
                return;
            }
            const result = await this.settingsService.updateSettings(request);
            if (result.success) {
                res.json({
                    success: true,
                    message: result.message
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: result.error || result.message
                });
            }
        }
        catch (error) {
            console.error('Error updating settings:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    /**
     * Get current settings
     */
    async getSettings(req, res) {
        try {
            const settings = this.settingsService.getCurrentSettings();
            res.json({
                success: true,
                settings
            });
        }
        catch (error) {
            console.error('Error getting settings:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
}
exports.SettingsController = SettingsController;
